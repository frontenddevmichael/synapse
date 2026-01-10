import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Brain, Users, Zap, BookOpen, Trophy, Shield } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Logo } from '@/components/Logo';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  const features = [
    {
      icon: Users,
      title: 'Collaborative Rooms',
      description: 'Create study rooms and invite friends. Learn better together.',
    },
    {
      icon: Zap,
      title: 'AI-Powered Quizzes',
      description: 'Upload documents and let AI generate smart quizzes instantly.',
    },
    {
      icon: BookOpen,
      title: 'Multiple Modes',
      description: 'Study, Challenge, or Exam mode - choose your learning style.',
    },
    {
      icon: Trophy,
      title: 'Leaderboards',
      description: 'Compete with friends and track your progress on room leaderboards.',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-border">
        <Logo />
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button variant="outline" onClick={() => navigate('/auth')}>
            Sign In
          </Button>
          <Button onClick={() => navigate('/auth')}>
            Get Started
          </Button>
        </div>
      </header>

      {/* Hero section */}
      <section className="flex-1 flex flex-col items-center justify-center px-4 py-16 text-center">
        <div className="max-w-3xl mx-auto animate-slide-up">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <Brain className="h-4 w-4" />
            AI-Powered Learning Platform
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            Learn together,{' '}
            <span className="gradient-text">grow together</span>
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Synapse transforms your study materials into interactive quizzes. 
            Create rooms, invite friends, and compete on leaderboards.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={() => navigate('/auth')} className="gap-2">
              Start Learning Free
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate('/auth')}>
              Watch Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Features section */}
      <section className="py-16 px-4 border-t border-border">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Everything you need to learn smarter</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Synapse combines AI quiz generation with collaborative learning features
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
                <CardContent className="pt-6">
                  <div className="p-3 rounded-lg bg-primary/10 w-fit mb-4">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA section */}
      <section className="py-16 px-4 bg-primary/5 border-t border-border">
        <div className="max-w-3xl mx-auto text-center">
          <Shield className="h-12 w-12 text-primary mx-auto mb-6" />
          <h2 className="text-3xl font-bold mb-4">Ready to transform your learning?</h2>
          <p className="text-muted-foreground mb-8">
            Join thousands of students who are already learning smarter with Synapse.
          </p>
          <Button size="lg" onClick={() => navigate('/auth')} className="gap-2">
            Create Free Account
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="p-6 text-center text-sm text-muted-foreground border-t border-border">
        <p>© 2024 Synapse. Learn together, grow together.</p>
      </footer>
    </div>
  );
};

export default Index;
