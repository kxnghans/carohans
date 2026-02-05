"use client";

import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/navigation';
import { Button } from '../components/ui/Button';
import { useAppStore } from '../context/AppContext';
import { NotificationToast } from '../components/common/NotificationToast';
import { Icons } from '../lib/icons';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

import { createClientAction } from '../actions/clients';
import { authenticateClient } from '../actions/client-auth';
import { getUserFriendlyErrorMessage } from '../utils/errorMapping';

function SignupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isTypeAdmin = searchParams.get('type') === 'admin';
  const { showNotification } = useAppStore();
  const { User, Lock, Mail, Phone, ChevronRight, ChevronLeft, Check, Eye, EyeOff, Shield, MapPin } = Icons;

  // Directly set based on type param, no manual toggle
  const isInternalAdmin = isTypeAdmin;

  // Admin / General Access Token
  const [accessToken, setAccessToken] = useState('');
  const [isAccessGranted, setIsAccessGranted] = useState(!isInternalAdmin);
  const [checkingToken, setCheckingToken] = useState(false);

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleVerifyToken = async (e: React.FormEvent) => {
    e.preventDefault();
    setCheckingToken(true);
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'signup_token')
        .single();

      if (error) throw error;

      if (data.value === accessToken) {
        setIsAccessGranted(true);
        showNotification("Access granted", "success");
      } else {
        showNotification("Invalid access token", "error");
      }
    } catch (err) {
      console.error("Token verification failed", err);
      showNotification("Access verification unavailable", "error");
    } finally {
      setCheckingToken(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isInternalAdmin) {
          // ADMIN SIGNUP (Supabase Auth)
          const { data, error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: {
              emailRedirectTo: typeof window !== 'undefined' ? `${window.location.origin}/` : undefined,
              data: {
                role: 'admin',
                username: username.toLowerCase(),
                first_name: firstName,
                last_name: lastName,
                phone: phone,
                signup_token: accessToken // Pass the token for trigger validation
              }
            }
          });

          if (authError) throw authError;

          if (data.user) {
            if (!data.session) {
              showNotification("Account created! Please check your email.", "success");
              setIsSuccess(true);
            } else {
              showNotification("Account created successfully!", "success");
              router.push('/admin/overview');
            }
          }

      } else {
          // CLIENT SIGNUP (Direct Table Insert)
          const clientData = {
              firstName,
              lastName,
              phone,
              email,
              address
          };

          const result = await createClientAction(clientData);

          if (!result.success) {
              throw new Error(result.error || 'Failed to create client account');
          }

          // Automatically log them in after signup
          const authResult = await authenticateClient(firstName, lastName, phone);
          
          if (authResult.success) {
              showNotification("Account created successfully!", "success");
              window.location.href = '/portal/inventory';
          } else {
              setIsSuccess(true);
          }
      }
      
    } catch (err: unknown) {
      console.error("Signup error:", err);
      setError(getUserFriendlyErrorMessage(err, "Signup"));
    } finally {
      setLoading(false);
    }
  };

  if (isSuccess) {
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
        <div className="min-h-screen flex flex-col items-center justify-center bg-background p-3 md:p-4 relative overflow-hidden text-center">

          <NotificationToast />
          <div className="w-full max-w-xl bg-surface/60 dark:bg-surface/80 backdrop-blur-2xl p-8 md:p-12 rounded-[2rem] md:rounded-[2.5rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] border border-border dark:border-border/50 relative overflow-hidden group flex flex-col items-center gap-6">

            <div className="bg-flow pointer-events-none">
              <div className="flow-shape w-[300px] h-[300px] md:w-[400px] md:h-[400px] bg-primary/[0.08] dark:bg-primary/5 rounded-full top-[-20%] left-[-20%] animate-[float-slow_20s_infinite_ease-in-out]"></div>
              <div className="flow-shape w-[350px] h-[350px] md:w-[450px] md:h-[450px] bg-secondary/10 rounded-full bottom-[-20%] right-[-20%] animate-[float-reverse_25s_infinite_ease-in-out]"></div>
            </div>

            <div className="relative z-10 flex flex-col items-center gap-6 w-full">
              <div className="relative mb-2">
                <div className="w-16 h-16 md:w-20 md:h-20 bg-success/10 dark:bg-success/20 text-success dark:text-success rounded-3xl flex items-center justify-center shadow-inner relative z-10">
                  <Check className="w-8 h-8 md:w-10 md:h-10" />
                </div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-success/20 blur-2xl rounded-full -z-10 animate-[pulse-glow_4s_infinite]"></div>
              </div>
              <h1 className="text-theme-header text-foreground tracking-tight">
                  {isInternalAdmin ? 'Check your email' : 'Account Created!'}
              </h1>
              <p className="text-muted text-theme-body">
                {isInternalAdmin ? (
                    <>We&apos;ve sent a confirmation link to <br /><span className="text-secondary dark:text-warning font-normal">{email}</span>.</>
                ) : (
                    <>Welcome to CaroHans Ventures, <br /><span className="text-secondary dark:text-warning font-normal">{firstName}</span>.</>
                )}
              </p>
              <Button onClick={() => router.push('/login')} className="w-full py-4.5 uppercase tracking-widest bg-primary dark:bg-primary text-primary-text dark:text-primary-text shadow-xl shadow-slate-900/10 dark:shadow-none rounded-2xl transform transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] font-normal" size="lg">
                Continue to Login
              </Button>
            </div>
          </div>
        </div>
      </>
    );
  }

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

      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-3 md:p-4 relative overflow-hidden">

        <NotificationToast />

        <div className="absolute top-6 left-6 md:top-8 md:left-8 z-20">
          <Link href="/" className="group flex items-center gap-2 text-muted hover:text-foreground transition-colors bg-surface/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-border shadow-sm hover:bg-surface/60">
            <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            <span className="text-theme-body">Home</span>
          </Link>
        </div>

        <div className="w-full max-w-xl z-10 animate-in fade-in slide-in-from-bottom-4 duration-700 py-8 md:py-12">
          <div className="text-center mb-6 md:mb-8">
            <div className="relative inline-flex mb-4">
              <div className="w-14 h-14 md:w-16 md:h-16 bg-primary dark:bg-primary rounded-2xl flex items-center justify-center text-primary-text dark:text-primary-text text-theme-label font-bold shadow-xl relative z-10">
                CH
              </div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-primary/20 blur-2xl rounded-full -z-10 animate-[pulse-glow_4s_infinite]"></div>
            </div>
            <h1 className="text-theme-header text-foreground tracking-tight font-normal">
              {!isAccessGranted ? "System Access" : (isInternalAdmin ? "Create Admin Account" : "Join Client Portal")}
            </h1>
            <p className="text-muted text-theme-body font-normal opacity-80">
              {!isAccessGranted ? "Enter security token to proceed" : "Create your account"}
            </p>
          </div>

          <div className="bg-surface/60 dark:bg-surface/80 backdrop-blur-2xl p-6 md:p-10 rounded-[2rem] md:rounded-[2.5rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] border border-border dark:border-border/50 relative overflow-hidden group">

            <div className="bg-flow pointer-events-none">
              <div className="flow-shape w-[300px] h-[300px] md:w-[400px] md:h-[400px] bg-primary/[0.08] dark:bg-primary/5 rounded-full top-[-20%] left-[-20%] animate-[float-slow_20s_infinite_ease-in-out]"></div>
              <div className="flow-shape w-[350px] h-[350px] md:w-[450px] md:h-[450px] bg-secondary/10 rounded-full bottom-[-20%] right-[-20%] animate-[float-reverse_25s_infinite_ease-in-out]"></div>
            </div>

            <div className="relative z-10">
              {!isAccessGranted ? (
                /* TOKEN VERIFICATION FORM */
                <form onSubmit={handleVerifyToken} className="space-y-6">
                  <div className="space-y-2">
                    <label className="block text-theme-body font-normal text-muted uppercase tracking-widest ml-1 mb-1">Security Token</label>
                    <div className="relative group/input">
                      <div className="absolute left-7 top-1/2 -translate-y-1/2 text-muted group-focus-within/input:text-primary transition-colors z-10">
                        <Shield className="w-5 h-5" />
                      </div>
                      <input
                        type="password"
                        required
                        className="w-full pl-20 pr-4 py-4 bg-background/40 dark:bg-background/20 border border-border dark:border-border/50 hover:bg-background/60 dark:hover:bg-background/30 focus:bg-background dark:focus:bg-background/40 focus:border-secondary/50 focus:ring-4 focus:ring-secondary/10 text-foreground text-theme-label rounded-2xl outline-none transition-all duration-300 placeholder:text-muted/30 font-normal placeholder:font-normal placeholder:tracking-normal tracking-[0.5em] text-center"
                        value={accessToken}
                        onChange={(e) => setAccessToken(e.target.value)}
                        placeholder="Enter security token"
                      />
                    </div>
                  </div>
                  <Button
                    className="w-full py-4.5 uppercase bg-primary dark:bg-primary hover:bg-primary dark:hover:bg-primary/90 text-primary-text shadow-xl shadow-slate-900/10 dark:shadow-none rounded-2xl transform transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] font-normal tracking-widest"
                    disabled={checkingToken}
                    size="lg"
                  >
                    {checkingToken ? 'Verifying...' : 'Unlock Signup'}
                  </Button>
                </form>
              ) : (
                /* ACTUAL SIGNUP FORM */
                <>
                  {error && (
                    <div className="bg-error/10 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800 text-error dark:text-rose-400 p-4 rounded-2xl mb-6 text-theme-body font-normal flex items-center gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-error"></div>
                      {error}
                    </div>
                  )}

                  <form onSubmit={handleSignup} className="space-y-5">
                    
                    {!isInternalAdmin ? (
                        /* CLIENT FIELDS */
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                              <div className="space-y-2">
                                <label className="block text-theme-body font-normal text-muted uppercase tracking-widest ml-1 mb-1">First Name *</label>
                                <div className="relative group/input">
                                  <div className="absolute left-7 top-1/2 -translate-y-1/2 text-muted group-focus-within/input:text-primary transition-colors z-10">
                                    <User className="w-5 h-5" />
                                  </div>
                                  <input
                                    type="text"
                                    required
                                    className="w-full pl-20 pr-4 py-4 bg-background/40 dark:bg-background/20 border border-border dark:border-border/50 hover:bg-background/60 dark:hover:bg-background/30 focus:bg-background dark:focus:bg-background/40 focus:border-secondary/50 focus:ring-4 focus:ring-secondary/10 text-foreground text-theme-label rounded-2xl outline-none transition-all duration-300 placeholder:text-muted/30 font-normal placeholder:font-normal"
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    placeholder="First"
                                  />
                                </div>
                              </div>

                              <div className="space-y-2">
                                <label className="block text-theme-body font-normal text-muted uppercase tracking-widest ml-1 mb-1">Last Name *</label>
                                <div className="relative group/input">
                                  <div className="absolute left-7 top-1/2 -translate-y-1/2 text-muted group-focus-within/input:text-primary transition-colors z-10">
                                    <User className="w-5 h-5" />
                                  </div>
                                  <input
                                    type="text"
                                    required
                                    className="w-full pl-20 pr-4 py-4 bg-background/40 dark:bg-background/20 border border-border dark:border-border/50 hover:bg-background/60 dark:hover:bg-background/30 focus:bg-background dark:focus:bg-background/40 focus:border-secondary/50 focus:ring-4 focus:ring-secondary/10 text-foreground text-theme-label rounded-2xl outline-none transition-all duration-300 placeholder:text-muted/30 font-normal placeholder:font-normal"
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    placeholder="Last"
                                  />
                                </div>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <label className="block text-theme-body font-normal text-muted uppercase tracking-widest ml-1 mb-1">Contact Number *</label>
                              <div className="relative group/input">
                                <div className="absolute left-7 top-1/2 -translate-y-1/2 text-muted group-focus-within/input:text-primary transition-colors z-10">
                                  <Phone className="w-5 h-5" />
                                </div>
                                <input
                                  type="tel"
                                  required
                                  className="w-full pl-20 pr-4 py-4 bg-background/40 dark:bg-background/20 border border-border dark:border-border/50 hover:bg-background/60 dark:hover:bg-background/30 focus:bg-background dark:focus:bg-background/40 focus:border-secondary/50 focus:ring-4 focus:ring-secondary/10 text-foreground text-theme-label rounded-2xl outline-none transition-all duration-300 placeholder:text-muted/30 font-normal placeholder:font-normal"
                                  value={phone}
                                  onChange={(e) => setPhone(e.target.value)}
                                  placeholder="024-000-0000"
                                />
                              </div>
                            </div>

                            <div className="space-y-2">
                              <label className="block text-theme-body font-normal text-muted uppercase tracking-widest ml-1 mb-1">Email Address *</label>
                              <div className="relative group/input">
                                <div className="absolute left-7 top-1/2 -translate-y-1/2 text-muted group-focus-within/input:text-primary transition-colors z-10">
                                  <Mail className="w-5 h-5" />
                                </div>
                                <input
                                  type="email"
                                  required
                                  className="w-full pl-20 pr-4 py-4 bg-background/40 dark:bg-background/20 border border-border dark:border-border/50 hover:bg-background/60 dark:hover:bg-background/30 focus:bg-background dark:focus:bg-background/40 focus:border-secondary/50 focus:ring-4 focus:ring-secondary/10 text-foreground text-theme-label rounded-2xl outline-none transition-all duration-300 placeholder:text-muted/30 font-normal placeholder:font-normal"
                                  value={email}
                                  onChange={(e) => setEmail(e.target.value)}
                                  placeholder="john@example.com"
                                />
                              </div>
                            </div>

                            <div className="space-y-2">
                              <label className="block text-theme-body font-normal text-muted uppercase tracking-widest ml-1 mb-1">Default Delivery Address</label>
                              <div className="relative group/input">
                                <div className="absolute left-7 top-4 text-muted group-focus-within/input:text-primary transition-colors z-10">
                                  <MapPin className="w-5 h-5" />
                                </div>
                                <textarea
                                  className="w-full pl-20 pr-4 py-4 bg-background/40 dark:bg-background/20 border border-border dark:border-border/50 hover:bg-background/60 dark:hover:bg-background/30 focus:bg-background dark:focus:bg-background/40 focus:border-secondary/50 focus:ring-4 focus:ring-secondary/10 text-foreground text-theme-label rounded-2xl outline-none transition-all duration-300 placeholder:text-muted/30 font-normal placeholder:font-normal min-h-[100px] resize-none"
                                  value={address}
                                  onChange={(e) => setAddress(e.target.value)}
                                  placeholder="Enter your delivery address..."
                                />
                              </div>
                            </div>
                        </>
                    ) : (
                        /* ADMIN FIELDS */
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                              <div className="space-y-2">
                                <label className="block text-theme-body font-normal text-muted uppercase tracking-widest ml-1 mb-1">First Name</label>
                                <div className="relative group/input">
                                  <div className="absolute left-7 top-1/2 -translate-y-1/2 text-muted group-focus-within/input:text-primary transition-colors z-10">
                                    <User className="w-5 h-5" />
                                  </div>
                                  <input
                                    type="text"
                                    required
                                    className="w-full pl-20 pr-4 py-4 bg-background/40 dark:bg-background/20 border border-border dark:border-border/50 hover:bg-background/60 dark:hover:bg-background/30 focus:bg-background dark:focus:bg-background/40 focus:border-secondary/50 focus:ring-4 focus:ring-secondary/10 text-foreground text-theme-label rounded-2xl outline-none transition-all duration-300 placeholder:text-muted/30 font-normal placeholder:font-normal"
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    placeholder="First"
                                  />
                                </div>
                              </div>

                              <div className="space-y-2">
                                <label className="block text-theme-body font-normal text-muted uppercase tracking-widest ml-1 mb-1">Last Name</label>
                                <div className="relative group/input">
                                  <div className="absolute left-7 top-1/2 -translate-y-1/2 text-muted group-focus-within/input:text-primary transition-colors z-10">
                                    <User className="w-5 h-5" />
                                  </div>
                                  <input
                                    type="text"
                                    required
                                    className="w-full pl-20 pr-4 py-4 bg-background/40 dark:bg-background/20 border border-border dark:border-border/50 hover:bg-background/60 dark:hover:bg-background/30 focus:bg-background dark:focus:bg-background/40 focus:border-secondary/50 focus:ring-4 focus:ring-secondary/10 text-foreground text-theme-label rounded-2xl outline-none transition-all duration-300 placeholder:text-muted/30 font-normal placeholder:font-normal"
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    placeholder="Last"
                                  />
                                </div>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <label className="block text-theme-body font-normal text-muted uppercase tracking-widest ml-1 mb-1">Username</label>
                              <div className="relative group/input">
                                <div className="absolute left-7 top-1/2 -translate-y-1/2 text-muted group-focus-within/input:text-primary transition-colors z-10">
                                  <User className="w-5 h-5" />
                                </div>
                                <input
                                  type="text"
                                  required
                                  className="w-full pl-20 pr-4 py-4 bg-background/40 dark:bg-background/20 border border-border dark:border-border/50 hover:bg-background/60 dark:hover:bg-background/30 focus:bg-background dark:focus:bg-background/40 focus:border-secondary/50 focus:ring-4 focus:ring-secondary/10 text-foreground text-theme-label rounded-2xl outline-none transition-all duration-300 placeholder:text-muted/30 font-normal placeholder:font-normal"
                                  value={username}
                                  onChange={(e) => setUsername(e.target.value)}
                                  placeholder="Username"
                                />
                              </div>
                            </div>

                            <div className="space-y-2">
                              <label className="block text-theme-body font-normal text-muted uppercase tracking-widest ml-1 mb-1">Phone Number</label>
                              <div className="relative group/input">
                                <div className="absolute left-7 top-1/2 -translate-y-1/2 text-muted group-focus-within/input:text-primary transition-colors z-10">
                                  <Phone className="w-5 h-5" />
                                </div>
                                <input
                                  type="tel"
                                  required
                                  className="w-full pl-20 pr-4 py-4 bg-background/40 dark:bg-background/20 border border-border dark:border-border/50 hover:bg-background/60 dark:hover:bg-background/30 focus:bg-background dark:focus:bg-background/40 focus:border-secondary/50 focus:ring-4 focus:ring-secondary/10 text-foreground text-theme-label rounded-2xl outline-none transition-all duration-300 placeholder:text-muted/30 font-normal placeholder:font-normal"
                                  value={phone}
                                  onChange={(e) => setPhone(e.target.value)}
                                  placeholder="024-000-0000"
                                />
                              </div>
                            </div>

                            <div className="space-y-2">
                              <label className="block text-theme-body font-normal text-muted uppercase tracking-widest ml-1 mb-1">Email Address</label>
                              <div className="relative group/input">
                                <div className="absolute left-7 top-1/2 -translate-y-1/2 text-muted group-focus-within/input:text-primary transition-colors z-10">
                                  <Mail className="w-5 h-5" />
                                </div>
                                <input
                                  type="email"
                                  required
                                  className="w-full pl-20 pr-4 py-4 bg-background/40 dark:bg-background/20 border border-border dark:border-border/50 hover:bg-background/60 dark:hover:bg-background/30 focus:bg-background dark:focus:bg-background/40 focus:border-secondary/50 focus:ring-4 focus:ring-secondary/10 text-foreground text-theme-label rounded-2xl outline-none transition-all duration-300 placeholder:text-muted/30 font-normal placeholder:font-normal"
                                  value={email}
                                  onChange={(e) => setEmail(e.target.value)}
                                  placeholder="john@example.com"
                                />
                              </div>
                            </div>

                            <div className="space-y-2">
                              <label className="block text-theme-body font-normal text-muted uppercase tracking-widest ml-1 mb-1">Password</label>
                              <div className="relative group/input">
                                <div className="absolute left-7 top-1/2 -translate-y-1/2 text-muted group-focus-within/input:text-primary transition-colors z-10">
                                  <Lock className="w-5 h-5" />
                                </div>
                                <input
                                  type={showPassword ? "text" : "password"}
                                  required
                                  minLength={6}
                                  className="w-full pl-20 pr-12 py-4 bg-background/40 dark:bg-background/20 border border-border dark:border-border/50 hover:bg-background/60 dark:hover:bg-background/30 focus:bg-background dark:focus:bg-background/40 focus:border-secondary/50 focus:ring-4 focus:ring-secondary/10 text-foreground text-theme-label rounded-2xl outline-none transition-all duration-300 placeholder:text-muted/30 font-normal placeholder:font-normal"
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
                        </>
                    )}
                    
                    <div className="pt-4">
                      <Button className="w-full py-4.5 uppercase bg-primary dark:bg-primary hover:bg-primary dark:hover:bg-primary/90 text-primary-text shadow-xl shadow-slate-900/10 dark:shadow-none rounded-2xl transform transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] font-normal tracking-widest" disabled={loading} size="lg">
                        <span className="flex items-center justify-center gap-3">
                          {loading ? 'Processing...' : (isInternalAdmin ? 'Create Admin Account' : 'Get Started')}
                          {!loading && <ChevronRight className="w-4 h-4" />}
                        </span>
                      </Button>
                    </div>
                  </form>
                </>
              )}

              <div className="mt-8 text-center">
                <p className="text-theme-body text-muted font-normal">
                  Already have an account? <Link href={isInternalAdmin ? "/login?redirect=/admin/overview" : "/login"} className="text-secondary dark:text-warning hover:underline underline-offset-4 transition-colors text-theme-subtitle">Sign In</Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-background text-muted">Loading...</div>}>
      <SignupContent />
    </Suspense>
  );
}
