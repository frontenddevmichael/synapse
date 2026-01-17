import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Users, BookOpen, Trophy, LogOut, Settings, BarChart3 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Logo } from '@/components/Logo';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { useGamification } from '@/hooks/useGamification';
import { XpProgress } from '@/components/gamification/XpProgress';
import { StreakBadge } from '@/components/gamification/StreakBadge';
import { AnalyticsDashboard } from '@/components/analytics/AnalyticsDashboard';
import { AchievementToast } from '@/components/gamification/AchievementToast';

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
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchRooms();
  }, [user, navigate]);

  const fetchRooms = async () => {
    if (!user) return;
    setIsLoading(true);
    
    const { data: memberRooms } = await supabase
      .from('room_members')
      .select('room_id')
      .eq('user_id', user.id);

    const roomIds = memberRooms?.map(m => m.room_id) || [];

    const { data: ownedRooms } = await supabase
      .from('rooms')
      .select('*')
      .eq('owner_id', user.id);

    let joinedRooms: Room[] = [];
    if (roomIds.length > 0) {
      const { data } = await supabase
        .from('rooms')
        .select('*')
        .in('id', roomIds);
      if (data) joinedRooms = data as Room[];
    }

    const allRooms = [...(ownedRooms || []), ...joinedRooms];
    const uniqueRooms = allRooms.filter((room, index, self) => 
      index === self.findIndex(r => r.id === room.id)
    );

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
      .from('rooms')
      .insert({ name: newRoomName.trim(), code, mode: newRoomMode, owner_id: user.id })
      .select()
      .single();

    if (roomError) {
      toast({ title: 'Could not create room', description: roomError.message, variant: 'destructive' });
      setIsSubmitting(false);
      return;
    }

    await supabase.from('room_members').insert({ room_id: room.id, user_id: user.id, role: 'owner' });
    toast({ title: 'Room created', description: `Code: ${code}` });
    setNewRoomName('');
    setNewRoomMode('study');
    setIsCreateOpen(false);
    setIsSubmitting(false);
    fetchRooms();
  };

  const handleJoinRoom = async () => {
    if (!user || !joinCode.trim()) return;
    setIsSubmitting(true);

    const { data: room } = await supabase
      .from('rooms')
      .select('*')
      .eq('code', joinCode.trim().toUpperCase())
      .maybeSingle();

    if (!room) {
      toast({ title: 'Room not found', description: 'Check the code and try again.', variant: 'destructive' });
      setIsSubmitting(false);
      return;
    }

    const { data: existingMember } = await supabase
      .from('room_members')
      .select('id')
      .eq('room_id', room.id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (existingMember) {
      toast({ title: 'Already a member', description: 'You\'re in this room already.' });
      setIsSubmitting(false);
      setIsJoinOpen(false);
      return;
    }

    await supabase.from('room_members').insert({ room_id: room.id, user_id: user.id, role: 'member' });
    toast({ title: 'Joined room', description: room.name });
    setJoinCode('');
    setIsJoinOpen(false);
    setIsSubmitting(false);
    fetchRooms();
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const getModeStyles = (mode: string) => {
    const styles: Record<string, string> = {
      study: 'bg-success/10 text-success border-success/20',
      challenge: 'bg-warning/10 text-warning border-warning/20',
      exam: 'bg-destructive/10 text-destructive border-destructive/20',
    };
    return styles[mode] || 'bg-muted text-muted-foreground';
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {newAchievement && (
        <AchievementToast
          name={newAchievement.name}
          description={newAchievement.description}
          icon={newAchievement.icon}
          xpReward={newAchievement.xp_reward}
          onClose={clearNewAchievement}
        />
      )}

      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-border">
        <Logo />
        <div className="flex items-center gap-3">
          {stats && (
            <XpProgress
              level={stats.level}
              currentXp={xpProgress.current}
              maxXp={xpProgress.max}
              percentage={xpProgress.percentage}
              compact
            />
          )}
          {stats && <StreakBadge days={stats.streak_days} />}
          <ThemeToggle />
          <Button variant="ghost" size="icon" onClick={() => navigate('/preferences')}>
            <Settings className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleSignOut}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 container max-w-5xl py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold mb-1">Your rooms</h1>
          <p className="text-muted-foreground">
            Create or join a room to start studying
          </p>
        </div>

        <Tabs defaultValue="rooms" className="space-y-6">
          <TabsList>
            <TabsTrigger value="rooms" className="gap-2">
              <Users className="h-4 w-4" />
              Rooms
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Progress
            </TabsTrigger>
          </TabsList>

          <TabsContent value="rooms" className="space-y-6">
            {/* Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogTrigger asChild>
                  <Card className="cursor-pointer card-interactive">
                    <CardContent className="flex items-center gap-4 p-5">
                      <div className="p-2.5 rounded-lg bg-primary/10">
                        <Plus className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium">Create room</h3>
                        <p className="text-sm text-muted-foreground">Start a new study group</p>
                      </div>
                    </CardContent>
                  </Card>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create room</DialogTitle>
                    <DialogDescription>Set up a space for your study group</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 pt-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="roomName">Name</Label>
                      <Input
                        id="roomName"
                        placeholder="e.g., Biology 101"
                        value={newRoomName}
                        onChange={(e) => setNewRoomName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="roomMode">Mode</Label>
                      <Select value={newRoomMode} onValueChange={(v) => setNewRoomMode(v as 'study' | 'challenge' | 'exam')}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="study">
                            <div className="flex items-center gap-2">
                              <BookOpen className="h-4 w-4" />
                              Study — answers shown immediately
                            </div>
                          </SelectItem>
                          <SelectItem value="challenge">
                            <div className="flex items-center gap-2">
                              <Trophy className="h-4 w-4" />
                              Challenge — timed, with leaderboard
                            </div>
                          </SelectItem>
                          <SelectItem value="exam">
                            <div className="flex items-center gap-2">
                              <Settings className="h-4 w-4" />
                              Exam — one attempt, hidden answers
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button className="w-full" onClick={handleCreateRoom} disabled={isSubmitting || !newRoomName.trim()}>
                      Create room
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={isJoinOpen} onOpenChange={setIsJoinOpen}>
                <DialogTrigger asChild>
                  <Card className="cursor-pointer card-interactive">
                    <CardContent className="flex items-center gap-4 p-5">
                      <div className="p-2.5 rounded-lg bg-accent/10">
                        <Users className="h-5 w-5 text-accent" />
                      </div>
                      <div>
                        <h3 className="font-medium">Join room</h3>
                        <p className="text-sm text-muted-foreground">Enter a 6-letter code</p>
                      </div>
                    </CardContent>
                  </Card>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Join room</DialogTitle>
                    <DialogDescription>Enter the room code from your group</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 pt-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="joinCode">Room code</Label>
                      <Input
                        id="joinCode"
                        placeholder="ABC123"
                        value={joinCode}
                        onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                        maxLength={6}
                        className="text-center text-xl tracking-widest font-mono"
                      />
                    </div>
                    <Button className="w-full" onClick={handleJoinRoom} disabled={isSubmitting || joinCode.length !== 6}>
                      Join room
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Room list */}
            <div>
              {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1, 2, 3].map((i) => (
                    <Card key={i} className="animate-pulse">
                      <CardHeader>
                        <div className="h-5 bg-muted rounded w-3/4 mb-2"></div>
                        <div className="h-4 bg-muted rounded w-1/2"></div>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              ) : rooms.length === 0 ? (
                <Card className="py-12">
                  <CardContent className="flex flex-col items-center text-center">
                    <Users className="h-10 w-10 text-muted-foreground mb-4" />
                    <h3 className="font-medium mb-1">No rooms yet</h3>
                    <p className="text-sm text-muted-foreground">
                      Create a room or join one with a code
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {rooms.map((room) => (
                    <Card 
                      key={room.id} 
                      className="cursor-pointer card-interactive"
                      onClick={() => navigate(`/room/${room.id}`)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-2">
                          <CardTitle className="text-base font-medium">{room.name}</CardTitle>
                          <Badge variant="outline" className={getModeStyles(room.mode)}>
                            {room.mode}
                          </Badge>
                        </div>
                        <CardDescription className="font-mono text-xs">
                          {room.code}
                        </CardDescription>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="analytics">
            <AnalyticsDashboard />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Dashboard;
