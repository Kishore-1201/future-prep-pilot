
import React, { useState } from 'react';
import { Calendar, BookOpen, Bell, Users, Settings, Shield, FileText, TrendingUp, GraduationCap, Brain, LogOut } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RealStudentDashboard } from '@/components/RealStudentDashboard';
import { TeacherDashboard } from '@/components/TeacherDashboard';
import { AdminDashboard } from '@/components/AdminDashboard';
import { useAuth } from '@/hooks/useAuth';

interface Profile {
  id: string;
  name: string;
  role: 'student' | 'teacher' | 'admin';
  department?: string;
  student_id?: string;
  employee_id?: string;
  is_active: boolean;
}

interface DashboardProps {
  userProfile: Profile | null;
}

const Dashboard: React.FC<DashboardProps> = ({ userProfile }) => {
  const { signOut } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  if (!userProfile) {
    return <div>Loading profile...</div>;
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
        return null;
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
