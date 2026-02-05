"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { getClientSession } from '../actions/client-auth';

export interface AuthContextType {
  user: User | null;
  userRole: 'admin' | 'client' | null;
  logout: () => Promise<void>;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  setUserRole: React.Dispatch<React.SetStateAction<'admin' | 'client' | null>>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<'admin' | 'client' | null>(null);

  useEffect(() => {
    // Safety check: if supabase client is not properly initialized
    if (!supabase || !supabase.auth) {
        console.error("Supabase client is not initialized. Authentication disabled.");
        return;
    }

    const checkSession = async () => {
        // 1. Check Supabase Session (Admin / Legacy)
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
            setUser(session.user);
            return;
        }

        // 2. Check Client Session (Cookie-based)
        const clientId = await getClientSession();
        if (clientId) {
            // Mock a User object for the client so the rest of the app works
            // In a real app we might want to fetch the client details here
            const mockUser = {
                id: `client-${clientId}`,
                email: `client-${clientId}@placeholder.com`,
                role: 'authenticated',
                aud: 'authenticated',
                app_metadata: {},
                user_metadata: { role: 'client', clientId },
                created_at: new Date().toISOString()
            } as User;
            
            setUser(mockUser);
            setUserRole('client');
        } else {
             setUser(null);
             setUserRole(null);
        }
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
            setUser(session.user);
        } else {
            // Re-check client session on logout
            checkSession();
        }
    });

    return () => subscription.unsubscribe();
  }, []);

  const logout = async () => {
      await supabase.auth.signOut();
      
      // Clear client session cookie
      // We need to call the server action to clear the HTTP-only cookie
      // Using a dynamic import or fetch to hit a logout route would be ideal
      // But for now, we can rely on the server action being imported
      const { logoutClient } = await import('../actions/client-auth');
      await logoutClient();
      
      setUser(null);
      setUserRole(null);
      window.location.href = '/';
  };

  return (
    <AuthContext.Provider value={{ user, userRole, logout, setUser, setUserRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
