import React, { useState, useEffect } from 'react';
import { 
  Building, Building2, Users, Plus, Edit, Trash2, Search, 
  UserPlus, Settings, Shield, GraduationCap, BookOpen
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

interface College {
  id: string;
  name: string;
  code: string;
  address: string;
  is_active: boolean;
}

interface Department {
  id: string;
  college_id: string;
  name: string;
  code: string;
  description: string;
  is_active: boolean;
  colleges?: { name: string; code: string };
}

interface DepartmentRoom {
  id: string;
  department_id: string;
  room_name: string;
  room_code: string;
  description: string;
  max_students: number;
  max_teachers: number;
  room_admin: string | null;
  is_active: boolean;
  departments?: { 
    name: string; 
    code: string;
    colleges?: { name: string; code: string };
  };
}

interface User {
  id: string;
  name: string;
  role: 'student' | 'teacher' | 'admin';
  college_id: string | null;
  department_id: string | null;
  room_id: string | null;
  is_active: boolean;
}

export const CollegeDepartmentAdmin: React.FC = () => {
  const { profile } = useAuth();
  const [colleges, setColleges] = useState<College[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [rooms, setRooms] = useState<DepartmentRoom[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Form states
  const [collegeForm, setCollegeForm] = useState({ name: '', code: '', address: '' });
  const [departmentForm, setDepartmentForm] = useState({ 
    college_id: '', name: '', code: '', description: '' 
  });
  const [roomForm, setRoomForm] = useState({
    department_id: '', room_name: '', room_code: '', description: '',
    max_students: 100, max_teachers: 10
  });
  
  // Dialog states
  const [showCollegeDialog, setShowCollegeDialog] = useState(false);
  const [showDepartmentDialog, setShowDepartmentDialog] = useState(false);
  const [showRoomDialog, setShowRoomDialog] = useState(false);
  const [showUserDialog, setShowUserDialog] = useState(false);
  
  // Edit states
  const [editingCollege, setEditingCollege] = useState<College | null>(null);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [editingRoom, setEditingRoom] = useState<DepartmentRoom | null>(null);

  useEffect(() => {
    fetchColleges();
    fetchDepartments();
    fetchRooms();
    fetchUsers();
  }, []);

  const fetchColleges = async () => {
    try {
      const { data, error } = await supabase
        .from('colleges')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      setColleges(data || []);
    } catch (error) {
      console.error('Error fetching colleges:', error);
      toast.error('Failed to load colleges');
    }
  };

  const fetchDepartments = async () => {
    try {
      const { data, error } = await supabase
        .from('departments')
        .select(`
          *,
          colleges (name, code)
        `)
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
    try {
      const { data, error } = await supabase
        .from('department_rooms')
        .select(`
          *,
          departments (
            name, 
            code,
            colleges (name, code)
          )
        `)
        .eq('is_active', true)
        .order('room_name');
      
      if (error) throw error;
      setRooms(data || []);
    } catch (error) {
      console.error('Error fetching rooms:', error);
      toast.error('Failed to load rooms');
    }
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    }
  };

  // College operations
  const handleCreateCollege = async () => {
    if (!collegeForm.name || !collegeForm.code) {
      toast.error('Name and code are required');
      return;
    }

    try {
      const { error } = await supabase
        .from('colleges')
        .insert([collegeForm]);

      if (error) throw error;
      
      toast.success('College created successfully');
      setCollegeForm({ name: '', code: '', address: '' });
      setShowCollegeDialog(false);
      fetchColleges();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create college');
    }
  };

  // Department operations
  const handleCreateDepartment = async () => {
    if (!departmentForm.college_id || !departmentForm.name || !departmentForm.code) {
      toast.error('College, name and code are required');
      return;
    }

    try {
      const { error } = await supabase
        .from('departments')
        .insert([departmentForm]);

      if (error) throw error;
      
      toast.success('Department created successfully');
      setDepartmentForm({ college_id: '', name: '', code: '', description: '' });
      setShowDepartmentDialog(false);
      fetchDepartments();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create department');
    }
  };

  // Room operations
  const handleCreateRoom = async () => {
    if (!roomForm.department_id || !roomForm.room_name || !roomForm.room_code) {
      toast.error('Department, room name and code are required');
      return;
    }

    try {
      const { error } = await supabase
        .from('department_rooms')
        .insert([{
          ...roomForm,
          room_admin: profile?.id // Set current user as room admin
        }]);

      if (error) throw error;
      
      toast.success('Department room created successfully');
      setRoomForm({
        department_id: '', room_name: '', room_code: '', description: '',
        max_students: 100, max_teachers: 10
      });
      setShowRoomDialog(false);
      fetchRooms();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create room');
    }
  };

  const resetForms = () => {
    setEditingCollege(null);
    setEditingDepartment(null);
    setEditingRoom(null);
    setCollegeForm({ name: '', code: '', address: '' });
    setDepartmentForm({ college_id: '', name: '', code: '', description: '' });
    setRoomForm({
      department_id: '', room_name: '', room_code: '', description: '',
      max_students: 100, max_teachers: 10
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">College & Department Management</h1>
        <Badge variant="outline" className="text-sm">
          {profile?.role === 'admin' ? 'Super Admin' : 'Department Admin'}
        </Badge>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="colleges">Colleges</TabsTrigger>
          <TabsTrigger value="departments">Departments</TabsTrigger>
          <TabsTrigger value="rooms">Department Rooms</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Colleges</p>
                    <p className="text-2xl font-bold">{colleges.length}</p>
                  </div>
                  <Building className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Departments</p>
                    <p className="text-2xl font-bold">{departments.length}</p>
                  </div>
                  <Building2 className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Department Rooms</p>
                    <p className="text-2xl font-bold">{rooms.length}</p>
                  </div>
                  <BookOpen className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Users</p>
                    <p className="text-2xl font-bold">{users.length}</p>
                  </div>
                  <Users className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="colleges" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Colleges</h2>
            <Dialog open={showCollegeDialog} onOpenChange={setShowCollegeDialog}>
              <DialogTrigger asChild>
                <Button onClick={resetForms}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add College
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New College</DialogTitle>
                  <DialogDescription>Add a new college to the system</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="college-name">College Name</Label>
                    <Input
                      id="college-name"
                      value={collegeForm.name}
                      onChange={(e) => setCollegeForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., ABC Engineering College"
                    />
                  </div>
                  <div>
                    <Label htmlFor="college-code">College Code</Label>
                    <Input
                      id="college-code"
                      value={collegeForm.code}
                      onChange={(e) => setCollegeForm(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                      placeholder="e.g., ABC"
                    />
                  </div>
                  <div>
                    <Label htmlFor="college-address">Address</Label>
                    <Textarea
                      id="college-address"
                      value={collegeForm.address}
                      onChange={(e) => setCollegeForm(prev => ({ ...prev, address: e.target.value }))}
                      placeholder="College address..."
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowCollegeDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateCollege}>Create</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          
          <div className="grid gap-4">
            {colleges.map((college) => (
              <Card key={college.id}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Building className="h-5 w-5 text-primary" />
                        <h3 className="text-lg font-semibold">{college.name}</h3>
                        <Badge variant="outline">{college.code}</Badge>
                      </div>
                      {college.address && (
                        <p className="text-muted-foreground">{college.address}</p>
                      )}
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

        <TabsContent value="departments" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Departments</h2>
            <Dialog open={showDepartmentDialog} onOpenChange={setShowDepartmentDialog}>
              <DialogTrigger asChild>
                <Button onClick={resetForms}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Department
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Department</DialogTitle>
                  <DialogDescription>Add a new department to a college</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="dept-college">Select College</Label>
                    <Select value={departmentForm.college_id} onValueChange={(value) => 
                      setDepartmentForm(prev => ({ ...prev, college_id: value }))
                    }>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a college" />
                      </SelectTrigger>
                      <SelectContent>
                        {colleges.map((college) => (
                          <SelectItem key={college.id} value={college.id}>
                            {college.name} ({college.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
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
                      <p className="text-sm text-muted-foreground">
                        College: {department.colleges?.name} ({department.colleges?.code})
                      </p>
                      {department.description && (
                        <p className="text-muted-foreground">{department.description}</p>
                      )}
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
                <Button onClick={resetForms}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Room
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Create Department Room</DialogTitle>
                  <DialogDescription>Create a separate room for your department</DialogDescription>
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
                            {dept.name} - {dept.colleges?.name}
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
                        {room.departments?.name} - {room.departments?.colleges?.name}
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
            <h2 className="text-2xl font-bold">User Management</h2>
            <Button>
              <UserPlus className="h-4 w-4 mr-2" />
              Add User to Room
            </Button>
          </div>
          
          <div className="text-center py-8 text-muted-foreground">
            User management functionality will be implemented next...
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};