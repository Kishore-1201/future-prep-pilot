
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { Building, Users, Code, ArrowRight, AlertCircle, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface College {
  id: string;
  name: string;
  code: string;
}

interface Department {
  id: string;
  name: string;
  code: string;
  college_id: string;
}

export const DepartmentJoin: React.FC = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [colleges, setColleges] = useState<College[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedCollege, setSelectedCollege] = useState<string>('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchColleges();
  }, []);

  useEffect(() => {
    if (selectedCollege) {
      fetchDepartments(selectedCollege);
    } else {
      setDepartments([]);
    }
  }, [selectedCollege]);

  const fetchColleges = async () => {
    try {
      const { data, error } = await supabase
        .from('colleges')
        .select('id, name, code')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setColleges(data || []);
    } catch (error) {
      console.error('Error fetching colleges:', error);
      toast.error('Failed to load colleges');
    }
  };

  const fetchDepartments = async (collegeId: string) => {
    try {
      const { data, error } = await supabase
        .from('departments')
        .select('id, name, code, college_id')
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

  const handleJoinDepartment = async () => {
    if (!selectedDepartment || !joinCode || !profile) {
      toast.error('Please select a department and enter the join code');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('join_department_with_code', {
        p_user_id: profile.id,
        p_join_code: joinCode,
        p_user_role: profile.role
      });

      if (error) throw error;

      toast.success('Join request submitted successfully! Please wait for approval from the department admin.');
      
      // Clear form
      setJoinCode('');
      setSelectedCollege('');
      setSelectedDepartment('');
      
      // Redirect to pending state or refresh
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error: any) {
      console.error('Error joining department:', error);
      toast.error(error.message || 'Failed to join department');
    } finally {
      setLoading(false);
    }
  };

  // If user already has a department, show status
  if (profile?.college_id && profile?.department_id) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Department Joined
            </CardTitle>
            <CardDescription>
              You are already part of a department and can access your dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                Ready to access your academic dashboard
              </p>
              <Button onClick={() => navigate('/dashboard')}>
                <ArrowRight className="h-4 w-4 mr-2" />
                Go to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If user is an HOD waiting for assignment, show different message
  if (profile?.is_hod && !profile?.department_id) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <AlertCircle className="h-5 w-5" />
              HOD Assignment Pending
            </CardTitle>
            <CardDescription className="text-blue-700">
              You are approved as an HOD. Please wait for a college admin to assign you to a department.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-blue-700">
              College administrators will assign you to a department based on your qualifications and department needs. 
              You will be notified once the assignment is complete.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Join Your Department</h1>
        <p className="text-muted-foreground">
          Select your college and department, then enter the join code provided by your department admin
        </p>
      </div>

      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-amber-800">Important Notice</p>
              <p className="text-xs text-amber-700">
                You must join a department to access your dashboard and academic features. 
                Contact your department administrator to get the join code.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Department Selection
          </CardTitle>
          <CardDescription>
            Choose your college and department to get started
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="college">Select College</Label>
            <Select value={selectedCollege} onValueChange={setSelectedCollege}>
              <SelectTrigger>
                <SelectValue placeholder="Choose your college" />
              </SelectTrigger>
              <SelectContent>
                {colleges.map((college) => (
                  <SelectItem key={college.id} value={college.id}>
                    {college.name} ({college.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="department">Select Department</Label>
            <Select value={selectedDepartment} onValueChange={setSelectedDepartment} disabled={!selectedCollege}>
              <SelectTrigger>
                <SelectValue placeholder="Choose your department" />
              </SelectTrigger>
              <SelectContent>
                {departments.map((department) => (
                  <SelectItem key={department.id} value={department.id}>
                    {department.name} ({department.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="joinCode">Join Code</Label>
            <Input
              id="joinCode"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              placeholder={`Enter ${profile?.role} join code`}
              className="font-mono"
            />
            <p className="text-sm text-muted-foreground mt-1">
              Get this code from your department admin
            </p>
          </div>

          <Button 
            onClick={handleJoinDepartment} 
            disabled={loading || !selectedDepartment || !joinCode}
            className="w-full"
            size="lg"
          >
            {loading ? 'Submitting Request...' : (
              <>
                <ArrowRight className="h-4 w-4 mr-2" />
                Submit Join Request
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            How to Get Join Code
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">1</div>
              <p>Contact your department administrator or academic coordinator</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">2</div>
              <p>Request the {profile?.role} join code for your department</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">3</div>
              <p>Enter the code above and submit your join request</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
