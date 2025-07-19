
import React from 'react';
import { Calendar, BookOpen, Bell, Users } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScheduleViewer } from '@/components/ScheduleViewer';
import { AssignmentTracker } from '@/components/AssignmentTracker';
import { NoticeBoard } from '@/components/NoticeBoard';
import { EventDiscovery } from '@/components/EventDiscovery';

interface StudentDashboardProps {
  activeTab: string;
  upcomingClasses: any[];
  assignments: any[];
  notices: any[];
  events: any[];
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  activeTab,
  upcomingClasses,
  assignments,
  notices,
  events
}) => {
  const renderContent = () => {
    switch (activeTab) {
      case 'schedule':
        return <ScheduleViewer classes={upcomingClasses} />;
      case 'assignments':
        return <AssignmentTracker assignments={assignments} />;
      case 'notices':
        return <NoticeBoard notices={notices} />;
      case 'events':
        return <EventDiscovery events={events} />;
      default:
        return (
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
                      <p className="text-2xl font-bold">{notices.filter(n => n.urgent).length}</p>
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
                      <p className="text-2xl font-bold">{events.length}</p>
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
                    <div key={class_.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border rounded-lg gap-2">
                      <div className="flex-1">
                        <h4 className="font-medium">{class_.subject}</h4>
                        <p className="text-sm text-muted-foreground">{class_.professor} • {class_.room}</p>
                      </div>
                      <Badge variant="outline" className="w-fit">{class_.time}</Badge>
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
                    <div key={assignment.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border rounded-lg gap-2">
                      <div className="flex-1">
                        <h4 className="font-medium">{assignment.title}</h4>
                        <p className="text-sm text-muted-foreground">{assignment.subject} • Due: {assignment.dueDate}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
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

  return renderContent();
};
