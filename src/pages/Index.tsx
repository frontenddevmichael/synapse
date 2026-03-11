import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Upload,
  Users,
  Sparkles,
  BookOpen,
  Trophy,
  Timer,
  Check,
} from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';

import { useAuth } from '@/contexts/AuthContext';
import { Logo } from '@/components/Logo';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { PWAInstall } from '@/components/pwa/PWAInstall';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { fadeUp, stagger, viewport, staggerSlow } from '@/lib/motion';

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { shouldShowPrompt } = usePWAInstall();
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (!loading && user) navigate('/dashboard');
  }, [user, loading, navigate]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowInstallBanner(shouldShowPrompt);
    }, 3000);
    return () => clearTimeout(timer);
  }, [shouldShowPrompt]);

  const animationProps = prefersReducedMotion
    ? {}
    : { variants: stagger, initial: 'hidden', animate: 'visible' };

  const scrollAnimationProps = prefersReducedMotion
    ? {}
    : { variants: staggerSlow, initial: 'hidden', whileInView: 'visible', viewport };

  return (
    <div className="min-h-screen flex flex-col bg-background noise-bg overflow-hidden">
      {/* Mesh background */}
      <div className="fixed inset-0 -z-10 mesh-gradient" />
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-mode-study/5 rounded-full blur-[100px]" />
      </div>

      {/* Header */}
      <header className="flex items-center justify-between px-4 sm:px-8 py-4 sm:py-5 bg-background/60 backdrop-blur-xl sticky top-0 z-50 border-b border-border/30">
        <Logo size="lg" />
        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle />
          <Button variant="ghost" size="sm" onClick={() => navigate('/auth')} className="hidden sm:inline-flex font-medium">
            Sign in
          </Button>
          <Button size="sm" onClick={() => navigate('/auth')} className="font-semibold text-xs sm:text-sm">
            Get started
          </Button>
        </div>
      </header>

      {/* Hero */}
      <motion.section
        {...animationProps}
        className="flex-1 flex items-center py-10 sm:py-16 lg:py-32"
      >
        <div className="container max-w-6xl px-4 sm:px-8">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-20 items-center">
            <motion.div variants={stagger}>
              <motion.div variants={fadeUp} className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs sm:text-sm font-medium mb-6 sm:mb-8">
                <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                AI-powered quiz generation
              </motion.div>

              <motion.h1
                variants={fadeUp}
                className="text-display-lg font-black mb-4 sm:mb-6 leading-[1.05]"
              >
                Your notes,
                <br />
                <span className="text-primary">transformed</span>
              </motion.h1>

              <motion.p
                variants={fadeUp}
                className="text-base sm:text-lg lg:text-xl text-muted-foreground mb-6 sm:mb-8 max-w-lg leading-relaxed"
              >
                Upload study materials. Generate quizzes with AI.
                Compete with your group or study at your own pace.
              </motion.p>

              <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-3">
                <Button size="lg" onClick={() => navigate('/auth')} className="gap-2 h-12 sm:h-14 px-6 sm:px-8 text-sm sm:text-base font-semibold w-full sm:w-auto">
                  Start studying free <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
                <Button size="lg" variant="outline" onClick={() => navigate('/auth')} className="h-12 sm:h-14 px-6 sm:px-8 text-sm sm:text-base font-medium w-full sm:w-auto">
                  Join a room
                </Button>
              </motion.div>

              <motion.div
                variants={fadeUp}
                className="flex gap-6 sm:gap-8 mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-border/50"
              >
                <QuickStat value="3" label="quiz modes" />
                <QuickStat value="PDF" label="& text support" />
                <QuickStat value="Free" label="to start" />
              </motion.div>
            </motion.div>

            {/* Mockup — condensed on mobile, full on desktop */}
            <motion.div variants={fadeUp} className="block">
              <div className="relative">
                {/* Floating decorative element — desktop only */}
                <div className="hidden lg:block absolute -top-6 -right-6 h-24 w-24 rounded-2xl bg-primary/10 border border-primary/20 rotate-12 animate-float" />
                
                <div className="bg-card rounded-xl sm:rounded-2xl border border-border/50 shadow-xl sm:shadow-2xl p-4 sm:p-8 relative">
                  <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                    <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg sm:rounded-xl bg-primary/10 flex items-center justify-center">
                      <BookOpen className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                    </div>
                    <div>
                      <div className="font-semibold text-sm sm:text-base">Biology 101</div>
                      <div className="text-xs sm:text-sm text-muted-foreground">
                        12 questions • Study mode
                      </div>
                    </div>
                  </div>

                  <div className="p-3 sm:p-5 rounded-lg sm:rounded-xl bg-muted/50 border border-border/50">
                    <p className="font-serif text-base sm:text-lg mb-3 sm:mb-4">
                      What is the powerhouse of the cell?
                    </p>
                    <div className="grid grid-cols-2 gap-2 sm:gap-3">
                      {['Nucleus', 'Mitochondria', 'Ribosome', 'Golgi body'].map(
                        (opt, i) => (
                          <div
                            key={opt}
                            className={`text-xs sm:text-sm p-2 sm:p-3 rounded-lg border transition-all ${
                              i === 1
                                ? 'bg-success/10 border-success/30 text-success font-medium scale-[1.02]'
                                : 'bg-background border-border/50'
                            }`}
                          >
                            {opt}
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* How it works — horizontal scroll on mobile */}
      <motion.section
        {...scrollAnimationProps}
        className="py-14 sm:py-20 lg:py-32 border-t border-border/30"
      >
        <div className="container max-w-5xl px-4 sm:px-8">
          <motion.div variants={fadeUp} className="text-center mb-10 sm:mb-16">
            <h2 className="font-black mb-3 sm:mb-4">
              From notes to knowledge
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto text-base sm:text-lg">
              Three simple steps. No setup friction.
            </p>
          </motion.div>

          {/* Mobile: horizontal scroll carousel, Desktop: grid */}
          <motion.div variants={stagger} className="hidden sm:grid sm:grid-cols-2 md:grid-cols-3 gap-6 lg:gap-8">
            <ProcessCard step={1} icon={Users} title="Create or join" description="Private study rooms with shareable codes." />
            <ProcessCard step={2} icon={Upload} title="Upload materials" description="PDFs, notes, or pasted text." />
            <ProcessCard step={3} icon={Sparkles} title="Generate quizzes" description="AI-crafted questions from your content." />
          </motion.div>
          
          {/* Mobile carousel */}
          <div className="sm:hidden flex gap-3 overflow-x-auto snap-x snap-mandatory pb-4 -mx-4 px-4 scrollbar-hide">
            <ProcessCardMobile step={1} icon={Users} title="Create or join" description="Private study rooms with shareable codes." />
            <ProcessCardMobile step={2} icon={Upload} title="Upload materials" description="PDFs, notes, or pasted text." />
            <ProcessCardMobile step={3} icon={Sparkles} title="Generate quizzes" description="AI-crafted questions from your content." />
          </div>
        </div>
      </motion.section>

      {/* Modes — featured card first on mobile */}
      <motion.section
        {...scrollAnimationProps}
        className="py-14 sm:py-20 lg:py-32 border-t border-border/30"
      >
        <div className="container max-w-5xl px-4 sm:px-8">
          <motion.div variants={fadeUp} className="text-center mb-10 sm:mb-16">
            <h2 className="font-black mb-3 sm:mb-4">Three ways to study</h2>
            <p className="text-muted-foreground text-base sm:text-lg">
              Choose what matches your goal.
            </p>
          </motion.div>

          {/* Mobile: featured first, 2-col for rest */}
          <motion.div variants={stagger} className="hidden sm:grid sm:grid-cols-2 md:grid-cols-3 gap-6">
            <ModeCard icon={BookOpen} mode="Study" tint="mode-study" features={['Instant feedback', 'Learn at your pace', 'Review explanations']} />
            <ModeCard icon={Trophy} mode="Challenge" tint="mode-challenge" featured features={['Leaderboards', 'Timed rounds', 'Compete with friends']} />
            <ModeCard icon={Timer} mode="Exam" tint="mode-exam" features={['One attempt only', 'No answer review', 'Real test conditions']} />
          </motion.div>
          
          {/* Mobile layout */}
          <div className="sm:hidden space-y-3">
            <ModeCard icon={Trophy} mode="Challenge" tint="mode-challenge" featured features={['Leaderboards', 'Timed rounds', 'Compete with friends']} />
            <div className="grid grid-cols-2 gap-3">
              <ModeCard icon={BookOpen} mode="Study" tint="mode-study" features={['Instant feedback', 'Learn at your pace']} compact />
              <ModeCard icon={Timer} mode="Exam" tint="mode-exam" features={['One attempt only', 'Real test conditions']} compact />
            </div>
          </div>
        </div>
      </motion.section>

      {/* CTA */}
      <motion.section
        {...scrollAnimationProps}
        className="py-14 sm:py-20 lg:py-28 border-t border-border/30 text-center px-4"
      >
        <motion.h2 variants={fadeUp} className="font-black mb-3 sm:mb-4">
          Ready to study smarter?
        </motion.h2>
        <motion.p variants={fadeUp} className="text-muted-foreground mb-8 sm:mb-10 text-base sm:text-lg">
          Free to start. No credit card.
        </motion.p>
        <motion.div variants={fadeUp}>
          <Button size="lg" onClick={() => navigate('/auth')} className="gap-2 h-12 sm:h-14 px-6 sm:px-8 text-sm sm:text-base font-semibold w-full sm:w-auto">
            Create your first room <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
        </motion.div>
      </motion.section>

      {/* Install Section */}
      <PWAInstall variant="section" />

      {/* Footer */}
      <footer className="py-6 sm:py-8 border-t border-border/30 text-center pb-safe">
        <p className="text-xs sm:text-sm text-muted-foreground">
          © {new Date().getFullYear()} Synapse. Built for students who mean it.
        </p>
      </footer>

      {showInstallBanner && (
        <PWAInstall variant="banner" onClose={() => setShowInstallBanner(false)} />
      )}
    </div>
  );
};

const QuickStat = ({ value, label }: { value: string; label: string }) => (
  <div>
    <div className="text-xl sm:text-2xl font-black text-foreground">{value}</div>
    <div className="text-xs sm:text-sm text-muted-foreground">{label}</div>
  </div>
);

const ProcessCard = ({
  step,
  icon: Icon,
  title,
  description,
}: {
  step: number;
  icon: React.ElementType;
  title: string;
  description: string;
}) => (
  <motion.div
    variants={fadeUp}
    whileHover={{ y: -6, transition: { type: 'spring', stiffness: 300, damping: 20 } }}
    className="relative p-7 rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm hover:shadow-xl transition-shadow diagonal-accent"
  >
    <div className="absolute top-6 right-6 text-5xl font-black text-muted/50 leading-none">
      {step}
    </div>
    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-5">
      <Icon className="h-6 w-6 text-primary" />
    </div>
    <h3 className="font-bold text-lg mb-2">{title}</h3>
    <p className="text-muted-foreground">{description}</p>
  </motion.div>
);

const ProcessCardMobile = ({
  step,
  icon: Icon,
  title,
  description,
}: {
  step: number;
  icon: React.ElementType;
  title: string;
  description: string;
}) => (
  <div className="flex-shrink-0 w-[75vw] snap-center p-5 rounded-xl border border-border/50 bg-card/80 backdrop-blur-sm">
    <div className="flex items-center gap-3 mb-3">
      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <span className="text-3xl font-black text-muted/50">{step}</span>
    </div>
    <h3 className="font-bold mb-1">{title}</h3>
    <p className="text-sm text-muted-foreground">{description}</p>
  </div>
);

const ModeCard = ({
  icon: Icon,
  mode,
  tint,
  features,
  featured,
  compact,
}: {
  icon: React.ElementType;
  mode: string;
  tint: string;
  features: string[];
  featured?: boolean;
  compact?: boolean;
}) => (
  <motion.div
    variants={fadeUp}
    whileHover={{ scale: featured ? 1.03 : 1.01 }}
    className={`relative ${compact ? 'p-4' : 'p-5 sm:p-7'} rounded-xl sm:rounded-2xl border bg-card/80 backdrop-blur-sm transition-all ${
      featured
        ? 'border-mode-challenge/30 ring-1 ring-mode-challenge/10 shadow-xl'
        : 'border-border/50 hover:shadow-lg'
    }`}
  >
    {featured && (
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 sm:px-4 py-1 rounded-full bg-mode-challenge text-mode-challenge-foreground text-[10px] sm:text-xs font-bold">
        POPULAR
      </div>
    )}
    <div className={`${compact ? 'h-9 w-9' : 'h-10 w-10 sm:h-12 sm:w-12'} rounded-lg sm:rounded-xl flex items-center justify-center ${compact ? 'mb-3' : 'mb-4 sm:mb-5'} ${
      tint === 'mode-study' ? 'bg-mode-study/10' :
      tint === 'mode-challenge' ? 'bg-mode-challenge/10' :
      'bg-mode-exam/10'
    }`}>
      <Icon className={`${compact ? 'h-4 w-4' : 'h-5 w-5 sm:h-6 sm:w-6'} ${
        tint === 'mode-study' ? 'text-mode-study' :
        tint === 'mode-challenge' ? 'text-mode-challenge' :
        'text-mode-exam'
      }`} />
    </div>
    <h3 className={`font-bold ${compact ? 'text-sm mb-2' : 'text-base sm:text-lg mb-3 sm:mb-4'}`}>{mode} mode</h3>
    <ul className={`space-y-${compact ? '1.5' : '2 sm:space-y-2.5'}`}>
      {features.map((f) => (
        <li key={f} className={`flex items-center gap-2 ${compact ? 'text-xs' : 'text-xs sm:text-sm'} text-muted-foreground`}>
          <Check className={`${compact ? 'h-3 w-3' : 'h-3.5 w-3.5 sm:h-4 sm:w-4'} text-success flex-shrink-0`} />
          {f}
        </li>
      ))}
    </ul>
  </motion.div>
);

export default Index;
