
-- Add detailed_role column to profiles table for more granular role management
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS detailed_role TEXT;

-- Create department_admins table to track department administrators
CREATE TABLE IF NOT EXISTS public.department_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
  college_id UUID NOT NULL REFERENCES public.colleges(id) ON DELETE CASCADE,
  assigned_by UUID NOT NULL REFERENCES public.profiles(id),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, department_id)
);

-- Create department_codes table for student/teacher joining
CREATE TABLE IF NOT EXISTS public.department_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
  college_id UUID NOT NULL REFERENCES public.colleges(id) ON DELETE CASCADE,
  student_code TEXT NOT NULL,
  teacher_code TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  is_active BOOLEAN NOT NULL DEFAULT true,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(department_id),
  UNIQUE(student_code),
  UNIQUE(teacher_code)
);

-- Create pending_department_joins table for code-based joining
CREATE TABLE IF NOT EXISTS public.pending_department_joins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  college_id UUID NOT NULL REFERENCES public.colleges(id) ON DELETE CASCADE,
  department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
  join_code TEXT NOT NULL,
  user_role TEXT NOT NULL CHECK (user_role IN ('student', 'teacher')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, department_id)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_department_admins_user_id ON public.department_admins(user_id);
CREATE INDEX IF NOT EXISTS idx_department_admins_department_id ON public.department_admins(department_id);
CREATE INDEX IF NOT EXISTS idx_department_codes_department_id ON public.department_codes(department_id);
CREATE INDEX IF NOT EXISTS idx_pending_department_joins_user_id ON public.pending_department_joins(user_id);
CREATE INDEX IF NOT EXISTS idx_pending_department_joins_status ON public.pending_department_joins(status);

-- Enable RLS on new tables
ALTER TABLE public.department_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.department_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pending_department_joins ENABLE ROW LEVEL SECURITY;

-- RLS Policies for department_admins
CREATE POLICY "College admins can manage department admins in their college" ON public.department_admins
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role = 'admin' 
      AND college_id = department_admins.college_id
    )
  );

CREATE POLICY "Department admins can view their own records" ON public.department_admins
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Super admins can manage all department admins" ON public.department_admins
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role = 'admin' 
      AND college_id IS NULL
    )
  );

-- RLS Policies for department_codes
CREATE POLICY "Department admins can manage codes for their departments" ON public.department_codes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.department_admins da
      WHERE da.user_id = auth.uid() 
      AND da.department_id = department_codes.department_id
      AND da.is_active = true
    )
  );

CREATE POLICY "College admins can manage codes in their college" ON public.department_codes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role = 'admin' 
      AND college_id = department_codes.college_id
    )
  );

CREATE POLICY "Users can view codes for joining" ON public.department_codes
  FOR SELECT USING (is_active = true);

-- RLS Policies for pending_department_joins
CREATE POLICY "Users can create their own join requests" ON public.pending_department_joins
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view their own join requests" ON public.pending_department_joins
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Department admins can manage joins for their departments" ON public.pending_department_joins
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.department_admins da
      WHERE da.user_id = auth.uid() 
      AND da.department_id = pending_department_joins.department_id
      AND da.is_active = true
    )
  );

CREATE POLICY "College admins can manage joins in their college" ON public.pending_department_joins
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role = 'admin' 
      AND college_id = pending_department_joins.college_id
    )
  );

