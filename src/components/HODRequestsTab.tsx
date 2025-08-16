import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { CheckCircle, XCircle, Clock, User, GraduationCap, Award } from 'lucide-react';

interface HODRequest {
  id: string;
  name: string;
  email: string;
  employee_id: string;
  qualification: string;
  experience: string;
  hod_details: string;
  college_name: string;
  created_at: string;
}

interface Department {
  id: string;
  name: string;
  code: string;
}

interface HODRequestsTabProps {
  collegeId: string;
}

export const HODRequestsTab: React.FC<HODRequestsTabProps> = ({ collegeId }) => {
  const [hodRequests, setHodRequests] = useState<HODRequest[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDepartments, setSelectedDepartments] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchHODRequests();
    fetchDepartments();

    // Debug: Log college info
    console.log('HODRequestsTab mounted with collegeId:', collegeId);

    // Fetch college name for display
    if (collegeId) {
      supabase
        .from('colleges')
        .select('name, code')
        .eq('id', collegeId)
        .single()
        .then(({ data, error }) => {
          if (data) {
            console.log('College info:', data);
          }
        });
    }
  }, [collegeId]);

  const fetchHODRequests = async () => {
    try {
      console.log('=== HOD REQUESTS DEBUG ===');
      console.log('College ID:', collegeId);

      // First, let's check ALL HOD profiles in the database
      const { data: allHODs, error: allHODsError } = await supabase
        .from('profiles')
        .select('id, name, is_hod, pending_approval, college_id, detailed_role, is_active')
        .eq('is_hod', true);

      console.log('ALL HOD profiles in database:', allHODs);
      console.log('All HODs error:', allHODsError);

      // Check HODs with pending approval
      const pendingHODs = allHODs?.filter(hod => hod.pending_approval === true);
      console.log('HODs with pending_approval=true:', pendingHODs);

      // Check HODs for this specific college
      const collegeHODs = allHODs?.filter(hod => hod.college_id === collegeId);
      console.log('HODs for this college:', collegeHODs);

      // Check HODs with pending approval for this college
      const targetHODs = allHODs?.filter(hod =>
        hod.is_hod === true &&
        hod.pending_approval === true &&
        hod.college_id === collegeId
      );
      console.log('Target HODs (is_hod=true, pending_approval=true, college_id=match):', targetHODs);

      // Try the existing RPC function first
      const { data, error } = await supabase.rpc('get_hod_requests', {
        college_uuid: collegeId
      });

      console.log('HOD requests RPC response:', { data, error });

      if (error) {
        console.error('RPC Error, falling back to direct query:', error);

        // Fallback: Use direct query if RPC function doesn't exist yet
        const { data: hodProfiles, error: profilesError } = await supabase
          .from('profiles')
          .select(`
            id, name, employee_id, qualification, experience, hod_details, created_at,
            colleges(name)
          `)
          .eq('is_hod', true)
          .eq('pending_approval', true)
          .eq('college_id', collegeId);

        console.log('Direct query result:', hodProfiles, 'Error:', profilesError);

        if (profilesError) throw profilesError;

        // Transform data to match expected format
        const transformedData = hodProfiles?.map(item => ({
          id: item.id,
          name: item.name || 'Unknown',
          email: 'Email not available',
          employee_id: item.employee_id || '',
          qualification: item.qualification || '',
          experience: item.experience || '',
          hod_details: item.hod_details || '',
          college_name: item.colleges?.name || 'Unknown College',
          created_at: item.created_at
        })) || [];

        console.log('Transformed HOD requests (fallback):', transformedData);
        setHodRequests(transformedData);
        console.log('=== END HOD REQUESTS DEBUG ===');
        return;
      }

      // Transform RPC data to match expected format
      const transformedData = (data as any[])?.map(item => ({
        id: item.id,
        name: item.name || 'Unknown',
        email: item.email || 'Email not available',
        employee_id: item.employee_id || '',
        qualification: item.qualification || '',
        experience: item.experience || '',
        hod_details: item.hod_details || '',
        college_name: item.college_name || 'Unknown College',
        created_at: item.created_at
      })) || [];

      setHodRequests(transformedData);
      console.log('Set HOD requests from RPC:', transformedData);
      console.log('=== END HOD REQUESTS DEBUG ===');

    } catch (error) {
      console.error('Error fetching HOD requests:', error);
      toast.error('Failed to load HOD requests');
    }
  };

  const fetchDepartments = async () => {
    try {
      const { data, error } = await supabase
        .from('departments')
        .select('id, name, code')
        .eq('college_id', collegeId)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setDepartments(data || []);
    } catch (error) {
      console.error('Error fetching departments:', error);
      toast.error('Failed to load departments');
    }
  };

  const handleApproveHOD = async (userId: string) => {
    const departmentId = selectedDepartments[userId];
    if (!departmentId) {
      toast.error('Please select a department for this HOD');
      return;
    }

    try {
      setLoading(true);

      // Get current user ID for the approver
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // First approve the HOD request
      const { error: approveError } = await supabase.rpc('approve_hod_request', {
        user_id: userId
      });

      if (approveError) throw approveError;

      // Then assign them to the selected department
      const { error: assignError } = await supabase.rpc('assign_hod_to_department', {
        p_user_id: userId,
        p_department_id: departmentId,
        p_approver_id: user.id
      });

      if (assignError) throw assignError;

      toast.success('HOD approved and assigned to department successfully!');
      fetchHODRequests();

    } catch (error: any) {
      console.error('Error approving HOD:', error);
      toast.error(error.message || 'Failed to approve HOD');
    } finally {
      setLoading(false);
    }
  };

  const handleRejectHOD = async (userId: string) => {
    try {
      setLoading(true);

      const { error } = await supabase
        .from('profiles')
        .update({
          pending_approval: false,
          is_active: false,
          detailed_role: 'rejected_hod'
        })
        .eq('id', userId);

      if (error) throw error;

      toast.success('HOD request rejected');
      fetchHODRequests();

    } catch (error: any) {
      console.error('Error rejecting HOD:', error);
      toast.error(error.message || 'Failed to reject HOD');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">HOD Approval Requests</h2>
          <p className="text-sm text-muted-foreground">College ID: {collegeId}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchHODRequests}
            className="text-blue-600"
          >
            🔄 Refresh & Debug
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              // Temporary: Show ALL HODs regardless of college
              const { data: allHODs } = await supabase
                .from('profiles')
                .select(`
                  id, name, employee_id, qualification, experience, hod_details, created_at,
                  colleges(name)
                `)
                .eq('is_hod', true)
                .eq('pending_approval', true);

              const transformedData = allHODs?.map(item => ({
                id: item.id,
                name: item.name || 'Unknown',
                email: 'Test Email',
                employee_id: item.employee_id || '',
                qualification: item.qualification || '',
                experience: item.experience || '',
                hod_details: item.hod_details || '',
                college_name: item.colleges?.name || 'Any College',
                created_at: item.created_at
              })) || [];

              setHodRequests(transformedData);
              toast.success(`Found ${transformedData.length} HOD applications total`);
            }}
            className="text-green-600"
          >
            🔍 Show All HODs
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              try {
                // Create a test HOD profile directly for this college
                const testHOD = {
                  name: 'Dr. Test HOD',
                  role: 'teacher' as const,
                  detailed_role: 'hod',
                  is_hod: true,
                  pending_approval: true,
                  college_id: collegeId,
                  employee_id: 'TEST001',
                  qualification: 'Ph.D in Computer Science',
                  experience: '10+ years',
                  hod_details: 'Test HOD application for debugging',
                  is_active: false
                };

                const { error } = await supabase
                  .from('profiles')
                  .insert(testHOD);

                if (error) throw error;

                toast.success('Test HOD created! Click Refresh & Debug to see it.');
                fetchHODRequests();
              } catch (error: any) {
                console.error('Error creating test HOD:', error);
                toast.error('Failed to create test HOD: ' + error.message);
              }
            }}
            className="text-purple-600"
          >
            🧪 Create Test HOD
          </Button>
          <Badge variant="outline" className="text-sm">
            <Clock className="h-4 w-4 mr-1" />
            {hodRequests.length} Pending
          </Badge>
        </div>
      </div>

      {hodRequests.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No HOD Requests</h3>
            <p className="text-muted-foreground">No pending HOD approval requests at this time.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {hodRequests.map((request) => (
            <Card key={request.id} className="border-l-4 border-l-amber-500">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <GraduationCap className="h-5 w-5" />
                      {request.name}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">{request.email}</p>
                  </div>
                  <Badge variant="secondary">
                    <Clock className="h-3 w-3 mr-1" />
                    Pending Review
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <strong className="text-sm">Employee ID:</strong>
                      <span className="text-sm">{request.employee_id}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <strong className="text-sm">Qualification:</strong>
                      <span className="text-sm">{request.qualification}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <strong className="text-sm">Experience:</strong>
                      <span className="text-sm">{request.experience}</span>
                    </div>
                  </div>

                  {request.hod_details && (
                    <div className="space-y-2">
                      <div className="flex items-start gap-2">
                        <Award className="h-4 w-4 mt-0.5 text-amber-600" />
                        <div>
                          <strong className="text-sm">Additional Details:</strong>
                          <div className="text-sm text-muted-foreground whitespace-pre-line mt-1">
                            {request.hod_details}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="border-t pt-4">
                  <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
                    <div className="flex-1 min-w-[200px]">
                      <label className="text-sm font-medium mb-2 block">
                        Assign to Department
                      </label>
                      <Select
                        value={selectedDepartments[request.id] || ''}
                        onValueChange={(value) =>
                          setSelectedDepartments(prev => ({ ...prev, [request.id]: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                        <SelectContent>
                          {departments.map((dept) => (
                            <SelectItem key={dept.id} value={dept.id}>
                              {dept.name} ({dept.code})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRejectHOD(request.id)}
                        disabled={loading}
                        className="text-red-600 hover:text-red-700"
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleApproveHOD(request.id)}
                        disabled={loading || !selectedDepartments[request.id]}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Approve & Assign
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};