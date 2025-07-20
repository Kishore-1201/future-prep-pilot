import React from 'react';
import { Clock, CheckCircle, Mail, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export const PendingApproval: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 bg-yellow-100 rounded-full w-fit">
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
            <CardTitle className="text-2xl">Request Submitted</CardTitle>
            <CardDescription>
              Your college admin request is pending approval
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-100 rounded-full">
                  <Mail className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-semibold">Request Received</h4>
                  <p className="text-sm text-muted-foreground">
                    We've received your college admin request and it's now under review.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-yellow-100 rounded-full">
                  <Clock className="h-4 w-4 text-yellow-600" />
                </div>
                <div>
                  <h4 className="font-semibold">Under Review</h4>
                  <p className="text-sm text-muted-foreground">
                    Our super admin is reviewing your college information and credentials.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-gray-100 rounded-full">
                  <CheckCircle className="h-4 w-4 text-gray-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-muted-foreground">Approval Pending</h4>
                  <p className="text-sm text-muted-foreground">
                    You'll receive an email notification once your request is approved.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-muted p-4 rounded-lg">
              <h4 className="font-semibold mb-2">What to expect:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Review typically takes 1-3 business days</li>
                <li>• You may be contacted for additional verification</li>
                <li>• Once approved, you'll gain full college admin access</li>
                <li>• You can then create departments and manage users</li>
              </ul>
            </div>

            <div className="space-y-2">
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => navigate('/')}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Login
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                You can try logging in once your request is approved
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};