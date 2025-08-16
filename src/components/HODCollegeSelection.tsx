import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Building2, GraduationCap, MapPin, Globe, Phone } from 'lucide-react';

interface College {
  id: string;
  name: string;
  code: string;
  address: string;
  phone?: string;
  website?: string;
  is_active: boolean;
}

interface HODCollegeSelectionProps {
  onCollegeSelected: () => void;
}

export const HODCollegeSelection: React.FC<HODCollegeSelectionProps> = ({ onCollegeSelected }) => {
  const [colleges, setColleges] = useState<College[]>([]);
  const [selectedCollege, setSelectedCollege] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchColleges();
  }, []);

  const fetchColleges = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('colleges')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      setColleges(data || []);
    } catch (error) {
      console.error('Error fetching colleges:', error);
      toast.error('Failed to load colleges');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitApplication = async () => {
    if (!selectedCollege) {
      toast.error('Please select a college');
      return;
    }

    try {
      setSubmitting(true);
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Update the user's profile with the selected college
      const { error } = await supabase
        .from('profiles')
        .update({
          college_id: selectedCollege,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;

      toast.success('College application submitted successfully! Please wait for approval from the college administration.');
      onCollegeSelected();
      
    } catch (error: any) {
      console.error('Error submitting application:', error);
      toast.error(error.message || 'Failed to submit application');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedCollegeData = colleges.find(c => c.id === selectedCollege);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <GraduationCap className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold text-primary">HOD Application</h1>
              <p className="text-xs text-muted-foreground">Select Your College</p>
            </div>
          </div>
          <CardTitle className="text-xl">Choose College to Apply</CardTitle>
          <p className="text-muted-foreground text-sm">
            Select the college where you want to apply as Head of Department. 
            The college administration will review and approve your application.
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Select College <span className="text-red-500">*</span>
              </label>
              <Select 
                value={selectedCollege} 
                onValueChange={setSelectedCollege}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a college..." />
                </SelectTrigger>
                <SelectContent>
                  {colleges.map((college) => (
                    <SelectItem key={college.id} value={college.id}>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        <span>{college.name} ({college.code})</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedCollegeData && (
              <Card className="border-l-4 border-l-primary">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-lg flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-primary" />
                        {selectedCollegeData.name}
                      </h3>
                      <Badge variant="outline">{selectedCollegeData.code}</Badge>
                    </div>
                    
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <span>{selectedCollegeData.address}</span>
                      </div>
                      
                      {selectedCollegeData.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          <span>{selectedCollegeData.phone}</span>
                        </div>
                      )}
                      
                      {selectedCollegeData.website && (
                        <div className="flex items-center gap-2">
                          <Globe className="h-4 w-4" />
                          <a 
                            href={selectedCollegeData.website} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            {selectedCollegeData.website}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">What happens next?</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Your application will be sent to the college administration</li>
              <li>• College admins will review your qualifications and experience</li>
              <li>• If approved, you'll be assigned to a department within the college</li>
              <li>• You'll receive an email notification about the decision</li>
            </ul>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => window.location.href = '/login'}
              disabled={submitting}
            >
              Back to Login
            </Button>
            <Button
              className="flex-1"
              onClick={handleSubmitApplication}
              disabled={!selectedCollege || submitting}
            >
              {submitting ? 'Submitting...' : 'Submit Application'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};