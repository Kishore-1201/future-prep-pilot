
import React from 'react';
import { BookOpen, Users, MessageSquare, Calendar, FileText, TrendingUp, GraduationCap, Clock, Target, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface TeacherDashboardProps {
  activeTab: string;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ activeTab }) => {
  const myClasses = [
    { id: 1, name: 'Computer Science 101', students: 45, schedule: 'MWF 9:00-10:00 AM', room: 'A-101', nextClass: '2024-07-22 09:00' },
    { id: 2, name: 'Data Structures', students: 38, schedule: 'TTh 2:00-3:30 PM', room: 'B-205', nextClass: '2024-07-23 14:00' },
    { id: 3, name: 'Algorithms', students: 32, schedule: 'MWF 11:00-12:00 PM', room: 'C-301', nextClass: '2024-07-22 11:00' },
  ];

  const recentAssignments = [
    { id: 1, title: 'Arrays and Lists Lab', class: 'CS 101', submitted: 42, total: 45, dueDate: '2024-07-22', type: 'Lab' },
    { id: 2, title: 'Binary Trees Project', class: 'Data Structures', submitted: 35, total: 38, dueDate: '2024-07-24', type: 'Project' },
    { id: 3, title: 'Sorting Algorithms Quiz', class: 'Algorithms', submitted: 30, total: 32, dueDate: '2024-07-25', type: 'Quiz' },
  ];

  const pendingGrading = [
    { id: 1, title: 'Midterm Examination', class: 'CS 101', count: 12, priority: 'high' },
    { id: 2, title: 'Project Submission', class: 'Data Structures', count: 8, priority: 'medium' },
    { id: 3, title: 'Weekly Quiz', class: 'Algorithms', count: 5, priority: 'low' },
  ];

  const students = [
    { id: 1, name: 'Alice Johnson', email: 'alice@university.edu', class: 'CS 101', attendance: 95, grade: 'A' },
    { id: 2, name: 'Bob Smith', email: 'bob@university.edu', class: 'Data Structures', attendance: 88, grade: 'B+' },
    { id: 3, name: 'Charlie Brown', email: 'charlie@university.edu', class: 'Algorithms', attendance: 92, grade: 'A-' },
  ];

  const renderStudentsTab = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold">Students Management</h2>
        <div className="flex gap-2">
          <Button variant="outline">
            <FileText className="h-4 w-4 mr-2" />
            Export List
          </Button>
          <Button>
            <Users className="h-4 w-4 mr-2" />
            Add Student
          </Button>
        </div>
      </div>
      
      <div className="grid gap-4">
        {students.map((student) => (
          <Card key={student.id}>
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">{student.name}</h3>
                  <p className="text-muted-foreground">{student.email} • {student.class}</p>
                  <div className="flex items-center gap-4">
                    <Badge variant="outline">Attendance: {student.attendance}%</Badge>
                    <Badge variant="default">Grade: {student.grade}</Badge>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">View Profile</Button>
                  <Button variant="outline" size="sm">Mark Attendance</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderMaterialsTab = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold">Study Materials</h2>
        <Button>
          <FileText className="h-4 w-4 mr-2" />
          Upload Material
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {['Lecture Slides', 'Reading List', 'Lab Instructions', 'Reference Materials', 'Video Lectures', 'Practice Problems'].map((material, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="h-8 w-8 text-primary" />
                  <div>
                    <h3 className="font-medium">{material}</h3>
                    <p className="text-sm text-muted-foreground">
                      {Math.floor(Math.random() * 15) + 1} files
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="sm">
                  <TrendingUp className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

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
                <Card key={class_.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div className="space-y-2">
                        <h3 className="text-lg font-semibold">{class_.name}</h3>
                        <p className="text-muted-foreground">{class_.schedule} • {class_.room}</p>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            Next: {new Date(class_.nextClass).toLocaleDateString()}
                          </span>
                        </div>
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
                <Card key={assignment.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-semibold">{assignment.title}</h3>
                          <Badge variant="secondary">{assignment.type}</Badge>
                        </div>
                        <p className="text-muted-foreground">{assignment.class} • Due: {assignment.dueDate}</p>
                        <div className="flex items-center gap-2">
                          <Progress value={(assignment.submitted / assignment.total) * 100} className="w-32" />
                          <span className="text-sm text-muted-foreground">
                            {assignment.submitted}/{assignment.total} submitted
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={assignment.submitted === assignment.total ? 'default' : 'secondary'}>
                          {assignment.submitted === assignment.total ? 'Complete' : 'Pending'}
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
                <Card key={item.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div className="space-y-2">
                        <h3 className="text-lg font-semibold">{item.title}</h3>
                        <p className="text-muted-foreground">{item.class}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge variant={item.priority === 'high' ? 'destructive' : item.priority === 'medium' ? 'default' : 'secondary'}>
                          {item.count} pending
                        </Badge>
                        <Button size="sm">Grade Now</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );
      case 'students':
        return renderStudentsTab();
      case 'materials':
        return renderMaterialsTab();
      case 'announcements':
        return (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2 className="text-2xl font-bold">Announcements</h2>
              <Button>
                <MessageSquare className="h-4 w-4 mr-2" />
                New Announcement
              </Button>
            </div>
            <Card>
              <CardContent className="p-6">
                <div className="text-center py-8">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No announcements yet. Create your first announcement to communicate with students.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        );
      default:
        return (
          <div className="space-y-6">
            {/* Enhanced Quick Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
                    <Target className="h-8 w-8 text-primary" />
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

            {/* Today's Schedule */}
            <Card>
              <CardHeader>
                <CardTitle>Today's Classes</CardTitle>
                <CardDescription>Your teaching schedule for today</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {myClasses.slice(0, 2).map((class_) => (
                    <div key={class_.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border rounded-lg gap-2">
                      <div className="flex items-center gap-3">
                        <GraduationCap className="h-5 w-5 text-primary" />
                        <div className="flex-1">
                          <h4 className="font-medium">{class_.name}</h4>
                          <p className="text-sm text-muted-foreground">{class_.schedule} • {class_.room}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{class_.students} students</Badge>
                        <Button variant="outline" size="sm">Start Class</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Frequently used teacher tools</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <Button variant="outline" className="flex flex-col items-center gap-2 h-20">
                    <FileText className="h-6 w-6" />
                    <span className="text-xs">Create Assignment</span>
                  </Button>
                  <Button variant="outline" className="flex flex-col items-center gap-2 h-20">
                    <Users className="h-6 w-6" />
                    <span className="text-xs">Take Attendance</span>
                  </Button>
                  <Button variant="outline" className="flex flex-col items-center gap-2 h-20">
                    <MessageSquare className="h-6 w-6" />
                    <span className="text-xs">Send Notice</span>
                  </Button>
                  <Button variant="outline" className="flex flex-col items-center gap-2 h-20">
                    <TrendingUp className="h-6 w-6" />
                    <span className="text-xs">View Analytics</span>
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
