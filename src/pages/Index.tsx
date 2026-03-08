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
import { InstallPrompt } from '@/components/pwa/InstallPrompt';
import { InstallSection } from '@/components/pwa/InstallSection';
import { InstallButton } from '@/components/pwa/InstallButton';
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
      <header className="flex items-center justify-between px-4 sm:px-8 py-5 bg-background/60 backdrop-blur-xl sticky top-0 z-50 border-b border-border/30">
        <Logo size="lg" />
        <div className="flex items-center gap-3">
          <InstallButton className="hidden sm:inline-flex" />
          <ThemeToggle />
          <Button variant="ghost" size="sm" onClick={() => navigate('/auth')} className="hidden sm:inline-flex font-medium">
            Sign in
          </Button>
          <Button size="sm" onClick={() => navigate('/auth')} className="font-semibold">
            Get started
          </Button>
        </div>
      </header>

      {/* Hero */}
      <motion.section
        {...animationProps}
        className="flex-1 flex items-center py-16 sm:py-24 lg:py-32"
      >
        <div className="container max-w-6xl px-4 sm:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <motion.div variants={stagger}>
              <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-8">
                <Sparkles className="h-4 w-4" />
                AI-powered quiz generation
              </motion.div>

              <motion.h1
                variants={fadeUp}
                className="text-display-lg font-black mb-6 leading-[1.05]"
              >
                Your notes,
                <br />
                <span className="text-primary">transformed</span>
              </motion.h1>

              <motion.p
                variants={fadeUp}
                className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-lg leading-relaxed"
              >
                Upload study materials. Generate quizzes with AI.
                Compete with your group or study at your own pace.
              </motion.p>

              <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-3">
                <Button size="lg" onClick={() => navigate('/auth')} className="gap-2 h-14 px-8 text-base font-semibold w-full sm:w-auto">
                  Start studying free <ArrowRight className="h-5 w-5" />
                </Button>
                <Button size="lg" variant="outline" onClick={() => navigate('/auth')} className="h-14 px-8 text-base font-medium w-full sm:w-auto">
                  Join a room
                </Button>
              </motion.div>

              <motion.div
                variants={fadeUp}
                className="flex gap-8 mt-12 pt-8 border-t border-border/50"
              >
                <QuickStat value="3" label="quiz modes" />
                <QuickStat value="PDF" label="& text support" />
                <QuickStat value="Free" label="to start" />
              </motion.div>
            </motion.div>

            {/* Mockup */}
            <motion.div variants={fadeUp} className="hidden lg:block">
              <div className="relative">
                {/* Floating decorative element */}
                <div className="absolute -top-6 -right-6 h-24 w-24 rounded-2xl bg-primary/10 border border-primary/20 rotate-12 animate-float" />
                
                <div className="bg-card rounded-2xl border border-border/50 shadow-2xl p-8 relative">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <BookOpen className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <div className="font-semibold">Biology 101</div>
                      <div className="text-sm text-muted-foreground">
                        12 questions • Study mode
                      </div>
                    </div>
                  </div>

                  <div className="p-5 rounded-xl bg-muted/50 border border-border/50">
                    <p className="font-serif text-lg mb-4">
                      What is the powerhouse of the cell?
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      {['Nucleus', 'Mitochondria', 'Ribosome', 'Golgi body'].map(
                        (opt, i) => (
                          <div
                            key={opt}
                            className={`text-sm p-3 rounded-lg border transition-all ${
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

      {/* How it works */}
      <motion.section
        {...scrollAnimationProps}
        className="py-20 sm:py-32 border-t border-border/30"
      >
        <div className="container max-w-5xl px-4 sm:px-8">
          <motion.div variants={fadeUp} className="text-center mb-16">
            <h2 className="font-black mb-4">
              From notes to knowledge
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto text-lg">
              Three simple steps. No setup friction.
            </p>
          </motion.div>

          <motion.div variants={stagger} className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 lg:gap-8">
            <ProcessCard step={1} icon={Users} title="Create or join" description="Private study rooms with shareable codes." />
            <ProcessCard step={2} icon={Upload} title="Upload materials" description="PDFs, notes, or pasted text." />
            <ProcessCard step={3} icon={Sparkles} title="Generate quizzes" description="AI-crafted questions from your content." />
          </motion.div>
        </div>
      </motion.section>

      {/* Modes */}
      <motion.section
        {...scrollAnimationProps}
        className="py-20 sm:py-32 border-t border-border/30"
      >
        <div className="container max-w-5xl px-4 sm:px-8">
          <motion.div variants={fadeUp} className="text-center mb-16">
            <h2 className="font-black mb-4">Three ways to study</h2>
            <p className="text-muted-foreground text-lg">
              Choose what matches your goal.
            </p>
          </motion.div>

          <motion.div variants={stagger} className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
            <ModeCard icon={BookOpen} mode="Study" tint="mode-study" features={['Instant feedback', 'Learn at your pace', 'Review explanations']} />
            <ModeCard icon={Trophy} mode="Challenge" tint="mode-challenge" featured features={['Leaderboards', 'Timed rounds', 'Compete with friends']} />
            <ModeCard icon={Timer} mode="Exam" tint="mode-exam" features={['One attempt only', 'No answer review', 'Real test conditions']} />
          </motion.div>
        </div>
      </motion.section>

      {/* CTA */}
      <motion.section
        {...scrollAnimationProps}
        className="py-20 sm:py-28 border-t border-border/30 text-center px-4"
      >
        <motion.h2 variants={fadeUp} className="font-black mb-4">
          Ready to study smarter?
        </motion.h2>
        <motion.p variants={fadeUp} className="text-muted-foreground mb-10 text-lg">
          Free to start. No credit card.
        </motion.p>
        <motion.div variants={fadeUp}>
          <Button size="lg" onClick={() => navigate('/auth')} className="gap-2 h-14 px-8 text-base font-semibold w-full sm:w-auto">
            Create your first room <ArrowRight className="h-5 w-5" />
          </Button>
        </motion.div>
      </motion.section>

      {/* Install Section */}
      <InstallSection />

      {/* Footer */}
      <footer className="py-8 border-t border-border/30 text-center">
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} Synapse. Built for students who mean it.
        </p>
      </footer>

      {showInstallBanner && (
        <InstallPrompt variant="banner" onClose={() => setShowInstallBanner(false)} />
      )}
    </div>
  );
};

const QuickStat = ({ value, label }: { value: string; label: string }) => (
  <div>
    <div className="text-2xl font-black text-foreground">{value}</div>
    <div className="text-sm text-muted-foreground">{label}</div>
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

const ModeCard = ({
  icon: Icon,
  mode,
  tint,
  features,
  featured,
}: {
  icon: React.ElementType;
  mode: string;
  tint: string;
  features: string[];
  featured?: boolean;
}) => (
  <motion.div
    variants={fadeUp}
    whileHover={{ scale: featured ? 1.03 : 1.01 }}
    className={`relative p-7 rounded-2xl border bg-card/80 backdrop-blur-sm transition-all ${
      featured
        ? 'border-mode-challenge/30 ring-1 ring-mode-challenge/10 shadow-xl'
        : 'border-border/50 hover:shadow-lg'
    }`}
  >
    {featured && (
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-mode-challenge text-mode-challenge-foreground text-xs font-bold">
        POPULAR
      </div>
    )}
    <div className={`h-12 w-12 rounded-xl flex items-center justify-center mb-5 ${
      tint === 'mode-study' ? 'bg-mode-study/10' :
      tint === 'mode-challenge' ? 'bg-mode-challenge/10' :
      'bg-mode-exam/10'
    }`}>
      <Icon className={`h-6 w-6 ${
        tint === 'mode-study' ? 'text-mode-study' :
        tint === 'mode-challenge' ? 'text-mode-challenge' :
        'text-mode-exam'
      }`} />
    </div>
    <h3 className="font-bold text-lg mb-4">{mode} mode</h3>
    <ul className="space-y-2.5">
      {features.map((f) => (
        <li key={f} className="flex items-center gap-2.5 text-sm text-muted-foreground">
          <Check className="h-4 w-4 text-success flex-shrink-0" />
          {f}
        </li>
      ))}
    </ul>
  </motion.div>
);

export default Index;
