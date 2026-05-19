import { memo } from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { QuestionCountSelector } from '@/components/quiz/QuestionCountSelector';

type Difficulty = 'easy' | 'medium' | 'hard';

interface QuizLauncherProps {
  documents: { id: string; name: string }[];
  selectedDoc: string;
  onSelectDoc: (id: string) => void;
  title: string;
  onTitleChange: (v: string) => void;
  difficulty: Difficulty;
  onDifficultyChange: (d: Difficulty) => void;
  preferredDifficulty?: Difficulty | null;
  questionCount: number;
  onQuestionCountChange: (n: number) => void;
  isGenerating: boolean;
  onGenerate: () => void;
}

function QuizLauncherImpl({
  documents, selectedDoc, onSelectDoc, title, onTitleChange,
  difficulty, onDifficultyChange, preferredDifficulty,
  questionCount, onQuestionCountChange, isGenerating, onGenerate,
}: QuizLauncherProps) {
  return (
    <div className="bento-card">
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
          <Select value={selectedDoc} onValueChange={onSelectDoc}>
            <SelectTrigger className="h-11"><SelectValue placeholder="Select document" /></SelectTrigger>
            <SelectContent>
              {documents.map((doc) => (<SelectItem key={doc.id} value={doc.id}>{doc.name}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Quiz title</Label>
          <Input placeholder="e.g., Chapter 5 Quiz" value={title} onChange={(e) => onTitleChange(e.target.value)} className="h-11" />
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Difficulty</Label>
          <Select value={difficulty} onValueChange={(v) => onDifficultyChange(v as Difficulty)}>
            <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="easy">Easy</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="hard">Hard</SelectItem>
            </SelectContent>
          </Select>
          {preferredDifficulty && difficulty !== preferredDifficulty && (
            <p className="text-2xs text-muted-foreground">Your default: {preferredDifficulty}</p>
          )}
        </div>
        <div className="space-y-2">
          <QuestionCountSelector value={questionCount} onChange={onQuestionCountChange} min={5} max={25} />
        </div>
        <div className="flex items-end">
          <Button className="w-full h-11 gap-2 font-semibold" onClick={onGenerate} disabled={isGenerating || !selectedDoc || !title.trim()}>
            {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Generate
          </Button>
        </div>
      </div>
    </div>
  );
}

export const QuizLauncher = memo(QuizLauncherImpl);
