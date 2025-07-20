import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, BookOpen, Bell, Users, Plus, Clock } from 'lucide-react';
import { AssignmentForm } from './assignments/AssignmentForm';
import { AssignmentCard } from './assignments/AssignmentCard';
import { format } from 'date-fns';

interface RealStudentDashboardProps {
  activeTab: string;
  userId: string;
}

export const RealStudentDashboard: React.FC<RealStudentDashboardProps> = ({ activeTab, userId }) => {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [notices, setNotices] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [showAssignmentForm, setShowAssignmentForm] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [userId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch assignments
      const { data: assignmentsData } = await supabase
        .from('assignments')
        .select('*')
        .eq('student_id', userId)
        .order('due_date', { ascending: true });

      // Fetch notices
      const { data: noticesData } = await supabase
        .from('notices')
        .select('*')
        .in('target_audience', ['all', 'student'])
        .order('date_posted', { ascending: false })
        .limit(10);

      // Fetch events
      const { data: eventsData } = await supabase
        .from('events')
        .select('*')
        .gte('event_date', new Date().toISOString())
        .order('event_date', { ascending: true })
        .limit(10);

      // Fetch class schedules
      const { data: schedulesData } = await supabase
        .from('class_schedules')
        .select(`
          *,
          teacher:profiles!class_schedules_teacher_id_fkey(name)
        `)
        .eq('student_id', userId);

      setAssignments(assignmentsData || []);
      setNotices(noticesData || []);
      setEvents(eventsData || []);
      setSchedules(schedulesData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderOverview = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <BookOpen className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{assignments.length}</p>
                <p className="text-sm text-muted-foreground">Assignments</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{schedules.length}</p>
                <p className="text-sm text-muted-foreground">Classes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Bell className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">{notices.length}</p>
                <p className="text-sm text-muted-foreground">Notices</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{events.length}</p>
                <p className="text-sm text-muted-foreground">Events</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Assignments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {assignments.slice(0, 3).map((assignment) => (
                <div key={assignment.id} className="flex items-center justify-between p-2 border rounded">
                  <div>
                    <p className="font-medium">{assignment.title}</p>
                    <p className="text-sm text-muted-foreground">
                      Due: {format(new Date(assignment.due_date), 'MMM dd, yyyy')}
                    </p>
                  </div>
                  <Badge variant={assignment.priority === 'high' ? 'destructive' : 'default'}>
                    {assignment.priority}
                  </Badge>
                </div>
              ))}
              {assignments.length === 0 && (
                <p className="text-muted-foreground">No assignments yet</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Latest Notices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {notices.slice(0, 3).map((notice) => (
                <div key={notice.id} className="p-2 border rounded">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{notice.title}</p>
                    {notice.is_urgent && <Badge variant="destructive">Urgent</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {format(new Date(notice.date_posted), 'MMM dd, yyyy')}
                  </p>
                </div>
              ))}
              {notices.length === 0 && (
                <p className="text-muted-foreground">No notices available</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderAssignments = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">My Assignments</h2>
        <Button onClick={() => setShowAssignmentForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Assignment
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {assignments.map((assignment) => (
          <AssignmentCard
            key={assignment.id}
            assignment={assignment}
            onUpdate={fetchData}
          />
        ))}
      </div>
      
      {assignments.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No assignments yet. Add your first assignment!</p>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderNotices = () => (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Notices & Announcements</h2>
      <div className="space-y-4">
        {notices.map((notice) => (
          <Card key={notice.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold">{notice.title}</h3>
                    {notice.is_urgent && <Badge variant="destructive">Urgent</Badge>}
                    <Badge variant="outline">{notice.target_audience}</Badge>
                  </div>
                  <p className="text-muted-foreground mb-2">{notice.description}</p>
                  <p className="text-xs text-muted-foreground">
                    Posted: {format(new Date(notice.date_posted), 'MMM dd, yyyy hh:mm a')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderEvents = () => (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Campus Events</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {events.map((event) => (
          <Card key={event.id}>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-2">{event.title}</h3>
              {event.description && (
                <p className="text-muted-foreground mb-2">{event.description}</p>
              )}
              <div className="space-y-1 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {format(new Date(event.event_date), 'MMM dd, yyyy hh:mm a')}
                </div>
                {event.location && (
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    {event.location}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderSchedule = () => (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Class Schedule</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {schedules.map((schedule) => (
          <Card key={schedule.id}>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-2">{schedule.subject}</h3>
              <div className="space-y-1 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {schedule.day_of_week}
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  {schedule.class_time}
                </div>
                {schedule.room_number && (
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    {schedule.room_number}
                  </div>
                )}
                {schedule.teacher && (
                  <p className="text-muted-foreground">
                    Teacher: {schedule.teacher.name}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  if (loading) {
    return <div className="flex justify-center p-8">Loading...</div>;
  }

  return (
    <div>
      {activeTab === 'overview' && renderOverview()}
      {activeTab === 'assignments' && renderAssignments()}
      {activeTab === 'notices' && renderNotices()}
      {activeTab === 'events' && renderEvents()}
      {activeTab === 'schedule' && renderSchedule()}
      
      {showAssignmentForm && (
        <AssignmentForm
          userId={userId}
          onClose={() => setShowAssignmentForm(false)}
          onSuccess={fetchData}
        />
      )}
    </div>
  );
};
