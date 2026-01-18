import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Upload, Users, Sparkles, BookOpen, Trophy, Timer, Download, Check, Smartphone } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Logo } from '@/components/Logo';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { InstallPrompt } from '@/components/pwa/InstallPrompt';
import { usePWAInstall } from '@/hooks/usePWAInstall';

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { shouldShowPrompt } = usePWAInstall();
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    // Delay showing install banner for better UX
    const timer = setTimeout(() => {
      setShowInstallBanner(shouldShowPrompt);
    }, 3000);
    return () => clearTimeout(timer);
  }, [shouldShowPrompt]);

  return (
    <div className="min-h-screen flex flex-col bg-background overflow-hidden">
      {/* Subtle background pattern */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/3 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/3 rounded-full blur-3xl" />
        <div 
          className="absolute inset-0 opacity-[0.015] dark:opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
            backgroundSize: '32px 32px'
          }}
        />
      </div>

      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-border/50 backdrop-blur-sm bg-background/80 sticky top-0 z-50">
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

      {/* Hero Section - Asymmetric, intentional */}
      <section className="relative flex-1 flex items-center py-20 lg:py-32">
        <div className="container max-w-6xl px-6">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* Left: Copy */}
            <div className="animate-slide-up">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-6 rounded-full bg-accent/10 border border-accent/20 text-accent text-sm font-medium">
                <Sparkles className="h-3.5 w-3.5" />
                <span>AI-powered quiz generation</span>
              </div>
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight mb-6 text-balance leading-[1.1]">
                Your notes,
                <br />
                <span className="text-primary">transformed into quizzes</span>
              </h1>
              
              <p className="text-lg text-muted-foreground mb-8 max-w-lg leading-relaxed">
                Upload your study materials. Synapse generates questions. 
                Quiz yourself or compete with your group—all in one place.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <Button size="lg" onClick={() => navigate('/auth')} className="gap-2 shadow-md">
                  Start studying free
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button size="lg" variant="outline" onClick={() => navigate('/auth')}>
                  Join a room
                </Button>
              </div>

              {/* Quick stats */}
              <div className="flex items-center gap-6 mt-10 pt-8 border-t border-border/50">
                <QuickStat value="3" label="quiz modes" />
                <QuickStat value="PDF" label="& text support" />
                <QuickStat value="Free" label="to start" />
              </div>
            </div>

            {/* Right: Product preview mockup */}
            <div className="relative lg:pl-8 animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <div className="relative">
                {/* Main card - Quiz preview */}
                <div className="bg-card rounded-2xl border border-border shadow-xl p-6 transform rotate-1">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <BookOpen className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="font-medium text-sm">Biology 101</div>
                      <div className="text-xs text-muted-foreground">12 questions • Study mode</div>
                    </div>
                  </div>
                  
                  <div className="space-y-3 mb-4">
                    <div className="p-3 rounded-lg bg-muted/50 border border-border">
                      <p className="text-sm font-medium mb-2">What is the powerhouse of the cell?</p>
                      <div className="grid grid-cols-2 gap-2">
                        {['Nucleus', 'Mitochondria', 'Ribosome', 'Golgi body'].map((opt, i) => (
                          <div 
                            key={opt}
                            className={`text-xs p-2 rounded-md border transition-colors ${
                              i === 1 
                                ? 'bg-success/10 border-success/30 text-success' 
                                : 'bg-background border-border'
                            }`}
                          >
                            {opt}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Question 3 of 12</span>
                    <span className="flex items-center gap-1">
                      <Check className="h-3 w-3 text-success" />
                      8 correct
                    </span>
                  </div>
                </div>

                {/* Floating badge - left */}
                <div className="absolute -left-4 top-1/3 bg-card rounded-xl border border-border shadow-lg p-3 transform -rotate-3 animate-float">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-warning/10 flex items-center justify-center">
                      <Trophy className="h-4 w-4 text-warning" />
                    </div>
                    <div>
                      <div className="text-xs font-medium">5 day streak!</div>
                      <div className="text-2xs text-muted-foreground">Keep it up</div>
                    </div>
                  </div>
                </div>

                {/* Floating badge - right */}
                <div className="absolute -right-2 bottom-1/4 bg-card rounded-xl border border-border shadow-lg p-3 transform rotate-2 animate-float" style={{ animationDelay: '0.5s' }}>
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-accent/10 flex items-center justify-center">
                      <Users className="h-4 w-4 text-accent" />
                    </div>
                    <div>
                      <div className="text-xs font-medium">3 studying now</div>
                      <div className="text-2xs text-muted-foreground">Room active</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works - Visual, not numbered */}
      <section className="py-24 border-t border-border bg-muted/30">
        <div className="container max-w-5xl px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-semibold mb-4">
              From notes to knowledge
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Three simple steps. No complex setup required.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <ProcessCard
              icon={Users}
              title="Create or join"
              description="Set up a private room for your study group. Share the 6-letter code to invite others."
              color="primary"
            />
            <ProcessCard
              icon={Upload}
              title="Upload materials"
              description="Drop in your PDFs, notes, or paste text directly. We extract the content automatically."
              color="accent"
            />
            <ProcessCard
              icon={Sparkles}
              title="Generate quizzes"
              description="AI creates questions tailored to your material. Choose difficulty and question count."
              color="success"
            />
          </div>
        </div>
      </section>

      {/* Quiz Modes - More visual, less text */}
      <section className="py-24 border-t border-border">
        <div className="container max-w-5xl px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-semibold mb-4">
              Three ways to study
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Pick the mode that matches how you learn best.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            <ModeCard
              icon={BookOpen}
              mode="Study"
              description="Answers shown immediately. Learn at your pace with instant feedback."
              color="success"
              features={['Instant feedback', 'Explanations shown', 'No time pressure']}
            />
            <ModeCard
              icon={Trophy}
              mode="Challenge"
              description="Timed quizzes with a leaderboard. Compete with your room."
              color="warning"
              features={['Time limits', 'Room leaderboard', 'XP & streaks']}
              featured
            />
            <ModeCard
              icon={Timer}
              mode="Exam"
              description="One attempt. Answers hidden until you finish. Simulate real conditions."
              color="destructive"
              features={['Single attempt', 'Results at end', 'No retakes']}
            />
          </div>
        </div>
      </section>

      {/* PWA Section */}
      <section className="py-20 border-t border-border bg-gradient-to-b from-muted/30 to-background">
        <div className="container max-w-4xl px-6">
          <div className="flex flex-col md:flex-row items-center gap-10">
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-4 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium">
                <Smartphone className="h-3.5 w-3.5" />
                <span>Works offline</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-semibold mb-4">
                Install Synapse on your device
              </h2>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                Add Synapse to your home screen for quick access. Works offline so you can review saved quizzes anywhere, even without internet.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button onClick={() => navigate('/auth')} className="gap-2">
                  <Download className="h-4 w-4" />
                  Get Synapse
                </Button>
                <Button variant="outline" onClick={() => navigate('/auth')}>
                  Learn more
                </Button>
              </div>
            </div>
            <div className="relative">
              <div className="w-48 h-48 md:w-56 md:h-56 rounded-3xl bg-gradient-to-br from-primary/20 via-accent/10 to-primary/5 border border-primary/10 flex items-center justify-center">
                <div className="text-center">
                  <Logo />
                  <p className="text-sm text-muted-foreground mt-3">Study anywhere</p>
                </div>
              </div>
              {/* Decorative elements */}
              <div className="absolute -top-4 -right-4 w-8 h-8 rounded-full bg-success/20 animate-pulse" />
              <div className="absolute -bottom-2 -left-2 w-6 h-6 rounded-full bg-accent/20 animate-pulse" style={{ animationDelay: '0.5s' }} />
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 border-t border-border">
        <div className="container max-w-2xl px-6 text-center">
          <h2 className="text-3xl font-semibold mb-4">
            Ready to study smarter?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            Create your first room in under a minute. Free to start, no credit card required.
          </p>
          <Button size="lg" onClick={() => navigate('/auth')} className="gap-2 shadow-md">
            Create your first room
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-border">
        <div className="container max-w-5xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Logo />
            <span className="text-sm text-muted-foreground">
              Collaborative learning, simplified.
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Synapse
          </p>
        </div>
      </footer>

      {/* PWA Install Banner */}
      {showInstallBanner && (
        <InstallPrompt variant="banner" onClose={() => setShowInstallBanner(false)} />
      )}
    </div>
  );
};

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
  color 
}: { 
  icon: React.ElementType; 
  title: string; 
  description: string;
  color: 'primary' | 'accent' | 'success';
}) => {
  const colorClasses = {
    primary: 'bg-primary/10 text-primary',
    accent: 'bg-accent/10 text-accent',
    success: 'bg-success/10 text-success'
  };

  return (
    <div className="relative group">
      <div className="p-6 rounded-xl border border-border bg-card hover:border-primary/20 transition-all hover:shadow-md">
        <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl ${colorClasses[color]} mb-4`}>
          <Icon className="h-6 w-6" />
        </div>
        <h3 className="font-semibold text-lg mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
      </div>
    </div>
  );
};

const ModeCard = ({
  icon: Icon,
  mode,
  description,
  color,
  features,
  featured
}: {
  icon: React.ElementType;
  mode: string;
  description: string;
  color: 'success' | 'warning' | 'destructive';
  features: string[];
  featured?: boolean;
}) => {
  const colorClasses = {
    success: 'bg-success/10 text-success border-success/20',
    warning: 'bg-warning/10 text-warning border-warning/20',
    destructive: 'bg-destructive/10 text-destructive border-destructive/20'
  };

  const badgeColors = {
    success: 'bg-success/10 text-success',
    warning: 'bg-warning/10 text-warning',
    destructive: 'bg-destructive/10 text-destructive'
  };

  return (
    <div className={`relative p-6 rounded-xl border bg-card transition-all hover:shadow-md ${
      featured ? 'border-warning/30 ring-1 ring-warning/10' : 'border-border hover:border-primary/20'
    }`}>
      {featured && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-warning/10 border border-warning/20 text-warning text-xs font-medium">
          Popular
        </div>
      )}
      
      <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl ${colorClasses[color]} mb-4`}>
        <Icon className="h-6 w-6" />
      </div>
      
      <h3 className="font-semibold text-lg mb-2">{mode} mode</h3>
      <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{description}</p>
      
      <ul className="space-y-2">
        {features.map((feature) => (
          <li key={feature} className="flex items-center gap-2 text-sm">
            <Check className={`h-4 w-4 ${badgeColors[color].split(' ')[1]}`} />
            <span className="text-muted-foreground">{feature}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Index;
