-- Fix function signatures and column ambiguity

-- Drop existing functions
DROP FUNCTION IF EXISTS public.approve_college_admin_request(UUID);
DROP FUNCTION IF EXISTS public.reject_college_admin_request(UUID);
DROP FUNCTION IF EXISTS public.create_college_admin_request(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT);

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

-- Create the approval function with duplicate handling
CREATE FUNCTION public.approve_college_admin_request(request_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  request_record RECORD;
  new_college_id UUID;
  existing_college_id UUID;
BEGIN
  -- Get the request details
  SELECT car.* INTO request_record 
  FROM public.college_admin_requests car
  WHERE car.id = request_id AND car.status = 'pending';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Request not found or already processed';
  END IF;
  
  -- Check if college with same code already exists
  SELECT id INTO existing_college_id 
  FROM public.colleges 
  WHERE code = request_record.college_code;
  
  IF existing_college_id IS NOT NULL THEN
    -- College already exists, use existing college
    new_college_id := existing_college_id;
  ELSE
    -- Create new college
    INSERT INTO public.colleges (name, code, address, phone, website)
    VALUES (
      request_record.college_name,
      request_record.college_code,
      request_record.college_address,
      request_record.phone,
      request_record.website
    )
    RETURNING id INTO new_college_id;
  END IF;
  
  -- Update the user profile with explicit column references
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
  SELECT car.* INTO request_record 
  FROM public.college_admin_requests car
  WHERE car.id = request_id AND car.status = 'pending';
  
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