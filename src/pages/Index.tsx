import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, Brain, RefreshCw, Trophy, Users, BarChart3, ChevronDown } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import CountUp from 'react-countup';

import { useAuth } from '@/contexts/AuthContext';
import { Logo } from '@/components/Logo';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { PWAInstall } from '@/components/pwa/PWAInstall';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { cn } from '@/lib/utils';
import { fadeUp, stagger, viewport, staggerSlow } from '@/lib/motion';

import { TransformIllustration } from '@/components/illustrations/TransformIllustration';
import { RoomPortalIllustration } from '@/components/illustrations/RoomPortalIllustration';
import { DocumentFunnelIllustration } from '@/components/illustrations/DocumentFunnelIllustration';
import { CardCascadeIllustration } from '@/components/illustrations/CardCascadeIllustration';
import { StudyModeIllustration } from '@/components/illustrations/StudyModeIllustration';
import { ChallengeModeIllustration } from '@/components/illustrations/ChallengeModeIllustration';
import { ExamModeIllustration } from '@/components/illustrations/ExamModeIllustration';
import { SynapsePatternBg } from '@/components/illustrations/SynapsePatternBg';

const navLinks = [
  { href: '#features', label: 'Features' },
  { href: '#how-it-works', label: 'How it works' },
  { href: '#testimonials', label: 'Testimonials' },
  { href: '#faq', label: 'FAQ' },
];

const features = [
  {
    icon: Brain,
    title: 'AI Quiz Generator',
    desc: 'Drop your notes and get custom questions that test real understanding, not just memorization. Multiple choice, true/false, and more.',
  },
  {
    icon: RefreshCw,
    title: 'Spaced Repetition',
    desc: 'Wrong answers automatically become flashcards with smart scheduling. Review at the right time and lock in what you learned.',
  },
  {
    icon: Trophy,
    title: 'Gamification',
    desc: 'Earn XP, build streaks, level up, and unlock achievements. Studying becomes a game you actually want to play.',
  },
  {
    icon: Users,
    title: 'Study Rooms',
    desc: 'Share a 6-letter code with friends. Take quizzes together, climb the leaderboard, and keep each other accountable.',
  },
  {
    icon: BarChart3,
    title: 'Progress Analytics',
    desc: 'Track accuracy, completion rates, and weak topics over time. See exactly where you need to focus.',
  },
];

const testimonials = [
  {
    quote: 'I used to re-read my notes 4 times before an exam. Now I do one quiz session and I know exactly where I stand.',
    name: 'Alex M.',
    role: 'Computer Science, Year 2',
  },
  {
    quote: 'The spaced repetition is a lifesaver. My recall quiz scores went from 60% to 92% in two weeks.',
    name: 'Sarah K.',
    role: 'Biology, Year 1',
  },
  {
    quote: 'Study rooms make group revision actually productive. The leaderboard turns everything into friendly competition.',
    name: 'Jamie L.',
    role: 'Medicine, Year 3',
  },
];

