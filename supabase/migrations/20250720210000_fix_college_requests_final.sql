-- Final fix for college admin requests - disable RLS completely for this table

-- Disable RLS on college_admin_requests table completely
ALTER TABLE public.college_admin_requests DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies since we're disabling RLS
DROP POLICY IF EXISTS "allow_college_request_creation" ON public.college_admin_requests;
DROP POLICY IF EXISTS "view_own_requests" ON public.college_admin_requests;
DROP POLICY IF EXISTS "super_admin_view_all_requests" ON public.college_admin_requests;
DROP POLICY IF EXISTS "super_admin_update_requests" ON public.college_admin_requests;
DROP POLICY IF EXISTS "requests_create_policy" ON public.college_admin_requests;
DROP POLICY IF EXISTS "requests_own_policy" ON public.college_admin_requests;
DROP POLICY IF EXISTS "requests_super_admin_select" ON public.college_admin_requests;
DROP POLICY IF EXISTS "requests_super_admin_update" ON public.college_admin_requests;

-- Ensure the table structure is correct
ALTER TABLE public.college_admin_requests ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.college_admin_requests ALTER COLUMN college_name SET NOT NULL;
ALTER TABLE public.college_admin_requests ALTER COLUMN college_code SET NOT NULL;
ALTER TABLE public.college_admin_requests ALTER COLUMN admin_name SET NOT NULL;
ALTER TABLE public.college_admin_requests ALTER COLUMN admin_email SET NOT NULL;