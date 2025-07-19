
import React, { useState } from 'react';
import { Calendar, BookOpen, Bell, Users, Settings, Shield, FileText, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StudentDashboard } from '@/components/StudentDashboard';
import { TeacherDashboard } from '@/components/TeacherDashboard';
import { AdminDashboard } from '@/components/AdminDashboard';

type UserRole = 'student' | 'teacher' | 'admin';

const Dashboard = () => {
  const [userRole, setUserRole] = useState<UserRole>('student');
  const [activeTab, setActiveTab] = useState('overview');

  // Sample data for student role
  const upcomingClasses = [
    { id: 1, subject: 'Computer Science 101', time: '9:00 AM', room: 'Room A-101', professor: 'Dr. Smith' },
    { id: 2, subject: 'Mathematics', time: '11:00 AM', room: 'Room B-205', professor: 'Prof. Johnson' },
    { id: 3, subject: 'Physics Lab', time: '2:00 PM', room: 'Lab C-301', professor: 'Dr. Brown' },
  ];

  const assignments = [
    { id: 1, title: 'Data Structures Assignment', subject: 'CS 101', dueDate: '2024-07-22', priority: 'high' as const, status: 'pending' as const },
    { id: 2, title: 'Calculus Problem Set', subject: 'Math', dueDate: '2024-07-24', priority: 'medium' as const, status: 'in-progress' as const },
    { id: 3, title: 'Physics Lab Report', subject: 'Physics', dueDate: '2024-07-25', priority: 'low' as const, status: 'completed' as const },
  ];

  const recentNotices = [
    { id: 1, title: 'Semester Schedule Update', type: 'academic' as const, date: '2024-07-19', urgent: true },
    { id: 2, title: 'Library Hours Extended', type: 'facility' as const, date: '2024-07-18', urgent: false },
    { id: 3, title: 'New Course Registration Open', type: 'registration' as const, date: '2024-07-17', urgent: false },
  ];

  const upcomingEvents = [
    { id: 1, title: 'Tech Symposium', date: '2024-07-25', time: '10:00 AM', location: 'Main Auditorium', rsvpStatus: null },
    { id: 2, title: 'Career Fair', date: '2024-07-30', time: '9:00 AM', location: 'Campus Center', rsvpStatus: 'attending' as const },
  ];

  const getNavigation = () => {
    switch (userRole) {
      case 'student':
        return [
          { id: 'overview', label: 'Overview', icon: Calendar },
          { id: 'schedule', label: 'Schedule', icon: Calendar },
          { id: 'assignments', label: 'Assignments', icon: BookOpen },
          { id: 'notices', label: 'Notices', icon: Bell },
          { id: 'events', label: 'Events', icon: Users },
        ];
      case 'teacher':
        return [
          { id: 'overview', label: 'Overview', icon: Calendar },
          { id: 'classes', label: 'My Classes', icon: BookOpen },
          { id: 'assignments', label: 'Assignments', icon: FileText },
          { id: 'grading', label: 'Grading', icon: TrendingUp },
          { id: 'announcements', label: 'Announcements', icon: Bell },
        ];
      case 'admin':
        return [
          { id: 'overview', label: 'Overview', icon: Calendar },
          { id: 'users', label: 'User Management', icon: Users },
          { id: 'courses', label: 'Courses', icon: BookOpen },
          { id: 'system', label: 'System', icon: Settings },
          { id: 'reports', label: 'Reports', icon: TrendingUp },
        ];
      default:
        return [];
    }
  };

  const renderDashboard = () => {
    switch (userRole) {
      case 'student':
        return (
          <StudentDashboard
            activeTab={activeTab}
            upcomingClasses={upcomingClasses}
            assignments={assignments}
            notices={recentNotices}
            events={upcomingEvents}
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

  const getRoleColor = (role: UserRole) => {
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
              <h1 className="text-2xl font-bold text-primary">CampusConnect</h1>
              <Badge variant={getRoleColor(userRole)}>
                {userRole === 'admin' && <Shield className="h-3 w-3 mr-1" />}
                {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
              </Badge>
            </div>
            
            {/* Role Switcher for Demo */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex gap-1 p-1 bg-muted rounded-lg">
                {(['student', 'teacher', 'admin'] as UserRole[]).map((role) => (
                  <Button
                    key={role}
                    variant={userRole === role ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => {
                      setUserRole(role);
                      setActiveTab('overview');
                    }}
                    className="capitalize"
                  >
                    {role === 'admin' && <Shield className="h-3 w-3 mr-1" />}
                    {role}
                  </Button>
                ))}
              </div>
              
              <Button variant="outline" size="sm" className="hidden sm:flex">
                <Bell className="h-4 w-4 mr-1" />
                Notifications
              </Button>
              <Button variant="outline" size="sm" className="hidden sm:flex">
                <Settings className="h-4 w-4 mr-1" />
                Settings
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
