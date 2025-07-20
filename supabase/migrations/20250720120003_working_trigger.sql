-- Working trigger for user profile creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
AS $$
BEGIN
  -- Insert profile with extracted role and name
  INSERT INTO public.profiles (
    id, 
    name, 
    role, 
    is_active,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'name',
      NEW.raw_user_meta_data->>'full_name',
      split_part(NEW.email, '@', 1),
      'User'
    ),
    CASE 
      WHEN NEW.raw_user_meta_data->>'role' IN ('student', 'teacher', 'admin') 
        THEN (NEW.raw_user_meta_data->>'role')::app_role
      WHEN NEW.raw_user_meta_data->>'user_role' IN ('student', 'teacher', 'admin') 
        THEN (NEW.raw_user_meta_data->>'user_role')::app_role
      ELSE 'student'::app_role
    END,
    true,
    now(),
    now()
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- If anything fails, just return NEW to allow user creation
    RETURN NEW;
END;
$$;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user();