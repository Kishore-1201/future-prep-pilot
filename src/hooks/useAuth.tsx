
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';

interface Profile {
  id: string;
  name: string;
  role: 'student' | 'teacher' | 'admin';
  department?: string;
  student_id?: string;
  employee_id?: string;
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
        // Use setTimeout to prevent potential deadlocks
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
      
      // Get role from metadata, with proper fallback
      let role: 'student' | 'teacher' | 'admin' = 'student';
      if (userMetadata.role && ['student', 'teacher', 'admin'].includes(userMetadata.role)) {
        role = userMetadata.role as 'student' | 'teacher' | 'admin';
      }

      // Get name from metadata or email
      const name = userMetadata.name || userMetadata.full_name || email.split('@')[0] || 'User';

      console.log('Creating profile with role:', role, 'for user:', email);

      const { data, error } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          name: name,
          role: role,
          is_active: true
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating profile:', error);
        throw error;
      }

      console.log('Profile created successfully:', data);
      setProfile(data);
    } catch (error) {
      console.error('Failed to create profile:', error);
      // Set a minimal profile to prevent infinite loading
      setProfile({
        id: userId,
        name: 'User',
        role: 'student',
        is_active: true
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
    isAuthenticated: !!user,
  };
};
