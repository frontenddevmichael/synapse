import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FileText, Sparkles, Trophy, Users, Settings, Copy, Check,
  BookOpen, Timer, BarChart3, Hammer, LogOut, Upload,
} from 'lucide-react';
import { CardCascadeIllustration } from '@/components/illustrations/CardCascadeIllustration';
import { DocumentFunnelIllustration } from '@/components/illustrations/DocumentFunnelIllustration';
import { ActivityFeed } from '@/components/room/ActivityFeed';
import { PulseTab } from '@/components/room/PulseTab';
import { RoomTriumph } from '@/components/room/RoomTriumph';
import { ForgeTab } from '@/components/room/ForgeTab';
import { UploadDocumentDialog } from '@/components/room/UploadDocumentDialog';
import { ShareRoomDialog } from '@/components/room/ShareRoomDialog';
import { QuizLauncher } from '@/components/room/QuizLauncher';
import { QuizCard } from '@/components/room/QuizCard';
import { DocumentCard } from '@/components/room/DocumentCard';
import { MemberCard } from '@/components/room/MemberCard';
import { LeaderboardPanel, type LeaderboardEntry } from '@/components/room/LeaderboardPanel';
import { motion, useReducedMotion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { RoomSettings } from '@/components/room/RoomSettings';
import { ActiveUsersIndicator } from '@/components/realtime/ActiveUsersIndicator';
import { QuizGeneratingOverlay } from '@/components/quiz/QuizGeneratingOverlay';
import { fadeUp, staggerFast } from '@/lib/motion';

interface Room {
  id: string;
  name: string;
  code: string;
  mode: 'study' | 'challenge' | 'exam';
  owner_id: string;
  leaderboard_enabled: boolean;
}

interface Document {
  id: string;
  name: string;
  content: string | null;
  created_at: string;
}

interface Quiz {
  id: string;
  title: string;
  description: string | null;
  difficulty: 'easy' | 'medium' | 'hard';
  time_limit_minutes: number | null;
  created_at: string;
}

interface Member {
  id: string;
  user_id: string;
  role: string;
  profile: {
    username: string;
    display_name: string | null;
  };
}

interface UserPreferences {
  preferred_difficulty: 'easy' | 'medium' | 'hard';
  default_time_limit: number;
}

const RoomPage = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const prefersReducedMotion = useReducedMotion();

  const [room, setRoom] = useState<Room | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const [userPreferences, setUserPreferences] = useState<UserPreferences | null>(null);

  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<string>('');
  const [quizTitle, setQuizTitle] = useState('');
  const [quizDifficulty, setQuizDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [questionCount, setQuestionCount] = useState(10);

  useEffect(() => {
    if (!user) return;
    if (roomId) { fetchRoomData(); fetchUserPreferences(); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, roomId]);

  const fetchUserPreferences = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('user_preferences')
      .select('preferred_difficulty, default_time_limit')
      .eq('user_id', user.id)
      .maybeSingle();
    if (data) {
      setUserPreferences(data as UserPreferences);
      setQuizDifficulty(data.preferred_difficulty as 'easy' | 'medium' | 'hard');
    }
  };

  const fetchRoomData = async () => {
    if (!roomId || !user) return;
    setIsLoading(true);

    const { data: roomData, error: roomError } = await supabase
      .from('rooms').select('*').eq('id', roomId).maybeSingle();

    if (roomError || !roomData) {
      toast({ title: 'Room not found', description: 'This room may not exist or you may not have access.', variant: 'destructive' });
      navigate('/dashboard');
      return;
    }

    setRoom(roomData as Room);

    const { data: docsData } = await supabase.from('documents').select('*').eq('room_id', roomId).order('created_at', { ascending: false });
    setDocuments((docsData as Document[]) || []);

    const { data: quizzesData } = await supabase.from('quizzes').select('*').eq('room_id', roomId).order('created_at', { ascending: false });
    setQuizzes((quizzesData as Quiz[]) || []);

    const { data: membersData } = await supabase
      .from('room_members')
      .select(`id, user_id, role, profile:profiles(username, display_name)`)
      .eq('room_id', roomId);

    if (membersData) {
      const formattedMembers = membersData.map((m: any) => ({
        id: m.id, user_id: m.user_id, role: m.role,
        profile: m.profile || { username: 'Unknown', display_name: null }
      }));
      setMembers(formattedMembers);
    }

    if (roomData.leaderboard_enabled) {
      const { data: attemptsData } = await supabase
        .from('quiz_attempts')
        .select(`user_id, score, quiz:quizzes!inner(room_id, difficulty)`)
        .eq('quiz.room_id', roomId)
        .eq('status', 'completed');

      if (attemptsData) {
        const scoreMap: Record<string, { weighted: number; count: number }> = {};
        attemptsData.forEach((attempt: any) => {
          if (!scoreMap[attempt.user_id]) scoreMap[attempt.user_id] = { weighted: 0, count: 0 };
          const diffWeight = attempt.quiz?.difficulty === 'hard' ? 2 : attempt.quiz?.difficulty === 'medium' ? 1.5 : 1;
          scoreMap[attempt.user_id].weighted += (attempt.score || 0) * diffWeight;
          scoreMap[attempt.user_id].count += 1;
        });

        const userIds = Object.keys(scoreMap);
        if (userIds.length > 0) {
          const { data: profiles } = await supabase.from('profiles').select('id, username').in('id', userIds);
          const leaderboardData: LeaderboardEntry[] = userIds.map(userId => {
            const profile = profiles?.find((p: any) => p.id === userId);
            return {
              user_id: userId, username: profile?.username || 'Unknown',
              total_score: Math.round(scoreMap[userId].weighted), quizzes_taken: scoreMap[userId].count,
            };
          }).sort((a, b) => b.total_score - a.total_score);
          setLeaderboard(leaderboardData);
        }
      }
    }

    setIsLoading(false);
  };

  const handleCopyCode = useCallback(() => {
    if (room) {
      navigator.clipboard.writeText(room.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [room]);

  const handleGenerateQuiz = async () => {
    if (!user || !roomId || !selectedDoc || !quizTitle.trim()) return;
    setIsGenerating(true);
    const doc = documents.find(d => d.id === selectedDoc);
    if (!doc || !doc.content) {
      toast({ title: 'Document not found', description: 'Please select a valid document with content.', variant: 'destructive' });
      setIsGenerating(false); return;
    }

    try {
      toast({ title: 'Generating quiz...', description: 'AI is creating questions from your document.' });
      const { data: aiData, error: aiError } = await supabase.functions.invoke('generate-quiz', {
        body: { content: doc.content, difficulty: quizDifficulty, questionCount },
      });
      if (aiError) throw new Error(aiError.message || 'Failed to generate questions');
      if (!aiData?.questions || aiData.questions.length === 0) throw new Error(aiData?.error || 'No questions generated');

      const timeLimit = room?.mode !== 'study' ? (userPreferences?.default_time_limit || null) : null;
      const { data: quiz, error: quizError } = await supabase
        .from('quizzes')
        .insert({ room_id: roomId, document_id: selectedDoc, title: quizTitle.trim(), difficulty: quizDifficulty, time_limit_minutes: timeLimit, created_by: user.id })
        .select().single();
      if (quizError) throw new Error(quizError.message);

      const questionsToInsert = aiData.questions.map((q: any, index: number) => ({
        quiz_id: quiz.id, question_text: q.question, question_type: q.type,
        options: q.options, correct_answer: q.correct, explanation: q.explanation || null, order_index: index,
      }));
      const { error: insertError } = await supabase.from('questions').insert(questionsToInsert);
      if (insertError) {
        await supabase.from('quizzes').delete().eq('id', quiz.id);
        throw new Error('Failed to save questions');
      }

      // Forge: also insert approved user_questions into this quiz
      let forgeCount = 0;
      try {
        const { data: approvedUQ } = await supabase
          .from('user_questions').select('*').eq('room_id', roomId).eq('status', 'approved');

        if (approvedUQ && approvedUQ.length > 0) {
          const existingTexts = new Set(questionsToInsert.map((q: any) => q.question_text));
          const newForgeQuestions = approvedUQ
            .filter((uq: any) => !existingTexts.has(uq.question_text))
            .map((uq: any, idx: number) => {
              const options = uq.question_type === 'true_false'
                ? JSON.stringify(['True', 'False'])
                : JSON.stringify([uq.option_a, uq.option_b, uq.option_c, uq.option_d].filter(Boolean));
              return {
                quiz_id: quiz.id, question_text: uq.question_text, question_type: uq.question_type,
                options, correct_answer: uq.correct_answer, explanation: null,
                order_index: questionsToInsert.length + idx,
              };
            });

          if (newForgeQuestions.length > 0) {
            await supabase.from('questions').insert(newForgeQuestions);
            forgeCount = newForgeQuestions.length;
          }
        }
      } catch (forgeErr) { console.error('Forge integration error:', forgeErr); }

      const totalQ = aiData.questions.length + forgeCount;
      toast({ title: 'Quiz generated!', description: `Created ${totalQ} questions${forgeCount > 0 ? ` (${forgeCount} from Forge)` : ''}.` });
      setQuizTitle(''); setSelectedDoc(''); fetchRoomData();
    } catch (error) {
      console.error('Quiz generation error:', error);
      toast({ title: 'Quiz generation failed', description: error instanceof Error ? error.message : 'Please try again.', variant: 'destructive' });
    } finally { setIsGenerating(false); }
  };

  const handleDeleteDocument = useCallback(async (docId: string) => {
    const { error } = await supabase.from('documents').delete().eq('id', docId);
    if (error) toast({ title: 'Failed to delete document', description: error.message, variant: 'destructive' });
    else { toast({ title: 'Document deleted' }); fetchRoomData(); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toast]);

  const handleDeleteQuiz = useCallback(async (quizId: string) => {
    await supabase.from('questions').delete().eq('quiz_id', quizId);
    const { error } = await supabase.from('quizzes').delete().eq('id', quizId);
    if (error) toast({ title: 'Failed to delete quiz', description: error.message, variant: 'destructive' });
    else { toast({ title: 'Quiz deleted' }); fetchRoomData(); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toast]);

  const handleLeaveRoom = async () => {
    if (!user || !roomId) return;
    const { error } = await supabase.from('room_members').delete().eq('room_id', roomId).eq('user_id', user.id);
    if (error) {
      toast({ title: 'Failed to leave room', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Left room' });
      navigate('/dashboard');
    }
  };

  const handleUploaded = useCallback((doc: Document) => {
    setDocuments(prev => {
      const seen = new Set(prev.map(d => d.id));
      return seen.has(doc.id) ? prev : [doc, ...prev];
    });
    fetchRoomData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const modeBadge = useMemo(() => {
    if (!room) return null;
    const icon = room.mode === 'study' ? <BookOpen className="h-4 w-4" /> : room.mode === 'challenge' ? <Trophy className="h-4 w-4" /> : <Timer className="h-4 w-4" />;
    const label = room.mode === 'study' ? 'Study Mode' : room.mode === 'challenge' ? 'Challenge Mode' : 'Exam Mode';
    return { icon, label };
  }, [room]);

  const containerProps = prefersReducedMotion ? {} : { variants: staggerFast, initial: 'hidden', animate: 'visible' };
  const itemProps = prefersReducedMotion ? {} : { variants: fadeUp };

  if (isLoading || !room) {
    return (
      <div className="flex-1 flex flex-col bg-background dot-grid pb-14 lg:pb-0">
        <div className="border-b border-border/30 bg-card/30 backdrop-blur-sm">
          <div className="container max-w-6xl px-3 sm:px-8 py-5 sm:py-8 space-y-3">
            <Skeleton className="h-8 sm:h-10 w-2/3 max-w-md" />
            <div className="flex gap-2">
              <Skeleton className="h-9 w-28" />
              <Skeleton className="h-9 w-20" />
              <Skeleton className="h-9 w-16" />
            </div>
          </div>
        </div>
        <main className="flex-1 container max-w-6xl py-6 sm:py-8 px-3 sm:px-8 space-y-6">
          <Skeleton className="h-11 w-full sm:w-96" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-36 rounded-xl" />)}
          </div>
        </main>
      </div>
    );
  }

  const modeBgClass = room.mode === 'study' ? 'mode-bg-study' : room.mode === 'challenge' ? 'mode-bg-challenge' : 'mode-bg-exam';
  const isOwner = user?.id === room.owner_id;
  const currentMemberRole = members.find(m => m.user_id === user?.id)?.role;
  const isAdmin = currentMemberRole === 'admin';
  const canManage = isOwner || isAdmin;

  return (
    <div className="flex-1 flex flex-col bg-background dot-grid pb-14 lg:pb-0">
      <div className={`fixed inset-0 -z-10 ${modeBgClass}`} />

      <div className="flex items-center justify-end px-3 sm:px-8 py-2 border-b border-border/30 bg-background/40 backdrop-blur-sm lg:hidden">
        <Badge variant="outline" className={`mode-${room.mode} gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 font-semibold text-[10px] sm:text-xs`}>
          {modeBadge?.icon}
          {modeBadge?.label}
        </Badge>
      </div>

      {/* Room Hero */}
      <motion.div {...containerProps} className="border-b border-border/30 bg-card/30 backdrop-blur-sm">
        <div className="container max-w-6xl px-3 sm:px-8 py-5 sm:py-8">
          <motion.div {...itemProps}>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tighter mb-2">{room.name}</h1>
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap mb-3 sm:mb-0">
              <button
                onClick={handleCopyCode}
                className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-muted/50 hover:bg-muted transition-colors font-mono text-xs sm:text-sm text-muted-foreground min-h-[36px]"
              >
                {room.code}
                {copied ? <Check className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-success" /> : <Copy className="h-3 w-3 sm:h-3.5 sm:w-3.5" />}
              </button>
              <ShareRoomDialog roomName={room.name} roomCode={room.code} />
              <span className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1">
                <Users className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                {members.length}
              </span>
              {quizzes.length > 0 && (
                <ActiveUsersIndicator quizId={quizzes[0]?.id || ''} roomId={room.id} />
              )}
              <span className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1">
                <Sparkles className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                {quizzes.length} quiz{quizzes.length !== 1 ? 'zes' : ''}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-3 sm:mt-0 sm:absolute sm:right-8 sm:top-8">
              {!isOwner && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-1.5 text-muted-foreground hover:text-destructive hover:border-destructive/50">
                      <LogOut className="h-3.5 w-3.5" />
                      Leave
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Leave this room?</AlertDialogTitle>
                      <AlertDialogDescription>You'll need to rejoin with the room code to access it again.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleLeaveRoom}>Leave room</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
              {user && (
                <UploadDocumentDialog roomId={room.id} userId={user.id} onUploaded={handleUploaded} />
              )}
            </div>
          </motion.div>
          <div className="container max-w-6xl px-3 sm:px-8 pb-4">
            <ActivityFeed roomId={room.id} />
          </div>
        </div>
      </motion.div>

      {/* Main content */}
      <main className="flex-1 container max-w-6xl py-6 sm:py-8 px-3 sm:px-8">
        <motion.div {...containerProps}>
          <Tabs defaultValue="quizzes" className="space-y-6 sm:space-y-8">
            <motion.div {...itemProps}>
              <TabsList className="bg-muted/50 backdrop-blur-sm overflow-x-auto whitespace-nowrap w-full sm:w-auto flex sm:inline-flex">
                <TabsTrigger value="quizzes" className="gap-1.5 sm:gap-2 font-semibold min-h-[44px] text-xs sm:text-sm flex-1 sm:flex-none">
                  <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  Quizzes
                </TabsTrigger>
                <TabsTrigger value="documents" className="gap-1.5 sm:gap-2 font-semibold min-h-[44px] text-xs sm:text-sm flex-1 sm:flex-none">
                  <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="hidden xs:inline">Documents</span>
                  <span className="xs:hidden">Docs</span>
                </TabsTrigger>
                <TabsTrigger value="members" className="gap-1.5 sm:gap-2 font-semibold min-h-[44px] text-xs sm:text-sm flex-1 sm:flex-none">
                  <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="hidden xs:inline">Members</span>
                  <span className="xs:hidden">{members.length}</span>
                </TabsTrigger>
                {room.leaderboard_enabled && (
                  <TabsTrigger value="leaderboard" className="gap-1.5 sm:gap-2 font-semibold min-h-[44px] text-xs sm:text-sm flex-1 sm:flex-none">
                    <Trophy className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Leaderboard</span>
                    <span className="sm:hidden">Rank</span>
                  </TabsTrigger>
                )}
                {canManage && (
                  <TabsTrigger value="pulse" className="gap-1.5 sm:gap-2 font-semibold min-h-[44px] text-xs sm:text-sm flex-1 sm:flex-none">
                    <BarChart3 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    Pulse
                  </TabsTrigger>
                )}
                <TabsTrigger value="forge" className="gap-1.5 sm:gap-2 font-semibold min-h-[44px] text-xs sm:text-sm flex-1 sm:flex-none">
                  <Hammer className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  Forge
                </TabsTrigger>
                {isOwner && (
                  <TabsTrigger value="settings" className="gap-1.5 sm:gap-2 font-semibold min-h-[44px] text-xs sm:text-sm flex-1 sm:flex-none">
                    <Settings className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </TabsTrigger>
                )}
              </TabsList>
            </motion.div>

            {canManage && <RoomTriumph roomId={room.id} isOwner={isOwner} />}

            {/* Quizzes Tab */}
            <TabsContent value="quizzes" className="space-y-6">
              {isGenerating && (
                <motion.div {...itemProps}>
                  <QuizGeneratingOverlay
                    isGenerating={isGenerating}
                    documentName={documents.find(d => d.id === selectedDoc)?.name || 'Document'}
                    questionCount={questionCount}
                    difficulty={quizDifficulty}
                  />
                </motion.div>
              )}

              {documents.length > 0 && !isGenerating && (
                <motion.div {...itemProps}>
                  <QuizLauncher
                    documents={documents}
                    selectedDoc={selectedDoc}
                    onSelectDoc={setSelectedDoc}
                    title={quizTitle}
                    onTitleChange={setQuizTitle}
                    difficulty={quizDifficulty}
                    onDifficultyChange={setQuizDifficulty}
                    preferredDifficulty={userPreferences?.preferred_difficulty}
                    questionCount={questionCount}
                    onQuestionCountChange={setQuestionCount}
                    isGenerating={isGenerating}
                    onGenerate={handleGenerateQuiz}
                  />
                </motion.div>
              )}

              {quizzes.length === 0 ? (
                <motion.div {...itemProps} className="bento-card py-16 flex flex-col items-center text-center">
                  <CardCascadeIllustration className="w-40 h-32 mb-4" />
                  <h3 className="font-black text-lg mb-1">No quizzes yet</h3>
                  <p className="text-muted-foreground">Upload a document and generate your first quiz</p>
                </motion.div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {quizzes.map((quiz, index) => (
                    <QuizCard
                      key={quiz.id}
                      id={quiz.id}
                      title={quiz.title}
                      description={quiz.description}
                      difficulty={quiz.difficulty}
                      timeLimitMinutes={quiz.time_limit_minutes}
                      mode={room.mode}
                      canDelete={canManage}
                      delay={index * 0.05}
                      onDelete={handleDeleteQuiz}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Documents Tab */}
            <TabsContent value="documents" className="space-y-6">
              {documents.length === 0 ? (
                <motion.div {...itemProps} className="bento-card py-16 flex flex-col items-center text-center">
                  <DocumentFunnelIllustration className="w-40 h-32 mb-4" />
                  <h3 className="font-black text-lg mb-1">No documents yet</h3>
                  <p className="text-muted-foreground mb-4">Upload your first study material</p>
                  <Button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="gap-2">
                    <Upload className="h-4 w-4" />
                    Upload Document
                  </Button>
                </motion.div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {documents.map((doc, index) => (
                    <DocumentCard
                      key={doc.id}
                      id={doc.id}
                      name={doc.name}
                      content={doc.content}
                      createdAt={doc.created_at}
                      canDelete={canManage}
                      delay={index * 0.05}
                      onDelete={handleDeleteDocument}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Members Tab */}
            <TabsContent value="members" className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {members.map((member, index) => (
                  <MemberCard
                    key={member.id}
                    username={member.profile.username}
                    displayName={member.profile.display_name}
                    role={member.role}
                    delay={index * 0.05}
                  />
                ))}
              </div>
            </TabsContent>

            {/* Leaderboard Tab */}
            {room.leaderboard_enabled && (
              <TabsContent value="leaderboard" className="space-y-6">
                <LeaderboardPanel leaderboard={leaderboard} currentUserId={user?.id} />
              </TabsContent>
            )}

            {/* Pulse Tab */}
            {isOwner && (
              <TabsContent value="pulse" className="space-y-6">
                <PulseTab roomId={room.id} ownerId={room.owner_id} currentUserId={user.id} />
              </TabsContent>
            )}

            {/* Forge Tab */}
            <TabsContent value="forge" className="space-y-6">
              <ForgeTab roomId={room.id} ownerId={room.owner_id} />
            </TabsContent>

            {/* Settings Tab */}
            {isOwner && (
              <TabsContent value="settings" className="space-y-6">
                <RoomSettings
                  roomId={room.id}
                  roomName={room.name}
                  mode={room.mode}
                  leaderboardEnabled={room.leaderboard_enabled}
                  ownerId={room.owner_id}
                  currentUserId={user.id}
                  members={members}
                  onUpdate={fetchRoomData}
                  onDelete={() => navigate('/dashboard')}
                />
              </TabsContent>
            )}
          </Tabs>
        </motion.div>
      </main>
    </div>
  );
};

export default RoomPage;
