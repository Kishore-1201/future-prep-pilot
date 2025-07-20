
-- Create custom types for enums
CREATE TYPE app_role AS ENUM ('student', 'teacher', 'admin');
CREATE TYPE assignment_priority AS ENUM ('low', 'medium', 'high');
CREATE TYPE assignment_status AS ENUM ('pending', 'in-progress', 'completed', 'overdue');
CREATE TYPE target_audience AS ENUM ('student', 'teacher', 'all');
CREATE TYPE attendance_status AS ENUM ('present', 'absent', 'late');
CREATE TYPE rsvp_response AS ENUM ('going', 'not_going', 'maybe');
CREATE TYPE day_of_week AS ENUM ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday');

-- Create profiles table linked to auth.users
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role app_role NOT NULL DEFAULT 'student',
  department TEXT,
  student_id TEXT,
  employee_id TEXT,
  google_auth_id TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create assignments table
CREATE TABLE public.assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMP WITH TIME ZONE NOT NULL,
  priority assignment_priority NOT NULL DEFAULT 'medium',
  reminder_time TIMESTAMP WITH TIME ZONE,
  status assignment_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create notices table
CREATE TABLE public.notices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  target_audience target_audience NOT NULL DEFAULT 'all',
  created_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  date_posted TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_urgent BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create events table
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  event_date TIMESTAMP WITH TIME ZONE NOT NULL,
  rsvp_deadline TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  max_attendees INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create class_schedules table
CREATE TABLE public.class_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  subject TEXT NOT NULL,
  class_time TIME NOT NULL,
  day_of_week day_of_week NOT NULL,
  room_number TEXT,
  semester TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create exams table
CREATE TABLE public.exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  subject TEXT NOT NULL,
  exam_date DATE NOT NULL,
  start_time TIME NOT NULL,
  duration INTEGER NOT NULL, -- duration in minutes
  student_group TEXT,
  room_number TEXT,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create study_materials table
CREATE TABLE public.study_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  uploaded_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  link TEXT,
  file_url TEXT,
  for_class TEXT,
  subject TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create attendance table
CREATE TABLE public.attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  class_id UUID REFERENCES public.class_schedules(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  status attendance_status NOT NULL DEFAULT 'present',
  marked_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(student_id, class_id, date)
);

-- Create rsvps table
CREATE TABLE public.rsvps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  response rsvp_response NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(event_id, student_id)
);

-- Create notifications table
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  related_id UUID, -- can reference assignments, events, etc.
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rsvps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create security definer function to get current user role
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS app_role AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'student'::app_role)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (public.get_current_user_role() = 'admin');

CREATE POLICY "Admins can manage all profiles" ON public.profiles
  FOR ALL USING (public.get_current_user_role() = 'admin');

-- RLS Policies for assignments
CREATE POLICY "Students can manage their own assignments" ON public.assignments
  FOR ALL USING (auth.uid() = student_id);

CREATE POLICY "Teachers and admins can view all assignments" ON public.assignments
  FOR SELECT USING (public.get_current_user_role() IN ('teacher', 'admin'));

-- RLS Policies for notices
CREATE POLICY "Everyone can view notices" ON public.notices
  FOR SELECT USING (true);

CREATE POLICY "Teachers and admins can create notices" ON public.notices
  FOR INSERT WITH CHECK (public.get_current_user_role() IN ('teacher', 'admin'));

CREATE POLICY "Creators can update their notices" ON public.notices
  FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Admins can manage all notices" ON public.notices
  FOR ALL USING (public.get_current_user_role() = 'admin');

-- RLS Policies for events
CREATE POLICY "Everyone can view events" ON public.events
  FOR SELECT USING (true);

CREATE POLICY "Teachers and admins can create events" ON public.events
  FOR INSERT WITH CHECK (public.get_current_user_role() IN ('teacher', 'admin'));

CREATE POLICY "Creators can update their events" ON public.events
  FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Admins can manage all events" ON public.events
  FOR ALL USING (public.get_current_user_role() = 'admin');

