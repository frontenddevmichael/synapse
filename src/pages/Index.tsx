import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Upload, Users, Zap, BarChart3 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Logo } from '@/components/Logo';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-border">
        <Logo />
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Button variant="ghost" onClick={() => navigate('/auth')}>
            Sign in
          </Button>
          <Button onClick={() => navigate('/auth')}>
            Get started
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center px-6 py-20 text-center">
        <div className="max-w-2xl mx-auto animate-slide-up">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight mb-6 text-balance">
            Study together,<br />
            <span className="text-accent">learn faster</span>
          </h1>
          
          <p className="text-lg sm:text-xl text-muted-foreground mb-10 max-w-xl mx-auto prose-width">
            Synapse turns your study materials into quizzes. Create a room, 
            upload your notes, and let your group quiz each other.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="lg" onClick={() => navigate('/auth')} className="gap-2">
              Create a room
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate('/auth')}>
              Join with code
            </Button>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-6 border-t border-border bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-semibold text-center mb-16">
            Three steps to better study sessions
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <Step
              number="1"
              icon={Users}
              title="Create a room"
              description="Set up a private study room and share the code with your group."
            />
            <Step
              number="2"
              icon={Upload}
              title="Upload materials"
              description="Add your notes, slides, or readings. Any text content works."
            />
            <Step
              number="3"
              icon={Zap}
              title="Generate quizzes"
              description="We create questions from your content. Take them solo or compete."
            />
          </div>
        </div>
      </section>

      {/* Features summary */}
      <section className="py-20 px-6 border-t border-border">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-semibold mb-6">
            Built for real studying
          </h2>
          <p className="text-muted-foreground mb-12 text-lg max-w-xl mx-auto">
            Synapse isn't another flashcard app. It's a focused tool for groups 
            who want to test their understanding together.
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-left">
            <Feature
              title="Study mode"
              description="See answers immediately. Learn at your own pace."
            />
            <Feature
              title="Challenge mode"
              description="Timed quizzes with a room leaderboard."
            />
            <Feature
              title="Exam mode"
              description="One attempt only. Answers hidden until you finish."
            />
            <Feature
              title="Progress tracking"
              description="See how you're improving over time."
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6 border-t border-border bg-primary text-primary-foreground">
        <div className="max-w-xl mx-auto text-center">
          <h2 className="text-2xl font-semibold mb-4">
            Ready to study smarter?
          </h2>
          <p className="opacity-90 mb-8">
            Create your first room in under a minute.
          </p>
          <Button 
            size="lg" 
            variant="secondary"
            onClick={() => navigate('/auth')} 
            className="gap-2"
          >
            Get started free
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 px-6 text-center text-sm text-muted-foreground border-t border-border">
        <p>© {new Date().getFullYear()} Synapse</p>
      </footer>
    </div>
  );
};

const Step = ({ 
  number, 
  icon: Icon, 
  title, 
  description 
}: { 
  number: string;
  icon: React.ElementType;
  title: string;
  description: string;
}) => (
  <div className="text-center">
    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary mb-4">
      <Icon className="h-5 w-5" />
    </div>
    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
      Step {number}
    </div>
    <h3 className="font-semibold text-lg mb-2">{title}</h3>
    <p className="text-muted-foreground text-sm">{description}</p>
  </div>
);

const Feature = ({ title, description }: { title: string; description: string }) => (
  <div className="p-5 rounded-lg border border-border bg-card">
    <h3 className="font-medium mb-1">{title}</h3>
    <p className="text-sm text-muted-foreground">{description}</p>
  </div>
);

export default Index;
