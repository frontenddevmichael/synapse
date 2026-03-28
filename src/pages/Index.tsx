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
    <div className="min-h-screen flex flex-col bg-background dot-grid overflow-hidden">
      {/* Header — minimal */}
      <header className="flex items-center justify-between px-4 sm:px-8 py-4 sm:py-5 sticky top-0 z-50 bg-background/80 backdrop-blur-md">
        <Logo size="lg" />
        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle />
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/auth')}
            className="font-bold uppercase tracking-wider text-xs"
          >
            Enter
          </Button>
        </div>
      </header>

      {/* Hero — typographic impact */}
      <motion.section
        {...animationProps}
        className="flex-1 flex items-center py-10 sm:py-16 lg:py-28"
      >
        <div className="container max-w-6xl px-4 sm:px-8">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
            <motion.div variants={stagger}>
              <motion.h1
                variants={fadeUp}
                className="text-5xl sm:text-6xl lg:text-[7rem] font-black leading-[0.95] tracking-tighter mb-6 sm:mb-8"
              >
                STOP
                <br />
                RE-READING.
                <br />
                <span className="text-electric">START KNOWING.</span>
              </motion.h1>

              <motion.p
                variants={fadeUp}
                className="text-base sm:text-lg lg:text-xl text-muted-foreground mb-8 sm:mb-10 max-w-lg leading-relaxed"
              >
                Drop your notes in. Get quizzed on what matters. Do it alone or drag your whole study group in.
              </motion.p>

              <motion.div variants={fadeUp}>
                <Button
                  size="lg"
                  onClick={() => navigate('/auth')}
                  className="gap-2 h-12 sm:h-14 px-8 sm:px-10 text-sm sm:text-base font-black uppercase tracking-wider"
                >
                  Get started <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              </motion.div>
            </motion.div>

            {/* Hero illustration */}
            <motion.div variants={fadeUp} className="hidden lg:block">
              <TransformIllustration className="w-full max-w-lg mx-auto" />
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Divider */}
      <div className="container max-w-6xl px-4 sm:px-8">
        <hr className="border-primary/30" />
      </div>

      {/* How it works — horizontal strips */}
      <motion.section
        {...scrollAnimationProps}
        className="py-14 sm:py-20 lg:py-32 relative"
      >
        <div className="container max-w-5xl px-4 sm:px-8">
          <motion.div variants={fadeUp} className="mb-12 sm:mb-20">
            <p className="text-[4rem] sm:text-[6rem] lg:text-[8rem] font-black text-muted-foreground/[0.07] leading-none select-none absolute top-8 sm:top-12 left-4 sm:left-8 pointer-events-none">
              90s
            </p>
            <h2 className="font-black mb-3 sm:mb-4 uppercase tracking-tight">
              The whole thing takes 90 seconds
            </h2>
            <p className="text-muted-foreground max-w-lg text-base sm:text-lg">
              Seriously. We timed it.
            </p>
          </motion.div>

          {/* Steps as horizontal strips */}
          <div className="space-y-0 divide-y divide-border/40">
            {[
              { step: 1, illustration: <RoomPortalIllustration className="w-20 h-20 sm:w-28 sm:h-28" />, title: 'Make a room', desc: 'Name it. Pick a mode. Share the 6-letter code.' },
              { step: 2, illustration: <DocumentFunnelIllustration className="w-20 h-20 sm:w-28 sm:h-28" />, title: 'Feed it your notes', desc: 'PDF or raw text. Drag, drop, done.' },
              { step: 3, illustration: <CardCascadeIllustration className="w-20 h-20 sm:w-28 sm:h-28" />, title: 'Quiz drops', desc: 'AI reads your material and builds questions that actually test understanding.' },
            ].map(({ step, illustration, title, desc }) => (
              <motion.div
                key={step}
                variants={fadeUp}
                className="flex items-center gap-6 sm:gap-10 py-8 sm:py-12"
              >
                <span className="text-5xl sm:text-7xl font-black text-muted-foreground/20 select-none shrink-0 w-16 sm:w-24 text-right">
                  {step}
                </span>
                <div className="shrink-0 hidden sm:block">
                  {illustration}
                </div>
                <div>
                  <h3 className="font-bold text-lg sm:text-xl mb-1">{title}</h3>
                  <p className="text-muted-foreground text-sm sm:text-base">{desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Modes — accent-border cards */}
      <motion.section
        {...scrollAnimationProps}
        className="py-14 sm:py-20 lg:py-32"
      >
        <div className="container max-w-5xl px-4 sm:px-8">
          <motion.div variants={fadeUp} className="mb-10 sm:mb-16">
            <h2 className="font-black mb-3 sm:mb-4 uppercase tracking-tight">Pick your poison</h2>
            <p className="text-muted-foreground text-base sm:text-lg">
              Three modes. Three very different vibes.
            </p>
          </motion.div>

          <motion.div variants={stagger} className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            <ModeCard
              illustration={<StudyModeIllustration className="w-14 h-14" />}
              mode="Study"
              nickname="The chill one"
              borderColor="border-l-mode-study"
              description="Wrong answer? No stress. See the explanation, learn the thing, move on. Your pace, your rules."
            />
            <ModeCard
              illustration={<ChallengeModeIllustration className="w-14 h-14" />}
              mode="Challenge"
              nickname="The competitive one"
              borderColor="border-l-mode-challenge"
              description="Timer's running. Leaderboard's watching. Your friends are scoring higher than you. Do something about it."
            />
            <ModeCard
              illustration={<ExamModeIllustration className="w-14 h-14" />}
              mode="Exam"
              nickname="The real one"
              borderColor="border-l-mode-exam"
              description="One shot. No peeking. No second chances. Find out if you actually know it."
            />
          </motion.div>
        </div>
      </motion.section>

      {/* CTA — full-bleed dark section */}
      <motion.section
        {...scrollAnimationProps}
        className="py-16 sm:py-24 lg:py-32 text-center px-4 relative overflow-hidden bg-foreground text-background"
      >
        <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none">
          <SynapsePatternBg className="w-full max-w-4xl" />
        </div>
        <div className="relative z-10 max-w-2xl mx-auto">
          <motion.h2 variants={fadeUp} className="font-black text-3xl sm:text-4xl lg:text-5xl uppercase tracking-tight mb-4 sm:mb-6 text-background">
            Your next exam is closer than you think
          </motion.h2>
          <motion.p variants={fadeUp} className="text-background/60 mb-8 sm:mb-10 text-base sm:text-lg max-w-md mx-auto">
            Stop highlighting things you'll never re-read. Start testing yourself on what you've actually learned.
          </motion.p>
          <motion.div variants={fadeUp}>
            <Button
              size="lg"
              onClick={() => navigate('/auth')}
              className="gap-2 h-12 sm:h-14 px-8 sm:px-10 text-sm sm:text-base font-black uppercase tracking-wider"
            >
              Start now — it's free <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          </motion.div>
        </div>
      </motion.section>

      {/* Install Section */}
      <PWAInstall variant="section" />

      {/* Footer */}
      <footer className="py-6 sm:py-8 text-center pb-safe">
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

const ModeCard = ({
  illustration,
  mode,
  nickname,
  borderColor,
  description,
}: {
  illustration: React.ReactNode;
  mode: string;
  nickname: string;
  borderColor: string;
  description: string;
}) => (
  <motion.div
    variants={fadeUp}
    className={`p-5 sm:p-7 rounded-sm border-l-[3px] ${borderColor} bg-card hover:border-l-[5px] transition-all duration-200 hover:shadow-md`}
  >
    <div className="mb-4">{illustration}</div>
    <h3 className="font-bold text-base sm:text-lg mb-1">{mode} mode</h3>
    <p className="text-primary/70 font-medium text-xs sm:text-sm mb-3">{nickname}</p>
    <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">{description}</p>
  </motion.div>
);

export default Index;
