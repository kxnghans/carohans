"use client";

import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/navigation';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { useAppStore } from '../context/AppContext';
import { NotificationToast } from '../components/common/NotificationToast';

export default function SignupPage() {
  const router = useRouter();
  const { showNotification } = useAppStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 1. Sign up auth user
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;

      if (data.user) {
        // 2. Create client record linked to auth user
        // Note: Profile is created automatically by database trigger
        const { error: clientError } = await supabase
            .from('clients')
            .insert({
                user_id: data.user.id,
                name,
                username,
                phone,
                email,
                total_orders: 0,
                total_spent: 0
            });
            
        if (clientError) throw clientError;

        if (!data.session) {
          // Email confirmation is required
          showNotification("Account created! Please check your email to confirm your account.", "success");
          setIsSuccess(true);
        } else {
          // Auto-confirmed or session already exists
          showNotification("Account created successfully!", "success");
          router.push('/portal/orders');
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 text-center">
        <NotificationToast />
        <Card className="w-full max-w-md p-8 flex flex-col items-center gap-6">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
             <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Check your email</h1>
          <p className="text-slate-500">
            We've sent a confirmation link to <span className="font-bold text-slate-900">{email}</span>. 
            Please confirm your account to continue.
          </p>
          <Button onClick={() => router.push('/login')} variant="secondary" className="w-full">
            Back to Login
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <NotificationToast />
      <Card className="w-full max-w-md p-8">
        <h1 className="text-2xl font-bold text-center mb-6 text-slate-900">Create Account</h1>
        
        {error && (
          <div className="bg-rose-50 text-rose-600 p-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSignup} className="space-y-4">
           <div>
            <label className="block text-sm font-bold text-slate-800 mb-1">Username</label>
            <input
              type="text"
              required
              className="w-full p-3 border-2 border-slate-400 bg-white text-slate-900 font-bold rounded-xl outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-50 shadow-sm transition-all"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Pick a unique username"
            />
          </div>

           <div>
            <label className="block text-sm font-bold text-slate-800 mb-1">Full Name</label>
            <input
              type="text"
              required
              className="w-full p-3 border-2 border-slate-400 bg-white text-slate-900 font-bold rounded-xl outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-50 shadow-sm transition-all"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. John Doe"
            />
          </div>
          
           <div>
            <label className="block text-sm font-bold text-slate-800 mb-1">Phone Number</label>
            <input
              type="tel"
              required
              className="w-full p-3 border-2 border-slate-400 bg-white text-slate-900 font-bold rounded-xl outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-50 shadow-sm transition-all"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="024-000-0000"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-800 mb-1">Email</label>
            <input
              type="email"
              required
              className="w-full p-3 border-2 border-slate-400 bg-white text-slate-900 font-bold rounded-xl outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-50 shadow-sm transition-all"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="john@example.com"
            />
          </div>
          
          <div>
            <label className="block text-sm font-bold text-slate-800 mb-1">Password</label>
            <input
              type="password"
              required
              minLength={6}
              className="w-full p-3 border-2 border-slate-400 bg-white text-slate-900 font-bold rounded-xl outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-50 shadow-sm transition-all"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter Password"
            />
          </div>

          <Button className="w-full" disabled={loading}>
            {loading ? 'Creating Account...' : 'Sign Up'}
          </Button>
        </form>

        <div className="mt-4 text-center text-sm text-slate-500">
          Already have an account? <a href="/login" className="text-indigo-600 font-bold hover:underline">Sign In</a>
        </div>
      </Card>
    </div>
  );
}
