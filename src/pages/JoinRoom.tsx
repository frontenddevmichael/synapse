import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, Users } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/Logo';

const JoinRoom = () => {
  const { code } = useParams<{ code: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      // Preserve join destination through auth
      if (code) sessionStorage.setItem('joinAfterAuth', code);
      navigate('/auth');
      return;
    }
    if (!code) {
      navigate('/dashboard');
      return;
    }
    joinRoom(code);
  }, [user, authLoading, code]);

  const joinRoom = async (roomCode: string) => {
    setJoining(true);
    try {
      const { data, error } = await supabase.rpc('join_room_by_code', { _code: roomCode });
      if (error) throw error;
      const result = data as any;
      if (result.status === 'joined') {
        toast({ title: 'Joined room!', description: result.room_name });
        navigate(`/room/${result.room_id}`);
      } else if (result.status === 'already_member') {
        toast({ title: 'Already a member', description: result.room_name });
        navigate(`/room/${result.room_id}`);
      } else if (result.status === 'not_found') {
        toast({ title: 'Room not found', description: 'This invite link may be invalid.', variant: 'destructive' });
        navigate('/dashboard');
      } else {
        toast({ title: 'Error', description: result.message || 'Something went wrong.', variant: 'destructive' });
        navigate('/dashboard');
      }
    } catch (err: any) {
      toast({ title: 'Failed to join', description: err.message, variant: 'destructive' });
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background dot-grid p-4">
      <Logo />
      <div className="mt-8 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
        <p className="text-muted-foreground font-medium">
          {authLoading ? 'Checking authentication…' : joining ? 'Joining room…' : 'Redirecting…'}
        </p>
      </div>
    </div>
  );
};

export default JoinRoom;
