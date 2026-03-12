import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';

import { useAuth } from '@/contexts/AuthContext';
import { Logo } from '@/components/Logo';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { PWAInstall } from '@/components/pwa/PWAInstall';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { fadeUp, stagger, viewport, staggerSlow } from '@/lib/motion';

import { TransformIllustration } from '@/components/illustrations/TransformIllustration';
import { RoomPortalIllustration } from '@/components/illustrations/RoomPortalIllustration';
import { DocumentFunnelIllustration } from '@/components/illustrations/DocumentFunnelIllustration';
import { CardCascadeIllustration } from '@/components/illustrations/CardCascadeIllustration';
import { StudyModeIllustration } from '@/components/illustrations/StudyModeIllustration';
import { ChallengeModeIllustration } from '@/components/illustrations/ChallengeModeIllustration';
import { ExamModeIllustration } from '@/components/illustrations/ExamModeIllustration';
import { SynapsePatternBg } from '@/components/illustrations/SynapsePatternBg';

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
            Drop your first PDF
          </Button>
        </div>
      </header>

      {/* Hero */}
      <motion.section
        {...animationProps}
        className="flex-1 flex items-center py-10 sm:py-16 lg:py-32"
      >
        <div className="container max-w-6xl px-4 sm:px-8">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
            <motion.div variants={stagger}>
              <motion.div variants={fadeUp} className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs sm:text-sm font-medium mb-6 sm:mb-8">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                </span>
                Generating quizzes right now
              </motion.div>

              <motion.h1
                variants={fadeUp}
                className="text-display-lg font-black mb-4 sm:mb-6 leading-[1.05]"
              >
                Stop re-reading.
                <br />
                <span className="text-primary">Start knowing.</span>
              </motion.h1>

              <motion.p
                variants={fadeUp}
                className="text-base sm:text-lg lg:text-xl text-muted-foreground mb-6 sm:mb-8 max-w-lg leading-relaxed"
              >
                Drop your notes in. Get quizzed on what matters. Do it alone or drag your whole study group in.
              </motion.p>

              <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-3">
                <Button size="lg" onClick={() => navigate('/auth')} className="gap-2 h-12 sm:h-14 px-6 sm:px-8 text-sm sm:text-base font-semibold w-full sm:w-auto">
                  Drop your first PDF <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
                <Button size="lg" variant="outline" onClick={() => navigate('/auth')} className="h-12 sm:h-14 px-6 sm:px-8 text-sm sm:text-base font-medium w-full sm:w-auto">
                  Got a room code?
                </Button>
              </motion.div>

              <motion.div
                variants={fadeUp}
                className="flex gap-6 sm:gap-8 mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-border/50"
              >
                <QuickStat value="14,000+" label="questions this week" />
                <QuickStat value="~8 sec" label="generation time" />
                <QuickStat value="100%" label="free, no card" />
              </motion.div>
            </motion.div>

            {/* Hero illustration */}
            <motion.div variants={fadeUp} className="block">
              <TransformIllustration className="w-full max-w-md mx-auto lg:max-w-none" />
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Diagonal divider */}
      <div className="relative h-16 sm:h-24 -mb-1">
        <svg viewBox="0 0 1200 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full">
          <path d="M0 100 L1200 0 L1200 100 Z" className="fill-background" />
          <path d="M0 100 L1200 0" className="stroke-border/20" strokeWidth="1" fill="none" />
        </svg>
      </div>

      {/* How it works */}
      <motion.section
        {...scrollAnimationProps}
        className="py-14 sm:py-20 lg:py-32"
      >
        <div className="container max-w-5xl px-4 sm:px-8">
          <motion.div variants={fadeUp} className="text-center mb-10 sm:mb-16">
            <h2 className="font-black mb-3 sm:mb-4">
              The whole thing takes 90 seconds
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto text-base sm:text-lg">
              Seriously. We timed it.
            </p>
          </motion.div>

          {/* Desktop: grid */}
          <motion.div variants={stagger} className="hidden sm:grid sm:grid-cols-2 md:grid-cols-3 gap-6 lg:gap-8">
            <ProcessCard
              step={1}
              illustration={<RoomPortalIllustration className="w-full h-32" />}
              title="Make a room"
              description="Name it. Pick a mode. Share the 6-letter code."
            />
            <ProcessCard
              step={2}
              illustration={<DocumentFunnelIllustration className="w-full h-32" />}
              title="Feed it your notes"
              description="PDF or raw text. Drag, drop, done."
            />
            <ProcessCard
              step={3}
              illustration={<CardCascadeIllustration className="w-full h-32" />}
              title="Quiz drops"
              description="AI reads your material and builds questions that actually test understanding."
            />
          </motion.div>

          {/* Mobile carousel */}
          <div className="sm:hidden flex gap-3 overflow-x-auto snap-x snap-mandatory pb-4 -mx-4 px-4 scrollbar-hide">
            <ProcessCardMobile
              step={1}
              illustration={<RoomPortalIllustration className="w-20 h-20" />}
              title="Make a room"
              description="Name it. Pick a mode. Share the 6-letter code."
            />
            <ProcessCardMobile
              step={2}
              illustration={<DocumentFunnelIllustration className="w-20 h-20" />}
              title="Feed it your notes"
              description="PDF or raw text. Drag, drop, done."
            />
            <ProcessCardMobile
              step={3}
              illustration={<CardCascadeIllustration className="w-20 h-20" />}
              title="Quiz drops"
              description="AI reads your material and builds questions that actually test understanding."
            />
          </div>
        </div>
      </motion.section>

      {/* Modes */}
      <motion.section
        {...scrollAnimationProps}
        className="py-14 sm:py-20 lg:py-32 border-t border-border/30"
      >
        <div className="container max-w-5xl px-4 sm:px-8">
          <motion.div variants={fadeUp} className="text-center mb-10 sm:mb-16">
            <h2 className="font-black mb-3 sm:mb-4">Pick your poison</h2>
            <p className="text-muted-foreground text-base sm:text-lg">
              Three modes. Three very different vibes.
            </p>
          </motion.div>

          {/* Desktop */}
          <motion.div variants={stagger} className="hidden sm:grid sm:grid-cols-2 md:grid-cols-3 gap-6">
            <ModeCard
              illustration={<StudyModeIllustration className="w-16 h-16" />}
              mode="Study"
              nickname="The chill one"
              tint="mode-study"
              description="Wrong answer? No stress. See the explanation, learn the thing, move on. Your pace, your rules."
            />
            <ModeCard
              illustration={<ChallengeModeIllustration className="w-16 h-16" />}
              mode="Challenge"
              nickname="The competitive one"
              tint="mode-challenge"
              featured
              description="Timer's running. Leaderboard's watching. Your friends are scoring higher than you. Do something about it."
            />
            <ModeCard
              illustration={<ExamModeIllustration className="w-16 h-16" />}
              mode="Exam"
              nickname="The real one"
              tint="mode-exam"
              description="One shot. No peeking. No second chances. Find out if you actually know it."
            />
          </motion.div>

          {/* Mobile */}
          <div className="sm:hidden space-y-3">
            <ModeCard
              illustration={<ChallengeModeIllustration className="w-14 h-14" />}
              mode="Challenge"
              nickname="The competitive one"
              tint="mode-challenge"
              featured
              description="Timer's running. Leaderboard's watching. Your friends are scoring higher than you."
            />
            <div className="grid grid-cols-2 gap-3">
              <ModeCard
                illustration={<StudyModeIllustration className="w-12 h-12" />}
                mode="Study"
                nickname="The chill one"
                tint="mode-study"
                description="Learn at your pace. No judgment."
                compact
              />
              <ModeCard
                illustration={<ExamModeIllustration className="w-12 h-12" />}
                mode="Exam"
                nickname="The real one"
                tint="mode-exam"
                description="One shot. No peeking."
                compact
              />
            </div>
          </div>
        </div>
      </motion.section>

      {/* CTA */}
      <motion.section
        {...scrollAnimationProps}
        className="py-14 sm:py-20 lg:py-28 border-t border-border/30 text-center px-4 relative overflow-hidden"
      >
        {/* Background synapse pattern */}
        <div className="absolute inset-0 flex items-center justify-center opacity-50 pointer-events-none">
          <SynapsePatternBg className="w-full max-w-4xl" />
        </div>
        <div className="relative z-10">
          <motion.h2 variants={fadeUp} className="font-black mb-3 sm:mb-4">
            Your next exam is closer than you think
          </motion.h2>
          <motion.p variants={fadeUp} className="text-muted-foreground mb-8 sm:mb-10 text-base sm:text-lg max-w-md mx-auto">
            Stop highlighting things you'll never re-read. Start testing yourself on what you've actually learned.
          </motion.p>
          <motion.div variants={fadeUp}>
            <Button size="lg" onClick={() => navigate('/auth')} className="gap-2 h-12 sm:h-14 px-6 sm:px-8 text-sm sm:text-base font-semibold w-full sm:w-auto">
              Start now — it's free <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          </motion.div>
        </div>
      </motion.section>

      {/* Install Section */}
      <PWAInstall variant="section" />

      {/* Footer */}
      <footer className="py-6 sm:py-8 border-t border-border/30 text-center pb-safe">
        <p className="text-xs sm:text-sm text-muted-foreground">
          © {new Date().getFullYear()} Synapse. Made by students who got tired of re-reading the same page six times.
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
  illustration,
  title,
  description,
}: {
  step: number;
  illustration: React.ReactNode;
  title: string;
  description: string;
}) => (
  <motion.div
    variants={fadeUp}
    whileHover={{ y: -6, transition: { type: 'spring', stiffness: 300, damping: 20 } }}
    className="relative p-7 rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm hover:shadow-xl transition-shadow"
  >
    <div className="absolute top-6 right-6 text-5xl font-black text-muted/50 leading-none select-none">
      {step}
    </div>
    <div className="mb-4">
      {illustration}
    </div>
    <h3 className="font-bold text-lg mb-2">{title}</h3>
    <p className="text-muted-foreground text-sm">{description}</p>
  </motion.div>
);

