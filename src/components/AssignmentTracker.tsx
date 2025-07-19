
import React, { useState } from 'react';
import { Calendar, Clock, Flag, CheckCircle, Circle, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface Assignment {
  id: number;
  title: string;
  subject: string;
  dueDate: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'in-progress' | 'completed';
}

interface AssignmentTrackerProps {
  assignments: Assignment[];
}

export const AssignmentTracker: React.FC<AssignmentTrackerProps> = ({ assignments }) => {
  const [filter, setFilter] = useState<'all' | 'pending' | 'in-progress' | 'completed'>('all');

  const filteredAssignments = assignments.filter(assignment => 
    filter === 'all' || assignment.status === filter
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'in-progress':
        return <Circle className="h-4 w-4 text-blue-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      default:
        return 'secondary';
    }
  };

  const getDaysUntilDue = (dueDate: string) => {
    const due = new Date(dueDate);
    const today = new Date();
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const completionRate = (assignments.filter(a => a.status === 'completed').length / assignments.length) * 100;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Assignment Tracker</h2>
          <p className="text-muted-foreground">Manage and track your assignments</p>
        </div>
        <Button>Add Assignment</Button>
      </div>

      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Progress Overview</CardTitle>
          <CardDescription>Your assignment completion rate</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Progress value={completionRate} className="w-full" />
            <div className="flex justify-between text-sm">
              <span>{assignments.filter(a => a.status === 'completed').length} completed</span>
              <span>{assignments.filter(a => a.status === 'pending').length} pending</span>
              <span>{assignments.filter(a => a.status === 'in-progress').length} in progress</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filter Buttons */}
      <div className="flex gap-2">
        {['all', 'pending', 'in-progress', 'completed'].map((status) => (
          <Button
            key={status}
            variant={filter === status ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(status as any)}
          >
            {status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
          </Button>
        ))}
      </div>

      {/* Assignments List */}
      <div className="grid gap-4">
        {filteredAssignments.map((assignment) => {
          const daysUntilDue = getDaysUntilDue(assignment.dueDate);
          
          return (
            <Card key={assignment.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(assignment.status)}
                      <h3 className="text-lg font-semibold">{assignment.title}</h3>
                    </div>
                    
                    <p className="text-sm text-muted-foreground">{assignment.subject}</p>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Due: {assignment.dueDate}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {daysUntilDue > 0 ? `${daysUntilDue} days left` : 'Overdue'}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-2">
                    <Badge variant={getPriorityColor(assignment.priority) as any}>
                      <Flag className="h-3 w-3 mr-1" />
                      {assignment.priority}
                    </Badge>
                    
                    <Badge variant={assignment.status === 'completed' ? 'default' : 'outline'}>
                      {assignment.status.replace('-', ' ')}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
