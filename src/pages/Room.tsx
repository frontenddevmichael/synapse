import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Upload, 
  FileText, 
  Sparkles, 
  Trophy,
  Users,
  Settings,
  Copy,
  Check
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Logo } from '@/components/Logo';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

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

const RoomPage = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [room, setRoom] = useState<Room | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  
  // Document upload
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [docName, setDocName] = useState('');
  const [docContent, setDocContent] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  
  // Quiz generation
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<string>('');
  const [quizTitle, setQuizTitle] = useState('');
  const [quizDifficulty, setQuizDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    if (roomId) {
      fetchRoomData();
    }
  }, [user, roomId, navigate]);

  const fetchRoomData = async () => {
    if (!roomId || !user) return;

    setIsLoading(true);

    // Fetch room
    const { data: roomData, error: roomError } = await supabase
      .from('rooms')
      .select('*')
      .eq('id', roomId)
      .maybeSingle();

    if (roomError || !roomData) {
      toast({
        title: 'Room not found',
        description: 'This room may not exist or you may not have access.',
        variant: 'destructive',
      });
      navigate('/dashboard');
      return;
    }

    setRoom(roomData as Room);

    // Fetch documents
    const { data: docsData } = await supabase
      .from('documents')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at', { ascending: false });

    setDocuments((docsData as Document[]) || []);

    // Fetch quizzes
    const { data: quizzesData } = await supabase
      .from('quizzes')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at', { ascending: false });

    setQuizzes((quizzesData as Quiz[]) || []);

    // Fetch members with profiles
    const { data: membersData } = await supabase
      .from('room_members')
      .select(`
        id,
        user_id,
        role,
        profile:profiles(username, display_name)
      `)
      .eq('room_id', roomId);

    if (membersData) {
      const formattedMembers = membersData.map((m: any) => ({
        id: m.id,
        user_id: m.user_id,
        role: m.role,
        profile: m.profile || { username: 'Unknown', display_name: null }
      }));
      setMembers(formattedMembers);
    }

    // Fetch leaderboard if enabled
    if (roomData.leaderboard_enabled) {
      const { data: attemptsData } = await supabase
        .from('quiz_attempts')
        .select(`
          user_id,
          score,
          quiz:quizzes!inner(room_id)
        `)
        .eq('quiz.room_id', roomId)
        .eq('status', 'completed');

      if (attemptsData) {
        // Aggregate scores by user
        const scoreMap: Record<string, { total: number; count: number }> = {};
        attemptsData.forEach((attempt: any) => {
          if (!scoreMap[attempt.user_id]) {
            scoreMap[attempt.user_id] = { total: 0, count: 0 };
          }
          scoreMap[attempt.user_id].total += attempt.score || 0;
          scoreMap[attempt.user_id].count += 1;
        });

        // Get usernames
        const userIds = Object.keys(scoreMap);
        if (userIds.length > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, username')
            .in('id', userIds);

          const leaderboardData: LeaderboardEntry[] = userIds.map(userId => {
            const profile = profiles?.find((p: any) => p.id === userId);
            return {
              user_id: userId,
              username: profile?.username || 'Unknown',
              total_score: scoreMap[userId].total,
              quizzes_taken: scoreMap[userId].count,
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

  const handleUploadDocument = async () => {
    if (!user || !roomId || !docName.trim() || !docContent.trim()) return;

    setIsUploading(true);

    const { error } = await supabase.from('documents').insert({
      room_id: roomId,
      uploaded_by: user.id,
      name: docName.trim(),
      content: docContent.trim(),
    });

    if (error) {
      toast({
        title: 'Upload failed',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Document uploaded!',
        description: 'You can now generate quizzes from this document.',
      });
      setDocName('');
      setDocContent('');
      setIsUploadOpen(false);
      fetchRoomData();
    }

    setIsUploading(false);
  };

  const handleGenerateQuiz = async () => {
    if (!user || !roomId || !selectedDoc || !quizTitle.trim()) return;

    setIsGenerating(true);

    // Get document content
    const doc = documents.find(d => d.id === selectedDoc);
    if (!doc) {
      toast({
        title: 'Document not found',
        variant: 'destructive',
      });
      setIsGenerating(false);
      return;
    }

    // Create quiz
    const { data: quiz, error: quizError } = await supabase
      .from('quizzes')
      .insert({
        room_id: roomId,
        document_id: selectedDoc,
        title: quizTitle.trim(),
        difficulty: quizDifficulty,
        created_by: user.id,
      })
      .select()
      .single();

    if (quizError) {
      toast({
        title: 'Failed to create quiz',
        description: quizError.message,
        variant: 'destructive',
      });
      setIsGenerating(false);
      return;
    }

    // Generate sample questions (in production, this would call an AI API)
    const sampleQuestions = generateSampleQuestions(doc.content || '', quizDifficulty);

    // Insert questions
    const questionsToInsert = sampleQuestions.map((q, index) => ({
      quiz_id: quiz.id,
      question_text: q.question,
      question_type: q.type,
      options: q.options,
      correct_answer: q.correct,
      order_index: index,
    }));

    await supabase.from('questions').insert(questionsToInsert);

    toast({
      title: 'Quiz generated!',
      description: `Created ${sampleQuestions.length} questions.`,
    });

    setQuizTitle('');
    setSelectedDoc('');
    setIsGenerating(false);
    fetchRoomData();
  };

  const generateSampleQuestions = (content: string, difficulty: string) => {
    // This is a placeholder - in production, this would call an AI API
    const questions = [
      {
        question: `Based on the document, what is the main topic discussed?`,
        type: 'multiple_choice',
        options: JSON.stringify(['Option A', 'Option B', 'Option C', 'Option D']),
        correct: 'Option A',
      },
      {
        question: `True or False: The document covers advanced concepts.`,
        type: 'true_false',
        options: JSON.stringify(['True', 'False']),
        correct: 'True',
      },
      {
        question: `Which concept is NOT mentioned in the document?`,
        type: 'multiple_choice',
        options: JSON.stringify(['Concept 1', 'Concept 2', 'Concept 3', 'Concept 4']),
        correct: 'Concept 4',
      },
    ];

    return questions;
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

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-success/10 text-success';
      case 'medium':
        return 'bg-warning/10 text-warning';
      case 'hard':
        return 'bg-destructive/10 text-destructive';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  if (isLoading || !room) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading room...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Logo />
        </div>
        <ThemeToggle />
      </header>

      {/* Room header */}
      <div className="border-b border-border p-6">
        <div className="container max-w-6xl">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold">{room.name}</h1>
                <Badge variant="outline" className={getModeColor(room.mode)}>
                  {room.mode}
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <span className="font-mono">Code: {room.code}</span>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleCopyCode}>
                  {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                </Button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Upload className="h-4 w-4" />
                    Upload Document
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Upload Document</DialogTitle>
                    <DialogDescription>
                      Paste your study material to generate quizzes
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label>Document name</Label>
                      <Input
                        placeholder="e.g., Chapter 5 Notes"
                        value={docName}
                        onChange={(e) => setDocName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Content</Label>
                      <Textarea
                        placeholder="Paste your study material here..."
                        value={docContent}
                        onChange={(e) => setDocContent(e.target.value)}
                        rows={10}
                      />
                    </div>
                    <Button 
                      className="w-full" 
                      onClick={handleUploadDocument}
                      disabled={isUploading || !docName.trim() || !docContent.trim()}
                    >
                      Upload Document
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 container max-w-6xl py-6">
        <Tabs defaultValue="quizzes">
          <TabsList>
            <TabsTrigger value="quizzes" className="gap-2">
              <Sparkles className="h-4 w-4" />
              Quizzes
            </TabsTrigger>
            <TabsTrigger value="documents" className="gap-2">
              <FileText className="h-4 w-4" />
              Documents
            </TabsTrigger>
            <TabsTrigger value="members" className="gap-2">
              <Users className="h-4 w-4" />
              Members
            </TabsTrigger>
            {room.leaderboard_enabled && (
              <TabsTrigger value="leaderboard" className="gap-2">
                <Trophy className="h-4 w-4" />
                Leaderboard
              </TabsTrigger>
            )}
          </TabsList>

          {/* Quizzes Tab */}
          <TabsContent value="quizzes" className="mt-6">
            {documents.length > 0 && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="text-lg">Generate Quiz</CardTitle>
                  <CardDescription>Create a quiz from your uploaded documents</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label>Document</Label>
                      <Select value={selectedDoc} onValueChange={setSelectedDoc}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select document" />
                        </SelectTrigger>
                        <SelectContent>
                          {documents.map((doc) => (
                            <SelectItem key={doc.id} value={doc.id}>
                              {doc.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Quiz title</Label>
                      <Input
                        placeholder="e.g., Chapter 5 Quiz"
                        value={quizTitle}
                        onChange={(e) => setQuizTitle(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Difficulty</Label>
                      <Select value={quizDifficulty} onValueChange={(v) => setQuizDifficulty(v as any)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="easy">Easy</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="hard">Hard</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-end">
                      <Button 
                        className="w-full gap-2" 
                        onClick={handleGenerateQuiz}
                        disabled={isGenerating || !selectedDoc || !quizTitle.trim()}
                      >
                        <Sparkles className="h-4 w-4" />
                        Generate
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {quizzes.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <Sparkles className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="font-semibold mb-2">No quizzes yet</h3>
                  <p className="text-muted-foreground">
                    Upload a document and generate your first quiz
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {quizzes.map((quiz) => (
                  <Card 
                    key={quiz.id} 
                    className="cursor-pointer hover:border-primary/50 transition-colors"
                    onClick={() => navigate(`/quiz/${quiz.id}`)}
                  >
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{quiz.title}</CardTitle>
                        <Badge className={getDifficultyColor(quiz.difficulty)}>
                          {quiz.difficulty}
                        </Badge>
                      </div>
                      {quiz.description && (
                        <CardDescription>{quiz.description}</CardDescription>
                      )}
                    </CardHeader>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents" className="mt-6">
            {documents.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="font-semibold mb-2">No documents yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Upload your first study material
                  </p>
                  <Button onClick={() => setIsUploadOpen(true)}>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Document
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {documents.map((doc) => (
                  <Card key={doc.id}>
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <CardTitle className="text-lg">{doc.name}</CardTitle>
                      </div>
                      <CardDescription>
                        {new Date(doc.created_at).toLocaleDateString()}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Members Tab */}
          <TabsContent value="members" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {members.map((member) => (
                <Card key={member.id}>
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-primary font-semibold">
                        {member.profile.username.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{member.profile.display_name || member.profile.username}</p>
                      <p className="text-sm text-muted-foreground">@{member.profile.username}</p>
                    </div>
                    <Badge variant="outline">{member.role}</Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Leaderboard Tab */}
          {room.leaderboard_enabled && (
            <TabsContent value="leaderboard" className="mt-6">
              {leaderboard.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                    <Trophy className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="font-semibold mb-2">No scores yet</h3>
                    <p className="text-muted-foreground">
                      Complete quizzes to appear on the leaderboard
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-0">
                    <div className="divide-y divide-border">
                      {leaderboard.map((entry, index) => (
                        <div 
                          key={entry.user_id} 
                          className={`flex items-center gap-4 p-4 ${
                            entry.user_id === user?.id ? 'bg-primary/5' : ''
                          }`}
                        >
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center font-bold">
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">{entry.username}</p>
                            <p className="text-sm text-muted-foreground">
                              {entry.quizzes_taken} quiz{entry.quizzes_taken !== 1 ? 'zes' : ''} completed
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-lg">{entry.total_score}</p>
                            <p className="text-sm text-muted-foreground">points</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          )}
        </Tabs>
      </main>
    </div>
  );
};

export default RoomPage;
