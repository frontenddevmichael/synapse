import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, Loader2, Trophy, LogOut, KeyRound, Link2, Unlink } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useGamification } from '@/hooks/useGamification';
import { XpProgress } from '@/components/gamification/XpProgress';
import { StreakBadge } from '@/components/gamification/StreakBadge';
import { AchievementShowcase, TrophyCase } from '@/components/gamification/AchievementShowcase';
import { fadeUp, staggerFast } from '@/lib/motion';

const Profile = () => {
  const { user, signOut, linkGoogle, unlinkIdentity, linkEmail } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { stats, achievements, earnedAchievements, isLoading: gamLoading, getXpProgress } = useGamification();

  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
      toast({ title: 'Signed out' });
      navigate('/');
    } finally {
      setIsSigningOut(false);
    }
  };

  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [passwordData, setPasswordData] = useState({ current: '', new: '', confirm: '' });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isLinkingGoogle, setIsLinkingGoogle] = useState(false);
  const [isUnlinking, setIsUnlinking] = useState<string | null>(null);
  const [linkEmailForm, setLinkEmailForm] = useState({ email: '', password: '' });
  const [isLinkingEmail, setIsLinkingEmail] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    const { data } = await supabase.from('profiles').select('username, display_name').eq('id', user.id).single();
    if (data) { setUsername(data.username); setDisplayName(data.display_name || ''); }
    setIsLoading(false);
  };

  const handleSave = async () => {
    if (!user || !username.trim()) return;
    setIsSaving(true);
    const { error } = await supabase.from('profiles').update({ username: username.trim(), display_name: displayName.trim() || null }).eq('id', user.id);
    if (error) toast({ title: 'Failed to update', description: error.message, variant: 'destructive' });
    else toast({ title: 'Profile updated' });
    setIsSaving(false);
  };

  const handleChangePassword = async () => {
    if (!user) return;
    if (passwordData.new.length < 8) { toast({ title: 'Password too short', description: 'Must be at least 8 characters.', variant: 'destructive' }); return; }
    if (passwordData.new !== passwordData.confirm) { toast({ title: 'Passwords do not match', variant: 'destructive' }); return; }
    setIsChangingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: passwordData.new });
    if (error) {
      toast({ title: 'Failed to change password', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Password changed' });
      setPasswordData({ current: '', new: '', confirm: '' });
    }
    setIsChangingPassword(false);
  };

  const handleLinkGoogle = async () => {
    setIsLinkingGoogle(true);
    const { error } = await linkGoogle();
    if (error) toast({ title: 'Failed to link Google', description: error.message, variant: 'destructive' });
    else toast({ title: 'Google account linked' });
    setIsLinkingGoogle(false);
  };

  const handleUnlinkIdentity = async (identityId: string) => {
    setIsUnlinking(identityId);
    const { error } = await unlinkIdentity(identityId);
    if (error) toast({ title: 'Failed to unlink', description: error.message, variant: 'destructive' });
    else toast({ title: 'Account unlinked' });
    setIsUnlinking(null);
  };

  const handleLinkEmail = async () => {
    if (!linkEmailForm.email.trim() || linkEmailForm.password.length < 8) {
      toast({ title: 'Invalid input', description: 'Valid email and password (8+ chars) required.', variant: 'destructive' });
      return;
    }
    setIsLinkingEmail(true);
    const { error } = await linkEmail(linkEmailForm.email, linkEmailForm.password);
    if (error) toast({ title: 'Failed to link email', description: error.message, variant: 'destructive' });
    else {
      toast({ title: 'Email/password account linked' });
      setLinkEmailForm({ email: '', password: '' });
    }
    setIsLinkingEmail(false);
  };

  const identities = user?.identities?.filter(id => id.provider !== 'email') || [];
  const hasEmailIdentity = user?.identities?.some(id => id.provider === 'email');

  const xpProgress = getXpProgress();

  if (isLoading || gamLoading) {
    return (
      <div className="flex-1 flex flex-col bg-background dot-grid pb-14 lg:pb-0">
        <main className="flex-1 container max-w-4xl py-6 sm:py-8 px-4 sm:px-8 space-y-6 sm:space-y-8">
          <Skeleton className="h-9 sm:h-10 w-28 mb-6 sm:mb-8" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
            <Skeleton className="h-24 sm:h-28 rounded-sm" />
            <Skeleton className="h-24 sm:h-28 rounded-sm" />
            <Skeleton className="h-24 sm:h-28 rounded-sm" />
            <Skeleton className="h-24 sm:h-28 rounded-sm" />
          </div>
          <Skeleton className="h-20 sm:h-24 rounded-sm mb-6 sm:mb-8" />
          <Skeleton className="h-64 sm:h-56 rounded-sm" />
        </main>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-background dot-grid pb-14 lg:pb-0">

      <main className="flex-1 container max-w-4xl py-6 sm:py-8 px-4 sm:px-8 space-y-6 sm:space-y-8">
        <motion.div variants={staggerFast} initial="hidden" animate="visible">
          <motion.h1 variants={fadeUp} className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tighter mb-6 sm:mb-8">Profile</motion.h1>

          {/* Hero stats row */}
          {stats && (
            <motion.div variants={fadeUp} className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
              <div className="bento-card text-center p-4 sm:p-6">
                <p className="text-2xl sm:text-4xl font-black">{stats.total_quizzes_completed}</p>
                <p className="text-xs sm:text-sm text-muted-foreground font-medium">Quizzes</p>
              </div>
              <div className="bento-card text-center p-4 sm:p-6">
                <p className="text-2xl sm:text-4xl font-black text-primary">{stats.xp}</p>
                <p className="text-xs sm:text-sm text-muted-foreground font-medium">Total XP</p>
              </div>
              <div className="bento-card text-center p-4 sm:p-6">
                <p className="text-2xl sm:text-4xl font-black text-success">{stats.total_correct_answers}</p>
                <p className="text-xs sm:text-sm text-muted-foreground font-medium">Correct</p>
              </div>
              <div className="bento-card flex flex-col items-center justify-center p-4 sm:p-6">
                <StreakBadge days={stats.streak_days} />
              </div>
            </motion.div>
          )}

          {/* XP Progress */}
          {stats && (
            <motion.div variants={fadeUp} className="bento-card mb-6 sm:mb-8">
              <XpProgress level={stats.level} currentXp={xpProgress.current} maxXp={xpProgress.max} percentage={xpProgress.percentage} />
            </motion.div>
          )}

          {/* Edit profile */}
          <motion.div variants={fadeUp}>
            <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-lg sm:text-xl font-bold">Account</CardTitle>
                <CardDescription className="text-xs sm:text-sm">Update your display name and username</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 p-4 sm:p-6 pt-0 sm:pt-0">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} className="h-11" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="display-name">Display Name</Label>
                    <Input id="display-name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Optional" className="h-11" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" value={user?.email ?? ''} readOnly disabled className="h-11" />
                </div>
                <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between pt-2">
                  <Button onClick={handleSave} disabled={isSaving || !username.trim()} className="gap-2 font-semibold w-full sm:w-auto">
                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Save
                  </Button>
                  <Button variant="outline" onClick={handleSignOut} disabled={isSigningOut} className="gap-2 font-semibold w-full sm:w-auto">
                    {isSigningOut ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
                    Sign out
                  </Button>
                </div>

                <div className="border-t border-border/30 my-4" />

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <KeyRound className="h-4 w-4 text-muted-foreground" />
                    <h4 className="font-semibold text-sm">Change Password</h4>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="current-password" className="text-xs">Current Password</Label>
                      <Input id="current-password" type="password" value={passwordData.current} onChange={(e) => setPasswordData({ ...passwordData, current: e.target.value })} className="h-11" placeholder="Leave blank if social login" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="new-password" className="text-xs">New Password</Label>
                      <Input id="new-password" type="password" value={passwordData.new} onChange={(e) => setPasswordData({ ...passwordData, new: e.target.value })} className="h-11" placeholder="Min 8 characters" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="confirm-password" className="text-xs">Confirm New</Label>
                      <Input id="confirm-password" type="password" value={passwordData.confirm} onChange={(e) => setPasswordData({ ...passwordData, confirm: e.target.value })} className="h-11" placeholder="Repeat new password" />
                    </div>
                  </div>
                  <Button onClick={handleChangePassword} disabled={isChangingPassword || !passwordData.new || !passwordData.confirm} variant="secondary" size="sm" className="gap-2 font-semibold">
                    {isChangingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
                    Update Password
                  </Button>
                </div>

                <div className="border-t border-border/30 my-4" />

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Link2 className="h-4 w-4 text-muted-foreground" />
                    <h4 className="font-semibold text-sm">Linked Accounts</h4>
                  </div>

                  {user?.identities?.map((identity) => (
                    <div key={identity.id} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30 border border-border/30">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary uppercase">
                          {identity.provider === 'google' ? 'G' : identity.provider === 'email' ? 'E' : identity.provider.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-medium capitalize">{identity.provider}</p>
                          <p className="text-[11px] text-muted-foreground">{identity.id.slice(0, 12)}...</p>
                        </div>
                      </div>
                      {identity.provider !== 'email' && user?.identities && user.identities.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => handleUnlinkIdentity(identity.id)}
                          disabled={isUnlinking === identity.id}
                        >
                          {isUnlinking === identity.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Unlink className="h-3.5 w-3.5" />}
                        </Button>
                      )}
                    </div>
                  ))}

                  {!user?.identities?.some(i => i.provider === 'google') && (
                    <Button variant="outline" size="sm" onClick={handleLinkGoogle} disabled={isLinkingGoogle} className="gap-2 w-full font-semibold">
                      {isLinkingGoogle ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
                      Link Google Account
                    </Button>
                  )}

                  {!hasEmailIdentity && (
                    <div className="space-y-2 pt-1">
                      <p className="text-xs text-muted-foreground">Set up email/password login:</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <Input type="email" value={linkEmailForm.email} onChange={(e) => setLinkEmailForm(f => ({ ...f, email: e.target.value }))} placeholder="Email" className="h-9 text-sm" />
                        <Input type="password" value={linkEmailForm.password} onChange={(e) => setLinkEmailForm(f => ({ ...f, password: e.target.value }))} placeholder="Password (8+ chars)" className="h-9 text-sm" />
                      </div>
                      <Button variant="outline" size="sm" onClick={handleLinkEmail} disabled={isLinkingEmail || !linkEmailForm.email || linkEmailForm.password.length < 8} className="gap-2 font-semibold">
                        {isLinkingEmail ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
                        Link Email/Password
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Trophy Cabinet */}
          <motion.div variants={fadeUp}>
            <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
              <CardHeader className="p-4 sm:p-6">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-gold/10 flex items-center justify-center">
                    <Trophy className="h-4 w-4 sm:h-5 sm:w-5 text-gold" />
                  </div>
                  <div>
                    <CardTitle className="text-lg sm:text-xl font-bold">Trophy Cabinet</CardTitle>
                    <CardDescription className="text-xs sm:text-sm">{earnedAchievements.size} of {achievements.length} unlocked</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
                <TrophyCase achievements={achievements} userAchievements={Array.from(earnedAchievements)} />
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
};

export default Profile;