const ProcessCardMobile = ({
  step,
  illustration,
  title,
  description,
}: {
  step: number;
  illustration: React.ReactNode;
  title: string;
  description: string;
}) => (
  <div className="flex-shrink-0 w-[75vw] snap-center p-5 rounded-xl border border-border/50 bg-card/80 backdrop-blur-sm">
    <div className="flex items-center gap-3 mb-3">
      {illustration}
      <span className="text-3xl font-black text-muted/50 select-none">{step}</span>
    </div>
    <h3 className="font-bold mb-1">{title}</h3>
    <p className="text-sm text-muted-foreground">{description}</p>
  </div>
);

const ModeCard = ({
  illustration,
  mode,
  nickname,
  tint,
  description,
  featured,
  compact,
}: {
  illustration: React.ReactNode;
  mode: string;
  nickname: string;
  tint: string;
  description: string;
  featured?: boolean;
  compact?: boolean;
}) => (
  <motion.div
    variants={fadeUp}
    whileHover={featured ? { scale: 1.03, y: -4 } : { scale: 1.01 }}
    className={`relative ${compact ? 'p-4' : 'p-5 sm:p-7'} rounded-xl sm:rounded-2xl border bg-card/80 backdrop-blur-sm transition-all ${
      featured
        ? 'border-mode-challenge/30 ring-1 ring-mode-challenge/10 shadow-xl sm:scale-[1.02]'
        : 'border-border/50 hover:shadow-lg'
    }`}
  >
    {featured && (
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 sm:px-4 py-1 rounded-full bg-mode-challenge text-mode-challenge-foreground text-[10px] sm:text-xs font-bold uppercase tracking-wider">
        Popular
      </div>
    )}
    <div className={`${compact ? 'mb-3' : 'mb-4 sm:mb-5'}`}>
      {illustration}
    </div>
    <h3 className={`font-bold ${compact ? 'text-sm mb-1' : 'text-base sm:text-lg mb-1'}`}>{mode} mode</h3>
    <p className={`text-primary/70 font-medium ${compact ? 'text-xs mb-2' : 'text-xs sm:text-sm mb-3'}`}>{nickname}</p>
    <p className={`text-muted-foreground ${compact ? 'text-xs' : 'text-xs sm:text-sm'} leading-relaxed`}>{description}</p>
  </motion.div>
);

export default Index;
