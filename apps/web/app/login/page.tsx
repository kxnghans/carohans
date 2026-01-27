"use client";

import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/navigation';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { useAppStore } from '../context/AppContext';
import { NotificationToast } from '../components/common/NotificationToast';

export default function LoginPage() {
  const router = useRouter();
  const { showNotification } = useAppStore();
  const [loginInput, setLoginInput] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      console.log('Attempting login with input:', loginInput);
      
      // 1. Resolve Username to Email if needed
      let emailToUse = loginInput;
      
      // Simple regex check: if it doesn't look like an email, try resolving it as a username
      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(loginInput);
      
      if (!isEmail) {
          console.log('Resolving username to email...');
          const { data: resolvedEmail, error: rpcError } = await supabase
            .rpc('get_email_for_login', { login_input: loginInput });

          if (rpcError) {
             console.error('RPC Error resolving username:', rpcError);
          }
          if (resolvedEmail) {
             console.log('Resolved email:', resolvedEmail);
          }

          if (rpcError || !resolvedEmail) {
              throw new Error('Invalid username or email.');
          }
          emailToUse = resolvedEmail;
      }

      console.log('Signing in with:', emailToUse);
      const { data, error } = await supabase.auth.signInWithPassword({
        email: emailToUse,
        password,
      });

      if (error) {
        console.error('Sign in error:', error);
        throw error;
      }

      console.log('Sign in successful, user:', data.user?.id);

      if (data.user) {
        showNotification("Welcome back!", "success");
        // Wait a small bit for DB triggers/sync if necessary, then fetch role
        // Using a direct query ensures we get the latest role from the database
        console.log('Fetching profile for user:', data.user.id);
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .single();

        if (profileError) {
            console.error('Error fetching profile:', profileError);
            // Default to portal if profile fetch fails but user exists
            console.log('Redirecting to portal due to profile error');
            router.push('/portal/orders');
            return;
        }

        console.log('Profile found:', profile);

        if (profile?.role === 'admin') {
          console.log('Redirecting to admin overview');
          router.push('/admin/overview');
        } else {
          console.log('Redirecting to portal orders');
          router.push('/portal/orders');
        }
      }
    } catch (err: any) {
      console.error('Login flow error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <NotificationToast />
      <Card className="w-full max-w-md p-8">
        <h1 className="text-2xl font-bold text-center mb-6 text-slate-900">Sign In</h1>
        
        {error && (
          <div className="bg-rose-50 text-rose-600 p-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-800 mb-1">Email or Username</label>
            <input
              type="text"
              required
              className="w-full p-3 border-2 border-slate-400 bg-white text-slate-900 font-bold rounded-xl outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-50 shadow-sm transition-all"
              value={loginInput}
              onChange={(e) => setLoginInput(e.target.value)}
              placeholder="Enter your email or username"
            />
          </div>
          
          <div>
            <label className="block text-sm font-bold text-slate-800 mb-1">Password</label>
            <input
              type="password"
              required
              className="w-full p-3 border-2 border-slate-400 bg-white text-slate-900 font-bold rounded-xl outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-50 shadow-sm transition-all"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter Password"
            />
          </div>

          <Button className="w-full" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>

        <div className="mt-4 text-center text-sm text-slate-500">
          Don't have an account? <a href="/signup" className="text-indigo-600 font-bold hover:underline">Sign Up</a>
        </div>
      </Card>
    </div>
  );
}
