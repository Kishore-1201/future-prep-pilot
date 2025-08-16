-- Fix the ambiguous column reference in join_department_with_code function
-- Keep original parameter names for backward compatibility
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
  -- Local variables to avoid ambiguity
  v_user_id UUID := user_id;
  v_join_code TEXT := join_code;
  v_user_role TEXT := user_role;
BEGIN
  -- Find the department based on the code
  SELECT d.id AS department_id, d.college_id, dc.student_code, dc.teacher_code
  INTO dept_record
  FROM public.departments d
  JOIN public.department_codes dc ON d.id = dc.department_id
  WHERE (dc.student_code = v_join_code OR dc.teacher_code = v_join_code)
    AND dc.is_active = true
    AND d.is_active = true;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid or expired code';
  END IF;
  
  -- Determine code type
  IF dept_record.student_code = v_join_code THEN
    code_type := 'student';
  ELSE
    code_type := 'teacher';
  END IF;
  
  -- Validate user role matches code type
  IF v_user_role != code_type THEN
    RAISE EXCEPTION 'Code type does not match user role';
  END IF;
  
  -- Create pending join request
  INSERT INTO public.pending_department_joins (
    user_id, college_id, department_id, join_code, user_role, status
  ) VALUES (
    v_user_id, dept_record.college_id, dept_record.department_id, v_join_code, v_user_role, 'pending'
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


-- Approve department join function (Option 1: keep original parameter names)
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
  v_join_id UUID := join_id;
  v_approver_id UUID := approver_id;
BEGIN
  -- Get join request details
  SELECT * INTO join_record 
  FROM public.pending_department_joins 
  WHERE id = v_join_id AND status = 'pending';
  
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
  WHERE id = v_join_id;
  
  RETURN true;
END;
$$;