-- RLS Policies for class_schedules
CREATE POLICY "Students can view their schedules" ON public.class_schedules
  FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "Teachers can view their class schedules" ON public.class_schedules
  FOR SELECT USING (auth.uid() = teacher_id);

CREATE POLICY "Teachers and admins can manage schedules" ON public.class_schedules
  FOR ALL USING (public.get_current_user_role() IN ('teacher', 'admin'));

-- RLS Policies for exams
CREATE POLICY "Everyone can view exams" ON public.exams
  FOR SELECT USING (true);

CREATE POLICY "Teachers and admins can manage exams" ON public.exams
  FOR ALL USING (public.get_current_user_role() IN ('teacher', 'admin'));

-- RLS Policies for study_materials
CREATE POLICY "Everyone can view study materials" ON public.study_materials
  FOR SELECT USING (true);

CREATE POLICY "Teachers and admins can manage materials" ON public.study_materials
  FOR ALL USING (public.get_current_user_role() IN ('teacher', 'admin'));

-- RLS Policies for attendance
CREATE POLICY "Students can view their attendance" ON public.attendance
  FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "Teachers can manage attendance" ON public.attendance
  FOR ALL USING (public.get_current_user_role() IN ('teacher', 'admin'));

-- RLS Policies for rsvps
CREATE POLICY "Students can manage their RSVPs" ON public.rsvps
  FOR ALL USING (auth.uid() = student_id);

CREATE POLICY "Teachers and admins can view all RSVPs" ON public.rsvps
  FOR SELECT USING (public.get_current_user_role() IN ('teacher', 'admin'));

-- RLS Policies for notifications
CREATE POLICY "Users can view their notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications" ON public.notifications
  FOR INSERT WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX idx_assignments_student_id ON public.assignments(student_id);
CREATE INDEX idx_assignments_due_date ON public.assignments(due_date);
CREATE INDEX idx_notices_target_audience ON public.notices(target_audience);
CREATE INDEX idx_events_event_date ON public.events(event_date);
CREATE INDEX idx_class_schedules_student_id ON public.class_schedules(student_id);
CREATE INDEX idx_class_schedules_teacher_id ON public.class_schedules(teacher_id);
CREATE INDEX idx_attendance_student_id ON public.attendance(student_id);
CREATE INDEX idx_rsvps_event_id ON public.rsvps(event_id);
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);

-- Insert sample data
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_user_meta_data)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440001', 'admin@campus.edu', crypt('admin123', gen_salt('bf')), now(), now(), now(), '{"name": "Admin User", "role": "admin"}'),
  ('550e8400-e29b-41d4-a716-446655440002', 'teacher@campus.edu', crypt('teacher123', gen_salt('bf')), now(), now(), now(), '{"name": "John Teacher", "role": "teacher"}'),
  ('550e8400-e29b-41d4-a716-446655440003', 'student@campus.edu', crypt('student123', gen_salt('bf')), now(), now(), now(), '{"name": "Jane Student", "role": "student"}');

-- Sample notices
INSERT INTO public.notices (title, description, target_audience, created_by) VALUES
  ('Welcome to New Semester', 'Welcome to the new academic semester. Please check your schedules.', 'all', '550e8400-e29b-41d4-a716-446655440001'),
  ('Assignment Deadline Reminder', 'All pending assignments are due this Friday.', 'student', '550e8400-e29b-41d4-a716-446655440002'),
  ('Faculty Meeting', 'Monthly faculty meeting scheduled for next Monday.', 'teacher', '550e8400-e29b-41d4-a716-446655440001');

-- Sample events
INSERT INTO public.events (title, description, location, event_date, created_by) VALUES
  ('Tech Symposium 2024', 'Annual technology symposium featuring industry experts.', 'Main Auditorium', '2024-08-15 10:00:00+00', '550e8400-e29b-41d4-a716-446655440001'),
  ('Career Fair', 'Meet with top companies and explore career opportunities.', 'Campus Center', '2024-08-20 09:00:00+00', '550e8400-e29b-41d4-a716-446655440002');
