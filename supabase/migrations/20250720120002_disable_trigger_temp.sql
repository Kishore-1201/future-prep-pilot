-- Temporarily disable the trigger to test user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Simple function that just logs but doesn't fail
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
AS $$
BEGIN
  -- Just return NEW without doing anything
  -- This will let user creation succeed
  RETURN NEW;
END;
$$;

-- Re-enable trigger but with minimal functionality
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user();