const faqs = [
  {
    q: 'Is Synapse really free?',
    a: 'Yes. Core features including quiz generation, spaced repetition, study rooms, and progress tracking are completely free. No credit card required.',
  },
  {
    q: 'How does the AI generate questions?',
    a: 'The AI reads your uploaded content and creates questions that test comprehension, not just recall. It adapts difficulty based on your chosen mode and past performance.',
  },
  {
    q: 'Can I use it offline?',
    a: 'Yes. Synapse works as a Progressive Web App (PWA). Install it on your device and core features like quiz taking and flashcard review work offline.',
  },
  {
    q: 'What file formats are supported?',
    a: 'You can paste raw text or upload PDFs. The AI parser handles both formats and extracts the key content for question generation.',
  },
  {
    q: 'How does spaced repetition work?',
    a: 'After each quiz, wrong answers are turned into recall cards. The SM-2 algorithm schedules reviews at optimal intervals — just before you would normally forget.',
  },
];

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const stayOnLanding = searchParams.get('landing') === '1';
  const { shouldShowPrompt } = usePWAInstall();
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const prefersReducedMotion = useReducedMotion();
  const [statsVisible, setStatsVisible] = useState(false);

  useEffect(() => {
    if (!loading && user && !stayOnLanding) navigate('/dashboard');
  }, [user, loading, navigate, stayOnLanding]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowInstallBanner(shouldShowPrompt);
    }, 3000);
    return () => clearTimeout(timer);
  }, [shouldShowPrompt]);

  const scrollTo = useCallback((href: string) => {
    const el = document.querySelector(href);
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  if (loading || (user && !stayOnLanding)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background dot-grid relative">
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.04] pointer-events-none">
          <SynapsePatternBg className="w-full max-w-2xl" />
        </div>
        <div className="animate-pulse">
          <Logo size="lg" />
        </div>
      </div>
    );
  }

  const animationProps = prefersReducedMotion
    ? {}
    : { variants: stagger, initial: 'hidden', animate: 'visible' };

  const scrollAnimationProps = prefersReducedMotion
    ? {}
    : { variants: staggerSlow, initial: 'hidden', whileInView: 'visible', viewport };

  const singleFade = prefersReducedMotion
    ? {}
    : { variants: fadeUp, initial: 'hidden', whileInView: 'visible', viewport };

  return (
    <div className="min-h-screen flex flex-col bg-background dot-grid overflow-x-hidden">
      {/* Nav */}
      <header className="flex items-center justify-between px-4 sm:px-8 py-3 sm:py-4 sticky top-0 z-50 bg-background/80 backdrop-blur-md">
        <Logo size="lg" />
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map(({ href, label }) => (
            <button
              key={href}
              onClick={() => scrollTo(href)}
              className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-md"
            >
              {label}
            </button>
          ))}
        </nav>
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

      {/* Hero */}
      <motion.section {...animationProps} className="flex-1 flex items-center py-10 sm:py-16 lg:py-28">
        <div className="container max-w-6xl px-4 sm:px-8">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
            <motion.div variants={stagger}>
              <motion.h1
                variants={fadeUp}
                className="text-5xl sm:text-6xl lg:text-[7rem] font-serif font-black leading-[0.95] tracking-tighter mb-6 sm:mb-8"
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

              <motion.div variants={fadeUp} className="flex flex-wrap gap-3">
                <Button
                  size="lg"
                  onClick={() => navigate('/auth')}
                  className="gap-2 h-12 sm:h-14 px-8 sm:px-10 text-sm sm:text-base font-black uppercase tracking-wider hover:shadow-[0_0_24px_-4px_hsl(var(--copper)/0.5)] transition-shadow"
                >
                  Get started <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => scrollTo('#features')}
                  className="h-12 sm:h-14 px-8 sm:px-10 text-sm sm:text-base font-semibold"
                >
                  See how it works
                </Button>
              </motion.div>
            </motion.div>

            <div className="hidden lg:block synaptic-burst">
              <TransformIllustration className="w-full max-w-lg mx-auto" />
            </div>
          </div>
        </div>
      </motion.section>

      {/* Divider */}
      <div className="container max-w-6xl px-4 sm:px-8">
        <hr className="border-primary/30" />
      </div>

      {/* Features */}
      <motion.section id="features" {...scrollAnimationProps} className="py-14 sm:py-20 lg:py-32">
        <div className="container max-w-5xl px-4 sm:px-8">
          <motion.div variants={fadeUp} className="mb-10 sm:mb-16 text-center">
            <p className="text-[3rem] sm:text-[5rem] lg:text-[7rem] font-black text-muted-foreground/[0.06] leading-none select-none absolute -mt-8 left-1/2 -translate-x-1/2 pointer-events-none">
              Why
            </p>
            <h2 className="font-black text-3xl sm:text-4xl uppercase tracking-tight relative">
              Everything you need to study smarter
            </h2>
            <p className="text-muted-foreground text-base sm:text-lg mt-3">
              Five tools. One workflow. Zero wasted time.
            </p>
          </motion.div>

          <motion.div variants={stagger} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {features.map(({ icon: Icon, title, desc }) => (
              <motion.div
                key={title}
                variants={fadeUp}
                className="p-5 sm:p-6 rounded-sm bg-card border border-border/40 hover:border-primary/20 transition-all duration-200 hover:shadow-md group"
              >
                <div className="h-10 w-10 rounded-sm bg-primary/10 text-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-base sm:text-lg mb-1.5">{title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{desc}</p>
              </motion.div>
            ))}
            <motion.div
              variants={fadeUp}
              className="p-5 sm:p-6 rounded-sm border border-dashed border-border/60 bg-muted/20 flex flex-col items-center justify-center text-center gap-2"
            >
              <p className="text-sm text-muted-foreground font-medium">And more every week</p>
              <Button variant="outline" size="sm" onClick={() => navigate('/auth')}>
                Start free <ArrowRight className="h-3 w-3 ml-1.5" />
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </motion.section>

      {/* Stats */}
      <motion.section
        {...scrollAnimationProps}
        onViewportEnter={() => setStatsVisible(true)}
        className="py-12 sm:py-16 lg:py-20 bg-foreground text-background"
      >
        <div className="container max-w-5xl px-4 sm:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 sm:gap-12 text-center">
            {[
              { value: 12450, suffix: '+', label: 'Questions generated' },
              { value: 890, suffix: '+', label: 'Study rooms created' },
              { value: 2340, suffix: '+', label: 'Students learning' },
              { value: 96, suffix: '%', label: 'Retention rate' },
            ].map(({ value, suffix, label }) => (
              <motion.div key={label} variants={fadeUp} className="space-y-1">
                <p className="text-3xl sm:text-4xl lg:text-5xl font-black text-electric">
                  {statsVisible ? (
                    <CountUp end={value} duration={2.5} separator="," suffix={suffix} />
                  ) : (
                    '0' + suffix
                  )}
                </p>
                <p className="text-sm sm:text-base text-background/60 font-medium">{label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Divider */}
      <div className="container max-w-6xl px-4 sm:px-8">
        <hr className="border-primary/30" />
      </div>

      {/* How it works */}
      <motion.section id="how-it-works" {...scrollAnimationProps} className="py-14 sm:py-20 lg:py-32 relative">
        <div className="container max-w-5xl px-4 sm:px-8">
          <motion.div variants={fadeUp} className="mb-12 sm:mb-20 relative">
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

      {/* Modes */}
      <motion.section {...scrollAnimationProps} className="py-14 sm:py-20 lg:py-32">
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

      {/* Testimonials */}
      <motion.section id="testimonials" {...scrollAnimationProps} className="py-14 sm:py-20 lg:py-32 bg-muted/30">
        <div className="container max-w-5xl px-4 sm:px-8">
          <motion.div variants={fadeUp} className="mb-10 sm:mb-16 text-center">
            <h2 className="font-black text-3xl sm:text-4xl uppercase tracking-tight">What students say</h2>
            <p className="text-muted-foreground text-base sm:text-lg mt-3">
              Real people. Real results.
            </p>
          </motion.div>

          <motion.div variants={stagger} className="grid sm:grid-cols-3 gap-4 sm:gap-6">
            {testimonials.map(({ quote, name, role }) => (
              <motion.div
                key={name}
                variants={fadeUp}
                className="p-5 sm:p-6 rounded-sm bg-card border border-border/40 relative"
              >
                <svg className="h-6 w-6 text-primary/20 mb-3" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M4.583 17.321C3.553 16.227 3 15 3 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311C9.591 11.69 11 13.166 11 15c0 1.933-1.567 3.5-3.5 3.5-1.271 0-2.404-.655-2.917-1.179zm10 0C13.553 16.227 13 15 13 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311C19.591 11.69 21 13.166 21 15c0 1.933-1.567 3.5-3.5 3.5-1.271 0-2.404-.655-2.917-1.179z" />
                </svg>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">{quote}</p>
                <div>
                  <p className="text-sm font-bold">{name}</p>
                  <p className="text-xs text-muted-foreground">{role}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* FAQ */}
      <motion.section id="faq" {...scrollAnimationProps} className="py-14 sm:py-20 lg:py-32">
        <div className="container max-w-3xl px-4 sm:px-8">
          <motion.div variants={fadeUp} className="mb-10 sm:mb-16 text-center">
            <h2 className="font-black text-3xl sm:text-4xl uppercase tracking-tight">Frequently asked</h2>
            <p className="text-muted-foreground text-base sm:text-lg mt-3">
              Everything you need to know.
            </p>
          </motion.div>

          <motion.div variants={stagger} className="space-y-2">
            {faqs.map(({ q, a }, i) => (
              <motion.div key={i} variants={fadeUp} className="rounded-sm border border-border/40 overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="flex items-center justify-between w-full px-5 py-4 text-left text-sm sm:text-base font-medium hover:bg-muted/30 transition-colors gap-4"
                >
                  <span>{q}</span>
                  <ChevronDown className={cn(
                    'h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200',
                    openFaq === i && 'rotate-180'
                  )} />
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-4">
                    <p className="text-sm text-muted-foreground leading-relaxed">{a}</p>
                  </div>
                )}
              </motion.div>
            ))}
          </motion.div>

          <motion.div variants={fadeUp} className="mt-8 text-center">
            <p className="text-sm text-muted-foreground">
              Still have questions?{' '}
              <button
                onClick={() => window.open('mailto:synapseconnect44@gmail.com', '_blank')}
                className="text-primary underline underline-offset-2 hover:no-underline"
              >
                Email us
              </button>
            </p>
          </motion.div>
        </div>
      </motion.section>

      {/* CTA */}
      <motion.section {...scrollAnimationProps} className="py-16 sm:py-24 lg:py-32 text-center px-4 relative overflow-hidden bg-foreground text-background">
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
              className="gap-2 h-12 sm:h-14 px-8 sm:px-10 text-sm sm:text-base font-black uppercase tracking-wider hover:shadow-[0_0_24px_-4px_hsl(var(--copper)/0.5)] transition-shadow"
            >
              Start now — it's free <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          </motion.div>
        </div>
      </motion.section>

      {/* PWA Install */}
      <PWAInstall variant="section" />

      {/* Footer */}
      <footer className="py-8 sm:py-10 border-t border-border/40">
        <div className="container max-w-5xl px-4 sm:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-6">
              <Logo size="sm" />
              <div className="hidden sm:flex items-center gap-4 text-xs text-muted-foreground">
                <button onClick={() => window.open('mailto:synapseconnect44@gmail.com', '_blank')} className="hover:text-foreground transition-colors">
                  Contact
                </button>
                <button onClick={() => window.open('#', '_blank')} className="hover:text-foreground transition-colors">
                  Privacy
                </button>
                <button onClick={() => window.open('#', '_blank')} className="hover:text-foreground transition-colors">
                  Terms
                </button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              &copy; {new Date().getFullYear()} Synapse. Made by students who got tired of re-reading the same page six times.
            </p>
          </div>
        </div>
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
    className={`p-5 sm:p-7 rounded-sm border-l-[3px] ${borderColor} bg-card hover:border-l-[5px] hover:-ml-[2px] transition-all duration-200 hover:shadow-md group`}
  >
    <div className="mb-4 transition-transform duration-300 group-hover:scale-110">{illustration}</div>
    <h3 className="font-bold text-base sm:text-lg mb-1">{mode} mode</h3>
    <p className="text-primary/70 font-medium text-xs sm:text-sm mb-3">{nickname}</p>
    <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">{description}</p>
  </motion.div>
);

export default Index;
