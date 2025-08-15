import React, { useState, useEffect } from 'react';
import { 
  Building2, Edit, Crown, UserPlus, Users, Shield, 
  CheckCircle, Clock, AlertCircle 
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Department {
  id: string;
  name: string;
  code: string;
  description: string;
  is_active: boolean;
  created_at: string;
}

interface AvailableHOD {
  id: string;
  name: string;
  role: string;
  detailed_role: string;
  department_id: string | null;
  is_active: boolean;
}

interface DepartmentHOD {
  id: string;
  name: string;
  detailed_role: string;
}

interface DepartmentStats {
  student_count: number;
  teacher_count: number;
  room_count: number;
}

interface DepartmentCardProps {
  department: Department;
  collegeId: string;
  onUpdate: () => void;
}

export const DepartmentCard: React.FC<DepartmentCardProps> = ({ 
  department, 
  collegeId, 
  onUpdate 
}) => {
  const [hodDialogOpen, setHodDialogOpen] = useState(false);
  const [adminDialogOpen, setAdminDialogOpen] = useState(false);
  const [availableHODs, setAvailableHODs] = useState<AvailableHOD[]>([]);
  const [currentHOD, setCurrentHOD] = useState<DepartmentHOD | null>(null);
  const [selectedHOD, setSelectedHOD] = useState('');
  const [departmentStats, setDepartmentStats] = useState<DepartmentStats>({
    student_count: 0,
    teacher_count: 0,
    room_count: 0
  });
  const [adminForm, setAdminForm] = useState({
    name: '',
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAvailableHODs();
    fetchCurrentHOD();
    fetchDepartmentStats();
  }, [department.id]);

  const fetchAvailableHODs = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, role, detailed_role, department_id, is_active')
        .eq('college_id', collegeId)
        .eq('role', 'teacher')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      setAvailableHODs(data || []);
    } catch (error) {
      console.error('Error fetching available HODs:', error);
    }
  };

  const fetchCurrentHOD = async () => {
    try {
      // Look for teachers in this department with HOD designation
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, detailed_role')
        .eq('department_id', department.id)
        .eq('role', 'teacher')
        .eq('detailed_role', 'hod')
        .eq('is_active', true)
        .maybeSingle();
      
      if (error && error.code !== 'PGRST116') throw error;
      setCurrentHOD(data);
    } catch (error) {
      console.error('Error fetching current HOD:', error);
    }
  };

  const fetchDepartmentStats = async () => {
    try {
      const [studentsRes, teachersRes, roomsRes] = await Promise.all([
        supabase
          .from('profiles')
          .select('id')
          .eq('department_id', department.id)
          .eq('role', 'student')
          .eq('is_active', true),
        supabase
          .from('profiles')
          .select('id')
          .eq('department_id', department.id)
          .eq('role', 'teacher')
          .eq('is_active', true),
        supabase
          .from('department_rooms')
          .select('id')
          .eq('department_id', department.id)
          .eq('is_active', true)
      ]);

      setDepartmentStats({
        student_count: studentsRes.data?.length || 0,
        teacher_count: teachersRes.data?.length || 0,
        room_count: roomsRes.data?.length || 0
      });
    } catch (error) {
      console.error('Error fetching department stats:', error);
    }
  };

  const handleAssignHOD = async () => {
    if (!selectedHOD) {
      toast.error('Please select a teacher to assign as HOD');
      return;
    }

    setLoading(true);
    try {
      // First, remove HOD designation from current HOD if exists
      if (currentHOD) {
        await supabase
          .from('profiles')
          .update({ 
            detailed_role: 'teacher',
            department_id: currentHOD.id === selectedHOD ? department.id : currentHOD.id 
          })
          .eq('id', currentHOD.id);
      }

      // Assign new HOD
      const { error } = await supabase
        .from('profiles')
        .update({ 
          detailed_role: 'hod',
          department_id: department.id 
        })
        .eq('id', selectedHOD);

      if (error) throw error;
      
      toast.success('HOD assigned successfully!');
      setHodDialogOpen(false);
      setSelectedHOD('');
      fetchCurrentHOD();
      fetchAvailableHODs();
      onUpdate();
    } catch (error: any) {
      console.error('Error assigning HOD:', error);
      toast.error(error.message || 'Failed to assign HOD');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDepartmentAdmin = async () => {
    if (!adminForm.name || !adminForm.email || !adminForm.password) {
      toast.error('All fields are required');
      return;
    }

    setLoading(true);
    try {
      // Create user account
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: adminForm.email,
        password: adminForm.password,
        email_confirm: true,
        user_metadata: {
          name: adminForm.name,
          role: 'admin',
          detailed_role: 'department_admin'
        }
      });

      if (authError) throw authError;

      // Update profile with department admin role
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          name: adminForm.name,
          role: 'admin',
          detailed_role: 'department_admin',
          college_id: collegeId,
          department_id: department.id,
          is_active: true,
          pending_approval: false
        })
        .eq('id', authData.user.id);

      if (profileError) throw profileError;

      // Add to department_admins table
      const { error: deptAdminError } = await supabase
        .from('department_admins')
        .insert({
          user_id: authData.user.id,
          department_id: department.id,
          college_id: collegeId,
          assigned_by: (await supabase.auth.getUser()).data.user?.id,
          is_active: true
        });

      if (deptAdminError) throw deptAdminError;

      toast.success('Department admin created successfully!');
      setAdminDialogOpen(false);
      setAdminForm({ name: '', email: '', password: '' });
      onUpdate();
    } catch (error: any) {
      console.error('Error creating department admin:', error);
      toast.error(error.message || 'Failed to create department admin');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">{department.name}</CardTitle>
              <Badge variant="outline">{department.code}</Badge>
            </div>
            {department.description && (
              <CardDescription>{department.description}</CardDescription>
            )}
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {departmentStats.student_count} Students
              </span>
              <span className="flex items-center gap-1">
                <Shield className="h-4 w-4" />
                {departmentStats.teacher_count} Teachers
              </span>
              <span className="flex items-center gap-1">
                <Building2 className="h-4 w-4" />
                {departmentStats.room_count} Rooms
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Edit className="h-4 w-4 mr-1" />
              Edit
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
          <div className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-yellow-600" />
            <span className="font-medium">Head of Department</span>
          </div>
          <div className="flex items-center gap-2">
            {currentHOD ? (
              <>
                <Badge variant="secondary" className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  {currentHOD.name}
                </Badge>
                <Dialog open={hodDialogOpen} onOpenChange={setHodDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      Change HOD
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Assign Head of Department</DialogTitle>
                      <DialogDescription>
                        Select a teacher to be the HOD for {department.name}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Select Teacher</Label>
                        <Select value={selectedHOD} onValueChange={setSelectedHOD}>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose a teacher" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableHODs.map((teacher) => (
                              <SelectItem key={teacher.id} value={teacher.id}>
                                {teacher.name} 
                                {teacher.department_id === department.id && ' (Current Dept)'}
                                {teacher.detailed_role === 'hod' && ' (Current HOD)'}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setHodDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleAssignHOD} disabled={loading}>
                          {loading ? 'Assigning...' : 'Assign HOD'}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </>
            ) : (
              <Dialog open={hodDialogOpen} onOpenChange={setHodDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="text-orange-600">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    Assign HOD
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Assign Head of Department</DialogTitle>
                    <DialogDescription>
                      Select a teacher to be the HOD for {department.name}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Select Teacher</Label>
                      <Select value={selectedHOD} onValueChange={setSelectedHOD}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a teacher" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableHODs.map((teacher) => (
                            <SelectItem key={teacher.id} value={teacher.id}>
                              {teacher.name}
                              {teacher.department_id === department.id && ' (Current Dept)'}
                              {teacher.detailed_role === 'hod' && ' (Current HOD)'}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setHodDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleAssignHOD} disabled={loading}>
                        {loading ? 'Assigning...' : 'Assign HOD'}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            <span className="font-medium">Department Admin</span>
          </div>
          <Dialog open={adminDialogOpen} onOpenChange={setAdminDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <UserPlus className="h-4 w-4 mr-1" />
                Create Admin
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Department Admin</DialogTitle>
                <DialogDescription>
                  Create a new admin account for {department.name} department
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="admin-name">Full Name</Label>
                  <Input
                    id="admin-name"
                    value={adminForm.name}
                    onChange={(e) => setAdminForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter admin name"
                  />
                </div>
                <div>
                  <Label htmlFor="admin-email">Email</Label>
                  <Input
                    id="admin-email"
                    type="email"
                    value={adminForm.email}
                    onChange={(e) => setAdminForm(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Enter admin email"
                  />
                </div>
                <div>
                  <Label htmlFor="admin-password">Password</Label>
                  <Input
                    id="admin-password"
                    type="password"
                    value={adminForm.password}
                    onChange={(e) => setAdminForm(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="Enter password"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setAdminDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateDepartmentAdmin} disabled={loading}>
                    {loading ? 'Creating...' : 'Create Admin'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="text-sm text-muted-foreground">
          Created: {new Date(department.created_at).toLocaleDateString()}
        </div>
      </CardContent>
    </Card>
  );
};