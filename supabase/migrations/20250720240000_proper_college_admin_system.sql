-- Proper college admin system with correct account types and permissions

-- Re-enable RLS on college_admin_requests with proper policies
ALTER TABLE public.college_admin_requests ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "anyone_can_create_requests" ON public.college_admin_requests;
DROP POLICY IF EXISTS "users_can_view_own_requests" ON public.college_admin_requests;
DROP POLICY IF EXISTS "super_admins_can_view_all_requests" ON public.college_admin_requests;
DROP POLICY IF EXISTS "super_admins_can_update_requests" ON public.college_admin_requests;

-- Create comprehensive RLS policies
CREATE POLICY "allow_college_registration" ON public.college_admin_requests
  FOR INSERT WITH CHECK (true);

CREATE POLICY "view_own_college_requests" ON public.college_admin_requests
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "super_admin_manage_all_requests" ON public.college_admin_requests
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role = 'admin' 
      AND college_id IS NULL
    )
  );

-- Add account_type column to profiles to distinguish account types
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS account_type TEXT DEFAULT 'regular' 
CHECK (account_type IN ('regular', 'college_admin', 'super_admin'));

-- Update existing profiles with proper account types
UPDATE public.profiles 
SET account_type = CASE 
  WHEN role = 'admin' AND college_id IS NULL THEN 'super_admin'
  WHEN role = 'admin' AND college_id IS NOT NULL THEN 'college_admin'
  ELSE 'regular'
END;

-- Create a comprehensive function to handle college admin approval
CREATE OR REPLACE FUNCTION public.approve_college_admin_request(request_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  request_record RECORD;
  college_id UUID;
  result JSON;
BEGIN
  -- Verify the current user is a super admin
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'admin' 
    AND college_id IS NULL
  ) THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized: Only super admins can approve requests');
  END IF;

  -- Get the request details
  SELECT * INTO request_record 
  FROM public.college_admin_requests 
  WHERE id = request_id AND status = 'pending';
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Request not found or already processed');
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
  
  -- Update the user profile to be a proper college admin
  UPDATE public.profiles 
  SET 
    role = 'admin',
    account_type = 'college_admin',
    college_id = college_id,
    pending_approval = false,
    is_active = true,
    updated_at = now()
  WHERE id = request_record.user_id;
  
  -- Update the request status
  UPDATE public.college_admin_requests 
  SET 
    status = 'approved',
    approved_by = auth.uid(),
    approved_at = now(),
    updated_at = now()
  WHERE id = request_id;
  
  result := json_build_object(
    'success', true,
    'college_id', college_id,
    'college_name', request_record.college_name,
    'admin_email', request_record.admin_email,
    'message', 'College admin approved successfully'
  );
  
  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Create function to reject college admin requests
