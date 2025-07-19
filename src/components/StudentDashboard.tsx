
import React from 'react';
import { Calendar, BookOpen, Bell, Users, Clock, MapPin, User, AlertCircle, CheckCircle, GraduationCap, FileText, Target } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScheduleViewer } from '@/components/ScheduleViewer';
import { AssignmentTracker } from '@/components/AssignmentTracker';
import { NoticeBoard } from '@/components/NoticeBoard';
import { EventDiscovery } from '@/components/EventDiscovery';

interface StudentDashboardProps {
  activeTab: string;
  data: {
    upcomingClasses: any[];
    assignments: any[];
    notices: any[];
    events: any[];
    exams: any[];
  };
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  activeTab,
  data
}) => {
  const { upcomingClasses, assignments, notices, events, exams } = data;

  const renderExamsTab = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold">Upcoming Exams</h2>
        <Button variant="outline">
          <Calendar className="h-4 w-4 mr-2" />
          Sync to Calendar
        </Button>
      </div>
      
      <div className="grid gap-4">
        {exams.map((exam) => (
          <Card key={exam.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">{exam.title}</h3>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {exam.date}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {exam.time} ({exam.duration})
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {exam.room}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    {new Date(exam.date) > new Date() ? 'Upcoming' : 'Past'}
                  </Badge>
                  <Button variant="outline" size="sm">
                    <Bell className="h-4 w-4 mr-1" />
                    Remind
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderStudyMaterials = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold">Study Materials</h2>
        <Button variant="outline">
          <FileText className="h-4 w-4 mr-2" />
          Upload Notes
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {['Lecture Notes', 'Practice Tests', 'Reference Books', 'Video Tutorials', 'Lab Manuals', 'Previous Papers'].map((material, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 text-primary" />
                <div>
                  <h3 className="font-medium">{material}</h3>
                  <p className="text-sm text-muted-foreground">
                    {Math.floor(Math.random() * 20) + 1} files
                  </p>
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
      case 'schedule':
        return <ScheduleViewer classes={upcomingClasses} />;
      case 'assignments':
        return <AssignmentTracker assignments={assignments} />;
      case 'exams':
        return renderExamsTab();
      case 'notices':
        return <NoticeBoard notices={notices} />;
      case 'events':
        return <EventDiscovery events={events} />;
      case 'materials':
        return renderStudyMaterials();
      default:
        return (
          <div className="space-y-6">
            {/* Enhanced Quick Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
                    <Target className="h-8 w-8 text-primary" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Upcoming Exams</p>
                      <p className="text-2xl font-bold">{exams.length}</p>
                    </div>
                    <GraduationCap className="h-8 w-8 text-primary" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">New Notices</p>
                      <p className="text-2xl font-bold">{notices.filter(n => n.urgent).length}</p>
                    </div>
                    <Bell className="h-8 w-8 text-primary" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Academic Progress */}
            <Card>
              <CardHeader>
                <CardTitle>Academic Progress</CardTitle>
                <CardDescription>Your semester performance overview</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Overall Progress</span>
                    <span className="text-sm text-muted-foreground">75%</span>
                  </div>
                  <Progress value={75} className="w-full" />
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">8.2</div>
                      <p className="text-sm text-muted-foreground">Current GPA</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">92%</div>
                      <p className="text-sm text-muted-foreground">Attendance</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">15</div>
                      <p className="text-sm text-muted-foreground">Credits</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Today's Schedule */}
            <Card>
              <CardHeader>
                <CardTitle>Today's Schedule</CardTitle>
                <CardDescription>Your classes and activities for today</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {upcomingClasses.map((class_) => (
                    <div key={class_.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border rounded-lg gap-2">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${class_.color}`}></div>
                        <div className="flex-1">
                          <h4 className="font-medium">{class_.subject}</h4>
                          <p className="text-sm text-muted-foreground">{class_.professor} • {class_.room}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="w-fit">{class_.time}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Frequently used features</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <Button variant="outline" className="flex flex-col items-center gap-2 h-20">
                    <BookOpen className="h-6 w-6" />
                    <span className="text-xs">Add Assignment</span>
                  </Button>
                  <Button variant="outline" className="flex flex-col items-center gap-2 h-20">
                    <Calendar className="h-6 w-6" />
                    <span className="text-xs">View Calendar</span>
                  </Button>
                  <Button variant="outline" className="flex flex-col items-center gap-2 h-20">
                    <Bell className="h-6 w-6" />
                    <span className="text-xs">Set Reminder</span>
                  </Button>
                  <Button variant="outline" className="flex flex-col items-center gap-2 h-20">
                    <Users className="h-6 w-6" />
                    <span className="text-xs">Join Event</span>
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
