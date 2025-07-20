
import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Mail, Lock, User, LogIn, UserPlus, Brain } from 'lucide-react';

interface AuthFormProps {
  onAuthSuccess: () => void;
}

export const AuthForm: React.FC<AuthFormProps> = ({ onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'student' | 'teacher' | 'admin'>('student');
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        console.log('Attempting login for:', email);
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (error) {
          console.error('Login error:', error);
          throw error;
        }
        
        console.log('Login successful:', data.user?.email);
        toast.success('Successfully logged in!');
      } else {
        console.log('Attempting signup for:', email, 'with role:', role);
        
        // Make sure we pass the role in the metadata correctly
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              name: name,
              role: role, // This should be passed to the trigger
              full_name: name
            }
          }
        });
        
        if (error) {
          console.error('Signup error:', error);
          throw error;
        }
        
        console.log('Signup successful:', data.user?.email, 'Role should be:', role);
        
        // If user is immediately confirmed, create profile manually to ensure correct role
        if (data.user && !data.user.email_confirmed_at) {
          toast.success('Account created! Please check your email to confirm your account.');
        } else if (data.user) {
          // User is auto-confirmed, let's make sure the profile has the correct role
          await createUserProfile(data.user.id, name, role);
          toast.success('Account created successfully!');
        }
      }
      onAuthSuccess();
    } catch (error: any) {
      console.error('Auth error:', error);
      
      let errorMessage = 'Authentication failed';
      if (error.message?.includes('Invalid login credentials')) {
        errorMessage = 'Invalid email or password. Please check your credentials.';
      } else if (error.message?.includes('Email not confirmed')) {
        errorMessage = 'Please check your email and confirm your account.';
      } else if (error.message?.includes('User already registered')) {
        errorMessage = 'An account with this email already exists. Please try logging in.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const createUserProfile = async (userId: string, userName: string, userRole: 'student' | 'teacher' | 'admin') => {
    try {
      console.log('Creating profile for user:', userId, 'with role:', userRole);
      
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          name: userName,
          role: userRole,
          is_active: true
        });

      if (error) {
        console.error('Error creating profile:', error);
      } else {
        console.log('Profile created successfully with role:', userRole);
      }
    } catch (error) {
      console.error('Error in createUserProfile:', error);
    }
  };

  const handleGoogleAuth = async () => {
    try {
      console.log('Attempting Google OAuth...');
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      });
      if (error) throw error;
    } catch (error) {
      console.error('Google auth error:', error);
      toast.error('Google authentication failed');
    }
  };

  const createDemoAccount = async (demoRole: 'student' | 'teacher' | 'admin') => {
    const demoEmail = `${demoRole}@campus.edu`;
    const demoPassword = `${demoRole}123`;
    const demoName = `Demo ${demoRole.charAt(0).toUpperCase() + demoRole.slice(1)}`;

    try {
      console.log('Creating demo account:', demoEmail, 'with role:', demoRole);
      setLoading(true);

      // First, try to sign up the demo user
      const { data, error } = await supabase.auth.signUp({
        email: demoEmail,
        password: demoPassword,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            name: demoName,
            role: demoRole,
            full_name: demoName
          }
        }
      });

      if (error && !error.message?.includes('User already registered')) {
        throw error;
      }

      // If user already exists or was just created, try to sign in
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: demoEmail,
        password: demoPassword,
      });

      if (signInError) {
        // If sign in fails, the account might not exist, so let's create it
        console.log('Demo account might not exist, creating it...');
        toast.info(`Creating demo ${demoRole} account...`);
        
        // Wait a moment and try again
        setTimeout(async () => {
          try {
            const { error: retryError } = await supabase.auth.signInWithPassword({
              email: demoEmail,
              password: demoPassword,
            });
            
            if (retryError) {
              toast.error(`Demo ${demoRole} account not available. Please create a regular account.`);
            } else {
              toast.success(`Logged in as demo ${demoRole}!`);
              onAuthSuccess();
            }
          } catch (err) {
            toast.error(`Failed to access demo ${demoRole} account`);
          }
          setLoading(false);
        }, 2000);
        return;
      }

      // Ensure the profile has the correct role
      if (signInData.user) {
        await createUserProfile(signInData.user.id, demoName, demoRole);
        toast.success(`Logged in as demo ${demoRole}!`);
        onAuthSuccess();
      }

    } catch (error: any) {
      console.error(`Error with demo ${demoRole} account:`, error);
      toast.error(`Failed to access demo ${demoRole} account: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fillDemoCredentials = (userType: 'student' | 'teacher' | 'admin') => {
    setEmail(`${userType}@campus.edu`);
    setPassword(`${userType}123`);
    setIsLogin(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Brain className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold text-primary">CampusConnect</h1>
              <p className="text-xs text-muted-foreground">Smart Academic Assistant</p>
            </div>
          </div>
          <CardTitle className="text-xl">
            {isLogin ? 'Welcome Back' : 'Join CampusConnect'}
          </CardTitle>
          <p className="text-muted-foreground text-sm">
            {isLogin ? 'Sign in to your account' : 'Create your account'}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleAuth} className="space-y-4">
            {!isLogin && (
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            )}
            
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
                required
              />
            </div>
            
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10"
                required
              />
            </div>

            {!isLogin && (
              <div>
                <Select value={role} onValueChange={(value: 'student' | 'teacher' | 'admin') => {
                  setRole(value);
                  console.log('Role selected:', value);
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="teacher">Teacher</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  Selected role: <span className="font-semibold capitalize">{role}</span>
                </p>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Please wait...' : (
                <>
                  {isLogin ? <LogIn className="h-4 w-4 mr-2" /> : <UserPlus className="h-4 w-4 mr-2" />}
                  {isLogin ? 'Sign In' : 'Create Account'}
                </>
              )}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
            </div>
          </div>

          <Button 
            type="button" 
            variant="outline" 
            className="w-full"
            onClick={handleGoogleAuth}
            disabled={loading}
          >
            <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </Button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-primary hover:underline"
              disabled={loading}
            >
              {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
            </button>
          </div>

          {isLogin && (
            <div className="space-y-3">
              <div className="text-xs text-muted-foreground text-center">
                <p className="font-semibold mb-2">Quick Demo Access:</p>
              </div>
              <div className="space-y-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  className="w-full text-xs"
                  onClick={() => createDemoAccount('student')}
                  disabled={loading}
                >
                  Login as Demo Student
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  className="w-full text-xs"
                  onClick={() => createDemoAccount('teacher')}
                  disabled={loading}
                >
                  Login as Demo Teacher
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  className="w-full text-xs"
                  onClick={() => createDemoAccount('admin')}
                  disabled={loading}
                >
                  Login as Demo Admin
                </Button>
              </div>
              <div className="text-xs text-muted-foreground text-center">
                <p className="mt-2">Or fill credentials manually:</p>
              </div>
              <div className="space-y-2">
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm" 
                  className="w-full text-xs"
                  onClick={() => fillDemoCredentials('student')}
                  disabled={loading}
                >
                  Fill Student: student@campus.edu
                </Button>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm" 
                  className="w-full text-xs"
                  onClick={() => fillDemoCredentials('teacher')}
                  disabled={loading}
                >
                  Fill Teacher: teacher@campus.edu
                </Button>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm" 
                  className="w-full text-xs"
                  onClick={() => fillDemoCredentials('admin')}
                  disabled={loading}
                >
                  Fill Admin: admin@campus.edu
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
