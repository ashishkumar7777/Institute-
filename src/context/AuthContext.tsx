import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../services/supabase';

export interface UserProfile {
  id: string;
  name: string;
  phone: string;
  role: 'owner' | 'teacher' | 'student';
  institute_id?: string;
  enrolled_subjects?: string[];
  subject?: string;
  assigned_teacher_id?: string;
  fee_status?: 'PAID' | 'UNPAID';
  attendance_rate?: number;
}

interface AuthContextType {
  currentUser: UserProfile | null;
  loading: boolean;
  loginWithPhoneAndPin: (phone: string, pin: string) => Promise<{ error: string | null }>;
  logout: () => Promise<void>;
  switchUserRoleDev: (role: 'owner' | 'teacher' | 'student') => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Fetch linked profile from Supabase profiles table
  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error.message);
        return null;
      }
      return data as UserProfile;
    } catch (err) {
      console.error('Unexpected error fetching profile:', err);
      return null;
    }
  };

  useEffect(() => {
    // Check initial session
    const initAuth = async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const profile = await fetchProfile(session.user.id);
        setCurrentUser(profile);
      }
      setLoading(false);
    };

    initAuth();

    // Listen to auth state transitions
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const profile = await fetchProfile(session.user.id);
        setCurrentUser(profile);
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Phone + PIN Authentication
  const loginWithPhoneAndPin = async (phone: string, pin: string): Promise<{ error: string | null }> => {
    try {
      const internalEmail = `${phone.trim()}@apex.internal`;
      const { data, error } = await supabase.auth.signInWithPassword({
        email: internalEmail,
        password: pin.trim(),
      });

      if (error) {
        return { error: error.message };
      }

      if (data.user) {
        const profile = await fetchProfile(data.user.id);
        if (!profile) {
          return { error: 'Account authenticated, but institute profile not found.' };
        }
        setCurrentUser(profile);
      }

      return { error: null };
    } catch (err: any) {
      return { error: err.message || 'An unexpected error occurred during login' };
    }
  };

  // Sign out
  const logout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
  };

  // Quick dev switcher helper
  const switchUserRoleDev = (role: 'owner' | 'teacher' | 'student') => {
    setCurrentUser(prev => prev ? { ...prev, role } : {
      id: 'dev_mock_id',
      name: `Mock ${role}`,
      phone: '9900000000',
      role,
      institute_id: 'inst_apex_01',
      fee_status: 'PAID',
      attendance_rate: 100,
    });
  };

  return (
    <AuthContext.Provider value={{ currentUser, loading, loginWithPhoneAndPin, logout, switchUserRoleDev }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};  