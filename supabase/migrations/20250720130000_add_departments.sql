-- Add departments table and enhance admin functionality
CREATE TABLE IF NOT EXISTS public.departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  head_of_department UUID REFERENCES public.profiles(id),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add department_id to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES public.departments(id);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_department_id ON public.profiles(department_id);
CREATE INDEX IF NOT EXISTS idx_departments_active ON public.departments(is_active);

-- Enable RLS on departments table
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for departments
CREATE POLICY "Everyone can view active departments" ON public.departments
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage all departments" ON public.departments
  FOR ALL USING (public.get_current_user_role() = 'admin');

-- Insert some default departments
INSERT INTO public.departments (name, code, description) VALUES
  ('Computer Science', 'CS', 'Department of Computer Science and Engineering'),
  ('Mathematics', 'MATH', 'Department of Mathematics'),
  ('Physics', 'PHY', 'Department of Physics'),
  ('Chemistry', 'CHEM', 'Department of Chemistry'),
  ('Biology', 'BIO', 'Department of Biology'),
  ('English', 'ENG', 'Department of English Literature'),
  ('Business Administration', 'BBA', 'Department of Business Administration'),
  ('Mechanical Engineering', 'ME', 'Department of Mechanical Engineering'),
  ('Electrical Engineering', 'EE', 'Department of Electrical Engineering'),
  ('Civil Engineering', 'CE', 'Department of Civil Engineering')
ON CONFLICT (name) DO NOTHING;

-- Create function to get department statistics
CREATE OR REPLACE FUNCTION public.get_department_stats()
RETURNS TABLE (
  department_id UUID,
  department_name TEXT,
  department_code TEXT,
  total_students BIGINT,
  total_teachers BIGINT,
  total_users BIGINT
)
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT 
    d.id as department_id,
    d.name as department_name,
    d.code as department_code,
    COUNT(CASE WHEN p.role = 'student' THEN 1 END) as total_students,
    COUNT(CASE WHEN p.role = 'teacher' THEN 1 END) as total_teachers,
    COUNT(p.id) as total_users
  FROM public.departments d
  LEFT JOIN public.profiles p ON d.id = p.department_id AND p.is_active = true
  WHERE d.is_active = true
  GROUP BY d.id, d.name, d.code
  ORDER BY d.name;
$$;

-- Create function to get system statistics for admin dashboard
CREATE OR REPLACE FUNCTION public.get_admin_stats()
RETURNS JSON
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT json_build_object(
    'total_users', (SELECT COUNT(*) FROM public.profiles WHERE is_active = true),
    'total_students', (SELECT COUNT(*) FROM public.profiles WHERE role = 'student' AND is_active = true),
    'total_teachers', (SELECT COUNT(*) FROM public.profiles WHERE role = 'teacher' AND is_active = true),
    'total_admins', (SELECT COUNT(*) FROM public.profiles WHERE role = 'admin' AND is_active = true),
    'total_departments', (SELECT COUNT(*) FROM public.departments WHERE is_active = true),
    'total_courses', (SELECT COUNT(*) FROM public.class_schedules),
    'total_events', (SELECT COUNT(*) FROM public.events WHERE event_date >= CURRENT_DATE),
    'total_notices', (SELECT COUNT(*) FROM public.notices WHERE date_posted >= CURRENT_DATE - INTERVAL '30 days'),
    'recent_signups', (SELECT COUNT(*) FROM public.profiles WHERE created_at >= CURRENT_DATE - INTERVAL '7 days')
  );
$$;