CREATE OR REPLACE FUNCTION public.reject_college_admin_request(
  request_id UUID,
  rejection_reason TEXT DEFAULT 'Request rejected by super admin'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  request_record RECORD;
  result JSON;
BEGIN
  -- Verify the current user is a super admin
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'admin' 
    AND college_id IS NULL
  ) THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized: Only super admins can reject requests');
  END IF;

  -- Get the request details
  SELECT * INTO request_record 
  FROM public.college_admin_requests 
  WHERE id = request_id AND status = 'pending';
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Request not found or already processed');
  END IF;
  
  -- Update the request status
  UPDATE public.college_admin_requests 
  SET 
    status = 'rejected',
    rejection_reason = rejection_reason,
    updated_at = now()
  WHERE id = request_id;
  
  -- Mark the user account as rejected (they can't login as college admin)
  UPDATE public.profiles 
  SET 
    pending_approval = true,
    account_type = 'regular',
    updated_at = now()
  WHERE id = request_record.user_id;
  
  result := json_build_object(
    'success', true,
    'message', 'Request rejected successfully',
    'reason', rejection_reason
  );
  
  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Update the user registration trigger to create proper college admin accounts
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
AS $$
DECLARE
  user_role text := 'student';
  user_name text := 'User';
  user_account_type text := 'regular';
  is_pending_admin boolean := false;
BEGIN
  -- Extract role and name from metadata
  IF NEW.raw_user_meta_data IS NOT NULL THEN
    -- Check if this is a college admin request
    IF NEW.raw_user_meta_data ? 'college_request' AND 
       (NEW.raw_user_meta_data->>'college_request')::boolean = true THEN
      user_role := 'student'; -- Temporary role until approved
      user_account_type := 'regular'; -- Will be changed to college_admin upon approval
      is_pending_admin := true;
    ELSIF NEW.raw_user_meta_data ? 'role' AND 
          NEW.raw_user_meta_data->>'role' IN ('student', 'teacher', 'admin') THEN
      user_role := NEW.raw_user_meta_data->>'role';
      user_account_type := CASE 
        WHEN NEW.raw_user_meta_data->>'role' = 'admin' THEN 'super_admin'
        ELSE 'regular'
      END;
    ELSIF NEW.raw_user_meta_data ? 'user_role' AND 
          NEW.raw_user_meta_data->>'user_role' IN ('student', 'teacher', 'admin') THEN
      user_role := NEW.raw_user_meta_data->>'user_role';
      user_account_type := CASE 
        WHEN NEW.raw_user_meta_data->>'user_role' = 'admin' THEN 'super_admin'
        ELSE 'regular'
      END;
    END IF;
    
    -- Extract name
    IF NEW.raw_user_meta_data ? 'name' THEN
      user_name := NEW.raw_user_meta_data->>'name';
    ELSIF NEW.raw_user_meta_data ? 'full_name' THEN
      user_name := NEW.raw_user_meta_data->>'full_name';
    ELSIF NEW.email IS NOT NULL THEN
      user_name := split_part(NEW.email, '@', 1);
    END IF;
  END IF;

  -- Insert the profile with proper account type
  INSERT INTO public.profiles (
    id, 
    name, 
    role, 
    account_type,
    is_active, 
    pending_approval, 
    created_at, 
    updated_at
  ) VALUES (
    NEW.id, 
    user_name, 
    user_role::app_role, 
    user_account_type,
    true, 
    is_pending_admin, 
    now(), 
    now()
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't block user creation
    RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- Create function to check if user can login (prevents pending college admins from logging in)
CREATE OR REPLACE FUNCTION public.can_user_login()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_profile RECORD;
BEGIN
  SELECT * INTO user_profile 
  FROM public.profiles 
  WHERE id = auth.uid();
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- If user has pending_approval = true, they cannot login
  IF user_profile.pending_approval = true THEN
    RETURN false;
  END IF;
  
  -- If user is not active, they cannot login
  IF user_profile.is_active = false THEN
    RETURN false;
  END IF;
  
  RETURN true;
END;
$$;

-- Update admin stats function to include account types
CREATE OR REPLACE FUNCTION public.get_super_admin_stats()
RETURNS JSON
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT json_build_object(
    'total_users', (SELECT COUNT(*) FROM public.profiles WHERE is_active = true),
    'total_colleges', (SELECT COUNT(*) FROM public.colleges WHERE is_active = true),
    'pending_requests', (SELECT COUNT(*) FROM public.college_admin_requests WHERE status = 'pending'),
    'approved_requests', (SELECT COUNT(*) FROM public.college_admin_requests WHERE status = 'approved'),
    'rejected_requests', (SELECT COUNT(*) FROM public.college_admin_requests WHERE status = 'rejected'),
    'college_admins', (SELECT COUNT(*) FROM public.profiles WHERE account_type = 'college_admin' AND is_active = true),
    'super_admins', (SELECT COUNT(*) FROM public.profiles WHERE account_type = 'super_admin' AND is_active = true),
    'regular_users', (SELECT COUNT(*) FROM public.profiles WHERE account_type = 'regular' AND is_active = true),
    'total_departments', (SELECT COUNT(*) FROM public.departments WHERE is_active = true),
    'total_rooms', (SELECT COUNT(*) FROM public.department_rooms WHERE is_active = true)
  );
$$;