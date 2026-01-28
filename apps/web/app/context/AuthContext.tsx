"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

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
    // Safety check: if supabase client is not properly initialized (e.g. missing env vars), don't crash
    if (!supabase || !supabase.auth) {
        console.error("Supabase client is not initialized. Authentication disabled.");
        return;
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user || null);
        if (!session) {
             setUserRole(null);
        }
    });

    return () => subscription.unsubscribe();
  }, []);

  const logout = async () => {
      await supabase.auth.signOut();
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
