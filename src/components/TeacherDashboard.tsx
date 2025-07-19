
import React from 'react';
import { BookOpen, Users, MessageSquare, Calendar, FileText, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface TeacherDashboardProps {
  activeTab: string;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ activeTab }) => {
  const myClasses = [
    { id: 1, name: 'Computer Science 101', students: 45, schedule: 'MWF 9:00-10:00 AM' },
    { id: 2, name: 'Data Structures', students: 38, schedule: 'TTh 2:00-3:30 PM' },
    { id: 3, name: 'Algorithms', students: 32, schedule: 'MWF 11:00-12:00 PM' },
  ];

  const recentAssignments = [
    { id: 1, title: 'Arrays and Lists Lab', class: 'CS 101', submitted: 42, total: 45, dueDate: '2024-07-22' },
    { id: 2, title: 'Binary Trees Project', class: 'Data Structures', submitted: 35, total: 38, dueDate: '2024-07-24' },
    { id: 3, title: 'Sorting Algorithms Quiz', class: 'Algorithms', submitted: 30, total: 32, dueDate: '2024-07-25' },
  ];

  const pendingGrading = [
    { id: 1, title: 'Midterm Examination', class: 'CS 101', count: 12 },
    { id: 2, title: 'Project Submission', class: 'Data Structures', count: 8 },
    { id: 3, title: 'Weekly Quiz', class: 'Algorithms', count: 5 },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'classes':
        return (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2 className="text-2xl font-bold">My Classes</h2>
              <Button>
                <Calendar className="h-4 w-4 mr-2" />
                Schedule Class
              </Button>
            </div>
            <div className="grid gap-4">
              {myClasses.map((class_) => (
                <Card key={class_.id}>
                  <CardContent className="p-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                        <h3 className="text-lg font-semibold">{class_.name}</h3>
                        <p className="text-muted-foreground">{class_.schedule}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge variant="outline">{class_.students} students</Badge>
                        <Button variant="outline" size="sm">Manage</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );
      case 'assignments':
        return (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2 className="text-2xl font-bold">Assignment Management</h2>
              <Button>
                <FileText className="h-4 w-4 mr-2" />
                Create Assignment
              </Button>
            </div>
            <div className="grid gap-4">
              {recentAssignments.map((assignment) => (
                <Card key={assignment.id}>
                  <CardContent className="p-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                        <h3 className="text-lg font-semibold">{assignment.title}</h3>
                        <p className="text-muted-foreground">{assignment.class} • Due: {assignment.dueDate}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge variant={assignment.submitted === assignment.total ? 'default' : 'secondary'}>
                          {assignment.submitted}/{assignment.total} submitted
                        </Badge>
                        <Button variant="outline" size="sm">View Details</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );
      case 'grading':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Pending Grading</h2>
            <div className="grid gap-4">
              {pendingGrading.map((item) => (
                <Card key={item.id}>
                  <CardContent className="p-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                        <h3 className="text-lg font-semibold">{item.title}</h3>
                        <p className="text-muted-foreground">{item.class}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge variant="destructive">{item.count} pending</Badge>
                        <Button size="sm">Grade Now</Button>
                      </div>
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
            {/* Quick Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Active Classes</p>
                      <p className="text-2xl font-bold">{myClasses.length}</p>
                    </div>
                    <BookOpen className="h-8 w-8 text-primary" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Students</p>
                      <p className="text-2xl font-bold">{myClasses.reduce((sum, cls) => sum + cls.students, 0)}</p>
                    </div>
                    <Users className="h-8 w-8 text-primary" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Pending Grading</p>
                      <p className="text-2xl font-bold">{pendingGrading.reduce((sum, item) => sum + item.count, 0)}</p>
                    </div>
                    <FileText className="h-8 w-8 text-primary" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Avg. Submission</p>
                      <p className="text-2xl font-bold">89%</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-primary" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest updates from your classes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 border rounded-lg gap-2">
                    <div>
                      <h4 className="font-medium">New assignment submitted</h4>
                      <p className="text-sm text-muted-foreground">CS 101 - Data Structures Lab</p>
                    </div>
                    <Badge variant="outline">5 min ago</Badge>
                  </div>
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 border rounded-lg gap-2">
                    <div>
                      <h4 className="font-medium">Student question posted</h4>
                      <p className="text-sm text-muted-foreground">Algorithms - Binary Search Trees</p>
                    </div>
                    <Badge variant="outline">12 min ago</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );
    }
  };

  return renderContent();
};
