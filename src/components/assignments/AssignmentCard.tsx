
import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Calendar, Clock, Edit, Trash2, Check } from 'lucide-react';
import { format } from 'date-fns';

interface Assignment {
  id: string;
  title: string;
  description?: string;
  due_date: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in-progress' | 'completed' | 'overdue';
}

interface AssignmentCardProps {
  assignment: Assignment;
  onUpdate: () => void;
}

export const AssignmentCard: React.FC<AssignmentCardProps> = ({ assignment, onUpdate }) => {
  const [loading, setLoading] = useState(false);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'default';
      case 'in-progress': return 'secondary';
      case 'overdue': return 'destructive';
      default: return 'outline';
    }
  };

  const handleStatusUpdate = async (newStatus: 'pending' | 'in-progress' | 'completed') => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('assignments')
        .update({ status: newStatus })
        .eq('id', assignment.id);

      if (error) throw error;
      toast.success('Assignment status updated!');
      onUpdate();
    } catch (error) {
      toast.error('Failed to update assignment');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this assignment?')) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('assignments')
        .delete()
        .eq('id', assignment.id);

      if (error) throw error;
      toast.success('Assignment deleted!');
      onUpdate();
    } catch (error) {
      toast.error('Failed to delete assignment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold truncate flex-1">{assignment.title}</h3>
          <div className="flex gap-1 ml-2">
            <Badge variant={getPriorityColor(assignment.priority)} className="text-xs">
              {assignment.priority}
            </Badge>
            <Badge variant={getStatusColor(assignment.status)} className="text-xs">
              {assignment.status}
            </Badge>
          </div>
        </div>
        
        {assignment.description && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {assignment.description}
          </p>
        )}
        
        <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {format(new Date(assignment.due_date), 'MMM dd, yyyy')}
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {format(new Date(assignment.due_date), 'hh:mm a')}
          </div>
        </div>
        
        <div className="flex gap-2">
          {assignment.status !== 'completed' && (
            <Button
              size="sm"
              variant="default"
              onClick={() => handleStatusUpdate('completed')}
              disabled={loading}
              className="flex-1"
            >
              <Check className="h-3 w-3 mr-1" />
              Complete
            </Button>
          )}
          
          {assignment.status === 'pending' && (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => handleStatusUpdate('in-progress')}
              disabled={loading}
            >
              Start
            </Button>
          )}
          
          <Button
            size="sm"
            variant="destructive"
            onClick={handleDelete}
            disabled={loading}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
