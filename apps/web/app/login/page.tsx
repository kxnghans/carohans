"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/navigation';
import { Button } from '../components/ui/Button';
import { useAppStore } from '../context/AppContext';
import { NotificationToast } from '../components/common/NotificationToast';
import { Icons } from '../lib/icons';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const { showNotification } = useAppStore();
  const { User, Lock, ChevronRight, ChevronLeft } = Icons;
  const [loginInput, setLoginInput] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Safely apply overscroll behavior only to the login page
  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overscrollBehaviorY;
    document.body.style.overscrollBehaviorY = 'none';
    document.documentElement.style.overscrollBehaviorY = 'none';
    
    return () => {
      document.body.style.overscrollBehaviorY = originalStyle;
      document.documentElement.style.overscrollBehaviorY = originalStyle;
    };
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let emailToUse = loginInput;
      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(loginInput);
      
      if (!isEmail) {
          const { data: resolvedEmail, error: rpcError } = await supabase
            .rpc('get_email_for_login', { login_input: loginInput });

          if (rpcError || !resolvedEmail) {
              throw new Error('Invalid username or email.');
          }
          emailToUse = resolvedEmail;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: emailToUse,
        password,
      });

      if (error) throw error;

      if (data.user) {
        showNotification("Welcome back!", "success");
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .single();

        if (profileError) {
            router.push('/portal/orders');
            return;
        }

        if (profile?.role === 'admin') {
          router.push('/admin/overview');
        } else {
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
    <>
      <style jsx>{`
        @keyframes float-slow {
          0% { transform: translate(0, 0) rotate(0deg); }
          50% { transform: translate(30px, 50px) rotate(5deg); }
          100% { transform: translate(0, 0) rotate(0deg); }
        }
        @keyframes float-reverse {
          0% { transform: translate(0, 0) rotate(0deg); }
          50% { transform: translate(-40px, -30px) rotate(-5deg); }
          100% { transform: translate(0, 0) rotate(0deg); }
        }
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.05); }
        }
        .bg-flow {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          overflow: hidden;
        }
        .flow-shape {
          position: absolute;
          filter: blur(60px);
          opacity: 0.6;
          will-change: transform;
        }
      `}</style>
      
      <div className="min-h-[100dvh] flex flex-col items-center justify-center relative z-10 p-4 bg-background">
        <NotificationToast />

        {/* Back to Home */}
        <div className="absolute top-8 left-8 z-20">
          <Link href="/" className="group flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors bg-white/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/20 shadow-sm hover:bg-white/60">
            <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            <span className="font-bold text-sm">Home</span>
          </Link>
        </div>

        <div className="w-full max-w-md animate-in fade-in zoom-in-95 duration-700">
          
          <div className="bg-white/60 backdrop-blur-2xl p-8 md:p-12 rounded-[2.5rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] border border-white/60 relative overflow-hidden group">
            
            {/* Exclusive Creative Background for Login Card */}
            <div className="bg-flow pointer-events-none">
              <div className="flow-shape w-[400px] h-[400px] bg-indigo-100/80 rounded-full top-[-20%] left-[-20%] animate-[float-slow_20s_infinite_ease-in-out]"></div>
              <div className="flow-shape w-[450px] h-[450px] bg-purple-100/80 rounded-full bottom-[-20%] right-[-20%] animate-[float-reverse_25s_infinite_ease-in-out]"></div>
              <div className="flow-shape w-[300px] h-[300px] bg-blue-50/80 rounded-full top-[40%] left-[20%] animate-[float-slow_15s_infinite_ease-in-out_reverse]"></div>
            </div>

            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/90 to-transparent z-20"></div>
            
            <div className="relative z-10">
                <div className="flex flex-col items-center mb-10">
                    <div className="relative mb-6">
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-slate-900 rounded-3xl shadow-xl shadow-slate-300 relative z-10 group-hover:scale-105 transition-transform duration-500">
                            <span className="text-3xl font-black text-white tracking-tight">CH</span>
                            <div className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        </div>
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-indigo-500/20 blur-2xl rounded-full -z-10 animate-[pulse-glow_4s_infinite]"></div>
                    </div>
                    
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight text-center">Welcome Back</h1>
                    <p className="text-slate-500 font-medium text-center mt-2">Sign in to your workspace</p>
                </div>

                {error && (
                <div className="bg-rose-50/80 backdrop-blur-sm border border-rose-100 text-rose-600 p-4 rounded-2xl mb-8 text-xs font-bold uppercase tracking-wide flex items-center gap-3 animate-in slide-in-from-top-2">
                    <div className="w-2 h-2 rounded-full bg-rose-500 shrink-0 shadow-[0_0_8px_rgba(244,63,94,0.4)]"></div>
                    {error}
                </div>
                )}

                <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-2">
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest ml-1 mb-1">Email</label>
                    <div className="relative group/input">
                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/input:text-indigo-600 transition-colors z-10">
                        <User className="w-5 h-5" />
                    </div>
                    <input
                        type="text"
                        required
                        className="w-full pl-14 pr-4 py-4 bg-white/40 border border-slate-200/50 hover:bg-white/60 focus:bg-white focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 text-slate-900 font-bold rounded-2xl outline-none transition-all duration-300 placeholder:text-slate-300"
                        value={loginInput}
                        onChange={(e) => setLoginInput(e.target.value)}
                        placeholder="name@example.com"
                    />
                    </div>
                </div>
                
                <div className="space-y-2">
                    <div className="flex items-center justify-between ml-1 mb-1">
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">Password</label>
                    </div>
                    <div className="relative group/input">
                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/input:text-indigo-600 transition-colors z-10">
                        <Lock className="w-5 h-5" />
                    </div>
                    <input
                        type="password"
                        required
                        className="w-full pl-14 pr-4 py-4 bg-white/40 border border-slate-200/50 hover:bg-white/60 focus:bg-white focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 text-slate-900 font-bold rounded-2xl outline-none transition-all duration-300 placeholder:text-slate-300"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter password.."
                    />
                    </div>
                </div>

                <div className="pt-4">
                    <Button 
                    className="w-full py-4.5 text-sm font-black tracking-widest uppercase bg-slate-900 hover:bg-slate-800 text-white shadow-xl shadow-slate-900/10 hover:shadow-slate-900/20 rounded-2xl transform transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]" 
                    disabled={loading} 
                    size="lg"
                    >
                    <span className="flex items-center justify-center gap-3">
                        {loading ? 'Authenticating...' : 'Sign In'}
                        {!loading && <ChevronRight className="w-4 h-4" />}
                    </span>
                    </Button>
                </div>
                </form>

                <div className="mt-8 text-center pt-8 border-t border-slate-200/30">
                <p className="text-sm text-slate-500 font-medium">
                    Don't have an account? <Link href="/signup" className="text-indigo-600 font-black hover:text-indigo-700 hover:underline decoration-2 underline-offset-4 transition-colors">Sign Up</Link>
                </p>
                </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}