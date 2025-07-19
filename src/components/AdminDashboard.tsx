
import React from 'react';
import { Users, BookOpen, Bell, Settings, TrendingUp, Shield, Calendar, FileText, Database, Activity, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface AdminDashboardProps {
  activeTab: string;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ activeTab }) => {
  const systemStats = {
    totalUsers: 1247,
    activeTeachers: 48,
    activeStudents: 1199,
    totalCourses: 156,
    pendingApprovals: 12,
    systemUptime: '99.9%',
    activeEvents: 8,
    globalNotices: 5
  };

  const recentActivity = [
    { id: 1, action: 'New teacher registration', user: 'Dr. Sarah Wilson', time: '2 hours ago', type: 'user', priority: 'medium' },
    { id: 2, action: 'Course approval request', user: 'Prof. Mike Chen', time: '4 hours ago', type: 'course', priority: 'high' },
    { id: 3, action: 'System backup completed', user: 'System', time: '6 hours ago', type: 'system', priority: 'low' },
    { id: 4, action: 'Student bulk enrollment', user: 'Admin Staff', time: '1 day ago', type: 'enrollment', priority: 'medium' },
  ];

  const pendingApprovals = [
    { id: 1, type: 'Course', title: 'Advanced Machine Learning', requester: 'Dr. Alice Brown', date: '2024-07-19', priority: 'high' },
    { id: 2, type: 'Teacher', title: 'Physics Department', requester: 'Prof. John Davis', date: '2024-07-18', priority: 'medium' },
    { id: 3, type: 'Event', title: 'Tech Innovation Summit', requester: 'Student Council', date: '2024-07-17', priority: 'low' },
  ];

  const campusEvents = [
    { id: 1, title: 'Annual Tech Fest', date: '2024-08-15', status: 'upcoming', attendees: 500, location: 'Main Campus' },
    { id: 2, title: 'Career Fair 2024', date: '2024-08-20', status: 'planning', attendees: 300, location: 'Convention Center' },
    { id: 3, title: 'Alumni Meet', date: '2024-09-01', status: 'approved', attendees: 200, location: 'Alumni Hall' },
  ];

  const renderEventsTab = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold">Campus Events Management</h2>
        <Button>
          <Calendar className="h-4 w-4 mr-2" />
          Create Event
        </Button>
      </div>
      
      <div className="grid gap-4">
        {campusEvents.map((event) => (
          <Card key={event.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">{event.title}</h3>
                  <p className="text-muted-foreground">{event.date} • {event.location}</p>
                  <div className="flex items-center gap-2">
                    <Badge variant={
                      event.status === 'upcoming' ? 'default' :
                      event.status === 'planning' ? 'secondary' : 'outline'
                    }>
                      {event.status}
                    </Badge>
                    <span className="text-sm text-muted-foreground">{event.attendees} expected attendees</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">Edit</Button>
                  <Button variant="outline" size="sm">View Details</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderNoticesTab = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold">Global Notices</h2>
        <Button>
          <Bell className="h-4 w-4 mr-2" />
          Create Notice
        </Button>
      </div>
      
      <div className="grid gap-4">
        {['Semester Break Announcement', 'New Library Rules', 'Campus Maintenance Schedule', 'Scholarship Applications Open'].map((notice, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">{notice}</h3>
                  <p className="text-muted-foreground">Published on {new Date().toLocaleDateString()}</p>
                  <Badge variant="outline">All Users</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">Edit</Button>
                  <Button variant="outline" size="sm">Analytics</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'users':
        return (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2 className="text-2xl font-bold">User Management</h2>
              <div className="flex gap-2">
                <Button variant="outline">
                  <Users className="h-4 w-4 mr-2" />
                  Import Users
                </Button>
                <Button>
                  <Users className="h-4 w-4 mr-2" />
                  Add User
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Students
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary">{systemStats.activeStudents}</div>
                  <p className="text-sm text-muted-foreground mt-2">Active students</p>
                  <Progress value={85} className="mt-2" />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    Teachers
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary">{systemStats.activeTeachers}</div>
                  <p className="text-sm text-muted-foreground mt-2">Active teachers</p>
                  <Progress value={92} className="mt-2" />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Pending
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-destructive">{systemStats.pendingApprovals}</div>
                  <p className="text-sm text-muted-foreground mt-2">Awaiting approval</p>
                  <Progress value={30} className="mt-2" />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Active
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">{systemStats.totalUsers}</div>
                  <p className="text-sm text-muted-foreground mt-2">Total users</p>
                  <Progress value={95} className="mt-2" />
                </CardContent>
              </Card>
            </div>
          </div>
        );
      case 'courses':
        return (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2 className="text-2xl font-bold">Course Management</h2>
              <Button>
                <BookOpen className="h-4 w-4 mr-2" />
                Add Course
              </Button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Course Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Total Courses</span>
                      <span className="text-2xl font-bold">{systemStats.totalCourses}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Active This Semester</span>
                      <span className="text-2xl font-bold">42</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Pending Approval</span>
                      <span className="text-2xl font-bold text-orange-600">8</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Popular Departments</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {['Computer Science', 'Mathematics', 'Physics', 'Chemistry'].map((dept, index) => (
                      <div key={dept} className="flex justify-between items-center">
                        <span>{dept}</span>
                        <Badge variant="outline">{20 - index * 3} courses</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );
      case 'events':
        return renderEventsTab();
      case 'notices':
        return renderNoticesTab();
      case 'system':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">System Settings & Health</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    System Health
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Uptime</span>
                    <Badge variant="default">{systemStats.systemUptime}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Database Status</span>
                    <Badge variant="default">Healthy</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>API Response</span>
                    <Badge variant="default">142ms</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Storage Usage</span>
                    <div className="flex items-center gap-2">
                      <Progress value={65} className="w-20" />
                      <span className="text-sm">65%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button variant="outline" className="w-full justify-start">
                    <Settings className="h-4 w-4 mr-2" />
                    Email Settings
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Bell className="h-4 w-4 mr-2" />
                    Notification Preferences
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Shield className="h-4 w-4 mr-2" />
                    Security Settings
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Database className="h-4 w-4 mr-2" />
                    Backup Management
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        );
      case 'reports':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Analytics & Reports</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {['User Activity', 'Course Enrollment', 'System Performance', 'Event Participation', 'Grade Distribution', 'Attendance Reports'].map((report, index) => (
                <Card key={index} className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <TrendingUp className="h-8 w-8 text-primary" />
                        <div>
                          <h3 className="font-medium">{report}</h3>
                          <p className="text-sm text-muted-foreground">
                            Generated daily
                          </p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        View
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );
      default:
        return (
          <div className="space-y-6">
            {/* Enhanced System Overview */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Users</p>
                      <p className="text-2xl font-bold">{systemStats.totalUsers}</p>
                    </div>
                    <Users className="h-8 w-8 text-primary" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Active Courses</p>
                      <p className="text-2xl font-bold">{systemStats.totalCourses}</p>
                    </div>
                    <BookOpen className="h-8 w-8 text-primary" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Campus Events</p>
                      <p className="text-2xl font-bold">{systemStats.activeEvents}</p>
                    </div>
                    <Calendar className="h-8 w-8 text-primary" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">System Health</p>
                      <p className="text-2xl font-bold text-green-600">{systemStats.systemUptime}</p>
                    </div>
                    <Activity className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Pending Approvals */}
            <Card>
              <CardHeader>
                <CardTitle>Pending Approvals</CardTitle>
                <CardDescription>Items requiring administrative approval</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {pendingApprovals.map((item) => (
                    <div key={item.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 border rounded-lg gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{item.title}</h4>
                          <Badge variant={
                            item.priority === 'high' ? 'destructive' :
                            item.priority === 'medium' ? 'default' : 'secondary'
                          }>
                            {item.priority}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{item.type} • {item.requester} • {item.date}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">Review</Button>
                        <Button size="sm">Approve</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent System Activity</CardTitle>
                <CardDescription>Latest activities and system changes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 border rounded-lg gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{activity.action}</h4>
                          <Badge variant="outline" className="text-xs">
                            {activity.type}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{activity.user}</p>
                      </div>
                      <Badge variant="outline">{activity.time}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        );
    }
  };

  return renderContent();
};
