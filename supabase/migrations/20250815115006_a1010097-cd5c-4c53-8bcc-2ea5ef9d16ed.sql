-- Update the approve_college_admin_request function to use the original signature
CREATE OR REPLACE FUNCTION public.approve_college_admin_request(request_id uuid)
RETURNS boolean
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
    detailed_role = 'college_admin',
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