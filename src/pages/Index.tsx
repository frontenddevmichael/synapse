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

  // Disable animations if user prefers reduced motion
  const animationProps = prefersReducedMotion 
    ? {} 
    : { variants: stagger, initial: 'hidden', animate: 'visible' };
  
  const scrollAnimationProps = prefersReducedMotion
    ? {}
    : { variants: staggerSlow, initial: 'hidden', whileInView: 'visible', viewport };

  return (
    <div className="min-h-screen flex flex-col bg-background overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/3 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/3 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-border/50 bg-background/80 backdrop-blur sticky top-0 z-50">
        <Logo />
        <div className="flex items-center gap-2">
          <InstallButton className="hidden sm:inline-flex" />
          <ThemeToggle />
          <Button variant="ghost" size="sm" onClick={() => navigate('/auth')} className="hidden sm:inline-flex">
            Sign in
          </Button>
          <Button size="sm" onClick={() => navigate('/auth')}>
            Get started
          </Button>
        </div>
      </header>

      {/* Hero */}
      <motion.section
        {...animationProps}
        className="flex-1 flex items-center py-12 sm:py-20 lg:py-32"
      >
        <div className="container max-w-6xl px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <motion.div variants={stagger}>
              <motion.h1
                variants={fadeUp}
                className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold mb-4 sm:mb-6 leading-[1.1]"
              >
                Your notes,
                <br />
                <span className="text-primary">transformed into quizzes</span>
              </motion.h1>

              <motion.p
                variants={fadeUp}
                className="text-base sm:text-lg text-muted-foreground mb-6 sm:mb-8 max-w-lg"
              >
                Upload your study materials. Synapse generates questions.
                Quiz yourself or compete with your group.
              </motion.p>

              <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-3">
                <Button size="lg" onClick={() => navigate('/auth')} className="gap-2 w-full sm:w-auto">
                  Start studying free <ArrowRight className="h-4 w-4" />
                </Button>
                <Button size="lg" variant="outline" onClick={() => navigate('/auth')} className="w-full sm:w-auto">
                  Join a room
                </Button>
              </motion.div>

              <motion.div
                variants={fadeUp}
                className="flex gap-6 mt-8 sm:mt-10 pt-6 sm:pt-8 border-t border-border/50"
              >
                <QuickStat value="3" label="quiz modes" />
                <QuickStat value="PDF" label="& text support" />
                <QuickStat value="Free" label="to start" />
              </motion.div>
            </motion.div>

            {/* Mockup */}
            <motion.div variants={fadeUp} className="hidden lg:block">
              <div className="bg-card rounded-2xl border shadow-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <BookOpen className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium text-sm">Biology 101</div>
                    <div className="text-xs text-muted-foreground">
                      12 questions • Study mode
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-muted/50 border">
                  <p className="text-sm font-medium mb-2">
                    What is the powerhouse of the cell?
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {['Nucleus', 'Mitochondria', 'Ribosome', 'Golgi body'].map(
                      (opt, i) => (
                        <div
                          key={opt}
                          className={`text-xs p-2 rounded-md border ${
                            i === 1
                              ? 'bg-success/10 border-success/30 text-success'
                              : 'bg-background'
                          }`}
                        >
                          {opt}
                        </div>
                      )
                    )}
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
        className="py-16 sm:py-24 border-t border-border bg-muted/30"
      >
        <div className="container max-w-5xl px-4 sm:px-6">
          <motion.div variants={fadeUp} className="text-center mb-10 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl font-semibold mb-3 sm:mb-4">
              From notes to knowledge
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto text-sm sm:text-base">
              Three simple steps. No setup friction.
            </p>
          </motion.div>

          <motion.div variants={stagger} className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            <ProcessCard icon={Users} title="Create or join" description="Private study rooms with shareable codes." />
            <ProcessCard icon={Upload} title="Upload materials" description="PDFs, notes, or pasted text." />
            <ProcessCard icon={Sparkles} title="Generate quizzes" description="AI-crafted questions from your content." />
          </motion.div>
        </div>
      </motion.section>

      {/* Modes */}
      <motion.section
        {...scrollAnimationProps}
        className="py-16 sm:py-24 border-t border-border"
      >
        <div className="container max-w-5xl px-4 sm:px-6">
          <motion.div variants={fadeUp} className="text-center mb-10 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl font-semibold mb-3 sm:mb-4">Three ways to study</h2>
            <p className="text-muted-foreground text-sm sm:text-base">
              Choose what matches your learning style.
            </p>
          </motion.div>

          <motion.div variants={stagger} className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
            <ModeCard icon={BookOpen} mode="Study" features={['Instant feedback', 'Learn at your pace']} />
            <ModeCard icon={Trophy} mode="Challenge" featured features={['Leaderboards', 'Compete with friends']} />
            <ModeCard icon={Timer} mode="Exam" features={['One attempt', 'Timed sessions']} />
          </motion.div>
        </div>
      </motion.section>

      {/* CTA */}
      <motion.section
        {...scrollAnimationProps}
        className="py-16 sm:py-20 border-t border-border text-center px-4"
      >
        <motion.h2 variants={fadeUp} className="text-2xl sm:text-3xl font-semibold mb-3 sm:mb-4">
          Ready to study smarter?
        </motion.h2>
        <motion.p variants={fadeUp} className="text-muted-foreground mb-6 sm:mb-8 text-sm sm:text-base">
          Free to start. No credit card.
        </motion.p>
        <motion.div variants={fadeUp}>
          <Button size="lg" onClick={() => navigate('/auth')} className="gap-2 w-full sm:w-auto">
            Create your first room <ArrowRight className="h-4 w-4" />
          </Button>
        </motion.div>
      </motion.section>

      {/* Install Section */}
      <InstallSection />

      {/* Footer */}
      <footer className="py-6 border-t border-border text-center">
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} Synapse. Built for students.
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
    <div className="text-base sm:text-lg font-semibold">{value}</div>
    <div className="text-xs text-muted-foreground">{label}</div>
  </div>
);

const ProcessCard = ({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
}) => (
  <motion.div
    variants={fadeUp}
    whileHover={{ y: -4 }}
    transition={{ type: 'spring', stiffness: 260, damping: 20 }}
    className="p-5 sm:p-6 rounded-xl border bg-card hover:shadow-md transition-shadow"
  >
    <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-3 sm:mb-4">
      <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
    </div>
    <h3 className="font-semibold mb-1.5 sm:mb-2 text-sm sm:text-base">{title}</h3>
    <p className="text-xs sm:text-sm text-muted-foreground">{description}</p>
  </motion.div>
);

const ModeCard = ({
  icon: Icon,
  mode,
  features,
  featured,
}: {
  icon: React.ElementType;
  mode: string;
  features: string[];
  featured?: boolean;
}) => (
  <motion.div
    variants={fadeUp}
    whileHover={{ scale: featured ? 1.03 : 1.01 }}
    className={`p-5 sm:p-6 rounded-xl border bg-card transition-shadow ${
      featured ? 'border-warning/30 ring-1 ring-warning/10 shadow-lg' : 'hover:shadow-md'
    }`}
  >
    <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-muted flex items-center justify-center mb-3 sm:mb-4">
      <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
    </div>
    <h3 className="font-semibold mb-2 sm:mb-3 text-sm sm:text-base">{mode} mode</h3>
    <ul className="space-y-1.5 sm:space-y-2">
      {features.map((f) => (
        <li key={f} className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
          <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-success flex-shrink-0" />
          {f}
        </li>
      ))}
    </ul>
  </motion.div>
);

export default Index;
