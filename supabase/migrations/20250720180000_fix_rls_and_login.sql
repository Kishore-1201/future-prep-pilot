-- Fix RLS policies and login system

-- Drop and recreate the problematic RLS policy for college_admin_requests
DROP POLICY IF EXISTS "requests_create_policy" ON public.college_admin_requests;

-- Create a more permissive policy for creating requests
CREATE POLICY "requests_create_policy" ON public.college_admin_requests 
  FOR INSERT WITH CHECK (true); -- Allow anyone to create requests

-- Also ensure the select policy works for pending users
DROP POLICY IF EXISTS "requests_own_policy" ON public.college_admin_requests;
CREATE POLICY "requests_own_policy" ON public.college_admin_requests 
  FOR SELECT USING (
    user_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role = 'admin' 
      AND college_id IS NULL
    )
  );