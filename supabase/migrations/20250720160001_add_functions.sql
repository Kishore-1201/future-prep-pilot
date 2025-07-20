-- Add functions for the college system

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

-- Create function to get college statistics
CREATE OR REPLACE FUNCTION public.get_college_stats(college_uuid UUID DEFAULT NULL)
RETURNS JSON
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT json_build_object(
    'total_departments', (
      SELECT COUNT(*) FROM public.departments 
      WHERE is_active = true 
      AND (college_uuid IS NULL OR college_id = college_uuid)
    ),
    'total_rooms', (
      SELECT COUNT(*) FROM public.department_rooms dr
      JOIN public.departments d ON dr.department_id = d.id
      WHERE dr.is_active = true 
      AND (college_uuid IS NULL OR d.college_id = college_uuid)
    ),
    'total_students', (
      SELECT COUNT(*) FROM public.profiles 
      WHERE role = 'student' 
      AND is_active = true 
      AND (college_uuid IS NULL OR college_id = college_uuid)
    ),
    'total_teachers', (
      SELECT COUNT(*) FROM public.profiles 
      WHERE role = 'teacher' 
      AND is_active = true 
      AND (college_uuid IS NULL OR college_id = college_uuid)
    )
  );
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