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
    
    // Fetch rooms where user is a member
    const { data: memberRooms, error: memberError } = await supabase
      .from('room_members')
      .select('room_id')
      .eq('user_id', user.id);

    if (memberError) {
      console.error('Error fetching member rooms:', memberError);
      setIsLoading(false);
      return;
    }

    const roomIds = memberRooms?.map(m => m.room_id) || [];

    // Fetch rooms where user is owner
    const { data: ownedRooms, error: ownedError } = await supabase
      .from('rooms')
      .select('*')
      .eq('owner_id', user.id);

    if (ownedError) {
      console.error('Error fetching owned rooms:', ownedError);
    }

    // Fetch rooms where user is member
    let joinedRooms: Room[] = [];
    if (roomIds.length > 0) {
      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .in('id', roomIds);
      
      if (!error && data) {
        joinedRooms = data as Room[];
      }
    }

    // Combine and deduplicate
    const allRooms = [...(ownedRooms || []), ...joinedRooms];
    const uniqueRooms = allRooms.filter((room, index, self) => 
      index === self.findIndex(r => r.id === room.id)
    );

    setRooms(uniqueRooms as Room[]);
    setIsLoading(false);
  };

  const generateRoomCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
  };

  const handleCreateRoom = async () => {
    if (!user || !newRoomName.trim()) return;

    setIsSubmitting(true);

    const code = generateRoomCode();

    // Create the room
    const { data: room, error: roomError } = await supabase
      .from('rooms')
      .insert({
        name: newRoomName.trim(),
        code,
        mode: newRoomMode,
        owner_id: user.id,
      })
      .select()
      .single();

    if (roomError) {
      toast({
        title: 'Failed to create room',
        description: roomError.message,
        variant: 'destructive',
      });
      setIsSubmitting(false);
      return;
    }

    // Add owner as room member
    await supabase.from('room_members').insert({
      room_id: room.id,
      user_id: user.id,
      role: 'owner',
    });

    toast({
      title: 'Room created!',
      description: `Your room code is: ${code}`,
    });

    setNewRoomName('');
    setNewRoomMode('study');
    setIsCreateOpen(false);
    setIsSubmitting(false);
    fetchRooms();
  };

  const handleJoinRoom = async () => {
    if (!user || !joinCode.trim()) return;

    setIsSubmitting(true);

    // Find room by code
    const { data: room, error: findError } = await supabase
      .from('rooms')
      .select('*')
      .eq('code', joinCode.trim().toUpperCase())
      .maybeSingle();

    if (findError || !room) {
      toast({
        title: 'Room not found',
        description: 'Please check the room code and try again.',
        variant: 'destructive',
      });
      setIsSubmitting(false);
      return;
    }

    // Check if already a member
    const { data: existingMember } = await supabase
      .from('room_members')
      .select('id')
      .eq('room_id', room.id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (existingMember) {
      toast({
        title: 'Already a member',
        description: 'You are already a member of this room.',
      });
      setIsSubmitting(false);
      setIsJoinOpen(false);
      return;
    }

    // Join the room
    const { error: joinError } = await supabase.from('room_members').insert({
      room_id: room.id,
      user_id: user.id,
      role: 'member',
    });

    if (joinError) {
      toast({
        title: 'Failed to join room',
        description: joinError.message,
        variant: 'destructive',
      });
      setIsSubmitting(false);
      return;
    }

    toast({
      title: 'Joined room!',
      description: `Welcome to ${room.name}`,
    });

    setJoinCode('');
    setIsJoinOpen(false);
    setIsSubmitting(false);
    fetchRooms();
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const getModeColor = (mode: string) => {
    switch (mode) {
      case 'study':
        return 'bg-success/10 text-success border-success/20';
      case 'challenge':
        return 'bg-warning/10 text-warning border-warning/20';
      case 'exam':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Achievement Toast */}
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
      <header className="flex items-center justify-between p-4 border-b border-border">
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

      {/* Main content */}
      <main className="flex-1 container max-w-6xl py-8">
        {/* Welcome section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Welcome back!</h1>
          <p className="text-muted-foreground">
            Ready to learn? Create or join a room to get started.
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
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="rooms" className="space-y-6">
            {/* Quick actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Card className="cursor-pointer hover:border-primary/50 transition-colors">
                <CardContent className="flex items-center gap-4 p-6">
                  <div className="p-3 rounded-full bg-primary/10">
                    <Plus className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Create Room</h3>
                    <p className="text-sm text-muted-foreground">
                      Start a new study room
                    </p>
                  </div>
                </CardContent>
              </Card>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create a new room</DialogTitle>
                <DialogDescription>
                  Set up a room for your study group
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="roomName">Room name</Label>
                  <Input
                    id="roomName"
                    placeholder="e.g., Biology 101 Study Group"
                    value={newRoomName}
                    onChange={(e) => setNewRoomName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="roomMode">Room mode</Label>
                  <Select value={newRoomMode} onValueChange={(v) => setNewRoomMode(v as any)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="study">
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-4 w-4" />
                          Study - Answers shown, relaxed pace
                        </div>
                      </SelectItem>
                      <SelectItem value="challenge">
                        <div className="flex items-center gap-2">
                          <Trophy className="h-4 w-4" />
                          Challenge - Timed, competitive
                        </div>
                      </SelectItem>
                      <SelectItem value="exam">
                        <div className="flex items-center gap-2">
                          <Settings className="h-4 w-4" />
                          Exam - Answers hidden until done
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  className="w-full" 
                  onClick={handleCreateRoom}
                  disabled={isSubmitting || !newRoomName.trim()}
                >
                  Create Room
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isJoinOpen} onOpenChange={setIsJoinOpen}>
            <DialogTrigger asChild>
              <Card className="cursor-pointer hover:border-primary/50 transition-colors">
                <CardContent className="flex items-center gap-4 p-6">
                  <div className="p-3 rounded-full bg-accent/10">
                    <Users className="h-6 w-6 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Join Room</h3>
                    <p className="text-sm text-muted-foreground">
                      Enter a room code
                    </p>
                  </div>
                </CardContent>
              </Card>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Join a room</DialogTitle>
                <DialogDescription>
                  Enter the 6-character room code
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="joinCode">Room code</Label>
                  <Input
                    id="joinCode"
                    placeholder="e.g., ABC123"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    maxLength={6}
                    className="text-center text-2xl tracking-widest font-mono"
                  />
                </div>
                <Button 
                  className="w-full" 
                  onClick={handleJoinRoom}
                  disabled={isSubmitting || joinCode.length !== 6}
                >
                  Join Room
                </Button>
              </div>
            </DialogContent>
        </Dialog>
            </div>

            {/* Rooms list */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Your Rooms</h2>
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1, 2, 3].map((i) => (
                    <Card key={i} className="animate-pulse">
                      <CardHeader>
                        <div className="h-5 bg-muted rounded w-3/4"></div>
                        <div className="h-4 bg-muted rounded w-1/2"></div>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              ) : rooms.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                    <Users className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="font-semibold mb-2">No rooms yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Create your first room or join one with a code
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {rooms.map((room) => (
                    <Card 
                      key={room.id} 
                      className="cursor-pointer hover:border-primary/50 transition-colors"
                      onClick={() => navigate(`/room/${room.id}`)}
                    >
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{room.name}</CardTitle>
                          <Badge variant="outline" className={getModeColor(room.mode)}>
                            {room.mode}
                          </Badge>
                        </div>
                        <CardDescription className="font-mono">
                          Code: {room.code}
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
