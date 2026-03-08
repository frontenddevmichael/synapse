import { motion } from 'framer-motion';
import { Sparkles, Brain, FileText, CheckCircle } from 'lucide-react';
import { useState, useEffect } from 'react';

interface QuizGeneratingOverlayProps {
  isGenerating: boolean;
  documentName: string;
  questionCount: number;
  difficulty: string;
}

const stages = [
  { icon: FileText, label: 'Reading document...', duration: 2000 },
  { icon: Brain, label: 'Analyzing content...', duration: 3000 },
  { icon: Sparkles, label: 'Generating questions...', duration: 4000 },
  { icon: CheckCircle, label: 'Finalizing quiz...', duration: 2000 },
];

export function QuizGeneratingOverlay({ isGenerating, documentName, questionCount, difficulty }: QuizGeneratingOverlayProps) {
  const [currentStage, setCurrentStage] = useState(0);

  useEffect(() => {
    if (!isGenerating) { setCurrentStage(0); return; }

    let stageIndex = 0;
    const advanceStage = () => {
      stageIndex++;
      if (stageIndex < stages.length) {
        setCurrentStage(stageIndex);
        setTimeout(advanceStage, stages[stageIndex].duration);
      }
    };
    setTimeout(advanceStage, stages[0].duration);

    return () => { stageIndex = stages.length; };
  }, [isGenerating]);

  if (!isGenerating) return null;

  const stage = stages[currentStage];
  const Icon = stage.icon;
  const progress = ((currentStage + 1) / stages.length) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="bento-card border-primary/20 bg-card/90 backdrop-blur-sm overflow-hidden"
    >
      {/* Progress bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-muted">
        <motion.div
          className="h-full bg-primary"
          initial={{ width: '0%' }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>

      <div className="flex items-center gap-4 pt-2">
        <motion.div
          key={currentStage}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0"
        >
          <Icon className="h-6 w-6 text-primary animate-pulse" />
        </motion.div>
        <div className="flex-1 min-w-0">
          <motion.p
            key={stage.label}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            className="font-bold"
          >
            {stage.label}
          </motion.p>
          <p className="text-sm text-muted-foreground">
            {documentName} · {questionCount} {difficulty} questions
          </p>
        </div>
      </div>
    </motion.div>
  );
}
