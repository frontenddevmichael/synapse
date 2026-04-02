import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, Loader2, Trophy, Zap, Target } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useGamification } from '@/hooks/useGamification';
import { XpProgress } from '@/components/gamification/XpProgress';
import { StreakBadge } from '@/components/gamification/StreakBadge';
import { AchievementShowcase, TrophyCase } from '@/components/gamification/AchievementShowcase';
import { fadeUp, staggerFast } from '@/lib/motion';

const Profile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { stats, achievements, earnedAchievements, isLoading: gamLoading, getXpProgress } = useGamification();
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) { navigate('/auth'); return; }
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

  const xpProgress = getXpProgress();

  if (isLoading || gamLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background dot-grid">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background dot-grid pb-14 sm:pb-0">
      <PageHeader />

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
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={user?.email || ''} disabled className="h-11 bg-muted/30 text-muted-foreground" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Username</Label>
                    <Input value={username} onChange={(e) => setUsername(e.target.value)} className="h-11" />
                  </div>
                  <div className="space-y-2">
                    <Label>Display Name</Label>
                    <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Optional" className="h-11" />
                  </div>
                </div>
                <Button onClick={handleSave} disabled={isSaving || !username.trim()} className="gap-2 font-semibold w-full sm:w-auto">
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save
                </Button>
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
