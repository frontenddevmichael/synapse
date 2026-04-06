import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, ArrowRight, KeyRound } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { Logo } from '@/components/Logo';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { fadeUp } from '@/lib/motion';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check for recovery token in URL hash
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    if (hashParams.get('type') === 'recovery') {
      setIsRecovery(true);
    }

    // Also listen for auth state changes (Supabase handles the token exchange)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsRecovery(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleResetPassword = async () => {
    if (password !== confirmPassword) {
      toast({ title: 'Passwords don\'t match', variant: 'destructive' });
      return;
    }
    if (password.length < 8) {
      toast({ title: 'Password too short', description: 'At least 8 characters required.', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setIsLoading(false);

    if (error) {
      toast({ title: 'Failed to reset password', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Password updated!', description: 'You can now sign in with your new password.' });
      navigate('/dashboard');
    }
  };

  if (!isRecovery) {
    return (
      <div className="min-h-screen flex flex-col bg-background dot-grid">
        <header className="flex items-center justify-between px-4 sm:px-6 py-4 sm:py-5">
          <Logo size="lg" />
          <ThemeToggle />
        </header>
        <main className="flex-1 flex flex-col items-center justify-center px-4">
          <motion.div variants={fadeUp} initial="hidden" animate="visible" className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Verifying reset link...</p>
          </motion.div>
        </main>
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
        <motion.div variants={fadeUp} initial="hidden" animate="visible" className="w-full max-w-md mx-auto">
          <div className="text-center mb-6 sm:mb-10">
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
              <KeyRound className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-display-md font-black tracking-tighter mb-2">Set new password</h1>
            <p className="text-muted-foreground text-base sm:text-lg">Choose a strong password for your account</p>
          </div>

          <div className="relative rounded-none sm:rounded-sm border-t-[3px] border-t-primary border border-border/50 bg-card p-5 sm:p-8 shadow-lg -mx-4 sm:mx-0 space-y-4 sm:space-y-5">
            <div className="space-y-2">
              <Label htmlFor="password">New password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11 sm:h-12 bg-background/50 border-border/50 text-base"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="h-11 sm:h-12 bg-background/50 border-border/50 text-base"
              />
            </div>
            <Button
              onClick={handleResetPassword}
              className="w-full h-11 sm:h-12 text-base font-bold gap-2 uppercase tracking-wider"
              disabled={isLoading || !password || !confirmPassword}
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
              Update password
            </Button>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default ResetPassword;
