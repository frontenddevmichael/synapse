import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Upload, FileText, Sparkles, Trophy, Users, Settings, Copy, Check,
  File, Loader2, X, Trash2, BookOpen, Timer, Crown, Medal, Award
} from 'lucide-react';
import { motion, useReducedMotion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Logo } from '@/components/Logo';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { extractTextFromPDF, formatFileSize } from '@/lib/pdfParser';
import { QuestionCountSelector } from '@/components/quiz/QuestionCountSelector';
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

interface LeaderboardEntry {
  user_id: string;
  username: string;
  total_score: number;
  quizzes_taken: number;
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const prefersReducedMotion = useReducedMotion();
  
  const [room, setRoom] = useState<Room | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  
  const [userPreferences, setUserPreferences] = useState<UserPreferences | null>(null);
  
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [docName, setDocName] = useState('');
  const [docContent, setDocContent] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMode, setUploadMode] = useState<'paste' | 'file'>('paste');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<string>('');
  const [quizTitle, setQuizTitle] = useState('');
  const [quizDifficulty, setQuizDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [questionCount, setQuestionCount] = useState(10);

  useEffect(() => {
    if (!user) { navigate('/auth'); return; }
    if (roomId) { fetchRoomData(); fetchUserPreferences(); }
  }, [user, roomId, navigate]);

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
        .select(`user_id, score, quiz:quizzes!inner(room_id)`)
        .eq('quiz.room_id', roomId)
        .eq('status', 'completed');

      if (attemptsData) {
        const scoreMap: Record<string, { total: number; count: number }> = {};
        attemptsData.forEach((attempt: any) => {
          if (!scoreMap[attempt.user_id]) scoreMap[attempt.user_id] = { total: 0, count: 0 };
          scoreMap[attempt.user_id].total += attempt.score || 0;
          scoreMap[attempt.user_id].count += 1;
        });

        const userIds = Object.keys(scoreMap);
        if (userIds.length > 0) {
          const { data: profiles } = await supabase.from('profiles').select('id, username').in('id', userIds);
          const leaderboardData: LeaderboardEntry[] = userIds.map(userId => {
            const profile = profiles?.find((p: any) => p.id === userId);
            return {
              user_id: userId, username: profile?.username || 'Unknown',
              total_score: scoreMap[userId].total, quizzes_taken: scoreMap[userId].count,
            };
          }).sort((a, b) => b.total_score - a.total_score);
          setLeaderboard(leaderboardData);
        }
      }
    }

    setIsLoading(false);
  };

  const handleCopyCode = () => {
    if (room) {
      navigator.clipboard.writeText(room.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    if (!docName) setDocName(file.name.replace(/\.[^/.]+$/, ''));

    setIsParsing(true);
    try {
      let content = '';
      if (file.type === 'application/pdf') { content = await extractTextFromPDF(file); }
      else { content = await file.text(); }
      setDocContent(content);
      toast({ title: 'File parsed successfully', description: `Extracted ${content.length.toLocaleString()} characters` });
    } catch (error) {
      console.error('File parsing error:', error);
      toast({ title: 'Failed to parse file', description: error instanceof Error ? error.message : 'Please try a different file', variant: 'destructive' });
      setSelectedFile(null);
    } finally { setIsParsing(false); }
  };

  const clearSelectedFile = () => {
    setSelectedFile(null); setDocContent('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleUploadDocument = async () => {
    if (!user || !roomId || !docName.trim() || !docContent.trim()) return;
    setIsUploading(true);
    const { error } = await supabase.from('documents').insert({
      room_id: roomId, uploaded_by: user.id, name: docName.trim(), content: docContent.trim(),
    });
    if (error) { toast({ title: 'Upload failed', description: error.message, variant: 'destructive' }); }
    else {
      toast({ title: 'Document uploaded!', description: 'You can now generate quizzes from this document.' });
      setDocName(''); setDocContent(''); setSelectedFile(null); setUploadMode('paste'); setIsUploadOpen(false);
      fetchRoomData();
    }
    setIsUploading(false);
  };

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

      toast({ title: 'Quiz generated!', description: `Created ${aiData.questions.length} AI-powered questions.` });
      setQuizTitle(''); setSelectedDoc(''); fetchRoomData();
    } catch (error) {
      console.error('Quiz generation error:', error);
      toast({ title: 'Quiz generation failed', description: error instanceof Error ? error.message : 'Please try again.', variant: 'destructive' });
    } finally { setIsGenerating(false); }
  };

  const handleDeleteDocument = async (docId: string) => {
    const { error } = await supabase.from('documents').delete().eq('id', docId);
    if (error) toast({ title: 'Failed to delete document', description: error.message, variant: 'destructive' });
    else { toast({ title: 'Document deleted' }); fetchRoomData(); }
  };

  const handleDeleteQuiz = async (quizId: string) => {
    await supabase.from('questions').delete().eq('quiz_id', quizId);
    const { error } = await supabase.from('quizzes').delete().eq('id', quizId);
    if (error) toast({ title: 'Failed to delete quiz', description: error.message, variant: 'destructive' });
    else { toast({ title: 'Quiz deleted' }); fetchRoomData(); }
  };

  const getModeIcon = (mode: string) => {
    switch (mode) {
      case 'study': return <BookOpen className="h-4 w-4" />;
      case 'challenge': return <Trophy className="h-4 w-4" />;
      case 'exam': return <Timer className="h-4 w-4" />;
      default: return null;
    }
  };

  const getModeLabel = (mode: string) => {
    switch (mode) {
      case 'study': return 'Study Mode';
      case 'challenge': return 'Challenge Mode';
      case 'exam': return 'Exam Mode';
      default: return mode;
    }
  };

  const getDifficultyClass = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-success/10 text-success border-success/20';
      case 'medium': return 'bg-warning/10 text-warning border-warning/20';
      case 'hard': return 'bg-destructive/10 text-destructive border-destructive/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const containerProps = prefersReducedMotion ? {} : { variants: staggerFast, initial: 'hidden', animate: 'visible' };
  const itemProps = prefersReducedMotion ? {} : { variants: fadeUp };

  if (isLoading || !room) {
    return (
      <div className="min-h-screen flex flex-col bg-background noise-bg">
        <div className="fixed inset-0 -z-10 mesh-gradient" />
        <div className="flex-1 flex items-center justify-center">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground font-medium">Loading room...</p>
          </motion.div>
        </div>
      </div>
    );
  }

  const modeBgClass = room.mode === 'study' ? 'mode-bg-study' : room.mode === 'challenge' ? 'mode-bg-challenge' : 'mode-bg-exam';

  return (
    <div className="min-h-screen flex flex-col bg-background noise-bg">
      {/* Mode-specific ambient background */}
      <div className={`fixed inset-0 -z-10 ${modeBgClass}`} />
      <div className="fixed inset-0 -z-10 mesh-gradient opacity-50" />

      {/* Header */}
      <header className="flex items-center justify-between px-3 sm:px-8 py-3 sm:py-4 border-b border-border/30 bg-background/60 backdrop-blur-xl sticky top-0 z-40">
        <div className="flex items-center gap-2 sm:gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')} className="text-muted-foreground hover:text-foreground min-h-[44px] min-w-[44px]">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Logo />
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <Badge variant="outline" className={`mode-${room.mode} gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 font-semibold text-[10px] sm:text-xs`}>
            {getModeIcon(room.mode)}
            <span className="hidden xs:inline">{getModeLabel(room.mode)}</span>
            <span className="xs:hidden">{room.mode}</span>
          </Badge>
          <ThemeToggle />
        </div>
      </header>

      {/* Room Hero — two-line on mobile */}
      <motion.div {...containerProps} className="border-b border-border/30 bg-card/30 backdrop-blur-sm">
        <div className="container max-w-6xl px-3 sm:px-8 py-5 sm:py-8">
          <motion.div {...itemProps}>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tighter mb-2">
              {room.name}
            </h1>
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap mb-3 sm:mb-0">
              <button
                onClick={handleCopyCode}
                className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-muted/50 hover:bg-muted transition-colors font-mono text-xs sm:text-sm text-muted-foreground min-h-[36px]"
              >
                {room.code}
                {copied ? <Check className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-success" /> : <Copy className="h-3 w-3 sm:h-3.5 sm:w-3.5" />}
              </button>
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
            {/* Upload button — full width on mobile */}
            <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2 font-semibold w-full sm:w-auto mt-3 sm:mt-0 sm:absolute sm:right-8 sm:top-8">
                  <Upload className="h-4 w-4" />
                  Upload Document
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg mx-4 sm:mx-auto">
                <DialogHeader>
                  <DialogTitle className="text-lg sm:text-xl font-bold">Upload Document</DialogTitle>
                  <DialogDescription className="text-xs sm:text-sm">Upload a PDF or paste your study material to generate quizzes</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="flex gap-2">
                    <Button variant={uploadMode === 'paste' ? 'default' : 'outline'} size="sm" onClick={() => setUploadMode('paste')} className="flex-1 min-h-[44px]">
                      Paste Text
                    </Button>
                    <Button variant={uploadMode === 'file' ? 'default' : 'outline'} size="sm" onClick={() => setUploadMode('file')} className="flex-1 min-h-[44px]">
                      Upload File
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <Label>Document name</Label>
                    <Input placeholder="e.g., Chapter 5 Notes" value={docName} onChange={(e) => setDocName(e.target.value)} className="h-11" />
                  </div>
                  {uploadMode === 'paste' ? (
                    <div className="space-y-2">
                      <Label>Content</Label>
                      <Textarea placeholder="Paste your study material here..." value={docContent} onChange={(e) => setDocContent(e.target.value)} rows={6} className="sm:rows-10" />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label>File</Label>
                      {!selectedFile ? (
                        <div
                          className="border-2 border-dashed border-border rounded-xl p-5 sm:p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <File className="h-8 w-8 sm:h-10 sm:w-10 mx-auto mb-2 sm:mb-3 text-muted-foreground" />
                          <p className="text-xs sm:text-sm font-medium">Click to upload a file</p>
                          <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">PDF, TXT, or MD files supported</p>
                        </div>
                      ) : (
                        <div className="border border-border rounded-xl p-3 sm:p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                              <div>
                                <p className="font-medium text-xs sm:text-sm">{selectedFile.name}</p>
                                <p className="text-[10px] sm:text-xs text-muted-foreground">{formatFileSize(selectedFile.size)}</p>
                              </div>
                            </div>
                            <Button variant="ghost" size="icon" onClick={clearSelectedFile} disabled={isParsing} className="min-h-[44px] min-w-[44px]">
                              {isParsing ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                            </Button>
                          </div>
                          {docContent && (
                            <p className="text-[10px] sm:text-xs text-muted-foreground mt-2">✓ Extracted {docContent.length.toLocaleString()} characters</p>
                          )}
                        </div>
                      )}
                      <input ref={fileInputRef} type="file" accept=".pdf,.txt,.md" onChange={handleFileSelect} className="hidden" />
                    </div>
                  )}
                  <Button className="w-full h-11 font-semibold" onClick={handleUploadDocument} disabled={isUploading || isParsing || !docName.trim() || !docContent.trim()}>
                    {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Upload Document
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </motion.div>
        </div>
      </motion.div>

      {/* Main content */}
      <main className="flex-1 container max-w-6xl py-6 sm:py-8 px-3 sm:px-8">
        <motion.div {...containerProps}>
          <Tabs defaultValue="quizzes" className="space-y-6 sm:space-y-8">
            <motion.div {...itemProps}>
              {/* Scrollable tabs on mobile */}
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
                {user?.id === room.owner_id && (
                  <TabsTrigger value="settings" className="gap-1.5 sm:gap-2 font-semibold min-h-[44px] text-xs sm:text-sm flex-1 sm:flex-none">
                    <Settings className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </TabsTrigger>
                )}
              </TabsList>
            </motion.div>

            {/* Quizzes Tab */}
            <TabsContent value="quizzes" className="space-y-6">
              {/* Quiz Generator */}
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
                <motion.div {...itemProps} className="bento-card">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="p-2.5 rounded-xl bg-primary/10">
                      <Sparkles className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">Generate Quiz</h3>
                      <p className="text-sm text-muted-foreground">Create AI-powered questions from your documents</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Document</Label>
                      <Select value={selectedDoc} onValueChange={setSelectedDoc}>
                        <SelectTrigger className="h-11"><SelectValue placeholder="Select document" /></SelectTrigger>
                        <SelectContent>
                          {documents.map((doc) => (<SelectItem key={doc.id} value={doc.id}>{doc.name}</SelectItem>))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Quiz title</Label>
                      <Input placeholder="e.g., Chapter 5 Quiz" value={quizTitle} onChange={(e) => setQuizTitle(e.target.value)} className="h-11" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Difficulty</Label>
                      <Select value={quizDifficulty} onValueChange={(v) => setQuizDifficulty(v as any)}>
                        <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="easy">Easy</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="hard">Hard</SelectItem>
                        </SelectContent>
                      </Select>
                      {userPreferences && quizDifficulty !== userPreferences.preferred_difficulty && (
                        <p className="text-2xs text-muted-foreground">Your default: {userPreferences.preferred_difficulty}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <QuestionCountSelector value={questionCount} onChange={setQuestionCount} min={5} max={25} />
                    </div>
                    <div className="flex items-end">
                      <Button className="w-full h-11 gap-2 font-semibold" onClick={handleGenerateQuiz} disabled={isGenerating || !selectedDoc || !quizTitle.trim()}>
                        {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                        Generate
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Quiz Grid */}
              {quizzes.length === 0 ? (
                <motion.div {...itemProps} className="bento-card py-16 flex flex-col items-center text-center">
                  <Sparkles className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <h3 className="font-bold text-lg mb-1">No quizzes yet</h3>
                  <p className="text-muted-foreground">Upload a document and generate your first quiz</p>
                </motion.div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {quizzes.map((quiz, index) => (
                    <motion.div key={quiz.id} {...itemProps} transition={{ delay: index * 0.05 }}>
                      <div
                        className="bento-card cursor-pointer group hover:shadow-lg relative"
                        onClick={() => navigate(`/quiz/${quiz.id}`)}
                      >
                        {/* Mode tint strip */}
                        <div className={`absolute top-0 left-0 right-0 h-1 rounded-t-xl ${
                          room.mode === 'study' ? 'bg-mode-study' :
                          room.mode === 'challenge' ? 'bg-mode-challenge' : 'bg-mode-exam'
                        }`} />

                        <div className="flex items-start justify-between gap-3 mt-2">
                          <div className="min-w-0 flex-1">
                            <h3 className="font-bold text-lg truncate group-hover:text-primary transition-colors">
                              {quiz.title}
                            </h3>
                            {quiz.description && (
                              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{quiz.description}</p>
                            )}
                            <div className="flex items-center gap-2 mt-3">
                              <Badge variant="outline" className={`${getDifficultyClass(quiz.difficulty)} text-xs`}>
                                {quiz.difficulty}
                              </Badge>
                              {quiz.time_limit_minutes && (
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Timer className="h-3 w-3" />
                                  {quiz.time_limit_minutes}m
                                </span>
                              )}
                            </div>
                          </div>
                          {user?.id === room.owner_id && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon"
                                  className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                                  onClick={(e) => e.stopPropagation()}>
                                  <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete quiz?</AlertDialogTitle>
                                  <AlertDialogDescription>This will permanently delete "{quiz.title}" and all its questions.</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeleteQuiz(quiz.id)}>Delete</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Documents Tab */}
            <TabsContent value="documents" className="space-y-6">
              {documents.length === 0 ? (
                <motion.div {...itemProps} className="bento-card py-16 flex flex-col items-center text-center">
                  <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <h3 className="font-bold text-lg mb-1">No documents yet</h3>
                  <p className="text-muted-foreground mb-4">Upload your first study material</p>
                  <Button onClick={() => setIsUploadOpen(true)} className="gap-2">
                    <Upload className="h-4 w-4" />
                    Upload Document
                  </Button>
                </motion.div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {documents.map((doc, index) => (
                    <motion.div key={doc.id} {...itemProps} transition={{ delay: index * 0.05 }}>
                      <div className="bento-card group relative">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                              <FileText className="h-5 w-5 text-primary" />
                            </div>
                            <div className="min-w-0">
                              <h3 className="font-bold truncate">{doc.name}</h3>
                              <p className="text-xs text-muted-foreground">{new Date(doc.created_at).toLocaleDateString()}</p>
                            </div>
                          </div>
                          {user?.id === room.owner_id && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                  <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete document?</AlertDialogTitle>
                                  <AlertDialogDescription>This will permanently delete "{doc.name}".</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeleteDocument(doc.id)}>Delete</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Members Tab */}
            <TabsContent value="members" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {members.map((member, index) => (
                  <motion.div key={member.id} {...itemProps} transition={{ delay: index * 0.05 }}>
                    <div className="bento-card">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                          <span className="text-primary font-bold text-lg">
                            {member.profile.username.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold truncate">{member.profile.display_name || member.profile.username}</p>
                          <p className="text-sm text-muted-foreground">@{member.profile.username}</p>
                        </div>
                        <Badge variant="outline" className={member.role === 'owner' ? 'border-gold/30 text-gold bg-gold/10' : ''}>
                          {member.role === 'owner' && <Crown className="h-3 w-3 mr-1" />}
                          {member.role}
                        </Badge>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </TabsContent>

            {/* Leaderboard Tab — Cinematic podium */}
            {room.leaderboard_enabled && (
              <TabsContent value="leaderboard" className="space-y-6">
                {leaderboard.length === 0 ? (
                  <motion.div {...itemProps} className="bento-card py-16 flex flex-col items-center text-center">
                    <Trophy className="h-12 w-12 text-muted-foreground/50 mb-4" />
                    <h3 className="font-bold text-lg mb-1">No scores yet</h3>
                    <p className="text-muted-foreground">Complete quizzes to appear on the leaderboard</p>
                  </motion.div>
                ) : (
                  <>
                    {/* Top 3 Podium */}
                    {leaderboard.length >= 1 && (
                      <motion.div {...itemProps} className="grid grid-cols-3 gap-4 max-w-2xl mx-auto mb-6">
                        {/* 2nd Place */}
                        <div className="flex flex-col items-center justify-end">
                          {leaderboard[1] && (
                            <motion.div
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.3 }}
                              className="text-center"
                            >
                              <div className="h-14 w-14 mx-auto rounded-xl bg-muted flex items-center justify-center mb-2">
                                <span className="font-bold text-lg">{leaderboard[1].username.charAt(0).toUpperCase()}</span>
                              </div>
                              <p className="font-bold text-sm truncate max-w-[100px]">{leaderboard[1].username}</p>
                              <p className="text-2xl font-black text-muted-foreground">{leaderboard[1].total_score}</p>
                              <div className="h-20 w-full rounded-t-xl bg-muted/50 border border-border/30 mt-2 flex items-center justify-center">
                                <Medal className="h-6 w-6 text-muted-foreground" />
                              </div>
                            </motion.div>
                          )}
                        </div>

                        {/* 1st Place */}
                        <div className="flex flex-col items-center justify-end">
                          <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
                            className="text-center"
                          >
                            <div className="h-16 w-16 mx-auto rounded-xl bg-gold/15 border-2 border-gold/30 flex items-center justify-center mb-2 legendary-glow">
                              <span className="font-black text-xl text-gold">{leaderboard[0].username.charAt(0).toUpperCase()}</span>
                            </div>
                            <p className="font-bold truncate max-w-[120px]">{leaderboard[0].username}</p>
                            <p className="text-3xl font-black text-gold">{leaderboard[0].total_score}</p>
                            <div className="h-28 w-full rounded-t-xl bg-gold/10 border border-gold/20 mt-2 flex items-center justify-center">
                              <Crown className="h-8 w-8 text-gold" />
                            </div>
                          </motion.div>
                        </div>

                        {/* 3rd Place */}
                        <div className="flex flex-col items-center justify-end">
                          {leaderboard[2] && (
                            <motion.div
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.5 }}
                              className="text-center"
                            >
                              <div className="h-14 w-14 mx-auto rounded-xl bg-muted flex items-center justify-center mb-2">
                                <span className="font-bold text-lg">{leaderboard[2].username.charAt(0).toUpperCase()}</span>
                              </div>
                              <p className="font-bold text-sm truncate max-w-[100px]">{leaderboard[2].username}</p>
                              <p className="text-2xl font-black text-muted-foreground">{leaderboard[2].total_score}</p>
                              <div className="h-14 w-full rounded-t-xl bg-muted/50 border border-border/30 mt-2 flex items-center justify-center">
                                <Award className="h-5 w-5 text-muted-foreground" />
                              </div>
                            </motion.div>
                          )}
                        </div>
                      </motion.div>
                    )}

                    {/* Full Rankings */}
                    <motion.div {...itemProps} className="bento-card p-0 overflow-hidden">
                      <div className="divide-y divide-border/30">
                        {leaderboard.map((entry, index) => (
                          <motion.div
                            key={entry.user_id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className={`flex items-center gap-4 px-6 py-4 transition-colors ${
                              entry.user_id === user?.id ? 'bg-primary/5' : 'hover:bg-muted/30'
                            }`}
                          >
                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm ${
                              index === 0 ? 'bg-gold/15 text-gold' :
                              index === 1 ? 'bg-muted text-foreground' :
                              index === 2 ? 'bg-muted text-foreground' :
                              'bg-muted/50 text-muted-foreground'
                            }`}>
                              {index + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold truncate">
                                {entry.username}
                                {entry.user_id === user?.id && <span className="text-xs text-primary ml-2">(you)</span>}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {entry.quizzes_taken} quiz{entry.quizzes_taken !== 1 ? 'zes' : ''} completed
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-black text-xl">{entry.total_score}</p>
                              <p className="text-2xs text-muted-foreground uppercase tracking-wider">points</p>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  </>
                )}
              </TabsContent>
            )}

            {/* Settings Tab */}
            {user?.id === room.owner_id && (
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
