-- Create college admin requests system
CREATE TABLE IF NOT EXISTS public.college_admin_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  college_name TEXT NOT NULL,
  college_code TEXT NOT NULL,
  college_address TEXT NOT NULL,
  admin_name TEXT NOT NULL,
  admin_email TEXT NOT NULL,
  phone TEXT,
  website TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  approved_by UUID REFERENCES public.profiles(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_college_admin_requests_status ON public.college_admin_requests(status);
CREATE INDEX IF NOT EXISTS idx_college_admin_requests_user_id ON public.college_admin_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_college_admin_requests_created_at ON public.college_admin_requests(created_at);

-- Enable RLS
ALTER TABLE public.college_admin_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own requests" ON public.college_admin_requests
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create their own requests" ON public.college_admin_requests
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Super admins can view all requests" ON public.college_admin_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role = 'admin' 
      AND college_id IS NULL -- Super admin
    )
  );

CREATE POLICY "Super admins can update all requests" ON public.college_admin_requests
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role = 'admin' 
      AND college_id IS NULL -- Super admin
    )
  );

-- Create function to get super admin statistics
CREATE OR REPLACE FUNCTION public.get_super_admin_stats()
RETURNS JSON
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT json_build_object(
    'total_users', (SELECT COUNT(*) FROM public.profiles WHERE is_active = true),
    'total_colleges', (SELECT COUNT(*) FROM public.colleges WHERE is_active = true),
    'pending_requests', (SELECT COUNT(*) FROM public.college_admin_requests WHERE status = 'pending'),
    'active_admins', (
      SELECT COUNT(*) FROM public.profiles 
      WHERE role = 'admin' 
      AND is_active = true 
      AND college_id IS NOT NULL
    ),
    'total_departments', (SELECT COUNT(*) FROM public.departments WHERE is_active = true),
    'total_rooms', (SELECT COUNT(*) FROM public.department_rooms WHERE is_active = true)
  );
$$;

-- Update the user role system to handle pending admins
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS pending_approval BOOLEAN DEFAULT false;

-- Create function to handle college admin approval
CREATE OR REPLACE FUNCTION public.approve_college_admin(
  request_id UUID,
  approver_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  request_record RECORD;
  college_id UUID;
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
  RETURNING id INTO college_id;
  
  -- Update the user profile to be college admin
  UPDATE public.profiles 
  SET 
    role = 'admin',
    college_id = college_id,
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

-- Create function to reject college admin request
CREATE OR REPLACE FUNCTION public.reject_college_admin(
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

-- Update the user registration trigger to handle pending admins
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
AS $$
DECLARE
  user_role text := 'student';
  user_name text := 'User';
  is_pending_admin boolean := false;
BEGIN
  -- Extract role from metadata with multiple fallback options
  IF NEW.raw_user_meta_data IS NOT NULL THEN
    -- Check if this is a college admin request
    IF NEW.raw_user_meta_data ? 'college_request' AND 
       (NEW.raw_user_meta_data->>'college_request')::boolean = true THEN
      user_role := 'student'; -- Temporary role until approved
      is_pending_admin := true;
    ELSIF NEW.raw_user_meta_data ? 'role' AND 
          NEW.raw_user_meta_data->>'role' IN ('student', 'teacher', 'admin') THEN
      user_role := NEW.raw_user_meta_data->>'role';
    ELSIF NEW.raw_user_meta_data ? 'user_role' AND 
          NEW.raw_user_meta_data->>'user_role' IN ('student', 'teacher', 'admin') THEN
      user_role := NEW.raw_user_meta_data->>'user_role';
    END IF;
    
    -- Extract name from metadata
    IF NEW.raw_user_meta_data ? 'name' THEN
      user_name := NEW.raw_user_meta_data->>'name';
    ELSIF NEW.raw_user_meta_data ? 'full_name' THEN
      user_name := NEW.raw_user_meta_data->>'full_name';
    ELSIF NEW.email IS NOT NULL THEN
      user_name := split_part(NEW.email, '@', 1);
    END IF;
  END IF;

  -- Insert the profile
  INSERT INTO public.profiles (
    id, 
    name, 
    role, 
    is_active,
    pending_approval,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    user_name,
    user_role::app_role,
    true,
    is_pending_admin,
    now(),
    now()
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't block user creation
    RAISE WARNING 'Failed to create profile for user %: % - %', NEW.id, SQLSTATE, SQLERRM;
    RETURN NEW;
END;
$$;