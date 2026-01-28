"use client";

import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/navigation';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { useAppStore } from '../context/AppContext';
import { NotificationToast } from '../components/common/NotificationToast';
import { Icons } from '../lib/icons';
import Link from 'next/link';

export default function SignupPage() {
  const router = useRouter();
  const { showNotification } = useAppStore();
  const { User, Lock, Mail, Phone, ChevronRight, ChevronLeft, Check, Eye, EyeOff } = Icons;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
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
        const { error: clientError } = await supabase
            .from('clients')
            .insert({
                user_id: data.user.id,
                name: `${firstName} ${lastName}`.trim(),
                username,
                phone,
                email,
                total_orders: 0,
                total_spent: 0,
                image: 'icon:User',
                color: 'text-indigo-600'
            });
            
        if (clientError) throw clientError;

        if (!data.session) {
          showNotification("Account created! Please check your email to confirm your account.", "success");
          setIsSuccess(true);
        } else {
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
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 relative overflow-hidden text-center">
        
        <NotificationToast />
        <Card className="w-full max-w-md p-8 z-10 flex flex-col items-center gap-6 border-none shadow-2xl shadow-indigo-500/10 bg-surface/80 backdrop-blur-xl rounded-[2.5rem] relative">
          
          {/* Abstract Background Design inside Card */}
          <div className="absolute inset-0 z-0 opacity-40 pointer-events-none">
            <div className="absolute top-[-50%] right-[-50%] w-[400px] h-[400px] bg-indigo-500/10 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
            <div className="absolute bottom-[-50%] left-[-50%] w-[400px] h-[400px] bg-purple-500/10 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
          </div>

          <div className="relative z-10 flex flex-col items-center gap-6 w-full">
            <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-500 rounded-3xl flex items-center justify-center shadow-inner">
               <Check className="w-10 h-10" />
            </div>
            <h1 className="text-theme-header text-foreground tracking-tight">Check your email</h1>
            <p className="text-muted text-theme-body">
              We've sent a confirmation link to <br /><span className="text-foreground">{email}</span>. <br />
              Please confirm your account to continue.
            </p>
            <Button onClick={() => router.push('/login')} variant="primary" className="w-full py-4 uppercase tracking-wide" size="lg">
              Continue to Login
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 relative overflow-hidden">
      
      <NotificationToast />

      <div className="absolute top-8 left-8 z-20">
        <Link href="/" className="flex items-center gap-2 text-muted hover:text-foreground transition-colors">
          <ChevronLeft className="w-4 h-4" />
          <span className="text-theme-caption">Home</span>
        </Link>
      </div>

      <div className="w-full max-w-lg z-10 animate-in fade-in slide-in-from-bottom-4 duration-700 py-12">
        <div className="text-center mb-8">
          <div className="inline-flex w-16 h-16 bg-slate-900 dark:bg-white rounded-2xl items-center justify-center text-white dark:text-slate-900 text-2xl font-bold shadow-2xl mb-4 dark:shadow-none">
            CH
          </div>
          <h1 className="text-theme-header text-foreground tracking-tight">Create Account</h1>
          <p className="text-muted text-theme-body font-medium">Join today</p>
        </div>

        <Card className="p-8 border-none shadow-2xl shadow-indigo-500/10 bg-surface/80 backdrop-blur-xl rounded-[2.5rem] relative">
          
          {/* Abstract Background Design inside Card */}
          <div className="absolute inset-0 z-0 opacity-40 pointer-events-none">
            <div className="absolute top-[-20%] right-[-20%] w-[400px] h-[400px] bg-indigo-500/10 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
            <div className="absolute bottom-[-20%] left-[-20%] w-[400px] h-[400px] bg-purple-500/10 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
          </div>

          <div className="relative z-10">
            {error && (
              <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800 text-rose-600 dark:text-rose-400 p-4 rounded-2xl mb-6 text-theme-caption font-bold flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div>
                {error}
              </div>
            )}

            <form onSubmit={handleSignup} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                      <label className="block text-theme-caption text-muted uppercase tracking-widest ml-1">First Name</label>
                      <div className="relative group">
                          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-primary transition-colors">
                          <User className="w-5 h-5" />
                          </div>
                          <input
                          type="text"
                          required
                          className="w-full pl-16 pr-4 py-4 bg-background/50 border-2 border-transparent focus:border-primary focus:bg-surface text-foreground text-theme-label rounded-2xl outline-none transition-all shadow-sm"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          placeholder="First"
                          />
                      </div>
                  </div>

                  <div className="space-y-2">
                      <label className="block text-theme-caption font-black text-muted uppercase tracking-widest ml-1">Last Name</label>
                      <div className="relative group">
                          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-primary transition-colors">
                          <User className="w-5 h-5" />
                          </div>
                          <input
                          type="text"
                          required
                          className="w-full pl-16 pr-4 py-4 bg-background/50 border-2 border-transparent focus:border-primary focus:bg-surface text-foreground text-theme-label rounded-2xl outline-none transition-all shadow-sm"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          placeholder="Last"
                          />
                      </div>
                  </div>
              </div>

              <div className="space-y-2">
                  <label className="block text-theme-caption font-black text-muted uppercase tracking-widest ml-1">Username</label>
                  <div className="relative group">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-primary transition-colors">
                      <User className="w-5 h-5" />
                      </div>
                      <input
                      type="text"
                      required
                      className="w-full pl-16 pr-4 py-4 bg-background/50 border-2 border-transparent focus:border-primary focus:bg-surface text-foreground text-theme-label rounded-2xl outline-none transition-all shadow-sm"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Username"
                      />
                  </div>
              </div>
              
              <div className="space-y-2">
                <label className="block text-theme-caption font-black text-muted uppercase tracking-widest ml-1">Phone Number</label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-primary transition-colors">
                    <Phone className="w-5 h-5" />
                  </div>
                  <input
                    type="tel"
                    required
                    className="w-full pl-16 pr-4 py-4 bg-background/50 border-2 border-transparent focus:border-primary focus:bg-surface text-foreground text-theme-label rounded-2xl outline-none transition-all shadow-sm"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="024-000-0000"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-theme-caption font-black text-muted uppercase tracking-widest ml-1">Email Address</label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-primary transition-colors">
                    <Mail className="w-5 h-5" />
                  </div>
                  <input
                    type="email"
                    required
                    className="w-full pl-16 pr-4 py-4 bg-background/50 border-2 border-transparent focus:border-primary focus:bg-surface text-foreground text-theme-label rounded-2xl outline-none transition-all shadow-sm"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="john@example.com"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="block text-theme-caption font-black text-muted uppercase tracking-widest ml-1">Password</label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-primary transition-colors">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={6}
                    className="w-full pl-16 pr-12 py-4 bg-background/50 border-2 border-transparent focus:border-primary focus:bg-surface text-foreground text-theme-label rounded-2xl outline-none transition-all shadow-sm"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password.."
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-primary transition-colors z-10 p-1"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <Button className="w-full py-4 text-theme-body-bold uppercase mt-4 bg-primary text-white hover:bg-indigo-700 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 border-none shadow-xl shadow-indigo-500/20 dark:shadow-none" disabled={loading} size="lg">
                {loading ? 'Creating Account...' : 'Get Started'}
                {!loading && <ChevronRight className="w-5 h-5" />}
              </Button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-theme-body text-muted">
                Already have an account? <Link href="/login" className="text-primary dark:text-amber-500 hover:underline underline-offset-4 transition-colors">Sign In</Link>
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
