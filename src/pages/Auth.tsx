import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Loader2, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Logo } from '@/components/Logo';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { fadeUp, stagger } from '@/lib/motion';

const signUpSchema = z.object({
  username: z
    .string()
    .min(3, 'At least 3 characters')
    .max(20, 'At most 20 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Letters, numbers, and underscores only'),
  email: z.string().email('Enter a valid email'),
  password: z
    .string()
    .min(8, 'At least 8 characters')
    .regex(/[A-Z]/, 'Include an uppercase letter')
    .regex(/[a-z]/, 'Include a lowercase letter')
    .regex(/[0-9]/, 'Include a number'),
});

const signInSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password required'),
});

type SignUpFormData = z.infer<typeof signUpSchema>;
type SignInFormData = z.infer<typeof signInSchema>;

const Auth = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const { user, signUp, signIn, resetPassword } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      const pendingJoin = sessionStorage.getItem('joinAfterAuth');
      if (pendingJoin) {
        sessionStorage.removeItem('joinAfterAuth');
        navigate(`/join/${pendingJoin}`);
      } else {
        navigate('/dashboard');
      }
    }
  }, [user, navigate]);

  const signUpForm = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { username: '', email: '', password: '' },
  });

  const signInForm = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: '', password: '' },
  });

  const handleSignUp = async (data: SignUpFormData) => {
    setIsLoading(true);
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', data.username)
      .maybeSingle();
    if (existing) {
      setIsLoading(false);
      signUpForm.setError('username', { message: 'This username is already taken. Choose another.' });
      toast({ title: 'Username taken', description: 'Please choose a different username.', variant: 'destructive' });
      return;
    }
    const { error } = await signUp(data.email, data.password, data.username);
    setIsLoading(false);
    if (error) {
      const message = error.message.includes('already registered')
        ? 'This email is already registered.'
        : error.message;
      toast({ title: 'Sign up failed', description: message, variant: 'destructive' });
    } else {
      toast({ title: 'Check your email', description: 'We sent a confirmation link.' });
    }
  };

  const handleSignIn = async (data: SignInFormData) => {
    setIsLoading(true);
    const { error } = await signIn(data.email, data.password);
    setIsLoading(false);
    if (error) {
      const message = error.message.includes('Invalid login credentials')
        ? 'Invalid email or password.'
        : error.message.includes('Email not confirmed')
        ? 'Please confirm your email first.'
        : error.message;
      toast({ title: 'Sign in failed', description: message, variant: 'destructive' });
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) return;
    setIsLoading(true);
    const { error } = await resetPassword(forgotEmail.trim());
    setIsLoading(false);
    if (error) {
      toast({ title: 'Failed to send reset email', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Check your email', description: 'We sent a password reset link.' });
      setForgotMode(false);
    }
  };

  const handleGoogleSignIn = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/dashboard` },
    });
    if (error) {
      toast({ title: 'Google sign-in failed', description: error.message, variant: 'destructive' });
    }
  };

  const toggleMode = (signUp: boolean) => {
    setIsSignUp(signUp);
    setForgotMode(false);
    signUpForm.reset();
    signInForm.reset();
  };

  return (
    <div className="min-h-screen flex flex-col bg-background dot-grid">
      {/* Header */}
      <header className="flex items-center justify-between px-4 sm:px-6 py-4 sm:py-5">
        <Logo size="lg" />
        <ThemeToggle />
      </header>

      {/* Main */}
      <main className="flex-1 flex flex-col sm:items-center sm:justify-center px-4 sm:p-6">
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="visible"
          className="w-full max-w-md mx-auto"
        >
          {/* Statement heading */}
          <motion.div variants={fadeUp} className="text-center mb-6 sm:mb-10">
            <h1 className="text-display-md font-black tracking-tighter mb-2 sm:mb-3">
              {isSignUp ? "Let's get you in" : 'Back already?'}
            </h1>
            <p className="text-muted-foreground text-base sm:text-lg">
              {isSignUp
                ? 'Takes 30 seconds. No spam, no nonsense.'
                : 'Good. Your streak was getting worried.'}
            </p>
          </motion.div>

          {/* Form card — sharp top border */}
          <motion.div
            variants={fadeUp}
            className="relative rounded-none sm:rounded-sm border-t-[3px] border-t-primary border border-border/50 bg-card p-5 sm:p-8 shadow-lg -mx-4 sm:mx-0"
          >
            {isSignUp ? (
              <form onSubmit={signUpForm.handleSubmit(handleSignUp)} className="space-y-4 sm:space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-sm font-medium">Username</Label>
                  <Input
                    id="username"
                    placeholder="your_username"
                    autoComplete="username"
                    className="h-11 sm:h-12 bg-background/50 border-border/50 text-base"
                    {...signUpForm.register('username')}
                  />
                  {signUpForm.formState.errors.username && (
                    <p className="text-xs text-destructive">{signUpForm.formState.errors.username.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    autoComplete="email"
                    className="h-11 sm:h-12 bg-background/50 border-border/50 text-base"
                    {...signUpForm.register('email')}
                  />
                  {signUpForm.formState.errors.email && (
                    <p className="text-xs text-destructive">{signUpForm.formState.errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      autoComplete="new-password"
                      className="h-11 sm:h-12 bg-background/50 border-border/50 text-base pr-12"
                      {...signUpForm.register('password')}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1 h-9 w-9 sm:h-10 sm:w-10 text-muted-foreground hover:text-foreground min-h-[44px] min-w-[44px]"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  {signUpForm.formState.errors.password && (
                    <p className="text-xs text-destructive">{signUpForm.formState.errors.password.message}</p>
                  )}
                </div>

                <Button type="submit" className="w-full h-11 sm:h-12 text-base font-bold gap-2 uppercase tracking-wider" disabled={isLoading}>
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                  Create account
                </Button>
              </form>
            ) : (
              <form onSubmit={signInForm.handleSubmit(handleSignIn)} className="space-y-4 sm:space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    autoComplete="email"
                    className="h-11 sm:h-12 bg-background/50 border-border/50 text-base"
                    {...signInForm.register('email')}
                  />
                  {signInForm.formState.errors.email && (
                    <p className="text-xs text-destructive">{signInForm.formState.errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      autoComplete="current-password"
                      className="h-11 sm:h-12 bg-background/50 border-border/50 text-base pr-12"
                      {...signInForm.register('password')}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1 h-9 w-9 sm:h-10 sm:w-10 text-muted-foreground hover:text-foreground min-h-[44px] min-w-[44px]"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  {signInForm.formState.errors.password && (
                    <p className="text-xs text-destructive">{signInForm.formState.errors.password.message}</p>
                  )}
                </div>

                <Button type="submit" className="w-full h-11 sm:h-12 text-base font-bold gap-2 uppercase tracking-wider" disabled={isLoading}>
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                  Sign in
                </Button>
              </form>
            )}

            {/* Forgot password (sign-in only) */}
            {!isSignUp && !forgotMode && (
              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={() => setForgotMode(true)}
                  className="text-xs text-muted-foreground hover:text-primary transition-colors"
                >
                  Forgot password?
                </button>
              </div>
            )}

            {/* Forgot password form */}
            {forgotMode && (
              <form onSubmit={handleForgotPassword} className="mt-4 space-y-3 border-t border-border/30 pt-4">
                <p className="text-sm text-muted-foreground">Enter your email and we'll send a reset link.</p>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  className="h-11 bg-background/50 border-border/50 text-base"
                />
                <div className="flex gap-2">
                  <Button type="submit" size="sm" disabled={isLoading || !forgotEmail.trim()} className="font-semibold">
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send reset link'}
                  </Button>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setForgotMode(false)}>Cancel</Button>
                </div>
              </form>
            )}

            {/* Google OAuth */}
            <div className="mt-5 sm:mt-6">
              <div className="relative mb-4">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border/40" /></div>
                <div className="relative flex justify-center text-xs"><span className="bg-card px-2 text-muted-foreground">or</span></div>
              </div>
              <Button type="button" variant="outline" className="w-full h-11 gap-2 font-medium" onClick={handleGoogleSignIn}>
                <svg className="h-4 w-4" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                Continue with Google
              </Button>
            </div>

            <div className="mt-5 sm:mt-6 text-center text-sm pb-safe">
              {isSignUp ? (
                <p className="text-muted-foreground">
                  Already in?{' '}
                  <button type="button" onClick={() => toggleMode(false)} className="text-primary font-bold hover:underline underline-offset-4 transition-colors min-h-[44px] inline-flex items-center">
                    Sign in
                  </button>
                </p>
              ) : (
                <p className="text-muted-foreground">
                  First time?{' '}
                  <button type="button" onClick={() => toggleMode(true)} className="text-primary font-bold hover:underline underline-offset-4 transition-colors min-h-[44px] inline-flex items-center">
                    Create account
                  </button>
                </p>
              )}
            </div>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
};

export default Auth;
