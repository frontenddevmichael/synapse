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
  Download,
  Check,
  Smartphone,
} from 'lucide-react';
import { motion } from 'framer-motion';

import { useAuth } from '@/contexts/AuthContext';
import { Logo } from '@/components/Logo';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { InstallPrompt } from '@/components/pwa/InstallPrompt';
import { usePWAInstall } from '@/hooks/usePWAInstall';

/* -------------------------------------------------------------------------- */
/*                                   Motion                                   */
/* -------------------------------------------------------------------------- */

const fadeUp = {
  hidden: { opacity: 0, y: 24, filter: 'blur(4px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

const stagger = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.12,
    },
  },
};

const viewport = { once: true, margin: '-120px' };

/* -------------------------------------------------------------------------- */

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { shouldShowPrompt } = usePWAInstall();
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate('/dashboard');
  }, [user, loading, navigate]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowInstallBanner(shouldShowPrompt);
    }, 3000);
    return () => clearTimeout(timer);
  }, [shouldShowPrompt]);

  return (
    <div className="min-h-screen flex flex-col bg-background overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/3 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/3 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-border/50 bg-background/80 backdrop-blur sticky top-0 z-50">
        <Logo />
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button variant="ghost" size="sm" onClick={() => navigate('/auth')}>
            Sign in
          </Button>
          <Button size="sm" onClick={() => navigate('/auth')}>
            Get started
          </Button>
        </div>
      </header>

      {/* Hero */}
      <motion.section
        variants={stagger}
        initial="hidden"
        animate="visible"
        className="flex-1 flex items-center py-20 lg:py-32"
      >
        <div className="container max-w-6xl px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div variants={stagger}>
              <motion.h1
                variants={fadeUp}
                className="text-4xl sm:text-5xl lg:text-6xl font-semibold mb-6 leading-[1.1]"
              >
                Your notes,
                <br />
                <span className="text-primary">transformed into quizzes</span>
              </motion.h1>

              <motion.p
                variants={fadeUp}
                className="text-lg text-muted-foreground mb-8 max-w-lg"
              >
                Upload your study materials. Synapse generates questions.
                Quiz yourself or compete with your group.
              </motion.p>

              <motion.div variants={fadeUp} className="flex gap-3">
                <Button size="lg" onClick={() => navigate('/auth')} className="gap-2">
                  Start studying free <ArrowRight className="h-4 w-4" />
                </Button>
                <Button size="lg" variant="outline" onClick={() => navigate('/auth')}>
                  Join a room
                </Button>
              </motion.div>

              <motion.div
                variants={fadeUp}
                className="flex gap-6 mt-10 pt-8 border-t border-border/50"
              >
                <QuickStat value="3" label="quiz modes" />
                <QuickStat value="PDF" label="& text support" />
                <QuickStat value="Free" label="to start" />
              </motion.div>
            </motion.div>

            {/* Mockup */}
            <motion.div variants={fadeUp}>
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
        variants={stagger}
        initial="hidden"
        whileInView="visible"
        viewport={viewport}
        className="py-24 border-t border-border bg-muted/30"
      >
        <div className="container max-w-5xl px-6">
          <motion.div variants={fadeUp} className="text-center mb-16">
            <h2 className="text-3xl font-semibold mb-4">
              From notes to knowledge
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Three simple steps. No setup friction.
            </p>
          </motion.div>

          <motion.div variants={stagger} className="grid md:grid-cols-3 gap-8">
            <ProcessCard icon={Users} title="Create or join" description="Private study rooms with shareable codes." />
            <ProcessCard icon={Upload} title="Upload materials" description="PDFs, notes, or pasted text." />
            <ProcessCard icon={Sparkles} title="Generate quizzes" description="AI-crafted questions from your content." />
          </motion.div>
        </div>
      </motion.section>

      {/* Modes */}
      <motion.section
        variants={stagger}
        initial="hidden"
        whileInView="visible"
        viewport={viewport}
        className="py-24 border-t border-border"
      >
        <div className="container max-w-5xl px-6">
          <motion.div variants={fadeUp} className="text-center mb-16">
            <h2 className="text-3xl font-semibold mb-4">Three ways to study</h2>
            <p className="text-muted-foreground">
              Choose what matches your learning style.
            </p>
          </motion.div>

          <motion.div variants={stagger} className="grid md:grid-cols-3 gap-6">
            <ModeCard icon={BookOpen} mode="Study" features={['Instant feedback']} />
            <ModeCard icon={Trophy} mode="Challenge" featured features={['Leaderboards']} />
            <ModeCard icon={Timer} mode="Exam" features={['One attempt']} />
          </motion.div>
        </div>
      </motion.section>

      {/* CTA */}
      <motion.section
        variants={stagger}
        initial="hidden"
        whileInView="visible"
        viewport={viewport}
        className="py-20 border-t border-border text-center"
      >
        <motion.h2 variants={fadeUp} className="text-3xl font-semibold mb-4">
          Ready to study smarter?
        </motion.h2>
        <motion.p variants={fadeUp} className="text-muted-foreground mb-8">
          Free to start. No credit card.
        </motion.p>
        <motion.div variants={fadeUp}>
          <Button size="lg" onClick={() => navigate('/auth')} className="gap-2">
            Create your first room <ArrowRight className="h-4 w-4" />
          </Button>
        </motion.div>
      </motion.section>

      {showInstallBanner && (
        <InstallPrompt variant="banner" onClose={() => setShowInstallBanner(false)} />
      )}
    </div>
  );
};

/* -------------------------------------------------------------------------- */

const QuickStat = ({ value, label }: { value: string; label: string }) => (
  <div>
    <div className="text-lg font-semibold">{value}</div>
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
    className="p-6 rounded-xl border bg-card hover:shadow-md"
  >
    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
      <Icon className="h-6 w-6 text-primary" />
    </div>
    <h3 className="font-semibold mb-2">{title}</h3>
    <p className="text-sm text-muted-foreground">{description}</p>
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
    className={`p-6 rounded-xl border bg-card ${
      featured ? 'border-warning/30 ring-1 ring-warning/10' : ''
    }`}
  >
    <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center mb-4">
      <Icon className="h-6 w-6" />
    </div>
    <h3 className="font-semibold mb-3">{mode} mode</h3>
    <ul className="space-y-2">
      {features.map((f) => (
        <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
          <Check className="h-4 w-4 text-success" />
          {f}
        </li>
      ))}
    </ul>
  </motion.div>
);

export default Index;
