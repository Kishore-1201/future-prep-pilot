import React, { useState, useEffect } from 'react';
import { 
  BookOpen, Users, MessageSquare, Calendar, FileText, TrendingUp, 
  GraduationCap, Clock, Target, CheckCircle, Crown, Shield, 
  UserPlus, Copy, RefreshCw, Eye, EyeOff, QrCode, Settings,
  AlertCircle, UserCheck, UserX, Building2
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

interface HODDashboardProps {
  activeTab: string;
}

interface DepartmentCode {
  id: string;
  student_code: string;
  teacher_code: string;
  is_active: boolean;
  created_at: string;
  expires_at: string | null;
}

interface JoinRequest {
  id: string;
  user_id: string;
  department_id: string;
  join_code: string;
  user_role: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  profiles: {
    name: string;
    role: string;
  };
}

interface DepartmentStats {
  total_students: number;
  total_teachers: number;
  pending_requests: number;
  active_codes: number;
}

export const HODDashboard: React.FC<HODDashboardProps> = ({ activeTab }) => {
  const { profile } = useAuth();
  const [departmentCodes, setDepartmentCodes] = useState<DepartmentCode[]>([]);
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
  const [departmentStats, setDepartmentStats] = useState<DepartmentStats>({
    total_students: 0,
    total_teachers: 0,
    pending_requests: 0,
    active_codes: 0
  });
  const [loading, setLoading] = useState(false);
  const [showCode, setShowCode] = useState<{ [key: string]: boolean }>({});
  
  // Form states
  const [codeForm, setCodeForm] = useState({
    role_type: 'student' as 'student' | 'teacher',
    max_usage: 50,
    expires_in_days: 30
  });

  // States for students and teachers tabs
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [teachersLoading, setTeachersLoading] = useState(false);

  useEffect(() => {
    if (profile?.department_id) {
      fetchDepartmentCodes();
      fetchJoinRequests();
      fetchDepartmentStats();
      fetchDepartmentStudents();
      fetchDepartmentTeachers();
    }
  }, [profile]);

  const fetchDepartmentStudents = async () => {
    if (!profile?.department_id) return;
    
    try {
      setStudentsLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, student_id, created_at, is_active')
        .eq('department_id', profile.department_id)
        .eq('role', 'student')
        .order('name');
      
      if (error) throw error;
      setStudents(data || []);
    } catch (error) {
      console.error('Error fetching students:', error);
      toast.error('Failed to load students');
    } finally {
      setStudentsLoading(false);
    }
  };

  const fetchDepartmentTeachers = async () => {
    if (!profile?.department_id) return;
    
    try {
      setTeachersLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, employee_id, detailed_role, created_at, is_active')
        .eq('department_id', profile.department_id)
        .eq('role', 'teacher')
        .order('name');
      
      if (error) throw error;
      setTeachers(data || []);
    } catch (error) {
      console.error('Error fetching teachers:', error);
      toast.error('Failed to load teachers');
    } finally {
      setTeachersLoading(false);
    }
  };

  const fetchDepartmentCodes = async () => {
    if (!profile?.department_id) return;
    
    try {
      const { data, error } = await supabase
        .from('department_codes')
        .select('*')
        .eq('department_id', profile.department_id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setDepartmentCodes(data || []);
    } catch (error) {
      console.error('Error fetching department codes:', error);
      toast.error('Failed to load department codes');
    }
  };

  const fetchJoinRequests = async () => {
    if (!profile?.department_id) return;
    
    try {
      const { data, error } = await supabase
        .from('pending_department_joins')
        .select(`
          *,
          profiles (name, role)
        `)
        .eq('department_id', profile.department_id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setJoinRequests(data || []);
    } catch (error) {
      console.error('Error fetching join requests:', error);
      toast.error('Failed to load join requests');
    }
  };

  const fetchDepartmentStats = async () => {
    if (!profile?.department_id) return;
    
    try {
      const [studentsRes, teachersRes, requestsRes, codesRes] = await Promise.all([
        supabase
          .from('profiles')
          .select('id')
          .eq('department_id', profile.department_id)
          .eq('role', 'student')
          .eq('is_active', true),
        supabase
          .from('profiles')
          .select('id')
          .eq('department_id', profile.department_id)
          .eq('role', 'teacher')
          .eq('is_active', true),
        supabase
          .from('pending_department_joins')
          .select('id')
          .eq('department_id', profile.department_id)
          .eq('status', 'pending'),
        supabase
          .from('department_codes')
          .select('id')
          .eq('department_id', profile.department_id)
          .eq('is_active', true)
      ]);

      setDepartmentStats({
        total_students: studentsRes.data?.length || 0,
        total_teachers: teachersRes.data?.length || 0,
        pending_requests: requestsRes.data?.length || 0,
        active_codes: codesRes.data?.length || 0
      });
    } catch (error) {
      console.error('Error fetching department stats:', error);
    }
  };

  const generateDepartmentCode = async () => {
    if (!profile?.department_id) return;
    
    try {
      setLoading(true);
      
      const expiresAt = codeForm.expires_in_days > 0 
        ? new Date(Date.now() + codeForm.expires_in_days * 24 * 60 * 60 * 1000).toISOString()
        : null;

      const { data, error } = await supabase.rpc('generate_department_codes', {
        dept_id: profile.department_id,
        college_id: profile.college_id!,
        created_by: profile.id
      });

      if (error) throw error;

      // Update the generated code with expiration if needed
      if (data && expiresAt) {
        const { error: updateError } = await supabase
          .from('department_codes')
          .update({
            expires_at: expiresAt
          })
          .eq('department_id', profile.department_id);

        if (updateError) throw updateError;
      }

      toast.success('Department join codes generated successfully!');
      fetchDepartmentCodes();
      fetchDepartmentStats();
      
      // Reset form
      setCodeForm({
        role_type: 'student',
        max_usage: 50,
        expires_in_days: 30
      });
    } catch (error: any) {
      console.error('Error generating code:', error);
      toast.error(error.message || 'Failed to generate code');
    } finally {
      setLoading(false);
    }
  };

  const toggleCodeStatus = async (codeId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('department_codes')
        .update({ is_active: !currentStatus })
        .eq('id', codeId);

      if (error) throw error;

      toast.success(`Code ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
      fetchDepartmentCodes();
      fetchDepartmentStats();
    } catch (error: any) {
      console.error('Error toggling code status:', error);
      toast.error(error.message || 'Failed to update code status');
    }
  };

  const handleJoinRequest = async (requestId: string, action: 'approve' | 'reject') => {
    try {
      setLoading(true);

      const { error } = await supabase.rpc('approve_department_join', {
        p_join_id: requestId,
        p_approver_id: profile?.id!
      });

      if (error) throw error;

      toast.success(`Request ${action}d successfully`);
      fetchJoinRequests();
      fetchDepartmentStats();
    } catch (error: any) {
      console.error(`Error ${action}ing request:`, error);
      toast.error(error.message || `Failed to ${action} request`);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Code copied to clipboard!');
  };

  const toggleShowCode = (codeId: string) => {
    setShowCode(prev => ({ ...prev, [codeId]: !prev[codeId] }));
  };

  // Mock data for teacher features (in real app, this would come from API)
  const myClasses = [
    { id: 1, name: 'Advanced Database Systems', students: 45, schedule: 'MWF 9:00-10:00 AM', room: 'A-101', nextClass: '2024-07-22 09:00' },
    { id: 2, name: 'Software Engineering', students: 38, schedule: 'TTh 2:00-3:30 PM', room: 'B-205', nextClass: '2024-07-23 14:00' },
    { id: 3, name: 'Computer Networks', students: 32, schedule: 'MWF 11:00-12:00 PM', room: 'C-301', nextClass: '2024-07-22 11:00' },
  ];

  const recentAssignments = [
    { id: 1, title: 'Database Design Project', class: 'Advanced Database Systems', submitted: 42, total: 45, dueDate: '2024-07-22', type: 'Project' },
    { id: 2, title: 'Software Requirements Analysis', class: 'Software Engineering', submitted: 35, total: 38, dueDate: '2024-07-24', type: 'Assignment' },
    { id: 3, title: 'Network Protocol Quiz', class: 'Computer Networks', submitted: 30, total: 32, dueDate: '2024-07-25', type: 'Quiz' },
  ];

  const pendingGrading = [
    { id: 1, title: 'Midterm Examination', class: 'Advanced Database Systems', count: 12, priority: 'high' },
    { id: 2, title: 'Project Submission', class: 'Software Engineering', count: 8, priority: 'medium' },
    { id: 3, title: 'Weekly Quiz', class: 'Computer Networks', count: 5, priority: 'low' },
  ];

  const renderClassesTab = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">My Classes</h2>
          <p className="text-muted-foreground">Classes you teach as HOD</p>
        </div>
        <Button>
          <Calendar className="h-4 w-4 mr-2" />
          Schedule Class
        </Button>
      </div>
      <div className="grid gap-4">
        {myClasses.map((class_) => (
          <Card key={class_.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">{class_.name}</h3>
                  <p className="text-muted-foreground">{class_.schedule} • {class_.room}</p>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Next: {new Date(class_.nextClass).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Badge variant="outline">{class_.students} students</Badge>
                  <Button variant="outline" size="sm">Manage</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderAssignmentsTab = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Assignment Management</h2>
          <p className="text-muted-foreground">Manage assignments for your classes</p>
        </div>
        <Button>
          <FileText className="h-4 w-4 mr-2" />
          Create Assignment
        </Button>
      </div>
      <div className="grid gap-4">
        {recentAssignments.map((assignment) => (
          <Card key={assignment.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold">{assignment.title}</h3>
                    <Badge variant="secondary">{assignment.type}</Badge>
                  </div>
                  <p className="text-muted-foreground">{assignment.class} • Due: {assignment.dueDate}</p>
                  <div className="flex items-center gap-2">
                    <Progress value={(assignment.submitted / assignment.total) * 100} className="w-32" />
                    <span className="text-sm text-muted-foreground">
                      {assignment.submitted}/{assignment.total} submitted
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={assignment.submitted === assignment.total ? 'default' : 'secondary'}>
                    {assignment.submitted === assignment.total ? 'Complete' : 'Pending'}
                  </Badge>
                  <Button variant="outline" size="sm">View Details</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderStudentsTab = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Department Students</h2>
          <p className="text-muted-foreground">All students in your department</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <FileText className="h-4 w-4 mr-2" />
            Export List
          </Button>
          <Button variant="outline" onClick={fetchDepartmentStudents}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>
      
      {studentsLoading ? (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading students...</p>
          </CardContent>
        </Card>
      ) : students.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Students Found</h3>
            <p className="text-muted-foreground">No students have joined your department yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {students.map((student: any) => (
            <Card key={student.id}>
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">{student.name}</h3>
                    <div className="flex items-center gap-4">
                      {student.student_id && (
                        <Badge variant="outline">ID: {student.student_id}</Badge>
                      )}
                      <Badge variant={student.is_active ? 'default' : 'secondary'}>
                        {student.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        Joined: {new Date(student.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">View Profile</Button>
                    <Button variant="outline" size="sm">Send Message</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  const renderTeachersTab = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Department Teachers</h2>
          <p className="text-muted-foreground">All teachers in your department</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <FileText className="h-4 w-4 mr-2" />
            Export List
          </Button>
          <Button variant="outline" onClick={fetchDepartmentTeachers}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>
      
      {teachersLoading ? (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading teachers...</p>
          </CardContent>
        </Card>
      ) : teachers.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <GraduationCap className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Teachers Found</h3>
            <p className="text-muted-foreground">No teachers have joined your department yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {teachers.map((teacher: any) => (
            <Card key={teacher.id}>
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold">{teacher.name}</h3>
                      {teacher.detailed_role === 'hod' && (
                        <Crown className="h-4 w-4 text-yellow-600" />
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      {teacher.employee_id && (
                        <Badge variant="outline">ID: {teacher.employee_id}</Badge>
                      )}
                      <Badge variant={teacher.detailed_role === 'hod' ? 'default' : 'secondary'}>
                        {teacher.detailed_role === 'hod' ? 'HOD' : 'Teacher'}
                      </Badge>
                      <Badge variant={teacher.is_active ? 'default' : 'secondary'}>
                        {teacher.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        Joined: {new Date(teacher.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">View Profile</Button>
                    <Button variant="outline" size="sm">Send Message</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  const renderAnnouncementsTab = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Department Announcements</h2>
          <p className="text-muted-foreground">Send announcements to all department members</p>
        </div>
        <Button>
          <MessageSquare className="h-4 w-4 mr-2" />
          New Announcement
        </Button>
      </div>
      
      <Card className="border-l-4 border-l-blue-500">
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <Crown className="h-6 w-6 text-blue-600 mt-1" />
            <div>
              <h3 className="font-semibold text-blue-900">HOD Announcement Privileges</h3>
              <p className="text-sm text-blue-700 mt-1">
                As HOD, your announcements will be sent to all students and teachers in the department. 
                Use this feature to communicate important information, deadlines, and updates.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No announcements yet. Create your first announcement to communicate with your department.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderCodeManagement = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Department Join Codes</h2>
          <p className="text-muted-foreground">Generate and manage codes for students and teachers to join your department</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <QrCode className="h-4 w-4 mr-2" />
              Generate New Code
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Generate Department Join Code</DialogTitle>
              <DialogDescription>
                Create a new code for students or teachers to join your department
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  This will generate both student and teacher codes for your department.
                </p>
              </div>
              <div>
                <Label>Expires in Days (0 = never expires)</Label>
                <Input
                  type="number"
                  value={codeForm.expires_in_days}
                  onChange={(e) => setCodeForm(prev => ({ ...prev, expires_in_days: parseInt(e.target.value) || 0 }))}
                  placeholder="30"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setCodeForm({ role_type: 'student', max_usage: 50, expires_in_days: 30 })}>
                  Cancel
                </Button>
                <Button onClick={generateDepartmentCode} disabled={loading}>
                  {loading ? 'Generating...' : 'Generate Code'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {departmentCodes.map((code) => (
          <Card key={code.id} className={`${!code.is_active ? 'opacity-60' : ''}`}>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge variant={code.is_active ? 'default' : 'outline'}>
                      {code.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  
                  {/* Student Code */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Student Code</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        value={showCode[`${code.id}-student`] ? code.student_code : '••••••••'}
                        readOnly
                        className="font-mono text-lg w-48"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleShowCode(`${code.id}-student`)}
                      >
                        {showCode[`${code.id}-student`] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(code.student_code)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Teacher Code */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Teacher Code</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        value={showCode[`${code.id}-teacher`] ? code.teacher_code : '••••••••'}
                        readOnly
                        className="font-mono text-lg w-48"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleShowCode(`${code.id}-teacher`)}
                      >
                        {showCode[`${code.id}-teacher`] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(code.teacher_code)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex gap-4 text-sm text-muted-foreground">
                    <span>Created: {new Date(code.created_at).toLocaleDateString()}</span>
                    {code.expires_at && (
                      <span>Expires: {new Date(code.expires_at).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleCodeStatus(code.id, code.is_active)}
                  >
                    {code.is_active ? 'Deactivate' : 'Activate'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderJoinRequests = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Join Requests</h2>
          <p className="text-muted-foreground">Review and approve requests to join your department</p>
        </div>
        <Badge variant="outline" className="text-sm">
          <AlertCircle className="h-4 w-4 mr-1" />
          {departmentStats.pending_requests} Pending
        </Badge>
      </div>

      {joinRequests.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <UserPlus className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Join Requests</h3>
            <p className="text-muted-foreground">No pending join requests at this time.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {joinRequests.map((request) => (
            <Card key={request.id} className={`border-l-4 ${
              request.status === 'pending' ? 'border-l-amber-500' :
              request.status === 'approved' ? 'border-l-green-500' : 'border-l-red-500'
            }`}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold">{request.profiles.name}</h3>
                      <Badge variant={request.profiles.role === 'student' ? 'default' : 'secondary'}>
                        {request.profiles.role}
                      </Badge>
                      <Badge variant={
                        request.status === 'pending' ? 'secondary' :
                        request.status === 'approved' ? 'default' : 'destructive'
                      }>
                        {request.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Code used: <span className="font-mono">{request.join_code}</span>
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Requested: {new Date(request.created_at).toLocaleDateString()}
                    </p>
                  </div>

                  {request.status === 'pending' && (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleJoinRequest(request.id, 'reject')}
                        disabled={loading}
                        className="text-red-600 hover:text-red-700"
                      >
                        <UserX className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleJoinRequest(request.id, 'approve')}
                        disabled={loading}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <UserCheck className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  const renderOverview = () => (
    <div className="space-y-6">
      {/* HOD Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Students</p>
                <p className="text-2xl font-bold">{departmentStats.total_students}</p>
              </div>
              <GraduationCap className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Teachers</p>
                <p className="text-2xl font-bold">{departmentStats.total_teachers}</p>
              </div>
              <Users className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Requests</p>
                <p className="text-2xl font-bold">{departmentStats.pending_requests}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-amber-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Codes</p>
                <p className="text-2xl font-bold">{departmentStats.active_codes}</p>
              </div>
              <QrCode className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* HOD Role Badge */}
      <Card className="border-l-4 border-l-yellow-500">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <Crown className="h-8 w-8 text-yellow-600" />
            <div>
              <h3 className="text-lg font-semibold">Head of Department</h3>
              <p className="text-muted-foreground">You have administrative privileges for this department</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>HOD Quick Actions</CardTitle>
          <CardDescription>Common administrative tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Button variant="outline" className="flex flex-col items-center gap-2 h-20">
              <QrCode className="h-6 w-6" />
              <span className="text-xs">Generate Code</span>
            </Button>
            <Button variant="outline" className="flex flex-col items-center gap-2 h-20">
              <UserCheck className="h-6 w-6" />
              <span className="text-xs">Review Requests</span>
            </Button>
            <Button variant="outline" className="flex flex-col items-center gap-2 h-20">
              <MessageSquare className="h-6 w-6" />
              <span className="text-xs">Send Notice</span>
            </Button>
            <Button variant="outline" className="flex flex-col items-center gap-2 h-20">
              <TrendingUp className="h-6 w-6" />
              <span className="text-xs">View Reports</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'codes':
        return renderCodeManagement();
      case 'requests':
        return renderJoinRequests();
      case 'classes':
        return renderClassesTab();
      case 'assignments':
        return renderAssignmentsTab();
      case 'students':
        return renderStudentsTab();
      case 'teachers':
        return renderTeachersTab();
      case 'announcements':
        return renderAnnouncementsTab();
      default:
        return renderOverview();
    }
  };

  return renderContent();
};