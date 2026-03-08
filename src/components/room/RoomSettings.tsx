import { useState } from 'react';
import { Settings, Trash2, UserMinus, BookOpen, Trophy, FileText, Pencil } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';

interface Member {
  id: string;
  user_id: string;
  role: string;
  profile: { username: string; display_name: string | null };
}

interface RoomSettingsProps {
  roomId: string;
  roomName: string;
  mode: 'study' | 'challenge' | 'exam';
  leaderboardEnabled: boolean;
  ownerId: string;
  currentUserId: string;
  members: Member[];
  onUpdate: () => void;
  onDelete: () => void;
}

export function RoomSettings({
  roomId, roomName, mode, leaderboardEnabled, ownerId, currentUserId, members, onUpdate, onDelete
}: RoomSettingsProps) {
  const { toast } = useToast();
  const [currentMode, setCurrentMode] = useState(mode);
  const [currentName, setCurrentName] = useState(roomName);
  const [leaderboard, setLeaderboard] = useState(leaderboardEnabled);
  const [isSaving, setIsSaving] = useState(false);
  const isOwner = currentUserId === ownerId;

  if (!isOwner) return null;

  const handleSave = async () => {
    setIsSaving(true);
    const { error } = await supabase
      .from('rooms')
      .update({ name: currentName.trim(), mode: currentMode, leaderboard_enabled: leaderboard })
      .eq('id', roomId);

    if (error) {
      toast({ title: 'Failed to update', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Room updated' });
      onUpdate();
    }
    setIsSaving(false);
  };

  const handleDeleteRoom = async () => {
    const { error } = await supabase.from('rooms').delete().eq('id', roomId);
    if (error) {
      toast({ title: 'Failed to delete room', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Room deleted' });
      onDelete();
    }
  };

  const handleRemoveMember = async (memberId: string, memberUserId: string) => {
    if (memberUserId === ownerId) return;
    const { error } = await supabase.from('room_members').delete().eq('id', memberId);
    if (error) {
      toast({ title: 'Failed to remove member', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Member removed' });
      onUpdate();
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Room Settings
          </CardTitle>
          <CardDescription>Manage room mode, leaderboard, and members</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Room Mode</Label>
            <Select value={currentMode} onValueChange={(v) => setCurrentMode(v as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="study">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4" /> Study
                  </div>
                </SelectItem>
                <SelectItem value="challenge">
                  <div className="flex items-center gap-2">
                    <Trophy className="h-4 w-4" /> Challenge
                  </div>
                </SelectItem>
                <SelectItem value="exam">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" /> Exam
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="leaderboard">Leaderboard</Label>
            <Switch
              id="leaderboard"
              checked={leaderboard}
              onCheckedChange={setLeaderboard}
            />
          </div>

          <Button onClick={handleSave} disabled={isSaving} className="w-full">
            Save Changes
          </Button>
        </CardContent>
      </Card>

      {/* Member management */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Members</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {members.map((member) => (
            <div key={member.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-primary text-sm font-semibold">
                    {member.profile.username.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium">{member.profile.display_name || member.profile.username}</p>
                  <p className="text-xs text-muted-foreground">{member.role}</p>
                </div>
              </div>
              {member.user_id !== ownerId && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                      <UserMinus className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Remove member?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will remove {member.profile.username} from the room.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleRemoveMember(member.id, member.user_id)}>
                        Remove
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Delete room */}
      <Card className="border-destructive/30">
        <CardContent className="p-4">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="w-full gap-2">
                <Trash2 className="h-4 w-4" />
                Delete Room
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete "{roomName}"?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete the room, all documents, quizzes, and scores. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteRoom} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
}
