
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { Building, Users, Code, ArrowRight } from 'lucide-react';

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
        user_id: profile.id,
        join_code: joinCode,
        user_role: profile.role
      });

      if (error) throw error;

      toast.success('Join request submitted! Please wait for approval from the department admin.');
      setJoinCode('');
    } catch (error: any) {
      console.error('Error joining department:', error);
      toast.error(error.message || 'Failed to join department');
    } finally {
      setLoading(false);
    }
  };

  if (profile?.college_id && profile?.department_id) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Already Joined
          </CardTitle>
          <CardDescription>
            You are already part of a department
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building className="h-5 w-5" />
          Join Department
        </CardTitle>
        <CardDescription>
          Select your college and department, then enter the join code provided by your department admin
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
        >
          {loading ? 'Submitting...' : (
            <>
              <ArrowRight className="h-4 w-4 mr-2" />
              Join Department
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};
