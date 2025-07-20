-- Complete college-department-room system
-- Drop existing departments table if it exists
DROP TABLE IF EXISTS public.departments CASCADE;

-- Create colleges table
CREATE TABLE IF NOT EXISTS public.colleges (
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

-- Create departments table (linked to colleges)
CREATE TABLE IF NOT EXISTS public.departments (
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

-- Create department_rooms table (separate rooms for each department)
CREATE TABLE IF NOT EXISTS public.department_rooms (
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

-- Update profiles table to include college, department, and room
ALTER TABLE public.profiles DROP COLUMN IF EXISTS department_id;
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS college_id UUID REFERENCES public.colleges(id),
ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES public.departments(id),
ADD COLUMN IF NOT EXISTS room_id UUID REFERENCES public.department_rooms(id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_college_id ON public.profiles(college_id);
CREATE INDEX IF NOT EXISTS idx_profiles_department_id ON public.profiles(department_id);
CREATE INDEX IF NOT EXISTS idx_profiles_room_id ON public.profiles(room_id);
CREATE INDEX IF NOT EXISTS idx_departments_college_id ON public.departments(college_id);
CREATE INDEX IF NOT EXISTS idx_department_rooms_department_id ON public.department_rooms(department_id);

-- Enable RLS on all tables
ALTER TABLE public.colleges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.department_rooms ENABLE ROW LEVEL SECURITY;

-- RLS Policies for colleges
CREATE POLICY "Everyone can view active colleges" ON public.colleges
  FOR SELECT USING (is_active = true);

CREATE POLICY "Super admins can manage colleges" ON public.colleges
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role = 'admin' 
      AND college_id IS NULL -- Super admin has no college assigned
    )
  );

-- RLS Policies for departments
CREATE POLICY "Everyone can view active departments" ON public.departments
  FOR SELECT USING (is_active = true);

CREATE POLICY "College admins can manage their departments" ON public.departments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role = 'admin' 
      AND (college_id = departments.college_id OR college_id IS NULL)
    )
  );

-- RLS Policies for department_rooms
CREATE POLICY "Users can view rooms in their college" ON public.department_rooms
  FOR SELECT USING (
    is_active = true AND
    EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.departments d ON p.college_id = d.college_id
      WHERE p.id = auth.uid() AND d.id = department_rooms.department_id
    )
  );

CREATE POLICY "Department admins can manage their rooms" ON public.department_rooms
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.departments d ON p.department_id = d.id
      WHERE p.id = auth.uid() 
      AND p.role = 'admin' 
      AND d.id = department_rooms.department_id
    )
  );

CREATE POLICY "Room admins can manage their assigned rooms" ON public.department_rooms
  FOR ALL USING (room_admin = auth.uid());

-- Insert sample colleges
INSERT INTO public.colleges (name, code, address) VALUES
  ('ABC Engineering College', 'ABC', '123 Tech Street, Engineering City'),
  ('XYZ Institute of Technology', 'XYZ', '456 Innovation Avenue, Tech Town'),
  ('PQR College of Engineering', 'PQR', '789 Science Boulevard, Knowledge City')
ON CONFLICT (name) DO NOTHING;