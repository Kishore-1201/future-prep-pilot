
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';

interface Profile {
  id: string;
  name: string;
  role: 'student' | 'teacher' | 'admin';
  detailed_role?: string;
  college_id?: string;
  department_id?: string;
  department?: string;
  student_id?: string;
  employee_id?: string;
  pending_approval?: boolean;
  is_active: boolean;
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Initial session:', session?.user?.email);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('Auth state changed:', _event, session?.user?.email);
      setUser(session?.user ?? null);
      if (session?.user) {
        setTimeout(() => {
          fetchProfile(session.user.id);
        }, 0);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      console.log('Fetching profile for user:', userId);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile:', error);
        throw error;
      }

      if (!data) {
        console.log('No profile found, creating one...');
        await createDefaultProfile(userId);
        return;
      }

      // CRITICAL: Check if user is college admin pending approval
      if (data.detailed_role === 'college_admin' && data.pending_approval) {
        console.log('College admin pending approval, blocking login');
        setProfile(data);
        setLoading(false);
        return;
      }

      // CRITICAL: Only allow login if user is properly approved
      if (data.pending_approval) {
        console.log('User has pending approval, cannot login');
        setProfile(data);
        setLoading(false);
        return;
      }

      console.log('Profile fetched successfully:', data);
      setProfile(data);
    } catch (error) {
      console.error('Error in fetchProfile:', error);
      await createDefaultProfile(userId);
    } finally {
      setLoading(false);
    }
  };

  const createDefaultProfile = async (userId: string) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const email = userData?.user?.email || '';
      const userMetadata = userData?.user?.user_metadata || {};
      
      console.log('User metadata:', userMetadata);
      
      // Handle college admin request - CRITICAL: Set pending_approval = true
      if (userMetadata.college_request) {
        console.log('Creating profile for college admin request with pending approval');
        const { data, error } = await supabase
          .from('profiles')
          .upsert({
            id: userId,
            name: userMetadata.name || email.split('@')[0] || 'User',
            role: 'student', // Temporary role
            detailed_role: 'college_admin', // This identifies them as college admin
            pending_approval: true, // CRITICAL: Cannot login until approved
            is_active: false // CRITICAL: Not active until approved
          }, {
            onConflict: 'id'
          })
          .select()
          .single();

        if (error) throw error;
        setProfile(data);
        return;
      }

      // Get role from metadata for regular users
      let role: 'student' | 'teacher' | 'admin' = 'student';
      const possibleRole = userMetadata.role || userMetadata.user_role;
      if (possibleRole && ['student', 'teacher', 'admin'].includes(possibleRole)) {
        role = possibleRole as 'student' | 'teacher' | 'admin';
      }

      // Get name from metadata or email
      const name = userMetadata.name || userMetadata.full_name || email.split('@')[0] || 'User';

      console.log('Creating regular profile with role:', role, 'for user:', email);

      const { data, error } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          name: name,
          role: role,
          detailed_role: role === 'admin' ? 'super_admin' : role,
          is_active: true,
          pending_approval: false
        }, {
          onConflict: 'id'
        })
        .select()
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Failed to create profile:', error);
      setProfile({
        id: userId,
        name: 'User',
        role: 'student',
        detailed_role: 'student',
        is_active: true,
        pending_approval: false
      });
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    console.log('Signing out...');
    await supabase.auth.signOut();
    setProfile(null);
    setUser(null);
  };

  return {
    user,
    profile,
    loading,
    signOut,
    isAuthenticated: !!user && !!profile && !profile.pending_approval && profile.is_active,
    isPendingApproval: profile?.pending_approval || false,
    isCollegeAdminPending: profile?.detailed_role === 'college_admin' && profile?.pending_approval,
  };
};
