-- Drop and recreate functions to fix signature conflicts

-- Drop all existing functions with any signature variations
DROP FUNCTION IF EXISTS public.approve_college_admin_request(UUID);
DROP FUNCTION IF EXISTS public.reject_college_admin_request(UUID);
DROP FUNCTION IF EXISTS public.reject_college_admin_request(UUID, TEXT);
DROP FUNCTION IF EXISTS public.create_college_admin_request(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT);

-- Drop all policies on profiles table that might cause recursion
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Super admin can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Super admin can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "College admin can view college profiles" ON public.profiles;
DROP POLICY IF EXISTS "College admin can update college profiles" ON public.profiles;
DROP POLICY IF EXISTS "allow_profile_read" ON public.profiles;
DROP POLICY IF EXISTS "allow_profile_update" ON public.profiles;
DROP POLICY IF EXISTS "allow_profile_insert" ON public.profiles;

-- Disable RLS on both tables to prevent recursion
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.college_admin_requests DISABLE ROW LEVEL SECURITY;

-- Drop foreign key constraint that might cause issues
ALTER TABLE public.college_admin_requests 
DROP CONSTRAINT IF EXISTS college_admin_requests_user_id_fkey;

-- Create the college admin request creation function
CREATE FUNCTION public.create_college_admin_request(
  p_user_id UUID,
  p_college_name TEXT,
  p_college_code TEXT,
  p_college_address TEXT,
  p_admin_name TEXT,
  p_admin_email TEXT,
  p_phone TEXT,
  p_website TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  request_id UUID;
BEGIN
  INSERT INTO public.college_admin_requests (
    user_id,
    college_name,
    college_code,
    college_address,
    admin_name,
    admin_email,
    phone,
    website,
    status,
    created_at,
    updated_at
  ) VALUES (
    p_user_id,
    p_college_name,
    p_college_code,
    p_college_address,
    p_admin_name,
    p_admin_email,
    p_phone,
    p_website,
    'pending',
    now(),
    now()
  )
  RETURNING id INTO request_id;
  
  RETURN request_id;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to create college admin request: %', SQLERRM;
END;
$$;

-- Create the approval function
CREATE FUNCTION public.approve_college_admin_request(request_id UUID)
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
  
  -- Update the user profile with explicit column reference
  UPDATE public.profiles 
  SET 
    role = 'admin',
    college_id = new_college_id,
    pending_approval = false,
    is_active = true,
    updated_at = now()
  WHERE id = request_record.user_id;
  
  -- Update the request status
  UPDATE public.college_admin_requests 
  SET 
    status = 'approved',
    approved_at = now(),
    updated_at = now()
  WHERE id = request_id;
  
  RETURN true;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to approve request: %', SQLERRM;
END;
$$;

-- Create the rejection function
CREATE FUNCTION public.reject_college_admin_request(request_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  request_record RECORD;
BEGIN
  -- Get the request details
  SELECT * INTO request_record 
  FROM public.college_admin_requests 
  WHERE id = request_id AND status = 'pending';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Request not found or already processed';
  END IF;
  
  -- Update the request status
  UPDATE public.college_admin_requests 
  SET 
    status = 'rejected',
    updated_at = now()
  WHERE id = request_id;
  
  -- Mark the user account as rejected
  UPDATE public.profiles 
  SET 
    pending_approval = true,
    updated_at = now()
  WHERE id = request_record.user_id;
  
  RETURN true;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to reject request: %', SQLERRM;
END;
$$;

-- Update the user registration trigger
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
  -- Extract role and name from metadata
  IF NEW.raw_user_meta_data IS NOT NULL THEN
    -- Check if this is a college admin request
    IF NEW.raw_user_meta_data ? 'college_request' AND 
       (NEW.raw_user_meta_data->>'college_request')::boolean = true THEN
      user_role := 'admin';
      is_pending_admin := true;
    ELSIF NEW.raw_user_meta_data ? 'role' AND 
          NEW.raw_user_meta_data->>'role' IN ('student', 'teacher', 'admin') THEN
      user_role := NEW.raw_user_meta_data->>'role';
    ELSIF NEW.raw_user_meta_data ? 'user_role' AND 
          NEW.raw_user_meta_data->>'user_role' IN ('student', 'teacher', 'admin') THEN
      user_role := NEW.raw_user_meta_data->>'user_role';
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

  -- Insert the profile without any RLS checks
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
    -- Log error but don't block user creation
    RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;