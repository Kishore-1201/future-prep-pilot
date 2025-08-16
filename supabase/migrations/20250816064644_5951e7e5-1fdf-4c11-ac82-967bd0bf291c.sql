-- Create function to get HOD requests for college admins
CREATE OR REPLACE FUNCTION public.get_hod_requests(college_uuid uuid DEFAULT NULL::uuid)
RETURNS TABLE(
  id uuid, 
  name text, 
  email text, 
  employee_id text, 
  qualification text, 
  experience text, 
  hod_details text, 
  college_name text, 
  created_at timestamp with time zone
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    p.id,
    p.name,
    au.email,
    p.employee_id,
    p.qualification,
    p.experience,
    p.hod_details,
    c.name as college_name,
    p.created_at
  FROM public.profiles p
  JOIN auth.users au ON p.id = au.id
  LEFT JOIN public.colleges c ON p.college_id = c.id
  WHERE p.is_hod = true 
    AND p.pending_approval = true
    AND (college_uuid IS NULL OR p.college_id = college_uuid)
  ORDER BY p.created_at DESC;
$$;

-- Create function to approve HOD requests
CREATE OR REPLACE FUNCTION public.approve_hod_request(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  profile_record RECORD;
BEGIN
  -- Get the profile details
  SELECT * INTO profile_record 
  FROM public.profiles 
  WHERE id = user_id AND is_hod = true AND pending_approval = true;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'HOD request not found or already processed';
  END IF;
  
  -- Update the profile to approve HOD status
  UPDATE public.profiles 
  SET 
    pending_approval = false,
    is_active = true,
    detailed_role = 'hod',
    updated_at = now()
  WHERE id = user_id;
  
  RETURN true;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to approve HOD request: %', SQLERRM;
END;
$$;