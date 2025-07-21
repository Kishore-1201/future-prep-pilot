
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { 
  Users, 
  Code, 
  UserCheck, 
  UserX, 
  RefreshCw, 
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface JoinRequest {
  id: string;
  user_id: string;
  user_role: string;
  join_code: string;
  status: string;
  created_at: string;
  profiles: {
    name: string;
    role: string;
  };
}

interface DepartmentCodes {
  id: string;
  student_code: string;
  teacher_code: string;
  created_at: string;
}

export const DepartmentAdminDashboard: React.FC = () => {
  const { profile } = useAuth();
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
  const [departmentCodes, setDepartmentCodes] = useState<DepartmentCodes | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (profile?.department_id) {
      fetchJoinRequests();
      fetchDepartmentCodes();
    }
  }, [profile?.department_id]);

  const fetchJoinRequests = async () => {
    if (!profile?.department_id) return;

    try {
      const { data, error } = await supabase
        .from('pending_department_joins')
        .select(`
          id,
          user_id,
          user_role,
          join_code,
          status,
          created_at,
          profiles!inner(name, role)
        `)
        .eq('department_id', profile.department_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setJoinRequests(data || []);
    } catch (error) {
      console.error('Error fetching join requests:', error);
      toast.error('Failed to load join requests');
    }
  };

  const fetchDepartmentCodes = async () => {
    if (!profile?.department_id) return;

    try {
      const { data, error } = await supabase
        .from('department_codes')
        .select('id, student_code, teacher_code, created_at')
        .eq('department_id', profile.department_id)
        .eq('is_active', true)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setDepartmentCodes(data);
    } catch (error) {
      console.error('Error fetching department codes:', error);
    }
  };

  const generateCodes = async () => {
    if (!profile?.department_id || !profile?.college_id) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('generate_department_codes', {
        dept_id: profile.department_id,
        college_id: profile.college_id,
        created_by: profile.id
      });

      if (error) throw error;
      
      await fetchDepartmentCodes();
      toast.success('New department codes generated successfully!');
    } catch (error: any) {
      console.error('Error generating codes:', error);
      toast.error(error.message || 'Failed to generate codes');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRequest = async (requestId: string, approve: boolean) => {
    setLoading(true);
    try {
      if (approve) {
        const { error } = await supabase.rpc('approve_department_join', {
          join_id: requestId,
          approver_id: profile?.id
        });
        if (error) throw error;
        toast.success('Join request approved successfully!');
      } else {
        const { error } = await supabase
          .from('pending_department_joins')
          .update({ status: 'rejected' })
          .eq('id', requestId);
        if (error) throw error;
        toast.success('Join request rejected');
      }
      
      await fetchJoinRequests();
    } catch (error: any) {
      console.error('Error handling join request:', error);
      toast.error(error.message || 'Failed to process request');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="text-yellow-600"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'approved':
        return <Badge variant="default" className="text-green-600"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Department Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage your department students and teachers</p>
        </div>
        <Badge variant="secondary" className="text-sm">
          <Users className="h-4 w-4 mr-1" />
          Department Admin
        </Badge>
      </div>

      <Tabs defaultValue="codes" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="codes">Department Codes</TabsTrigger>
          <TabsTrigger value="requests">Join Requests</TabsTrigger>
        </TabsList>

        <TabsContent value="codes" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="h-5 w-5" />
                Department Join Codes
              </CardTitle>
              <CardDescription>
                Share these codes with students and teachers to join your department
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {departmentCodes ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-semibold text-blue-600 mb-2">Student Code</h3>
                    <code className="text-lg font-mono bg-muted p-2 rounded block">
                      {departmentCodes.student_code}
                    </code>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-semibold text-green-600 mb-2">Teacher Code</h3>
                    <code className="text-lg font-mono bg-muted p-2 rounded block">
                      {departmentCodes.teacher_code}
                    </code>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">No codes generated yet</p>
                </div>
              )}
              
              <Button 
                onClick={generateCodes} 
                disabled={loading}
                className="w-full"
              >
                {loading ? 'Generating...' : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    {departmentCodes ? 'Regenerate Codes' : 'Generate Codes'}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="requests" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5" />
                Join Requests
              </CardTitle>
              <CardDescription>
                Approve or reject student and teacher join requests
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {joinRequests.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No join requests found
                  </div>
                ) : (
                  joinRequests.map((request) => (
                    <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">{request.profiles.name}</h4>
                          <Badge variant="outline" className="capitalize">
                            {request.user_role}
                          </Badge>
                          {getStatusBadge(request.status)}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Used code: <code className="font-mono">{request.join_code}</code>
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Requested: {new Date(request.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      
                      {request.status === 'pending' && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleJoinRequest(request.id, true)}
                            disabled={loading}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleJoinRequest(request.id, false)}
                            disabled={loading}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
