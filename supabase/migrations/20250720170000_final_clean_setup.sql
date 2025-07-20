-- Final clean setup - handles all existing policies and tables
-- Drop all existing policies first
DO $$ 
BEGIN
    -- Drop college policies
    DROP POLICY IF EXISTS "Everyone can view active colleges" ON public.colleges;
    DROP POLICY IF EXISTS "Super admins can manage colleges" ON public.colleges;
    
    -- Drop department policies  
    DROP POLICY IF EXISTS "Everyone can view active departments" ON public.departments;
    DROP POLICY IF EXISTS "College admins can manage their departments" ON public.departments;
    
    -- Drop room policies
    DROP POLICY IF EXISTS "Users can view rooms in their college" ON public.department_rooms;
    DROP POLICY IF EXISTS "Department admins can manage their rooms" ON public.department_rooms;
    DROP POLICY IF EXISTS "Room admins can manage their assigned rooms" ON public.department_rooms;
    
    -- Drop request policies
    DROP POLICY IF EXISTS "Users can view their own requests" ON public.college_admin_requests;
    DROP POLICY IF EXISTS "Users can create their own requests" ON public.college_admin_requests;
    DROP POLICY IF EXISTS "Super admins can view all requests" ON public.college_admin_requests;
    DROP POLICY IF EXISTS "Super admins can update all requests" ON public.college_admin_requests;
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

-- Drop existing tables if they exist
DROP TABLE IF EXISTS public.college_admin_requests CASCADE;
DROP TABLE IF EXISTS public.department_rooms CASCADE;
DROP TABLE IF EXISTS public.departments CASCADE;
DROP TABLE IF EXISTS public.colleges CASCADE;

-- Drop existing functions
DROP FUNCTION IF EXISTS public.get_super_admin_stats();
DROP FUNCTION IF EXISTS public.get_college_stats(UUID);

-- Create colleges table
CREATE TABLE public.colleges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  code TEXT NOT NULL UNIQUE,
  address TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create departments table
CREATE TABLE public.departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  college_id UUID NOT NULL REFERENCES public.colleges(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(college_id, name),
  UNIQUE(college_id, code)
);

-- Create department_rooms table
CREATE TABLE public.department_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
  room_name TEXT NOT NULL,
  room_code TEXT NOT NULL,
  description TEXT,
  max_students INTEGER DEFAULT 100,
  max_teachers INTEGER DEFAULT 10,
  room_admin UUID REFERENCES public.profiles(id),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(department_id, room_name),
  UNIQUE(department_id, room_code)
);

-- Create college admin requests table
CREATE TABLE public.college_admin_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  college_name TEXT NOT NULL,
  college_code TEXT NOT NULL,
  college_address TEXT NOT NULL,
  admin_name TEXT NOT NULL,
  admin_email TEXT NOT NULL,
  phone TEXT,
  website TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  approved_by UUID REFERENCES public.profiles(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT
);

-- Update profiles table
ALTER TABLE public.profiles DROP COLUMN IF EXISTS department_id;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS college_id;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS room_id;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS pending_approval;

ALTER TABLE public.profiles 
ADD COLUMN college_id UUID REFERENCES public.colleges(id),
ADD COLUMN department_id UUID REFERENCES public.departments(id),
ADD COLUMN room_id UUID REFERENCES public.department_rooms(id),
ADD COLUMN pending_approval BOOLEAN DEFAULT false;

-- Create indexes
CREATE INDEX idx_profiles_college_id ON public.profiles(college_id);
CREATE INDEX idx_profiles_department_id ON public.profiles(department_id);
CREATE INDEX idx_profiles_room_id ON public.profiles(room_id);
CREATE INDEX idx_departments_college_id ON public.departments(college_id);
CREATE INDEX idx_department_rooms_department_id ON public.department_rooms(department_id);
CREATE INDEX idx_college_admin_requests_status ON public.college_admin_requests(status);
CREATE INDEX idx_college_admin_requests_user_id ON public.college_admin_requests(user_id);

-- Enable RLS
ALTER TABLE public.colleges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.department_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.college_admin_requests ENABLE ROW LEVEL SECURITY;

-- Create all RLS policies
CREATE POLICY "colleges_select_policy" ON public.colleges FOR SELECT USING (is_active = true);
CREATE POLICY "colleges_admin_policy" ON public.colleges FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin' AND college_id IS NULL)
);

CREATE POLICY "departments_select_policy" ON public.departments FOR SELECT USING (is_active = true);
CREATE POLICY "departments_admin_policy" ON public.departments FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin' AND (college_id = departments.college_id OR college_id IS NULL))
);

