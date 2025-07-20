-- Final fix for RLS policy on college_admin_requests

-- Drop all existing policies on college_admin_requests
DROP POLICY IF EXISTS "requests_create_policy" ON public.college_admin_requests;
DROP POLICY IF EXISTS "requests_own_policy" ON public.college_admin_requests;
DROP POLICY IF EXISTS "requests_super_admin_select" ON public.college_admin_requests;
DROP POLICY IF EXISTS "requests_super_admin_update" ON public.college_admin_requests;

-- Create new, more permissive policies

-- Allow anyone to create college admin requests (for registration)
CREATE POLICY "allow_college_request_creation" ON public.college_admin_requests
  FOR INSERT WITH CHECK (true);

-- Allow users to view their own requests
CREATE POLICY "view_own_requests" ON public.college_admin_requests
  FOR SELECT USING (
    user_id = auth.uid()
  );

-- Allow super admins to view all requests
CREATE POLICY "super_admin_view_all_requests" ON public.college_admin_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role = 'admin' 
      AND (college_id IS NULL OR college_id IS NULL)
    )
  );

-- Allow super admins to update requests (approve/reject)
CREATE POLICY "super_admin_update_requests" ON public.college_admin_requests
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role = 'admin' 
      AND (college_id IS NULL OR college_id IS NULL)
    )
  );

-- Also disable RLS temporarily for testing (you can re-enable later)
-- ALTER TABLE public.college_admin_requests DISABLE ROW LEVEL SECURITY;