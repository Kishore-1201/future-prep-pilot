-- Fix HOD requests visibility for college admins
-- This migration updates the get_hod_requests function to show all HOD requests without college assignment
-- and updates the approve_hod_request function to assign college_id when approving

-- Update function to get HOD requests for college admins
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
    COALESCE(c.name, 'College Application') as college_name,
    p.created_at
  FROM public.profiles p
  JOIN auth.users au ON p.id = au.id
  LEFT JOIN public.colleges c ON p.college_id = c.id
  WHERE p.is_hod = true 
    AND p.pending_approval = true
    AND (college_uuid IS NULL OR p.college_id = college_uuid)
  ORDER BY p.created_at DESC;
$$;

-- Create function to assign HOD to department and college
CREATE OR REPLACE FUNCTION public.assign_hod_to_department(
  p_user_id uuid,
  p_department_id uuid,
  p_approver_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  dept_college_id uuid;
  approver_ok boolean := false;
BEGIN
  -- Get the college of the department
  SELECT d.college_id INTO dept_college_id
  FROM public.departments d
  WHERE d.id = p_department_id AND d.is_active = true;

  IF dept_college_id IS NULL THEN
    RAISE EXCEPTION 'Department not found or inactive';
  END IF;

  -- Check if approver has permission (super admin or college admin of the same college)
  SELECT EXISTS (
    SELECT 1 FROM public.profiles pa
    WHERE pa.id = p_approver_id 
      AND pa.is_active = true
      AND (
        pa.detailed_role = 'super_admin'
        OR (pa.detailed_role = 'college_admin' AND pa.college_id = dept_college_id)
      )
  ) INTO approver_ok;

  IF NOT approver_ok THEN
    RAISE EXCEPTION 'Insufficient permissions to assign HOD to this department';
  END IF;

  -- Check if department already has an active HOD
  IF EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.department_id = p_department_id 
      AND p.detailed_role = 'hod' 
      AND p.is_active = true
  ) THEN
    RAISE EXCEPTION 'Department already has an active HOD';
  END IF;

  -- Update the HOD profile with department and college assignment
  UPDATE public.profiles 
  SET
    department_id = p_department_id,
    college_id = dept_college_id,
    detailed_role = 'hod',
    is_active = true,
    pending_approval = false,
    updated_at = now()
  WHERE id = p_user_id;

  RETURN true;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to assign HOD to department: %', SQLERRM;
END;
$$;