CREATE POLICY "rooms_select_policy" ON public.department_rooms FOR SELECT USING (
  is_active = true AND EXISTS (
    SELECT 1 FROM public.profiles p JOIN public.departments d ON p.college_id = d.college_id
    WHERE p.id = auth.uid() AND d.id = department_rooms.department_id
  )
);
CREATE POLICY "rooms_admin_policy" ON public.department_rooms FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles p JOIN public.departments d ON p.department_id = d.id
    WHERE p.id = auth.uid() AND p.role = 'admin' AND d.id = department_rooms.department_id) OR
  room_admin = auth.uid()
);

CREATE POLICY "requests_own_policy" ON public.college_admin_requests FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "requests_create_policy" ON public.college_admin_requests FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "requests_super_admin_select" ON public.college_admin_requests FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin' AND college_id IS NULL)
);
CREATE POLICY "requests_super_admin_update" ON public.college_admin_requests FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin' AND college_id IS NULL)
);

-- Create functions
CREATE OR REPLACE FUNCTION public.get_super_admin_stats()
RETURNS JSON
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT json_build_object(
    'total_users', (SELECT COUNT(*) FROM public.profiles WHERE is_active = true),
    'total_colleges', (SELECT COUNT(*) FROM public.colleges WHERE is_active = true),
    'pending_requests', (SELECT COUNT(*) FROM public.college_admin_requests WHERE status = 'pending'),
    'active_admins', (SELECT COUNT(*) FROM public.profiles WHERE role = 'admin' AND is_active = true AND college_id IS NOT NULL),
    'total_departments', (SELECT COUNT(*) FROM public.departments WHERE is_active = true),
    'total_rooms', (SELECT COUNT(*) FROM public.department_rooms WHERE is_active = true)
  );
$$;

CREATE OR REPLACE FUNCTION public.get_college_stats(college_uuid UUID DEFAULT NULL)
RETURNS JSON
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT json_build_object(
    'total_departments', (SELECT COUNT(*) FROM public.departments WHERE is_active = true AND (college_uuid IS NULL OR college_id = college_uuid)),
    'total_rooms', (SELECT COUNT(*) FROM public.department_rooms dr JOIN public.departments d ON dr.department_id = d.id WHERE dr.is_active = true AND (college_uuid IS NULL OR d.college_id = college_uuid)),
    'total_students', (SELECT COUNT(*) FROM public.profiles WHERE role = 'student' AND is_active = true AND (college_uuid IS NULL OR college_id = college_uuid)),
    'total_teachers', (SELECT COUNT(*) FROM public.profiles WHERE role = 'teacher' AND is_active = true AND (college_uuid IS NULL OR college_id = college_uuid))
  );
$$;

-- Update trigger function
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
  IF NEW.raw_user_meta_data IS NOT NULL THEN
    IF NEW.raw_user_meta_data ? 'college_request' AND (NEW.raw_user_meta_data->>'college_request')::boolean = true THEN
      user_role := 'student';
      is_pending_admin := true;
    ELSIF NEW.raw_user_meta_data ? 'role' AND NEW.raw_user_meta_data->>'role' IN ('student', 'teacher', 'admin') THEN
      user_role := NEW.raw_user_meta_data->>'role';
    ELSIF NEW.raw_user_meta_data ? 'user_role' AND NEW.raw_user_meta_data->>'user_role' IN ('student', 'teacher', 'admin') THEN
      user_role := NEW.raw_user_meta_data->>'user_role';
    END IF;
    
    IF NEW.raw_user_meta_data ? 'name' THEN
      user_name := NEW.raw_user_meta_data->>'name';
    ELSIF NEW.raw_user_meta_data ? 'full_name' THEN
      user_name := NEW.raw_user_meta_data->>'full_name';
    ELSIF NEW.email IS NOT NULL THEN
      user_name := split_part(NEW.email, '@', 1);
    END IF;
  END IF;

  INSERT INTO public.profiles (id, name, role, is_active, pending_approval, created_at, updated_at)
  VALUES (NEW.id, user_name, user_role::app_role, true, is_pending_admin, now(), now());
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to create profile for user %: % - %', NEW.id, SQLSTATE, SQLERRM;
    RETURN NEW;
END;
$$;

-- Insert sample data
INSERT INTO public.colleges (name, code, address) VALUES
  ('ABC Engineering College', 'ABC', '123 Tech Street, Engineering City'),
  ('XYZ Institute of Technology', 'XYZ', '456 Innovation Avenue, Tech Town'),
  ('PQR College of Engineering', 'PQR', '789 Science Boulevard, Knowledge City')
ON CONFLICT (name) DO NOTHING;