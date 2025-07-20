-- Remove foreign key constraint to fix user creation timing issue

-- Drop the foreign key constraint that's causing the issue
ALTER TABLE public.college_admin_requests 
DROP CONSTRAINT IF EXISTS college_admin_requests_user_id_fkey;

-- We'll store the user_id as a regular UUID field without foreign key constraint
-- This allows us to create the request immediately after user signup
-- The user_id will still be valid, just not enforced by foreign key

-- Add a comment to document this decision
COMMENT ON COLUMN public.college_admin_requests.user_id IS 'User ID from auth.users - foreign key constraint removed due to timing issues during signup';