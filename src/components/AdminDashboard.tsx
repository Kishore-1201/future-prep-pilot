
import React from 'react';
import { Users, BookOpen, Bell, Settings, TrendingUp, Shield, Calendar, FileText } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

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
    systemUptime: '99.9%'
  };

  const recentActivity = [
    { id: 1, action: 'New teacher registration', user: 'Dr. Sarah Wilson', time: '2 hours ago', type: 'user' },
    { id: 2, action: 'Course approval request', user: 'Prof. Mike Chen', time: '4 hours ago', type: 'course' },
    { id: 3, action: 'System backup completed', user: 'System', time: '6 hours ago', type: 'system' },
    { id: 4, action: 'Student bulk enrollment', user: 'Admin Staff', time: '1 day ago', type: 'enrollment' },
  ];

  const pendingApprovals = [
    { id: 1, type: 'Course', title: 'Advanced Machine Learning', requester: 'Dr. Alice Brown', date: '2024-07-19' },
    { id: 2, type: 'Teacher', title: 'Physics Department', requester: 'Prof. John Davis', date: '2024-07-18' },
    { id: 3, type: 'Event', title: 'Tech Innovation Summit', requester: 'Student Council', date: '2024-07-17' },
  ];

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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Students</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary">{systemStats.activeStudents}</div>
                  <p className="text-sm text-muted-foreground mt-2">Active students</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Teachers</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary">{systemStats.activeTeachers}</div>
                  <p className="text-sm text-muted-foreground mt-2">Active teachers</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Pending</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-destructive">{systemStats.pendingApprovals}</div>
                  <p className="text-sm text-muted-foreground mt-2">Awaiting approval</p>
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
            <Card>
              <CardHeader>
                <CardTitle>Course Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{systemStats.totalCourses}</div>
                    <p className="text-sm text-muted-foreground">Total Courses</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">42</div>
                    <p className="text-sm text-muted-foreground">Active This Semester</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">8</div>
                    <p className="text-sm text-muted-foreground">Pending Approval</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );
      case 'system':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">System Settings</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>System Health</CardTitle>
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
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Configuration</CardTitle>
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
                </CardContent>
              </Card>
            </div>
          </div>
        );
      default:
        return (
          <div className="space-y-6">
            {/* System Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
                      <p className="text-sm text-muted-foreground">System Uptime</p>
                      <p className="text-2xl font-bold">{systemStats.systemUptime}</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-primary" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Pending Items</p>
                      <p className="text-2xl font-bold">{systemStats.pendingApprovals}</p>
                    </div>
                    <Bell className="h-8 w-8 text-destructive" />
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
                        <h4 className="font-medium">{item.title}</h4>
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
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest system activities and changes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 border rounded-lg gap-2">
                      <div className="flex-1">
                        <h4 className="font-medium">{activity.action}</h4>
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
