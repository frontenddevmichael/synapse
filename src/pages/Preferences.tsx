import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, Loader2, Target, Snowflake, Bell, BellOff } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { fadeUp, stagger } from '@/lib/motion';

interface UserPreferences {
  default_difficulty: 'easy' | 'medium' | 'hard';
  default_time_limit: number | null;
  show_answers_after_quiz: boolean;
}

const Preferences = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [preferences, setPreferences] = useState<UserPreferences>({
    default_difficulty: 'medium', default_time_limit: null, show_answers_after_quiz: true,
  });
  const [dailyGoalEnabled, setDailyGoalEnabled] = useState(false);
  const [streakFreezeCount, setStreakFreezeCount] = useState(0);
  const [streakFreezeAvailable, setStreakFreezeAvailable] = useState(false);
  const [isUsingFreeze, setIsUsingFreeze] = useState(false);
  const { permission: pushPermission, subscribed: pushSubscribed, isLoading: pushLoading, subscribe: pushSubscribe, unsubscribe: pushUnsubscribe } = usePushNotifications();

  useEffect(() => {
    if (!user) return;
    fetchPreferences();
  }, [user]);

  const fetchPreferences = async () => {
    if (!user) return;
    const { data } = await supabase.from('user_preferences').select('*').eq('user_id', user.id).maybeSingle();
    if (data) {
      setPreferences({
        default_difficulty: (data.preferred_difficulty as any) || 'medium',
        default_time_limit: data.default_time_limit,
        show_answers_after_quiz: data.show_answers_immediately ?? true,
      });
    }

    const { data: profile } = await supabase.from('profiles').select('streak_freeze_count, streak_freeze_available, daily_goal_completed').eq('id', user.id).maybeSingle();
    if (profile) {
      setDailyGoalEnabled(profile.daily_goal_completed);
      setStreakFreezeCount(profile.streak_freeze_count);
      setStreakFreezeAvailable(profile.streak_freeze_available);
    }

    setIsLoading(false);
  };

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    const { error } = await supabase.from('user_preferences').upsert({
      user_id: user.id,
      preferred_difficulty: preferences.default_difficulty,
      default_time_limit: preferences.default_time_limit,
      show_answers_immediately: preferences.show_answers_after_quiz,
    }, { onConflict: 'user_id' });
    if (error) toast({ title: 'Failed to save', description: error.message, variant: 'destructive' });
    else toast({ title: 'Preferences saved!' });
    setIsSaving(false);
  };

  const handleUseStreakFreeze = async () => {
    if (!user || streakFreezeCount < 1) return;
    setIsUsingFreeze(true);
    const { error } = await supabase.rpc('use_streak_freeze', { _user_id: user.id });
    if (error) toast({ title: 'Failed to use freeze', description: error.message, variant: 'destructive' });
    else {
      setStreakFreezeCount(prev => prev - 1);
      toast({ title: 'Streak freeze applied!', description: 'Your streak is protected for today.' });
    }
    setIsUsingFreeze(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background dot-grid">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-background dot-grid pb-14 lg:pb-0">

      <main className="flex-1 container max-w-2xl py-6 sm:py-8 px-4 sm:px-8">
        <motion.div variants={stagger} initial="hidden" animate="visible">
          <motion.div variants={fadeUp} className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tighter mb-1 sm:mb-2">Preferences</h1>
            <p className="text-muted-foreground text-sm sm:text-lg">Customize your default quiz settings</p>
          </motion.div>

          <motion.div variants={fadeUp}>
            <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-lg sm:text-xl font-bold">Quiz Defaults</CardTitle>
                <CardDescription className="text-xs sm:text-sm">These settings apply to new quizzes you take</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 sm:space-y-8 p-4 sm:p-6 pt-0 sm:pt-0">
                <div className="p-3 sm:p-4 rounded-lg sm:rounded-xl bg-warning/5 border border-warning/20">
                  <p className="text-xs sm:text-sm text-warning font-medium">⚠️ Room rules override these defaults</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                    When a room's mode is set to Challenge or Exam, the room's timer and answer-reveal settings take priority over your preferences.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="font-semibold text-sm">Default Difficulty</Label>
                  <Select value={preferences.default_difficulty} onValueChange={(value: any) => setPreferences({ ...preferences, default_difficulty: value })}>
                    <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Easy</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">Preferred difficulty when generating new quizzes</p>
                </div>

                <div className="space-y-2">
                  <Label className="font-semibold text-sm">Default Time Limit</Label>
                  <Select value={preferences.default_time_limit?.toString() || 'none'} onValueChange={(value) => setPreferences({ ...preferences, default_time_limit: value === 'none' ? null : parseInt(value) })}>
                    <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No time limit</SelectItem>
                      <SelectItem value="5">5 minutes</SelectItem>
                      <SelectItem value="10">10 minutes</SelectItem>
                      <SelectItem value="15">15 minutes</SelectItem>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="60">60 minutes</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">Time limit preference for timed quizzes</p>
                </div>

                <div className="flex items-center justify-between p-3 sm:p-4 rounded-lg sm:rounded-xl bg-muted/30 border border-border/30 gap-4">
                  <div className="space-y-0.5 min-w-0">
                    <Label className="font-semibold text-sm">Show answers after quiz</Label>
                    <p className="text-xs text-muted-foreground">Display correct answers when you complete a quiz</p>
                  </div>
                  <Switch checked={preferences.show_answers_after_quiz} onCheckedChange={(checked) => setPreferences({ ...preferences, show_answers_after_quiz: checked })} />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Gamification Settings */}
          <motion.div variants={fadeUp} className="mt-6">
            <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-lg sm:text-xl font-bold">Gamification</CardTitle>
                <CardDescription className="text-xs sm:text-sm">Daily goals and streak protection</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6 pt-0 sm:pt-0">
                <div className="flex items-center justify-between p-3 sm:p-4 rounded-lg sm:rounded-xl bg-muted/30 border border-border/30 gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <Target className="h-5 w-5 text-primary shrink-0" />
                    <div className="space-y-0.5 min-w-0">
                      <Label className="font-semibold text-sm">Daily Goal</Label>
                      <p className="text-xs text-muted-foreground">Complete at least one quiz every day</p>
                    </div>
                  </div>
                  <Badge variant={dailyGoalEnabled ? "default" : "outline"} className="shrink-0 text-xs">
                    {dailyGoalEnabled ? "Today's goal met" : "Not yet today"}
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-3 sm:p-4 rounded-lg sm:rounded-xl bg-muted/30 border border-border/30 gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <Snowflake className="h-5 w-5 text-blue-400 shrink-0" />
                    <div className="space-y-0.5 min-w-0">
                      <Label className="font-semibold text-sm">Streak Freezes</Label>
                      <p className="text-xs text-muted-foreground">
                        {streakFreezeCount > 0 ? `${streakFreezeCount} freeze${streakFreezeCount !== 1 ? 's' : ''} available` : 'No freezes available'}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleUseStreakFreeze}
                    disabled={streakFreezeCount < 1 || isUsingFreeze}
                    className="shrink-0 gap-1.5 text-xs font-semibold"
                  >
                    {isUsingFreeze ? <Loader2 className="h-3 w-3 animate-spin" /> : <Snowflake className="h-3 w-3" />}
                    Use Freeze
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Notifications */}
          <motion.div variants={fadeUp} className="mt-6">
            <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-lg sm:text-xl font-bold">Notifications</CardTitle>
                <CardDescription className="text-xs sm:text-sm">Push notifications for quiz reminders and updates</CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
                <div className="flex items-center justify-between p-3 sm:p-4 rounded-lg sm:rounded-xl bg-muted/30 border border-border/30 gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    {pushSubscribed ? <Bell className="h-5 w-5 text-primary shrink-0" /> : <BellOff className="h-5 w-5 text-muted-foreground shrink-0" />}
                    <div className="space-y-0.5 min-w-0">
                      <Label className="font-semibold text-sm">Push Notifications</Label>
                      <p className="text-xs text-muted-foreground">
                        {pushSubscribed ? 'Notifications enabled' : pushPermission === 'denied' ? 'Permission denied — update browser settings' : 'Get notified about quiz reminders'}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant={pushSubscribed ? 'outline' : 'default'}
                    size="sm"
                    onClick={pushSubscribed ? pushUnsubscribe : pushSubscribe}
                    disabled={pushLoading || pushPermission === 'denied'}
                    className="shrink-0 gap-1.5 text-xs font-semibold"
                  >
                    {pushLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : pushSubscribed ? <BellOff className="h-3 w-3" /> : <Bell className="h-3 w-3" />}
                    {pushSubscribed ? 'Disable' : 'Enable'}
                  </Button>
                </div>
                {!import.meta.env.VITE_VAPID_PUBLIC_KEY && (
                  <p className="text-[11px] text-warning mt-2">Set VITE_VAPID_PUBLIC_KEY in your environment to enable push notifications.</p>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Sticky save on mobile */}
          <div className="sm:relative fixed bottom-14 sm:bottom-auto left-0 right-0 sm:left-auto sm:right-auto p-4 sm:p-0 bg-background/80 sm:bg-transparent backdrop-blur-sm sm:backdrop-blur-none border-t sm:border-0 border-border/30 z-30 sm:mt-6">
            <Button onClick={handleSave} disabled={isSaving} className="w-full h-11 sm:h-12 font-bold text-sm sm:text-base">
              {isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : <><Save className="mr-2 h-4 w-4" />Save Preferences</>}
            </Button>
          </div>

        </motion.div>
      </main>
    </div>
  );
};

export default Preferences;
