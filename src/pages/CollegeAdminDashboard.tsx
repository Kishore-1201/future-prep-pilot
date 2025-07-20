import React, { useState, useEffect } from 'react';
import { 
  Building2, Users, Plus, Edit, Trash2, UserPlus, 
  GraduationCap, BookOpen, Settings, TrendingUp
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

interface Department {
  id: string;
  name: string;
  code: string;
  description: string;
  is_active: boolean;
  created_at: string;
}

interface DepartmentRoom {
  id: string;
  department_id: string;
  room_name: string;
  room_code: string;
  description: string;
  max_students: number;
  max_teachers: number;
  is_active: boolean;
  departments?: { name: string; code: string };
}

interface CollegeUser {
  id: string;
  name: string;
  role: 'student' | 'teacher' | 'admin';
  department_id: string | null;
  room_id: string | null;
  is_active: boolean;
  created_at: string;
}

interface CollegeStats {
  total_departments: number;
  total_rooms: number;
  total_students: number;
  total_teachers: number;
}

export const CollegeAdminDashboard: React.FC = () => {
  const { profile } = useAuth();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [rooms, setRooms] = useState<DepartmentRoom[]>([]);
  const [users, setUsers] = useState<CollegeUser[]>([]);
  const [stats, setStats] = useState<CollegeStats | null>(null);
  const [loading, setLoading] = useState(false);

  // Form states
  const [departmentForm, setDepartmentForm] = useState({
    name: '', code: '', description: ''
  });
  const [roomForm, setRoomForm] = useState({
    department_id: '', room_name: '', room_code: '', description: '',
    max_students: 100, max_teachers: 10
  });
  const [userForm, setUserForm] = useState({
    name: '', email: '', role: 'student' as 'student' | 'teacher',
    department_id: '', room_id: ''
  });

  // Dialog states
  const [showDepartmentDialog, setShowDepartmentDialog] = useState(false);
  const [showRoomDialog, setShowRoomDialog] = useState(false);
  const [showUserDialog, setShowUserDialog] = useState(false);

  useEffect(() => {
    if (profile?.college_id) {
      fetchDepartments();
      fetchRooms();
      fetchUsers();
      fetchStats();
    }
  }, [profile]);

  const fetchDepartments = async () => {
    if (!profile?.college_id) return;
    
    try {
      const { data, error } = await supabase
        .from('departments')
        .select('*')
        .eq('college_id', profile.college_id)
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      setDepartments(data || []);
    } catch (error) {
      console.error('Error fetching departments:', error);
      toast.error('Failed to load departments');
    }
  };

  const fetchRooms = async () => {
    if (!profile?.college_id) return;
    
    try {
      const { data, error } = await supabase
        .from('department_rooms')
        .select(`
          *,
          departments (name, code)
        `)
        .eq('is_active', true)
        .order('room_name');
      
      if (error) throw error;
      
      // Filter rooms that belong to this college's departments
      const collegeRooms = data?.filter(room => 
        departments.some(dept => dept.id === room.department_id)
      ) || [];
      
      setRooms(collegeRooms);
    } catch (error) {
      console.error('Error fetching rooms:', error);
      toast.error('Failed to load rooms');
    }
  };

  const fetchUsers = async () => {
    if (!profile?.college_id) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('college_id', profile.college_id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    }
  };

  const fetchStats = async () => {
    if (!profile?.college_id) return;
    
    try {
      const { data, error } = await supabase.rpc('get_college_stats', {
        college_uuid: profile.college_id
      });
      
      if (error) throw error;
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleCreateDepartment = async () => {
    if (!departmentForm.name || !departmentForm.code || !profile?.college_id) {
      toast.error('Name and code are required');
      return;
    }

    try {
      const { error } = await supabase
        .from('departments')
        .insert({
          college_id: profile.college_id,
          name: departmentForm.name,
          code: departmentForm.code.toUpperCase(),
          description: departmentForm.description
        });

      if (error) throw error;
      
      toast.success('Department created successfully');
      setDepartmentForm({ name: '', code: '', description: '' });
      setShowDepartmentDialog(false);
      fetchDepartments();
      fetchStats();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create department');
    }
  };

  const handleCreateRoom = async () => {
    if (!roomForm.department_id || !roomForm.room_name || !roomForm.room_code) {
      toast.error('Department, room name and code are required');
      return;
    }

    try {
      const { error } = await supabase
        .from('department_rooms')
        .insert({
          ...roomForm,
          room_admin: profile?.id
        });

      if (error) throw error;
      
      toast.success('Department room created successfully');
      setRoomForm({
        department_id: '', room_name: '', room_code: '', description: '',
        max_students: 100, max_teachers: 10
      });
      setShowRoomDialog(false);
      fetchRooms();
      fetchStats();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create room');
    }
  };

  const handleCreateUser = async () => {
    if (!userForm.name || !userForm.email || !userForm.department_id) {
      toast.error('Name, email, and department are required');
      return;
    }

    try {
      // Create user account
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: userForm.email,
        password: 'TempPassword123!', // Temporary password
        email_confirm: true,
        user_metadata: {
          name: userForm.name,
          role: userForm.role
        }
      });

      if (authError) throw authError;

      // Update profile with college and department info
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          name: userForm.name,
          role: userForm.role,
          college_id: profile?.college_id,
          department_id: userForm.department_id,
          room_id: userForm.room_id || null
        })
        .eq('id', authData.user.id);

      if (profileError) throw profileError;

      toast.success(`${userForm.role} created successfully`);
      setUserForm({
        name: '', email: '', role: 'student',
        department_id: '', room_id: ''
      });
      setShowUserDialog(false);
      fetchUsers();
      fetchStats();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create user');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">College Administration</h1>
          <p className="text-muted-foreground">Manage your college departments and users</p>
        </div>
        <Badge variant="default" className="text-sm">
          <Building2 className="h-4 w-4 mr-1" />
          College Admin
        </Badge>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="departments">Departments</TabsTrigger>
          <TabsTrigger value="rooms">Department Rooms</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Departments</p>
                    <p className="text-2xl font-bold">{stats?.total_departments || 0}</p>
                  </div>
                  <Building2 className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Department Rooms</p>
                    <p className="text-2xl font-bold">{stats?.total_rooms || 0}</p>
                  </div>
                  <BookOpen className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Students</p>
                    <p className="text-2xl font-bold">{stats?.total_students || 0}</p>
                  </div>
                  <GraduationCap className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Teachers</p>
                    <p className="text-2xl font-bold">{stats?.total_teachers || 0}</p>
                  </div>
                  <Users className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common administrative tasks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button 
                  variant="outline" 
                  className="h-20 flex-col"
                  onClick={() => setShowDepartmentDialog(true)}
                >
                  <Building2 className="h-6 w-6 mb-2" />
                  Add Department
                </Button>
                <Button 
                  variant="outline" 
                  className="h-20 flex-col"
                  onClick={() => setShowRoomDialog(true)}
                >
                  <BookOpen className="h-6 w-6 mb-2" />
                  Create Room
                </Button>
                <Button 
                  variant="outline" 
                  className="h-20 flex-col"
                  onClick={() => setShowUserDialog(true)}
                >
                  <UserPlus className="h-6 w-6 mb-2" />
                  Add User
                </Button>
                <Button variant="outline" className="h-20 flex-col">
                  <TrendingUp className="h-6 w-6 mb-2" />
                  View Reports
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="departments" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Departments</h2>
            <Dialog open={showDepartmentDialog} onOpenChange={setShowDepartmentDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Department
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Department</DialogTitle>
                  <DialogDescription>Add a new department to your college</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="dept-name">Department Name</Label>
                    <Input
                      id="dept-name"
                      value={departmentForm.name}
                      onChange={(e) => setDepartmentForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., Computer Science Engineering"
                    />
                  </div>
                  <div>
                    <Label htmlFor="dept-code">Department Code</Label>
                    <Input
                      id="dept-code"
                      value={departmentForm.code}
                      onChange={(e) => setDepartmentForm(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                      placeholder="e.g., CSE"
                    />
                  </div>
                  <div>
                    <Label htmlFor="dept-description">Description</Label>
                    <Textarea
                      id="dept-description"
                      value={departmentForm.description}
                      onChange={(e) => setDepartmentForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Department description..."
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowDepartmentDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateDepartment}>Create</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          
          <div className="grid gap-4">
            {departments.map((department) => (
              <Card key={department.id}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-primary" />
                        <h3 className="text-lg font-semibold">{department.name}</h3>
                        <Badge variant="outline">{department.code}</Badge>
                      </div>
                      {department.description && (
                        <p className="text-muted-foreground">{department.description}</p>
                      )}
                      <p className="text-sm text-muted-foreground">
                        Created: {new Date(department.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="rooms" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Department Rooms</h2>
            <Dialog open={showRoomDialog} onOpenChange={setShowRoomDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Room
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Department Room</DialogTitle>
                  <DialogDescription>Create a separate room for a department</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="room-dept">Select Department</Label>
                    <Select value={roomForm.department_id} onValueChange={(value) => 
                      setRoomForm(prev => ({ ...prev, department_id: value }))
                    }>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a department" />
                      </SelectTrigger>
                      <SelectContent>
                        {departments.map((dept) => (
                          <SelectItem key={dept.id} value={dept.id}>
                            {dept.name} ({dept.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="room-name">Room Name</Label>
                    <Input
                      id="room-name"
                      value={roomForm.room_name}
                      onChange={(e) => setRoomForm(prev => ({ ...prev, room_name: e.target.value }))}
                      placeholder="e.g., CSE Main Room"
                    />
                  </div>
                  <div>
                    <Label htmlFor="room-code">Room Code</Label>
                    <Input
                      id="room-code"
                      value={roomForm.room_code}
                      onChange={(e) => setRoomForm(prev => ({ ...prev, room_code: e.target.value.toUpperCase() }))}
                      placeholder="e.g., CSE001"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="max-students">Max Students</Label>
                      <Input
                        id="max-students"
                        type="number"
                        value={roomForm.max_students}
                        onChange={(e) => setRoomForm(prev => ({ ...prev, max_students: parseInt(e.target.value) || 100 }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="max-teachers">Max Teachers</Label>
                      <Input
                        id="max-teachers"
                        type="number"
                        value={roomForm.max_teachers}
                        onChange={(e) => setRoomForm(prev => ({ ...prev, max_teachers: parseInt(e.target.value) || 10 }))}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="room-description">Description</Label>
                    <Textarea
                      id="room-description"
                      value={roomForm.description}
                      onChange={(e) => setRoomForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Room description..."
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowRoomDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateRoom}>Create Room</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          
          <div className="grid gap-4">
            {rooms.map((room) => (
              <Card key={room.id}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-5 w-5 text-primary" />
                        <h3 className="text-lg font-semibold">{room.room_name}</h3>
                        <Badge variant="outline">{room.room_code}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Department: {room.departments?.name} ({room.departments?.code})
                      </p>
                      <div className="flex gap-4 text-sm text-muted-foreground">
                        <span>Max Students: {room.max_students}</span>
                        <span>Max Teachers: {room.max_teachers}</span>
                      </div>
                      {room.description && (
                        <p className="text-muted-foreground">{room.description}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Users className="h-4 w-4 mr-1" />
                        Manage Users
                      </Button>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Users Management</h2>
            <Dialog open={showUserDialog} onOpenChange={setShowUserDialog}>
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add User
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New User</DialogTitle>
                  <DialogDescription>Add a student or teacher to your college</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="user-name">Full Name</Label>
                    <Input
                      id="user-name"
                      value={userForm.name}
                      onChange={(e) => setUserForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="User's full name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="user-email">Email</Label>
                    <Input
                      id="user-email"
                      type="email"
                      value={userForm.email}
                      onChange={(e) => setUserForm(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="user@college.edu"
                    />
                  </div>
                  <div>
                    <Label htmlFor="user-role">Role</Label>
                    <Select value={userForm.role} onValueChange={(value: 'student' | 'teacher') => 
                      setUserForm(prev => ({ ...prev, role: value }))
                    }>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="student">Student</SelectItem>
                        <SelectItem value="teacher">Teacher</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="user-dept">Department</Label>
                    <Select value={userForm.department_id} onValueChange={(value) => 
                      setUserForm(prev => ({ ...prev, department_id: value }))
                    }>
                      <SelectTrigger>
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        {departments.map((dept) => (
                          <SelectItem key={dept.id} value={dept.id}>
                            {dept.name} ({dept.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="user-room">Room (Optional)</Label>
                    <Select value={userForm.room_id} onValueChange={(value) => 
                      setUserForm(prev => ({ ...prev, room_id: value }))
                    }>
                      <SelectTrigger>
                        <SelectValue placeholder="Select room (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        {rooms.filter(room => room.department_id === userForm.department_id).map((room) => (
                          <SelectItem key={room.id} value={room.id}>
                            {room.room_name} ({room.room_code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowUserDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateUser}>Add User</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          
          <div className="grid gap-4">
            {users.map((user) => (
              <Card key={user.id}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold">{user.name}</h3>
                        <Badge variant={
                          user.role === 'admin' ? 'destructive' :
                          user.role === 'teacher' ? 'default' : 'secondary'
                        }>
                          {user.role}
                        </Badge>
                        <Badge variant={user.is_active ? 'default' : 'outline'}>
                          {user.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Joined: {new Date(user.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <h2 className="text-2xl font-bold">College Settings</h2>
          <div className="text-center py-8 text-muted-foreground">
            College settings functionality coming soon...
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};