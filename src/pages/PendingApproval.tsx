
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, CheckCircle, Building, Brain, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export const PendingApproval: React.FC = () => {
  const { profile, signOut } = useAuth();

  const getApprovalMessage = () => {
    if (profile?.detailed_role === 'college_admin') {
      return {
        title: "College Admin Request Pending",
        description: "Your college admin request is currently being reviewed by our super administrators.",
        details: [
          "Your registration has been received successfully",
          "Our team is verifying your college information",
          "You will receive email notification once approved",
          "This process typically takes 1-2 business days"
        ],
        icon: Building
      };
    }

    return {
      title: "Account Approval Pending",
      description: "Your account is pending approval from the administration.",
      details: [
        "Your registration has been received",
        "An administrator will review your request",
        "You will be notified once approved",
        "Please contact support if you have questions"
      ],
      icon: Clock
    };
  };

  const approvalInfo = getApprovalMessage();
  const IconComponent = approvalInfo.icon;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Brain className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold text-primary">CampusConnect</h1>
              <p className="text-xs text-muted-foreground">Smart Academic Assistant</p>
            </div>
          </div>
        </div>

        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="relative">
                <IconComponent className="h-16 w-16 text-yellow-500" />
                <div className="absolute -top-1 -right-1 h-6 w-6 bg-yellow-100 rounded-full flex items-center justify-center">
                  <Clock className="h-3 w-3 text-yellow-600" />
                </div>
              </div>
            </div>
            <CardTitle className="text-xl">{approvalInfo.title}</CardTitle>
            <CardDescription className="text-center">
              {approvalInfo.description}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-semibold text-yellow-800 mb-2 flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                What's happening now:
              </h4>
              <ul className="space-y-1 text-sm text-yellow-700">
                {approvalInfo.details.map((detail, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-yellow-500 mt-1">•</span>
                    <span>{detail}</span>
                  </li>
                ))}
              </ul>
            </div>

            {profile?.detailed_role === 'college_admin' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-800 mb-2">College Information</h4>
                <div className="text-sm text-blue-700">
                  <p><strong>Registered as:</strong> College Administrator</p>
                  <p><strong>Status:</strong> Awaiting Super Admin Approval</p>
                  <p><strong>Account:</strong> {profile.name}</p>
                </div>
              </div>
            )}

            <div className="pt-4 border-t space-y-3">
              <div className="text-center text-sm text-muted-foreground">
                Need help? Contact our support team at support@campusconnect.edu
              </div>
              
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={signOut}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
