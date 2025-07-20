import React, { useState, useEffect } from 'react';
import { 
  Users, BookOpen, Bell, Settings, TrendingUp, Shield, Calendar, 
  FileText, Database, Activity, AlertTriangle, Plus, Edit, Trash2,
  Building2, UserCheck, UserX, Search, Filter, Download, Building
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { CollegeDepartmentAdmin } from './CollegeDepartmentAdmin';

interface AdminDashboardProps {
  activeTab: string;
}

interface Department {
  id: string;
  name: string;
  code: string;
  description: string;
  head_of_department: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface User {
  id: string;
  name: string;
  role: 'student' | 'teacher' | 'admin';
  department_id: string | null;
  is_active: boolean;
  created_at: string;
}

interface AdminStats {
  total_users: number;
  total_students: number;
  total_teachers: number;
  total_admins: number;
  total_departments: number;
  total_courses: number;
  total_events: number;
  total_notices: number;
  recent_signups: number;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ activeTab }) => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  
  // Department form state
  const [departmentForm, setDepartmentForm] = useState({
    name: '',
    code: '',
    description: ''
  });
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [showDepartmentDialog, setShowDepartmentDialog] = useState(false);

  useEffect(() => {
    if (activeTab === 'overview') {
      fetchAdminStats();
    } else if (activeTab === 'departments') {
      fetchDepartments();
    } else if (activeTab === 'users') {
      fetchUsers();
    }
  }, [activeTab]);

  const fetchAdminStats = async () => {
    try {
      const { data, error } = await supabase.rpc('get_admin_stats');
      if (error) throw error;
      setAdminStats(data);
    } catch (error) {
      console.error('Error fetching admin stats:', error);
      toast.error('Failed to load statistics');
    }
  };

  const fetchDepartments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('departments')
        .select('*')
        .order('name');
      
      if (error) throw error;
      setDepartments(data || []);
    } catch (error) {
      console.error('Error fetching departments:', error);
      toast.error('Failed to load departments');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          name,
          role,
          department_id,
          is_active,
          created_at,
          departments (
            name,
            code
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDepartment = async () => {
    if (!departmentForm.name || !departmentForm.code) {
      toast.error('Name and code are required');
      return;
    }

    try {
      const { error } = await supabase
        .from('departments')
        .insert([departmentForm]);

      if (error) throw error;
      
      toast.success('Department created successfully');
      setDepartmentForm({ name: '', code: '', description: '' });
      setShowDepartmentDialog(false);
      fetchDepartments();
    } catch (error: any) {
      console.error('Error creating department:', error);
      toast.error(error.message || 'Failed to create department');
    }
  };

  const handleUpdateDepartment = async () => {
    if (!editingDepartment || !departmentForm.name || !departmentForm.code) {
      toast.error('Name and code are required');
      return;
    }

    try {
      const { error } = await supabase
        .from('departments')
        .update({
          name: departmentForm.name,
          code: departmentForm.code,
          description: departmentForm.description,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingDepartment.id);

      if (error) throw error;
      
      toast.success('Department updated successfully');
      setEditingDepartment(null);
      setDepartmentForm({ name: '', code: '', description: '' });
      setShowDepartmentDialog(false);
      fetchDepartments();
    } catch (error: any) {
      console.error('Error updating department:', error);
      toast.error(error.message || 'Failed to update department');
    }
  };

  const handleDeleteDepartment = async (id: string) => {
    if (!confirm('Are you sure you want to delete this department?')) return;

    try {
      const { error } = await supabase
        .from('departments')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
      
      toast.success('Department deleted successfully');
      fetchDepartments();
    } catch (error: any) {
      console.error('Error deleting department:', error);
      toast.error(error.message || 'Failed to delete department');
    }
  };

  const handleToggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: !currentStatus })
        .eq('id', userId);

      if (error) throw error;
      
      toast.success(`User ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
      fetchUsers();
    } catch (error: any) {
      console.error('Error updating user status:', error);
      toast.error(error.message || 'Failed to update user status');
    }
  };

  const openEditDepartment = (department: Department) => {
    setEditingDepartment(department);
    setDepartmentForm({
      name: department.name,
      code: department.code,
      description: department.description || ''
    });
    setShowDepartmentDialog(true);
  };

  const resetDepartmentForm = () => {
    setEditingDepartment(null);
    setDepartmentForm({ name: '', code: '', description: '' });
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === 'all' || user.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  const renderDepartmentsTab = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold">Department Management</h2>
        <Dialog open={showDepartmentDialog} onOpenChange={setShowDepartmentDialog}>
          <DialogTrigger asChild>
            <Button onClick={resetDepartmentForm}>
              <Plus className="h-4 w-4 mr-2" />
              Add Department
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingDepartment ? 'Edit Department' : 'Create New Department'}
              </DialogTitle>
              <DialogDescription>
                {editingDepartment ? 'Update department information' : 'Add a new department to the system'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Department Name</Label>
                <Input
                  id="name"
                  value={departmentForm.name}
                  onChange={(e) => setDepartmentForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Computer Science"
                />
              </div>
              <div>
                <Label htmlFor="code">Department Code</Label>
                <Input
                  id="code"
                  value={departmentForm.code}
                  onChange={(e) => setDepartmentForm(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                  placeholder="e.g., CS"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={departmentForm.description}
                  onChange={(e) => setDepartmentForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Department description..."
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowDepartmentDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={editingDepartment ? handleUpdateDepartment : handleCreateDepartment}>
                  {editingDepartment ? 'Update' : 'Create'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="grid gap-4">
        {loading ? (
          <div className="text-center py-8">Loading departments...</div>
        ) : departments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">No departments found</div>
        ) : (
          departments.map((department) => (
            <Card key={department.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
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
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => openEditDepartment(department)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDeleteDepartment(department.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );

  const renderUsersTab = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold">User Management</h2>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add User
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>
        <Select value={selectedRole} onValueChange={setSelectedRole}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="student">Students</SelectItem>
            <SelectItem value="teacher">Teachers</SelectItem>
            <SelectItem value="admin">Admins</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* User Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Students</p>
                <p className="text-2xl font-bold text-blue-600">
                  {adminStats?.total_students || 0}
                </p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Teachers</p>
                <p className="text-2xl font-bold text-green-600">
                  {adminStats?.total_teachers || 0}
                </p>
              </div>
              <BookOpen className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Admins</p>
                <p className="text-2xl font-bold text-purple-600">
                  {adminStats?.total_admins || 0}
                </p>
              </div>
              <Shield className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold">
                  {adminStats?.total_users || 0}
                </p>
              </div>
              <Activity className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users List */}
      <div className="grid gap-4">
        {loading ? (
          <div className="text-center py-8">Loading users...</div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">No users found</div>
        ) : (
          filteredUsers.map((user) => (
            <Card key={user.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
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
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleToggleUserStatus(user.id, user.is_active)}
                    >
                      {user.is_active ? (
                        <>
                          <UserX className="h-4 w-4 mr-1" />
                          Deactivate
                        </>
                      ) : (
                        <>
                          <UserCheck className="h-4 w-4 mr-1" />
                          Activate
                        </>
                      )}
                    </Button>
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'colleges':
      case 'departments':
        return <CollegeDepartmentAdmin />;
      case 'users':
        return renderUsersTab();
      case 'courses':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Course Management</h2>
            <div className="text-center py-8 text-muted-foreground">
              Course management functionality coming soon...
            </div>
          </div>
        );
      case 'events':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Campus Events Management</h2>
            <div className="text-center py-8 text-muted-foreground">
              Event management functionality coming soon...
            </div>
          </div>
        );
      case 'notices':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Global Notices</h2>
            <div className="text-center py-8 text-muted-foreground">
              Notice management functionality coming soon...
            </div>
          </div>
        );
      case 'system':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">System Settings & Health</h2>
            <div className="text-center py-8 text-muted-foreground">
              System settings functionality coming soon...
            </div>
          </div>
        );
      case 'reports':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Analytics & Reports</h2>
            <div className="text-center py-8 text-muted-foreground">
              Reports functionality coming soon...
            </div>
          </div>
        );
      default:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Admin Dashboard Overview</h2>
            
            {/* System Statistics */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Users</p>
                      <p className="text-2xl font-bold">{adminStats?.total_users || 0}</p>
                    </div>
                    <Users className="h-8 w-8 text-primary" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Departments</p>
                      <p className="text-2xl font-bold">{adminStats?.total_departments || 0}</p>
                    </div>
                    <Building2 className="h-8 w-8 text-primary" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Active Events</p>
                      <p className="text-2xl font-bold">{adminStats?.total_events || 0}</p>
                    </div>
                    <Calendar className="h-8 w-8 text-primary" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Recent Signups</p>
                      <p className="text-2xl font-bold text-green-600">{adminStats?.recent_signups || 0}</p>
                    </div>
                    <Activity className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common administrative tasks</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Button variant="outline" className="h-20 flex-col">
                    <Building2 className="h-6 w-6 mb-2" />
                    Manage Departments
                  </Button>
                  <Button variant="outline" className="h-20 flex-col">
                    <Users className="h-6 w-6 mb-2" />
                    User Management
                  </Button>
                  <Button variant="outline" className="h-20 flex-col">
                    <Calendar className="h-6 w-6 mb-2" />
                    Create Event
                  </Button>
                  <Button variant="outline" className="h-20 flex-col">
                    <Bell className="h-6 w-6 mb-2" />
                    Send Notice
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        );
    }
  };

  return renderContent();
};