
import React from 'react';
import { Calendar, MapPin, Clock, Users, CheckCircle, X } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface Event {
  id: number;
  title: string;
  date: string;
  time: string;
  location: string;
  rsvpStatus: 'attending' | 'not-attending' | null;
}

interface EventDiscoveryProps {
  events: Event[];
}

export const EventDiscovery: React.FC<EventDiscoveryProps> = ({ events }) => {
  const handleRSVP = (eventId: number, status: 'attending' | 'not-attending') => {
    console.log(`RSVP for event ${eventId}: ${status}`);
    // This would typically update the state or make an API call
  };

  const getRSVPButton = (event: Event) => {
    if (event.rsvpStatus === 'attending') {
      return (
        <div className="flex items-center gap-2">
          <Badge variant="default" className="bg-green-500">
            <CheckCircle className="h-3 w-3 mr-1" />
            Attending
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleRSVP(event.id, 'not-attending')}
          >
            Cancel
          </Button>
        </div>
      );
    } else if (event.rsvpStatus === 'not-attending') {
      return (
        <div className="flex items-center gap-2">
          <Badge variant="secondary">
            <X className="h-3 w-3 mr-1" />
            Not Attending
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleRSVP(event.id, 'attending')}
          >
            Join
          </Button>
        </div>
      );
    } else {
      return (
        <div className="flex gap-2">
          <Button
            variant="default"
            size="sm"
            onClick={() => handleRSVP(event.id, 'attending')}
          >
            Attend
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleRSVP(event.id, 'not-attending')}
          >
            Not Interested
          </Button>
        </div>
      );
    }
  };

  const getDaysUntilEvent = (date: string) => {
    const eventDate = new Date(date);
    const today = new Date();
    const diffTime = eventDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Campus Events</h2>
          <p className="text-muted-foreground">Discover and join campus activities</p>
        </div>
        <Button>Create Event</Button>
      </div>

      {/* Upcoming Events */}
      <div className="grid gap-4">
        {events.map((event) => {
          const daysUntilEvent = getDaysUntilEvent(event.date);
          
          return (
            <Card key={event.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-3 flex-1">
                    <div>
                      <h3 className="text-lg font-semibold">{event.title}</h3>
                      {daysUntilEvent >= 0 && (
                        <Badge variant="outline" className="mt-1">
                          {daysUntilEvent === 0 ? 'Today' : daysUntilEvent === 1 ? 'Tomorrow' : `In ${daysUntilEvent} days`}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {event.date}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {event.time}
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {event.location}
                      </div>
                    </div>
                  </div>
                  
                  <div className="ml-4">
                    {getRSVPButton(event)}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Event Categories */}
      <Card>
        <CardHeader>
          <CardTitle>Event Categories</CardTitle>
          <CardDescription>Browse events by category</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: 'Academic', icon: Calendar, count: 5 },
              { name: 'Sports', icon: Users, count: 3 },
              { name: 'Cultural', icon: Users, count: 7 },
              { name: 'Technical', icon: Users, count: 4 },
            ].map((category) => {
              const Icon = category.icon;
              
              return (
                <div key={category.name} className="p-4 border rounded-lg text-center hover:bg-muted/50 cursor-pointer transition-colors">
                  <Icon className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <h4 className="font-medium">{category.name}</h4>
                  <p className="text-sm text-muted-foreground">{category.count} events</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
