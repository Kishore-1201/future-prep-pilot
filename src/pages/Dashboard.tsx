import React, { useState } from 'react';
import { Calendar, BookOpen, Bell, Users, Settings, Shield, FileText, TrendingUp, GraduationCap, Brain, LogOut, Building2, Building, UserPlus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RealStudentDashboard } from '@/components/RealStudentDashboard';
import { TeacherDashboard } from '@/components/TeacherDashboard';
import { AdminDashboard } from '@/components/AdminDashboard';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';

interface Profile {
  id: string;
  name: string;
  role: 'student' | 'teacher' | 'admin' | 'department_admin';
  department?: string;
  department_id?: string;
  student_id?: string;
  employee_id?: string;
  is_active: boolean;
}

interface DashboardProps {
  userProfile: Profile | null;
}

const Dashboard: React.FC<DashboardProps> = ({ userProfile }) => {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  // Show loading state if profile is still null
  if (!userProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Brain className="h-12 w-12 text-primary mx-auto animate-pulse" />
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <div className="space-y-2">
            <p className="text-lg font-semibold">CampusConnect</p>
            <p className="text-muted-foreground">Setting up your profile...</p>
          </div>
        </div>
      </div>
    );
  }

  // CRITICAL: Show empty state if user hasn't joined a department
  const showEmptyState = (userProfile.role === 'student' || userProfile.role === 'teacher') && !userProfile.department_id;

  if (showEmptyState) {
    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Brain className="h-8 w-8 text-primary" />
                  <div>
                    <h1 className="text-2xl font-bold text-primary">CampusConnect</h1>
                    <p className="text-xs text-muted-foreground hidden sm:block">Smart Academic Assistant</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="flex items-center gap-1">
                    {userProfile.role === 'student' && <BookOpen className="h-3 w-3" />}
                    {userProfile.role === 'teacher' && <GraduationCap className="h-3 w-3" />}
                    {userProfile.role.charAt(0).toUpperCase() + userProfile.role.slice(1)}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    Welcome, {userProfile.name}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={signOut}>
                  <LogOut className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">Sign Out</span>
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Empty State Content */}
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-2xl mx-auto text-center space-y-8">
            <div className="space-y-4">
              <UserPlus className="h-24 w-24 text-muted-foreground mx-auto" />
              <h2 className="text-3xl font-bold">Join a Department</h2>
              <p className="text-lg text-muted-foreground">
                You need to join a department to access your dashboard and academic features.
              </p>
            </div>

            <Card className="text-left">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  How to Join a Department
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">1</div>
                    <div>
                      <p className="font-medium">Contact your Department Admin</p>
                      <p className="text-sm text-muted-foreground">Get the join code from your department administrator</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">2</div>
                    <div>
                      <p className="font-medium">Enter the Join Code</p>
                      <p className="text-sm text-muted-foreground">Use the code to request access to your department</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">3</div>
                    <div>
                      <p className="font-medium">Wait for Approval</p>
                      <p className="text-sm text-muted-foreground">Your request will be reviewed and approved</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button onClick={() => navigate('/join-department')} size="lg">
                <UserPlus className="h-5 w-5 mr-2" />
                Join Department
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const getNavigation = () => {
    switch (userProfile.role) {
      case 'student':
        return [
          { id: 'overview', label: 'Overview', icon: Calendar },
          { id: 'schedule', label: 'Schedule', icon: Calendar },
          { id: 'assignments', label: 'Assignments', icon: BookOpen },
          { id: 'exams', label: 'Exams', icon: GraduationCap },
          { id: 'notices', label: 'Notices', icon: Bell },
          { id: 'events', label: 'Events', icon: Users },
          { id: 'materials', label: 'Study Materials', icon: FileText },
        ];
      case 'teacher':
        return [
          { id: 'overview', label: 'Overview', icon: Calendar },
          { id: 'classes', label: 'My Classes', icon: BookOpen },
          { id: 'assignments', label: 'Assignments', icon: FileText },
          { id: 'grading', label: 'Grading', icon: TrendingUp },
          { id: 'students', label: 'Students', icon: Users },
          { id: 'materials', label: 'Materials', icon: FileText },
          { id: 'announcements', label: 'Announcements', icon: Bell },
        ];
      case 'admin':
        return [
          { id: 'overview', label: 'Overview', icon: Calendar },
          { id: 'users', label: 'User Management', icon: Users },
          { id: 'colleges', label: 'Colleges', icon: Building },
          { id: 'departments', label: 'Departments', icon: Building2 },
          { id: 'courses', label: 'Courses', icon: BookOpen },
          { id: 'events', label: 'Campus Events', icon: Calendar },
          { id: 'notices', label: 'Global Notices', icon: Bell },
          { id: 'system', label: 'System', icon: Settings },
          { id: 'reports', label: 'Reports', icon: TrendingUp },
        ];
      default:
        return [];
    }
  };

  const renderDashboard = () => {
    switch (userProfile.role) {
      case 'student':
        return (
          <RealStudentDashboard
            activeTab={activeTab}
            userId={userProfile.id}
          />
        );
      case 'teacher':
        return <TeacherDashboard activeTab={activeTab} />;
      case 'admin':
        return <AdminDashboard activeTab={activeTab} />;
      default:
        return (
          <div className="text-center p-8">
            <p className="text-muted-foreground">Role not recognized. Please contact support.</p>
          </div>
        );
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'student': return 'default';
      case 'teacher': return 'secondary';
      case 'admin': return 'destructive';
      default: return 'outline';
    }
  };

  const navigation = getNavigation();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Brain className="h-8 w-8 text-primary" />
                <div>
                  <h1 className="text-2xl font-bold text-primary">CampusConnect</h1>
                  <p className="text-xs text-muted-foreground hidden sm:block">Smart Academic Assistant</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={getRoleColor(userProfile.role)} className="flex items-center gap-1">
                  {userProfile.role === 'admin' && <Shield className="h-3 w-3" />}
                  {userProfile.role === 'teacher' && <GraduationCap className="h-3 w-3" />}
                  {userProfile.role === 'student' && <BookOpen className="h-3 w-3" />}
                  {userProfile.role.charAt(0).toUpperCase() + userProfile.role.slice(1)}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  Welcome, {userProfile.name}
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="hidden md:flex">
                <Bell className="h-4 w-4 mr-1" />
                <span className="hidden lg:inline">Notifications</span>
              </Button>
              <Button variant="outline" size="sm" className="hidden md:flex">
                <Settings className="h-4 w-4 mr-1" />
                <span className="hidden lg:inline">Settings</span>
              </Button>
              {/* Add Join Department button for students/teachers */}
              {(userProfile.role === 'student' || userProfile.role === 'teacher') && (
                <Button variant="outline" size="sm" onClick={() => navigate('/join-department')}>
                  <UserPlus className="h-4 w-4 mr-1" />
                  <span className="hidden lg:inline">Change Department</span>
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={signOut}>
                <LogOut className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Sign Out</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar Navigation */}
          <aside className="lg:w-64">
            <Card className="sticky top-24">
              <CardContent className="p-4">
                <nav className="space-y-2">
                  {navigation.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                          activeTab === item.id
                            ? 'bg-primary text-primary-foreground'
                            : 'hover:bg-muted'
                        }`}
                      >
                        <Icon className="h-4 w-4 flex-shrink-0" />
                        <span className="truncate">{item.label}</span>
                      </button>
                    );
                  })}
                </nav>
              </CardContent>
            </Card>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            {renderDashboard()}
          </main>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
