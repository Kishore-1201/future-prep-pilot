import React, { useState } from 'react';
import { Calendar, BookOpen, Bell, Users, Settings, PlusCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScheduleViewer } from '@/components/ScheduleViewer';
import { AssignmentTracker } from '@/components/AssignmentTracker';
import { NoticeBoard } from '@/components/NoticeBoard';
import { EventDiscovery } from '@/components/EventDiscovery';

type UserRole = 'student' | 'teacher' | 'admin';

const Dashboard = () => {
  const [userRole, setUserRole] = useState<UserRole>('student');
  const [activeTab, setActiveTab] = useState('overview');

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
    { id: 1, title: 'Tech Symposium', date: '2024-07-25', time: '10:00 AM', location: 'Main Auditorium', rsvpStatus: null as const },
    { id: 2, title: 'Career Fair', date: '2024-07-30', time: '9:00 AM', location: 'Campus Center', rsvpStatus: 'attending' as const },
  ];

  const navigation = [
    { id: 'overview', label: 'Overview', icon: Calendar },
    { id: 'schedule', label: 'Schedule', icon: Calendar },
    { id: 'assignments', label: 'Assignments', icon: BookOpen },
    { id: 'notices', label: 'Notices', icon: Bell },
    { id: 'events', label: 'Events', icon: Users },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'schedule':
        return <ScheduleViewer classes={upcomingClasses} />;
      case 'assignments':
        return <AssignmentTracker assignments={assignments} />;
      case 'notices':
        return <NoticeBoard notices={recentNotices} />;
      case 'events':
        return <EventDiscovery events={upcomingEvents} />;
      default:
        return (
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Today's Classes</p>
                      <p className="text-2xl font-bold">{upcomingClasses.length}</p>
                    </div>
                    <Calendar className="h-8 w-8 text-primary" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Pending Tasks</p>
                      <p className="text-2xl font-bold">{assignments.filter(a => a.status === 'pending').length}</p>
                    </div>
                    <BookOpen className="h-8 w-8 text-primary" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">New Notices</p>
                      <p className="text-2xl font-bold">{recentNotices.filter(n => n.urgent).length}</p>
                    </div>
                    <Bell className="h-8 w-8 text-primary" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Upcoming Events</p>
                      <p className="text-2xl font-bold">{upcomingEvents.length}</p>
                    </div>
                    <Users className="h-8 w-8 text-primary" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Today's Schedule */}
            <Card>
              <CardHeader>
                <CardTitle>Today's Schedule</CardTitle>
                <CardDescription>Your classes and activities for today</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {upcomingClasses.map((class_) => (
                    <div key={class_.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{class_.subject}</h4>
                        <p className="text-sm text-muted-foreground">{class_.professor} • {class_.room}</p>
                      </div>
                      <Badge variant="outline">{class_.time}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Assignments */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Assignments</CardTitle>
                <CardDescription>Track your assignment progress</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {assignments.slice(0, 3).map((assignment) => (
                    <div key={assignment.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{assignment.title}</h4>
                        <p className="text-sm text-muted-foreground">{assignment.subject} • Due: {assignment.dueDate}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant={assignment.priority === 'high' ? 'destructive' : assignment.priority === 'medium' ? 'default' : 'secondary'}
                        >
                          {assignment.priority}
                        </Badge>
                        <Badge variant={assignment.status === 'completed' ? 'default' : 'outline'}>
                          {assignment.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-primary">CampusConnect</h1>
              <Badge variant="outline">{userRole.charAt(0).toUpperCase() + userRole.slice(1)}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Bell className="h-4 w-4 mr-1" />
                Notifications
              </Button>
              <Button variant="outline" size="sm">
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
            <Card>
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
                        <Icon className="h-4 w-4" />
                        {item.label}
                      </button>
                    );
                  })}
                </nav>
              </CardContent>
            </Card>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            {renderContent()}
          </main>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
