import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Loader2, ArrowRight, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { Logo } from '@/components/Logo';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { fadeUp, stagger } from '@/lib/motion';

const resetSchema = z.object({
  password: z
    .string()
    .min(8, 'At least 8 characters')
    .regex(/[A-Z]/, 'Include an uppercase letter')
    .regex(/[a-z]/, 'Include a lowercase letter')
    .regex(/[0-9]/, 'Include a number'),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type ResetFormData = z.infer<typeof resetSchema>;

const ResetPassword = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);
  const [done, setDone] = useState(false);

  const form = useForm<ResetFormData>({
    resolver: zodResolver(resetSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  useEffect(() => {
    // Supabase appends #access_token=...&type=recovery to the URL
    const hash = window.location.hash;
    if (hash.includes('type=recovery')) {
      setIsRecovery(true);
    }

    // Also listen for PASSWORD_RECOVERY event
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsRecovery(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleReset = async (data: ResetFormData) => {
    setIsLoading(true);
    const { error } = await supabase.auth.updateUser({ password: data.password });
    setIsLoading(false);

    if (error) {
      toast({ title: 'Reset failed', description: error.message, variant: 'destructive' });
    } else {
      setDone(true);
      toast({ title: 'Password updated', description: 'You can now sign in with your new password.' });
      setTimeout(() => navigate('/dashboard'), 2000);
    }
  };

  if (!isRecovery && !done) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background dot-grid p-4">
        <Logo size="lg" />
        <p className="mt-6 text-muted-foreground text-center max-w-sm">
          This page is for resetting your password. Please use the link from your email to access it.
        </p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/auth')}>
          Back to sign in
        </Button>
      </div>
    );
  }

  if (done) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background dot-grid p-4">
        <Logo size="lg" />
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="mt-8">
          <CheckCircle className="h-16 w-16 text-success mx-auto" />
        </motion.div>
        <p className="mt-4 text-lg font-bold">Password updated!</p>
        <p className="text-muted-foreground">Redirecting to dashboard…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background dot-grid">
      <header className="flex items-center justify-between px-4 sm:px-6 py-4 sm:py-5">
        <Logo size="lg" />
        <ThemeToggle />
      </header>

      <main className="flex-1 flex flex-col sm:items-center sm:justify-center px-4 sm:p-6">
        <motion.div variants={stagger} initial="hidden" animate="visible" className="w-full max-w-md mx-auto">
          <motion.div variants={fadeUp} className="text-center mb-6 sm:mb-10">
            <h1 className="text-display-md font-black tracking-tighter mb-2 sm:mb-3">
              New password
            </h1>
            <p className="text-muted-foreground text-base sm:text-lg">
              Pick something strong. You've got this.
            </p>
          </motion.div>

          <motion.div
            variants={fadeUp}
            className="relative rounded-none sm:rounded-sm border-t-[3px] border-t-primary border border-border/50 bg-card p-5 sm:p-8 shadow-lg -mx-4 sm:mx-0"
          >
            <form onSubmit={form.handleSubmit(handleReset)} className="space-y-4 sm:space-y-5">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">New password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    className="h-11 sm:h-12 bg-background/50 border-border/50 text-base pr-12"
                    {...form.register('password')}
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
                {form.formState.errors.password && (
                  <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium">Confirm password</Label>
                <Input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  className="h-11 sm:h-12 bg-background/50 border-border/50 text-base"
                  {...form.register('confirmPassword')}
                />
                {form.formState.errors.confirmPassword && (
                  <p className="text-xs text-destructive">{form.formState.errors.confirmPassword.message}</p>
                )}
              </div>

              <Button type="submit" className="w-full h-11 sm:h-12 text-base font-bold gap-2 uppercase tracking-wider" disabled={isLoading}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                Set new password
              </Button>
            </form>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
};

export default ResetPassword;
