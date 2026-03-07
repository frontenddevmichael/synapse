import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Logo } from '@/components/Logo';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useGamification } from '@/hooks/useGamification';
import { XpProgress } from '@/components/gamification/XpProgress';
import { StreakBadge } from '@/components/gamification/StreakBadge';
import { AchievementShowcase } from '@/components/gamification/AchievementShowcase';

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
    const { data } = await supabase
      .from('profiles')
      .select('username, display_name')
      .eq('id', user.id)
      .single();
    if (data) {
      setUsername(data.username);
      setDisplayName(data.display_name || '');
    }
    setIsLoading(false);
  };

  const handleSave = async () => {
    if (!user || !username.trim()) return;
    setIsSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({ username: username.trim(), display_name: displayName.trim() || null })
      .eq('id', user.id);

    if (error) {
      toast({ title: 'Failed to update profile', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Profile updated' });
    }
    setIsSaving(false);
  };

  const xpProgress = getXpProgress();

  if (isLoading || gamLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Logo />
        </div>
        <ThemeToggle />
      </header>

      <main className="flex-1 container max-w-2xl py-8 space-y-6">
        <h1 className="text-2xl font-semibold">Profile</h1>

        {/* Edit profile */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Account</CardTitle>
            <CardDescription>Update your display name and username</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Username</Label>
              <Input value={username} onChange={(e) => setUsername(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Display Name</Label>
              <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Optional" />
            </div>
            <Button onClick={handleSave} disabled={isSaving || !username.trim()} className="gap-2">
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save
            </Button>
          </CardContent>
        </Card>

        {/* Stats overview */}
        {stats && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <XpProgress
                level={stats.level}
                currentXp={xpProgress.current}
                maxXp={xpProgress.max}
                percentage={xpProgress.percentage}
              />
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
                <div className="text-center">
                  <p className="text-2xl font-bold">{stats.total_quizzes_completed}</p>
                  <p className="text-xs text-muted-foreground">Quizzes</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{stats.total_correct_answers}</p>
                  <p className="text-xs text-muted-foreground">Correct</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{stats.xp}</p>
                  <p className="text-xs text-muted-foreground">Total XP</p>
                </div>
                <div className="text-center">
                  <StreakBadge days={stats.streak_days} />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Achievements */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Achievements</CardTitle>
            <CardDescription>{earnedAchievements.size} of {achievements.length} unlocked</CardDescription>
          </CardHeader>
          <CardContent>
            <AchievementShowcase
              achievements={achievements}
              userAchievements={Array.from(earnedAchievements)}
              maxDisplay={20}
            />
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Profile;
