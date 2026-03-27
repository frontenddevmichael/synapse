import { motion } from 'framer-motion';
import { Plus, Upload, Sparkles, ArrowRight } from 'lucide-react';
import { fadeUp } from '@/lib/motion';

interface OnboardingCardProps {
  onCreateRoom: () => void;
}

export function OnboardingCard({ onCreateRoom }: OnboardingCardProps) {
  return (
    <motion.div
      variants={fadeUp}
      className="bento-card p-6 sm:p-8 border-primary/20 bg-primary/5"
    >
      <h3 className="font-bold text-lg sm:text-xl mb-2">Welcome to Synapse 👋</h3>
      <p className="text-sm text-muted-foreground mb-6">
        Get your first quiz in under 90 seconds. Here's how:
      </p>
      <div className="space-y-4">
        <Step number={1} icon={<Plus className="h-4 w-4" />} title="Create a room" description="Pick a name and a study mode" />
        <Step number={2} icon={<Upload className="h-4 w-4" />} title="Upload your notes" description="PDF or paste raw text" />
        <Step number={3} icon={<Sparkles className="h-4 w-4" />} title="Generate a quiz" description="AI builds questions from your material" />
      </div>
      <button
        onClick={onCreateRoom}
        className="mt-6 inline-flex items-center gap-2 text-primary font-semibold text-sm hover:underline underline-offset-4"
      >
        Create your first room <ArrowRight className="h-4 w-4" />
      </button>
    </motion.div>
  );
}

function Step({ number, icon, title, description }: { number: number; icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold shrink-0 mt-0.5">
        {number}
      </div>
      <div>
        <p className="font-medium text-sm">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
