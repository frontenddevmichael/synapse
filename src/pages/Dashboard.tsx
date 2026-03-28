import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Users, BookOpen, Trophy, LogOut, Settings, BarChart3, User, Zap, Flame, Bookmark } from 'lucide-react';
import { EmptyDeskIllustration } from '@/components/illustrations/EmptyDeskIllustration';
import { OnboardingCard } from '@/components/dashboard/OnboardingCard';
import { motion, useReducedMotion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Logo } from '@/components/Logo';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';

import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { useGamification } from '@/hooks/useGamification';
import { XpProgress } from '@/components/gamification/XpProgress';
import { StreakBadge } from '@/components/gamification/StreakBadge';
import { AnalyticsDashboard } from '@/components/analytics/AnalyticsDashboard';
import { AchievementToast } from '@/components/gamification/AchievementToast';
import { Progress } from '@/components/ui/progress';
import { fadeUp, staggerFast } from '@/lib/motion';

interface Room {
  id: string;
  name: string;
  code: string;
  mode: 'study' | 'challenge' | 'exam';
  owner_id: string;
  created_at: string;
}

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { stats, newAchievement, clearNewAchievement, getXpProgress } = useGamification();
  const prefersReducedMotion = useReducedMotion();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isJoinOpen, setIsJoinOpen] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomMode, setNewRoomMode] = useState<'study' | 'challenge' | 'exam'>('study');
  const [joinCode, setJoinCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const xpProgress = getXpProgress();

  useEffect(() => {
    if (!user) { navigate('/auth'); return; }
    fetchRooms();
  }, [user, navigate]);

  const fetchRooms = async () => {
    if (!user) return;
    setIsLoading(true);
    const { data: memberRooms } = await supabase.from('room_members').select('room_id').eq('user_id', user.id);
    const roomIds = memberRooms?.map(m => m.room_id) || [];
    const { data: ownedRooms } = await supabase.from('rooms').select('*').eq('owner_id', user.id);
    let joinedRooms: Room[] = [];
    if (roomIds.length > 0) {
      const { data } = await supabase.from('rooms').select('*').in('id', roomIds);
      if (data) joinedRooms = data as Room[];
    }
    const allRooms = [...(ownedRooms || []), ...joinedRooms];
    const uniqueRooms = allRooms.filter((room, index, self) => index === self.findIndex(r => r.id === room.id));
    setRooms(uniqueRooms as Room[]);
    setIsLoading(false);
  };

  const generateRoomCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  };

  const handleCreateRoom = async () => {
    if (!user || !newRoomName.trim()) return;
    setIsSubmitting(true);
    const code = generateRoomCode();
    const { data: room, error: roomError } = await supabase
      .from('rooms').insert({ name: newRoomName.trim(), code, mode: newRoomMode, owner_id: user.id }).select().single();
    if (roomError) {
      toast({ title: 'Could not create room', description: roomError.message, variant: 'destructive' });
      setIsSubmitting(false);
      return;
    }
    await supabase.from('room_members').insert({ room_id: room.id, user_id: user.id, role: 'owner' });
    toast({ title: 'Room created', description: `Code: ${code}` });
    setNewRoomName(''); setNewRoomMode('study'); setIsCreateOpen(false); setIsSubmitting(false);
    fetchRooms();
  };

  const handleJoinRoom = async (codeOverride?: string) => {
    const code = codeOverride || joinCode.trim().toUpperCase();
    if (!user || !code) return;
    setIsSubmitting(true);
    const { data: room } = await supabase.from('rooms').select('*').eq('code', code).maybeSingle();
    if (!room) {
      toast({ title: 'Room not found', description: 'Check the code and try again.', variant: 'destructive' });
      setIsSubmitting(false);
      return;
    }
    const { data: existingMember } = await supabase.from('room_members').select('id').eq('room_id', room.id).eq('user_id', user.id).maybeSingle();
    if (existingMember) {
      toast({ title: 'Already a member' });
      setIsSubmitting(false); setIsJoinOpen(false);
      return;
    }
    await supabase.from('room_members').insert({ room_id: room.id, user_id: user.id, role: 'member' });
    toast({ title: 'Joined room', description: room.name });
    setJoinCode(''); setIsJoinOpen(false); setIsSubmitting(false);
    fetchRooms();
  };

  const handleSignOut = async () => { await signOut(); navigate('/auth'); };

  const getModeClass = (mode: string) => {
    const styles: Record<string, string> = { study: 'mode-study', challenge: 'mode-challenge', exam: 'mode-exam' };
    return styles[mode] || '';
  };

  const getModeIcon = (mode: string) => {
    switch (mode) {
      case 'study': return <BookOpen className="h-3.5 w-3.5" />;
      case 'challenge': return <Trophy className="h-3.5 w-3.5" />;
      case 'exam': return <Settings className="h-3.5 w-3.5" />;
      default: return null;
    }
  };

  const containerProps = prefersReducedMotion ? {} : { variants: staggerFast, initial: 'hidden', animate: 'visible' };
  const itemProps = prefersReducedMotion ? {} : { variants: fadeUp };

  return (
    <div className="min-h-screen flex flex-col bg-background dot-grid pb-14 sm:pb-0">

      {newAchievement && (
        <AchievementToast
          name={newAchievement.name} description={newAchievement.description}
          icon={newAchievement.icon} xpReward={newAchievement.xp_reward}
          onClose={clearNewAchievement}
        />
      )}

      {/* Header — simplified on mobile (nav icons moved to bottom nav) */}
      <header className="flex items-center justify-between px-4 sm:px-8 py-3 sm:py-4 border-b border-border/40 bg-background/80 backdrop-blur-md sticky top-0 z-40">
        <Logo />
        <div className="flex items-center gap-2 sm:gap-3">
          {stats && (
            <div className="hidden sm:flex items-center gap-3 mr-2">
              <XpProgress level={stats.level} currentXp={xpProgress.current} maxXp={xpProgress.max} percentage={xpProgress.percentage} compact />
              <StreakBadge days={stats.streak_days} />
            </div>
          )}
          <ThemeToggle />
          {/* Desktop-only nav icons */}
          <Button variant="ghost" size="icon" onClick={() => navigate('/profile')} className="hidden sm:inline-flex text-muted-foreground hover:text-foreground">
            <User className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => navigate('/bookmarks')} className="hidden sm:inline-flex text-muted-foreground hover:text-foreground" title="Study Deck">
            <Bookmark className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => navigate('/preferences')} className="hidden sm:inline-flex text-muted-foreground hover:text-foreground">
            <Settings className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleSignOut} className="hidden sm:inline-flex text-muted-foreground hover:text-foreground">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Mobile XP/Streak strip */}
      {stats && (
        <div className="sm:hidden flex items-center gap-3 px-4 py-2.5 border-b border-border/20 bg-background/40 backdrop-blur-sm">
          <Badge variant="outline" className="text-xs font-bold gap-1 shrink-0">
            <Zap className="h-3 w-3 text-primary" />
            Lv {stats.level}
          </Badge>
          <div className="flex-1 min-w-0">
            <Progress value={xpProgress.percentage} className="h-1.5" />
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
            <Flame className="h-3.5 w-3.5 text-warning" />
            {stats.streak_days}
          </div>
          <Button variant="ghost" size="icon" onClick={handleSignOut} className="h-8 w-8 text-muted-foreground shrink-0">
            <LogOut className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}

      {/* Main */}
      <main className="flex-1 container max-w-6xl py-6 sm:py-8 px-4 sm:px-8">
        <motion.div {...containerProps}>
          <motion.div {...itemProps} className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tighter mb-1 sm:mb-2 uppercase">Home base</h1>
            <p className="text-muted-foreground text-sm sm:text-lg">
              Create or join a room to start studying
            </p>
          </motion.div>

          <Tabs defaultValue="rooms" className="space-y-6 sm:space-y-8">
            <motion.div {...itemProps}>
              <TabsList className="bg-muted/50 backdrop-blur-sm w-full sm:w-auto">
                <TabsTrigger value="rooms" className="gap-2 font-semibold flex-1 sm:flex-none min-h-[44px]">
                  <Users className="h-4 w-4" />
                  Rooms
                </TabsTrigger>
                <TabsTrigger value="analytics" className="gap-2 font-semibold flex-1 sm:flex-none min-h-[44px]">
                  <BarChart3 className="h-4 w-4" />
                  Progress
                </TabsTrigger>
              </TabsList>
            </motion.div>

            <TabsContent value="rooms" className="space-y-6 sm:space-y-8">
              {/* Action cards — pill buttons on mobile, bento cards on desktop */}
              <motion.div {...itemProps} className="grid grid-cols-2 sm:grid-cols-2 gap-3 sm:gap-4">
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                  <DialogTrigger asChild>
                    {/* Mobile: compact pill, Desktop: bento card */}
                    <div className="bento-card cursor-pointer group sm:p-6 p-4">
                      <div className="flex items-center gap-3 sm:gap-4">
                        <div className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-primary/10 group-hover:bg-primary/15 transition-colors">
                          <Plus className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-bold text-sm sm:text-lg">Create room</h3>
                          <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">Start a new study group</p>
                        </div>
                      </div>
                    </div>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md mx-4 sm:mx-auto">
                    <DialogHeader>
                      <DialogTitle className="text-xl font-bold">Create room</DialogTitle>
                      <DialogDescription>Set up a space for your study group</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-5 pt-2">
                      <div className="space-y-2">
                        <Label htmlFor="roomName">Name</Label>
                        <Input id="roomName" placeholder="e.g., Biology 101" value={newRoomName} onChange={(e) => setNewRoomName(e.target.value)} className="h-11" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="roomMode">Mode</Label>
                        <Select value={newRoomMode} onValueChange={(v) => setNewRoomMode(v as any)}>
                          <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="study">
                              <div className="flex items-center gap-2">
                                <BookOpen className="h-4 w-4 text-mode-study" />
                                Study — answers shown immediately
                              </div>
                            </SelectItem>
                            <SelectItem value="challenge">
                              <div className="flex items-center gap-2">
                                <Trophy className="h-4 w-4 text-mode-challenge" />
                                Challenge — timed, with leaderboard
                              </div>
                            </SelectItem>
                            <SelectItem value="exam">
                              <div className="flex items-center gap-2">
                                <Settings className="h-4 w-4 text-mode-exam" />
                                Exam — one attempt, hidden answers
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button className="w-full h-11 font-semibold" onClick={handleCreateRoom} disabled={isSubmitting || !newRoomName.trim()}>
                        Create room
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                <Dialog open={isJoinOpen} onOpenChange={setIsJoinOpen}>
                  <DialogTrigger asChild>
                    <div className="bento-card cursor-pointer group sm:p-6 p-4">
                      <div className="flex items-center gap-3 sm:gap-4">
                        <div className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-muted group-hover:bg-muted/80 transition-colors">
                          <Users className="h-5 w-5 sm:h-6 sm:w-6 text-foreground" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-bold text-sm sm:text-lg">Join room</h3>
                          <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">Enter a 6-letter code</p>
                        </div>
                      </div>
                    </div>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md mx-4 sm:mx-auto">
                    <DialogHeader>
                      <DialogTitle className="text-xl font-bold">Join room</DialogTitle>
                      <DialogDescription>Enter the room code from your group</DialogDescription>
                    </DialogHeader>
                     <div className="space-y-5 pt-2">
                      <div className="space-y-2">
                        <Label htmlFor="joinCode">Room code</Label>
                        <Input id="joinCode" placeholder="ABC123" value={joinCode}
                          onChange={(e) => {
                            const val = e.target.value.toUpperCase();
                            setJoinCode(val);
                            // Auto-submit on 6 valid characters
                            if (val.length === 6 && !isSubmitting) {
                              handleJoinRoom(val);
                            }
                          }} maxLength={6}
                          className="text-center text-2xl tracking-[0.3em] font-mono h-14" />
                      </div>
                      <Button className="w-full h-11 font-semibold" onClick={() => handleJoinRoom()} disabled={isSubmitting || joinCode.length !== 6}>
                        Join room
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </motion.div>

              {/* Room list — list on mobile, grid on desktop */}
              <div>
                {isLoading ? (
                  <div className="space-y-3 sm:grid sm:grid-cols-2 lg:grid-cols-3 sm:gap-4 sm:space-y-0">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="bento-card animate-pulse h-20 sm:h-36" />
                    ))}
                  </div>
                ) : rooms.length === 0 ? (
                  <div className="space-y-4">
                    {/* Show onboarding for brand new users */}
                    {stats && stats.total_quizzes_completed === 0 && (
                      <OnboardingCard onCreateRoom={() => setIsCreateOpen(true)} />
                    )}
                    <motion.div {...itemProps} className="bento-card py-12 sm:py-16 flex flex-col items-center text-center">
                      <EmptyDeskIllustration className="w-48 h-36 mb-3 sm:mb-4" />
                      <h3 className="font-bold text-base sm:text-lg mb-1">Nothing here yet</h3>
                      <p className="text-sm text-muted-foreground">
                        Create a room or paste a code to join one
                      </p>
                    </motion.div>
                  </div>
                ) : (
                  <div className="space-y-2 sm:space-y-0 sm:grid sm:grid-cols-2 lg:grid-cols-3 sm:gap-4">
                    {rooms.map((room, index) => (
                      <motion.div
                        key={room.id}
                        {...itemProps}
                        transition={{ delay: index * 0.05 }}
                      >
                        {/* Mobile: list row, Desktop: bento card */}
                        <div
                          className="bento-card cursor-pointer group hover:shadow-lg relative p-3 sm:p-6"
                          onClick={() => navigate(`/room/${room.id}`)}
                        >
                          {/* Mode tint strip */}
                          <div className={`absolute top-0 left-0 sm:right-0 ${
                            /* Mobile: left edge strip, Desktop: top strip */
                            'sm:h-1 sm:rounded-t-xl h-full w-1 rounded-l-xl sm:w-auto'
                          } ${
                            room.mode === 'study' ? 'bg-mode-study' :
                            room.mode === 'challenge' ? 'bg-mode-challenge' :
                            'bg-mode-exam'
                          }`} />

                          <div className="flex items-center justify-between gap-3 sm:items-start sm:flex-col sm:gap-0 pl-2 sm:pl-0 sm:mt-2">
                            <div className="min-w-0 flex-1 sm:w-full">
                              <h3 className="font-bold text-sm sm:text-lg truncate group-hover:text-primary transition-colors">
                                {room.name}
                              </h3>
                              <p className="font-mono text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1">{room.code}</p>
                            </div>
                            <Badge variant="outline" className={`${getModeClass(room.mode)} text-[10px] sm:text-xs font-semibold gap-1 shrink-0 sm:mt-2`}>
                              {getModeIcon(room.mode)}
                              <span className="hidden sm:inline">{room.mode}</span>
                            </Badge>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="analytics">
              <AnalyticsDashboard />
            </TabsContent>
          </Tabs>
        </motion.div>
      </main>
    </div>
  );
};

export default Dashboard;
