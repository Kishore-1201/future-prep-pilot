-- Add RLS policies back and implement approval-controlled login

-- Re-enable RLS on college_admin_requests
ALTER TABLE public.college_admin_requests ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for college_admin_requests
CREATE POLICY "anyone_can_create_requests" ON public.college_admin_requests
  FOR INSERT WITH CHECK (true);

CREATE POLICY "users_can_view_own_requests" ON public.college_admin_requests
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "super_admins_can_view_all_requests" ON public.college_admin_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role = 'admin' 
      AND college_id IS NULL
    )
  );

CREATE POLICY "super_admins_can_update_requests" ON public.college_admin_requests
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role = 'admin' 
      AND college_id IS NULL
    )
  );

-- Add a function to handle college admin approval with proper credential activation
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
  
  -- Update the user profile to be college admin (this activates their login)
  UPDATE public.profiles 
  SET 
    role = 'admin',
    college_id = college_id,
    pending_approval = false,
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
    'admin_email', request_record.admin_email
  );
  
  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Add a function to reject college admin requests
CREATE OR REPLACE FUNCTION public.reject_college_admin_request(
  request_id UUID,
  rejection_reason TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  request_record RECORD;
  result JSON;
BEGIN
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
  
  -- Keep the user account but ensure they remain as student with pending_approval = true
  -- This prevents them from logging in as college admin
  UPDATE public.profiles 
  SET 
    pending_approval = true,
    updated_at = now()
  WHERE id = request_record.user_id;
  
  result := json_build_object(
    'success', true,
    'message', 'Request rejected successfully'
  );
  
  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Update the authentication check to prevent login for pending college admins
CREATE OR REPLACE FUNCTION public.check_user_login_allowed(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_profile RECORD;
BEGIN
  SELECT * INTO user_profile 
  FROM public.profiles 
  WHERE id = user_id;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- If user has pending_approval = true, they cannot login
  IF user_profile.pending_approval = true THEN
    RETURN false;
  END IF;
  
  -- If user is active, they can login
  IF user_profile.is_active = true THEN
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$;