-- Function to approve college admin and create college
CREATE OR REPLACE FUNCTION public.approve_college_admin_request(
  request_id UUID,
  approver_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  request_record RECORD;
  new_college_id UUID;
BEGIN
  -- Get the request details
  SELECT * INTO request_record 
  FROM public.college_admin_requests 
  WHERE id = request_id AND status = 'pending';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Request not found or already processed';
  END IF;
  
  -- Create the college
  INSERT INTO public.colleges (name, code, address, phone, website)
  VALUES (
    request_record.college_name,
    request_record.college_code,
    request_record.college_address,
    request_record.phone,
    request_record.website
  )
  RETURNING id INTO new_college_id;
  
  -- Update the user profile to be college admin
  UPDATE public.profiles 
  SET 
    role = 'admin',
    college_id = new_college_id,
    detailed_role = 'college_admin',
    pending_approval = false,
    updated_at = now()
  WHERE id = request_record.user_id;
  
  -- Update the request status
  UPDATE public.college_admin_requests 
  SET 
    status = 'approved',
    approved_by = approver_id,
    approved_at = now(),
    updated_at = now()
  WHERE id = request_id;
  
  RETURN true;
END;
$$;

-- Function to reject college admin request
CREATE OR REPLACE FUNCTION public.reject_college_admin_request(
  request_id UUID,
  rejection_reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update the request status
  UPDATE public.college_admin_requests 
  SET 
    status = 'rejected',
    rejection_reason = rejection_reason,
    updated_at = now()
  WHERE id = request_id AND status = 'pending';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Request not found or already processed';
  END IF;
  
  RETURN true;
END;
$$;

-- Function to create department admin
CREATE OR REPLACE FUNCTION public.create_department_admin(
  admin_email TEXT,
  admin_name TEXT,
  admin_password TEXT,
  department_id UUID,
  college_id UUID,
  assigned_by UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_user_id UUID;
  auth_result RECORD;
BEGIN
  -- Check if the assigner is a college admin for this college
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = assigned_by 
    AND role = 'admin' 
    AND college_id = college_id
  ) THEN
    RAISE EXCEPTION 'Only college admins can create department admins';
  END IF;
  
  -- Create user account (this would need to be handled by the application)
  -- For now, we'll assume the user is created and return a placeholder
  new_user_id := gen_random_uuid();
  
  -- Create profile for department admin
  INSERT INTO public.profiles (
    id, name, role, detailed_role, college_id, department_id, is_active, pending_approval
  ) VALUES (
    new_user_id, admin_name, 'admin', 'department_admin', college_id, department_id, true, false
  );
  
  -- Add to department_admins table
  INSERT INTO public.department_admins (
    user_id, department_id, college_id, assigned_by, is_active
  ) VALUES (
    new_user_id, department_id, college_id, assigned_by, true
  );
  
  RETURN new_user_id;
END;
$$;

-- Function to generate department codes
CREATE OR REPLACE FUNCTION public.generate_department_codes(
  dept_id UUID,
  college_id UUID,
  created_by UUID
)
RETURNS RECORD
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  student_code TEXT;
  teacher_code TEXT;
  result RECORD;
BEGIN
  -- Generate unique codes
  student_code := 'STU-' || substr(gen_random_uuid()::text, 1, 8);
  teacher_code := 'TCH-' || substr(gen_random_uuid()::text, 1, 8);
  
  -- Insert or update codes
  INSERT INTO public.department_codes (
    department_id, college_id, student_code, teacher_code, created_by, is_active
  ) VALUES (
    dept_id, college_id, student_code, teacher_code, created_by, true
  )
  ON CONFLICT (department_id) 
  DO UPDATE SET 
    student_code = EXCLUDED.student_code,
    teacher_code = EXCLUDED.teacher_code,
    updated_at = now();
  
  SELECT student_code as student_code, teacher_code as teacher_code INTO result;
  RETURN result;
END;
$$;

-- Function to join department with code
CREATE OR REPLACE FUNCTION public.join_department_with_code(
  user_id UUID,
  join_code TEXT,
  user_role TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  dept_record RECORD;
  code_type TEXT;
BEGIN
  -- Find the department based on the code
  SELECT d.id as department_id, d.college_id, dc.student_code, dc.teacher_code
  INTO dept_record
  FROM public.departments d
  JOIN public.department_codes dc ON d.id = dc.department_id
  WHERE (dc.student_code = join_code OR dc.teacher_code = join_code)
  AND dc.is_active = true
  AND d.is_active = true;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid or expired code';
  END IF;
  
  -- Determine code type
  IF dept_record.student_code = join_code THEN
    code_type := 'student';
  ELSE
    code_type := 'teacher';
  END IF;
  
  -- Validate user role matches code type
  IF user_role != code_type THEN
    RAISE EXCEPTION 'Code type does not match user role';
  END IF;
  
  -- Create pending join request
  INSERT INTO public.pending_department_joins (
    user_id, college_id, department_id, join_code, user_role, status
  ) VALUES (
    user_id, dept_record.college_id, dept_record.department_id, join_code, user_role, 'pending'
  )
  ON CONFLICT (user_id, department_id) 
  DO UPDATE SET 
    join_code = EXCLUDED.join_code,
    user_role = EXCLUDED.user_role,
    status = 'pending',
    updated_at = now();
  
  RETURN true;
END;
$$;

-- Function to approve department join
CREATE OR REPLACE FUNCTION public.approve_department_join(
  join_id UUID,
  approver_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  join_record RECORD;
BEGIN
  -- Get join request details
  SELECT * INTO join_record 
  FROM public.pending_department_joins 
  WHERE id = join_id AND status = 'pending';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Join request not found or already processed';
  END IF;
  
  -- Update user profile with department and college
  UPDATE public.profiles 
  SET 
    college_id = join_record.college_id,
    department_id = join_record.department_id,
    role = join_record.user_role::app_role,
    updated_at = now()
  WHERE id = join_record.user_id;
  
  -- Update join request status
  UPDATE public.pending_department_joins 
  SET 
    status = 'approved',
    updated_at = now()
  WHERE id = join_id;
  
  RETURN true;
END;
$$;

-- Update existing profiles to set detailed_role based on current role and college_id
UPDATE public.profiles 
SET detailed_role = CASE 
  WHEN role = 'admin' AND college_id IS NULL THEN 'super_admin'
  WHEN role = 'admin' AND college_id IS NOT NULL THEN 'college_admin'
  WHEN role = 'student' THEN 'student'
  WHEN role = 'teacher' THEN 'teacher'
  ELSE 'student'
END
WHERE detailed_role IS NULL;
