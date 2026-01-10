import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Logo } from '@/components/Logo';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

interface UserPreferences {
  default_difficulty: 'easy' | 'medium' | 'hard';
  default_time_limit: number | null;
  show_answers_after_quiz: boolean;
}

const Preferences = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [preferences, setPreferences] = useState<UserPreferences>({
    default_difficulty: 'medium',
    default_time_limit: null,
    show_answers_after_quiz: true,
  });

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchPreferences();
  }, [user, navigate]);

  const fetchPreferences = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (data) {
      setPreferences({
        default_difficulty: (data.preferred_difficulty as 'easy' | 'medium' | 'hard') || 'medium',
        default_time_limit: data.default_time_limit,
        show_answers_after_quiz: data.show_answers_immediately ?? true,
      });
    }
    setIsLoading(false);
  };

  const handleSave = async () => {
    if (!user) return;

    setIsSaving(true);

    const { error } = await supabase
      .from('user_preferences')
      .upsert({
        user_id: user.id,
        preferred_difficulty: preferences.default_difficulty,
        default_time_limit: preferences.default_time_limit,
        show_answers_immediately: preferences.show_answers_after_quiz,
      }, {
        onConflict: 'user_id',
      });

    if (error) {
      toast({
        title: 'Failed to save preferences',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Preferences saved!',
        description: 'Your quiz preferences have been updated.',
      });
    }

    setIsSaving(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading preferences...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Logo />
        </div>
        <ThemeToggle />
      </header>

      {/* Main content */}
      <main className="flex-1 container max-w-2xl py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Preferences</h1>
          <p className="text-muted-foreground">
            Customize your default quiz settings
          </p>
        </div>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Quiz Defaults</CardTitle>
            <CardDescription>
              These settings will be applied to new quizzes you take
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Default Difficulty */}
            <div className="space-y-2">
              <Label htmlFor="difficulty">Default Difficulty</Label>
              <Select
                value={preferences.default_difficulty}
                onValueChange={(value: 'easy' | 'medium' | 'hard') =>
                  setPreferences({ ...preferences, default_difficulty: value })
                }
              >
                <SelectTrigger id="difficulty">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Preferred difficulty when generating new quizzes
              </p>
            </div>

            {/* Default Time Limit */}
            <div className="space-y-2">
              <Label htmlFor="time-limit">Default Time Limit</Label>
              <Select
                value={preferences.default_time_limit?.toString() || 'none'}
                onValueChange={(value) =>
                  setPreferences({
                    ...preferences,
                    default_time_limit: value === 'none' ? null : parseInt(value),
                  })
                }
              >
                <SelectTrigger id="time-limit">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No time limit</SelectItem>
                  <SelectItem value="5">5 minutes</SelectItem>
                  <SelectItem value="10">10 minutes</SelectItem>
                  <SelectItem value="15">15 minutes</SelectItem>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="60">60 minutes</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Time limit preference for timed quizzes
              </p>
            </div>

            {/* Show Answers */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="show-answers">Show answers after quiz</Label>
                <p className="text-sm text-muted-foreground">
                  Display correct answers when you complete a quiz
                </p>
              </div>
              <Switch
                id="show-answers"
                checked={preferences.show_answers_after_quiz}
                onCheckedChange={(checked) =>
                  setPreferences({ ...preferences, show_answers_after_quiz: checked })
                }
              />
            </div>

            {/* Save Button */}
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full bg-gradient-synapse hover:opacity-90"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Preferences
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Preferences;
