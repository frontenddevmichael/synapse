import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Users, BookOpen, Trophy, LogOut, Settings, BarChart3, User, Zap, Flame, Bookmark } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Logo } from '@/components/Logo';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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

  const handleJoinRoom = async () => {
    if (!user || !joinCode.trim()) return;
    setIsSubmitting(true);
    const { data: room } = await supabase.from('rooms').select('*').eq('code', joinCode.trim().toUpperCase()).maybeSingle();
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

  const handleDeleteRoom = async (roomId: string) => {
    const { error } = await supabase.from('rooms').delete().eq('id', roomId);
    if (error) { toast({ title: 'Failed to delete room', description: error.message, variant: 'destructive' }); }
    else { toast({ title: 'Room deleted' }); fetchRooms(); }
  };

  const getModeClass = (mode: string) => {
    const styles: Record<string, string> = {
      study: 'mode-study',
      challenge: 'mode-challenge',
      exam: 'mode-exam',
    };
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
    <div className="min-h-screen flex flex-col bg-background noise-bg">
      {/* Ambient background */}
      <div className="fixed inset-0 -z-10 mesh-gradient" />

      {newAchievement && (
        <AchievementToast
          name={newAchievement.name} description={newAchievement.description}
          icon={newAchievement.icon} xpReward={newAchievement.xp_reward}
          onClose={clearNewAchievement}
        />
      )}

      {/* Header */}
      <header className="flex items-center justify-between px-4 sm:px-8 py-4 border-b border-border/30 bg-background/60 backdrop-blur-xl sticky top-0 z-40">
        <Logo />
        <div className="flex items-center gap-2 sm:gap-3">
          {stats && (
            <div className="hidden sm:flex items-center gap-3 mr-2">
              <XpProgress level={stats.level} currentXp={xpProgress.current} maxXp={xpProgress.max} percentage={xpProgress.percentage} compact />
              <StreakBadge days={stats.streak_days} />
            </div>
          )}
          <ThemeToggle />
          <Button variant="ghost" size="icon" onClick={() => navigate('/profile')} className="text-muted-foreground hover:text-foreground">
            <User className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => navigate('/preferences')} className="text-muted-foreground hover:text-foreground">
            <Settings className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleSignOut} className="text-muted-foreground hover:text-foreground">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 container max-w-6xl py-8 px-4 sm:px-8">
        <motion.div {...containerProps}>
          <motion.div {...itemProps} className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-black tracking-tighter mb-2">Your rooms</h1>
            <p className="text-muted-foreground text-lg">
              Create or join a room to start studying
            </p>
          </motion.div>

          <Tabs defaultValue="rooms" className="space-y-8">
            <motion.div {...itemProps}>
              <TabsList className="bg-muted/50 backdrop-blur-sm">
                <TabsTrigger value="rooms" className="gap-2 font-semibold">
                  <Users className="h-4 w-4" />
                  Rooms
                </TabsTrigger>
                <TabsTrigger value="analytics" className="gap-2 font-semibold">
                  <BarChart3 className="h-4 w-4" />
                  Progress
                </TabsTrigger>
              </TabsList>
            </motion.div>

            <TabsContent value="rooms" className="space-y-8">
              {/* Action cards */}
              <motion.div {...itemProps} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                  <DialogTrigger asChild>
                    <div className="bento-card cursor-pointer group">
                      <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-primary/10 group-hover:bg-primary/15 transition-colors">
                          <Plus className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg">Create room</h3>
                          <p className="text-sm text-muted-foreground">Start a new study group</p>
                        </div>
                      </div>
                    </div>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
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
                          <SelectTrigger className="h-11">
                            <SelectValue />
                          </SelectTrigger>
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
                    <div className="bento-card cursor-pointer group">
                      <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-muted group-hover:bg-muted/80 transition-colors">
                          <Users className="h-6 w-6 text-foreground" />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg">Join room</h3>
                          <p className="text-sm text-muted-foreground">Enter a 6-letter code</p>
                        </div>
                      </div>
                    </div>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle className="text-xl font-bold">Join room</DialogTitle>
                      <DialogDescription>Enter the room code from your group</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-5 pt-2">
                      <div className="space-y-2">
                        <Label htmlFor="joinCode">Room code</Label>
                        <Input id="joinCode" placeholder="ABC123" value={joinCode}
                          onChange={(e) => setJoinCode(e.target.value.toUpperCase())} maxLength={6}
                          className="text-center text-2xl tracking-[0.3em] font-mono h-14" />
                      </div>
                      <Button className="w-full h-11 font-semibold" onClick={handleJoinRoom} disabled={isSubmitting || joinCode.length !== 6}>
                        Join room
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </motion.div>

              {/* Room grid — Bento style */}
              <div>
                {isLoading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="bento-card animate-pulse h-36" />
                    ))}
                  </div>
                ) : rooms.length === 0 ? (
                  <motion.div {...itemProps} className="bento-card py-16 flex flex-col items-center text-center">
                    <Users className="h-12 w-12 text-muted-foreground/50 mb-4" />
                    <h3 className="font-bold text-lg mb-1">No rooms yet</h3>
                    <p className="text-muted-foreground">
                      Create a room or join one with a code
                    </p>
                  </motion.div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {rooms.map((room, index) => (
                      <motion.div
                        key={room.id}
                        {...itemProps}
                        transition={{ delay: index * 0.05 }}
                      >
                        <div
                          className="bento-card cursor-pointer group hover:shadow-lg relative"
                          onClick={() => navigate(`/room/${room.id}`)}
                        >
                          {/* Mode tint strip */}
                          <div className={`absolute top-0 left-0 right-0 h-1 rounded-t-xl ${
                            room.mode === 'study' ? 'bg-mode-study' :
                            room.mode === 'challenge' ? 'bg-mode-challenge' :
                            'bg-mode-exam'
                          }`} />

                          <div className="flex items-start justify-between gap-3 mt-2">
                            <div className="min-w-0 flex-1">
                              <h3 className="font-bold text-lg truncate group-hover:text-primary transition-colors">
                                {room.name}
                              </h3>
                              <p className="font-mono text-xs text-muted-foreground mt-1">{room.code}</p>
                            </div>
                            <Badge variant="outline" className={`${getModeClass(room.mode)} text-xs font-semibold gap-1`}>
                              {getModeIcon(room.mode)}
                              {room.mode}
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
