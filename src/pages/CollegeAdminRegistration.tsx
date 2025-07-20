import React, { useState } from 'react';
import { Building, Mail, Phone, Globe, MapPin, User, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export const CollegeAdminRegistration: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    // College Information
    college_name: '',
    college_code: '',
    college_address: '',
    phone: '',
    website: '',
    
    // Admin Information
    admin_name: '',
    admin_email: '',
    admin_password: '',
    admin_phone: ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.college_name || !formData.college_code || !formData.admin_name || 
        !formData.admin_email || !formData.admin_password) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);

    try {
      console.log('Starting college admin registration...');
      
      // First, create the user account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.admin_email,
        password: formData.admin_password,
        options: {
          data: {
            name: formData.admin_name,
            role: 'student', // Temporary role
            college_request: true
          }
        }
      });

      console.log('Auth signup result:', { authData, authError });

      if (authError) {
        console.error('Auth error:', authError);
        throw authError;
      }

      if (!authData.user) {
        throw new Error('Failed to create user account - no user returned');
      }

      console.log('User created successfully:', authData.user.id);

      // Wait a moment to ensure the user is fully created in the database
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Create college admin request with the user ID
      console.log('Creating college admin request for user:', authData.user.id);
      
      const requestData = {
        user_id: authData.user.id,
        college_name: formData.college_name,
        college_code: formData.college_code.toUpperCase(),
        college_address: formData.college_address,
        admin_name: formData.admin_name,
        admin_email: formData.admin_email,
        phone: formData.admin_phone || formData.phone,
        website: formData.website,
        status: 'pending'
      };

      console.log('Request data:', requestData);

      const { data: requestResult, error: requestError } = await supabase
        .from('college_admin_requests')
        .insert(requestData)
        .select();

      console.log('Request creation result:', { requestResult, requestError });

      if (requestError) {
        console.error('Request error:', requestError);
        throw requestError;
      }

      toast.success('College admin request submitted successfully! Please wait for approval.');
      
      // Redirect to a pending approval page
      navigate('/pending-approval');
      
    } catch (error: any) {
      console.error('Registration error:', error);
      
      let errorMessage = 'Failed to submit registration';
      if (error.message?.includes('User already registered')) {
        errorMessage = 'An account with this email already exists. Please try logging in or use a different email.';
      } else if (error.message?.includes('Invalid email')) {
        errorMessage = 'Please enter a valid email address.';
      } else if (error.message?.includes('Password')) {
        errorMessage = 'Password must be at least 6 characters long.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Login
          </Button>
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Register as College Admin</CardTitle>
            <CardDescription>
              Submit your college information for approval to become a college administrator
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* College Information Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Building className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">College Information</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="college_name">College Name *</Label>
                    <Input
                      id="college_name"
                      value={formData.college_name}
                      onChange={(e) => handleInputChange('college_name', e.target.value)}
                      placeholder="e.g., ABC Engineering College"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="college_code">College Code *</Label>
                    <Input
                      id="college_code"
                      value={formData.college_code}
                      onChange={(e) => handleInputChange('college_code', e.target.value.toUpperCase())}
                      placeholder="e.g., ABC"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="college_address">College Address *</Label>
                  <Textarea
                    id="college_address"
                    value={formData.college_address}
                    onChange={(e) => handleInputChange('college_address', e.target.value)}
                    placeholder="Full address of the college"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phone">College Phone</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="College contact number"
                    />
                  </div>
                  <div>
                    <Label htmlFor="website">College Website</Label>
                    <Input
                      id="website"
                      value={formData.website}
                      onChange={(e) => handleInputChange('website', e.target.value)}
                      placeholder="https://college-website.edu"
                    />
                  </div>
                </div>
              </div>

              {/* Admin Information Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <User className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">Admin Information</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="admin_name">Your Full Name *</Label>
                    <Input
                      id="admin_name"
                      value={formData.admin_name}
                      onChange={(e) => handleInputChange('admin_name', e.target.value)}
                      placeholder="Your full name"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="admin_phone">Your Phone Number</Label>
                    <Input
                      id="admin_phone"
                      value={formData.admin_phone}
                      onChange={(e) => handleInputChange('admin_phone', e.target.value)}
                      placeholder="Your contact number"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="admin_email">Your Email Address *</Label>
                  <Input
                    id="admin_email"
                    type="email"
                    value={formData.admin_email}
                    onChange={(e) => handleInputChange('admin_email', e.target.value)}
                    placeholder="your.email@college.edu"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="admin_password">Create Password *</Label>
                  <Input
                    id="admin_password"
                    type="password"
                    value={formData.admin_password}
                    onChange={(e) => handleInputChange('admin_password', e.target.value)}
                    placeholder="Create a strong password"
                    required
                  />
                </div>
              </div>

              {/* Terms and Submit */}
              <div className="space-y-4">
                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">What happens next?</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Your request will be reviewed by our super admin</li>
                    <li>• We may contact you for additional verification</li>
                    <li>• Once approved, you'll receive access to manage your college</li>
                    <li>• You can then create departments and manage users</li>
                  </ul>
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Submitting Request...' : 'Submit College Admin Request'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};