
import React, { useState, useEffect } from 'react';
import { 
  Users, Building, Shield, CheckCircle, XCircle, Clock, 
  Search, Filter, Eye, UserCheck, UserX, AlertTriangle
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CollegeAdminRequest {
  id: string;
  college_name: string;
  college_code: string;
  college_address: string;
  admin_name: string;
  admin_email: string;
  phone: string | null;
  website?: string | null;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
  approved_by: string | null;
  approved_at: string | null;
  user_id: string;
  rejection_reason: string | null;
}

interface SystemStats {
  total_users: number;
  total_colleges: number;
  pending_requests: number;
  active_admins: number;
  total_departments: number;
  total_rooms: number;
}

export const SuperAdminDashboard: React.FC = () => {
  const [requests, setRequests] = useState<CollegeAdminRequest[]>([]);
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<CollegeAdminRequest | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    fetchRequests();
    fetchStats();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('college_admin_requests')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setRequests(data?.map(item => ({
        ...item,
        status: item.status as 'pending' | 'approved' | 'rejected'
      })) || []);
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast.error('Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const { data, error } = await supabase.rpc('get_super_admin_stats');
      if (error) throw error;
      setStats(data as unknown as SystemStats);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleApproveRequest = async (requestId: string) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Not authenticated');

      const { data, error } = await supabase.rpc('approve_college_admin_request', {
        request_id: requestId,
        approver_id: userData.user.id
      });

      if (error) throw error;
      
      toast.success('College admin request approved successfully');
      fetchRequests();
      fetchStats();
    } catch (error: any) {
      console.error('Error approving request:', error);
      toast.error(error.message || 'Failed to approve request');
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      const { data, error } = await supabase.rpc('reject_college_admin_request', {
        request_id: requestId,
        rejection_reason: 'Rejected by super admin'
      });

      if (error) throw error;

      toast.success('Request rejected');
      fetchRequests();
      fetchStats();
    } catch (error: any) {
      console.error('Error rejecting request:', error);
      toast.error(error.message || 'Failed to reject request');
    }
  };

  const filteredRequests = requests.filter(request => {
    const matchesSearch = 
      request.college_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.admin_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.admin_email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

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
          <h1 className="text-3xl font-bold">Super Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage the entire CampusConnect platform</p>
        </div>
        <Badge variant="destructive" className="text-sm">
          <Shield className="h-4 w-4 mr-1" />
          Super Admin
        </Badge>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="requests">College Requests</TabsTrigger>
          <TabsTrigger value="colleges">Active Colleges</TabsTrigger>
          <TabsTrigger value="users">All Users</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Users</p>
                    <p className="text-2xl font-bold">{stats?.total_users || 0}</p>
                  </div>
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Active Colleges</p>
                    <p className="text-2xl font-bold">{stats?.total_colleges || 0}</p>
                  </div>
                  <Building className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Pending Requests</p>
                    <p className="text-2xl font-bold text-yellow-600">{stats?.pending_requests || 0}</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-yellow-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">College Admins</p>
                    <p className="text-2xl font-bold">{stats?.active_admins || 0}</p>
                  </div>
                  <Shield className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest college admin requests and system activities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {requests.slice(0, 5).map((request) => (
                  <div key={request.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h4 className="font-medium">{request.college_name}</h4>
                      <p className="text-sm text-muted-foreground">
                        Requested by {request.admin_name} • {new Date(request.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    {getStatusBadge(request.status)}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="requests" className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h2 className="text-2xl font-bold">College Admin Requests</h2>
            <div className="flex gap-2">
              <Input
                placeholder="Search requests..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border rounded-md"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>

          <div className="grid gap-4">
            {loading ? (
              <div className="text-center py-8">Loading requests...</div>
            ) : filteredRequests.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No requests found</div>
            ) : (
              filteredRequests.map((request) => (
                <Card key={request.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          <Building className="h-5 w-5 text-primary" />
                          <h3 className="text-lg font-semibold">{request.college_name}</h3>
                          <Badge variant="outline">{request.college_code}</Badge>
                          {getStatusBadge(request.status)}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground">
                          <p><strong>Admin:</strong> {request.admin_name}</p>
                          <p><strong>Email:</strong> {request.admin_email}</p>
                          <p><strong>Phone:</strong> {request.phone}</p>
                          <p><strong>Requested:</strong> {new Date(request.created_at).toLocaleDateString()}</p>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          <strong>Address:</strong> {request.college_address}
                        </p>
                        {request.website && (
                          <p className="text-sm text-muted-foreground">
                            <strong>Website:</strong> {request.website}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" onClick={() => setSelectedRequest(request)}>
                              <Eye className="h-4 w-4 mr-1" />
                              View Details
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>College Admin Request Details</DialogTitle>
                              <DialogDescription>
                                Review the college information and admin details
                              </DialogDescription>
                            </DialogHeader>
                            {selectedRequest && (
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <h4 className="font-semibold">College Information</h4>
                                    <p><strong>Name:</strong> {selectedRequest.college_name}</p>
                                    <p><strong>Code:</strong> {selectedRequest.college_code}</p>
                                    <p><strong>Address:</strong> {selectedRequest.college_address}</p>
                                    {selectedRequest.website && (
                                      <p><strong>Website:</strong> {selectedRequest.website}</p>
                                    )}
                                  </div>
                                  <div>
                                    <h4 className="font-semibold">Admin Information</h4>
                                    <p><strong>Name:</strong> {selectedRequest.admin_name}</p>
                                    <p><strong>Email:</strong> {selectedRequest.admin_email}</p>
                                    <p><strong>Phone:</strong> {selectedRequest.phone}</p>
                                    <p><strong>Status:</strong> {getStatusBadge(selectedRequest.status)}</p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                        {request.status === 'pending' && (
                          <>
                            <Button 
                              size="sm" 
                              onClick={() => handleApproveRequest(request.id)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button 
                              variant="destructive" 
                              size="sm"
                              onClick={() => handleRejectRequest(request.id)}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="colleges" className="space-y-6">
          <h2 className="text-2xl font-bold">Active Colleges</h2>
          <div className="text-center py-8 text-muted-foreground">
            Active colleges management coming soon...
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <h2 className="text-2xl font-bold">All Users Management</h2>
          <div className="text-center py-8 text-muted-foreground">
            Global user management coming soon...
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
