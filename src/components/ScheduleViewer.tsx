
import React from 'react';
import { Clock, MapPin, User } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Class {
  id: number;
  subject: string;
  time: string;
  room: string;
  professor: string;
}

interface ScheduleViewerProps {
  classes: Class[];
}

export const ScheduleViewer: React.FC<ScheduleViewerProps> = ({ classes }) => {
  const today = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  const timeSlots = [
    '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
    '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM'
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Class Schedule</h2>
        <p className="text-muted-foreground">{today}</p>
      </div>

      <div className="grid gap-4">
        {classes.map((class_) => (
          <Card key={class_.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">{class_.subject}</h3>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {class_.time}
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {class_.room}
                    </div>
                    <div className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      {class_.professor}
                    </div>
                  </div>
                </div>
                
                <Badge variant="outline" className="ml-4">
                  Upcoming
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Weekly View */}
      <Card>
        <CardHeader>
          <CardTitle>Weekly Schedule</CardTitle>
          <CardDescription>Overview of your weekly class schedule</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-6 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Time</h4>
              {timeSlots.map((time) => (
                <div key={time} className="h-12 flex items-center text-sm text-muted-foreground">
                  {time}
                </div>
              ))}
            </div>
            
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((day) => (
              <div key={day} className="space-y-2">
                <h4 className="font-medium text-sm">{day}</h4>
                {timeSlots.map((time) => (
                  <div key={`${day}-${time}`} className="h-12 border rounded p-2">
                    {/* Schedule items would be populated here based on actual data */}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
