-- Add new gamification columns to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS hot_streak INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS best_hot_streak INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS streak_freeze_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS streak_freeze_available BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS xp_multiplier DECIMAL DEFAULT 1.0,
ADD COLUMN IF NOT EXISTS perfect_scores INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS daily_goal_completed BOOLEAN DEFAULT false;

-- Create daily_activity table for detailed tracking
CREATE TABLE IF NOT EXISTS public.daily_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  quizzes_completed INTEGER DEFAULT 0,
  correct_answers INTEGER DEFAULT 0,
  total_answers INTEGER DEFAULT 0,
  xp_earned INTEGER DEFAULT 0,
  perfect_quizzes INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, date)
);

-- Enable RLS on daily_activity
ALTER TABLE public.daily_activity ENABLE ROW LEVEL SECURITY;

-- Create policies for daily_activity
CREATE POLICY "Users can view their own daily activity" 
ON public.daily_activity 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own daily activity" 
ON public.daily_activity 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own daily activity" 
ON public.daily_activity 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Add new offensive/defensive achievements
INSERT INTO public.achievements (id, name, description, icon, category, xp_reward, requirement_value) VALUES
('hot_hand', 'Hot Hand', 'Get 10 correct answers in a row across any quizzes', 'flame', 'offensive', 100, 10),
('rampage', 'Rampage', 'Complete 3 quizzes in a single day', 'zap', 'offensive', 75, 3),
('blitz', 'Blitz Master', 'Answer 5 questions correctly in under 30 seconds each', 'zap', 'offensive', 150, 5),
('perfection_streak', 'Perfection Streak', 'Get 3 perfect scores in a row', 'star', 'offensive', 200, 3),
('comeback_kid', 'Comeback Kid', 'Improve your score by 20% after a poor quiz', 'trending-up', 'defensive', 50, 20),
('fortress', 'Fortress', 'Maintain 80%+ accuracy for 7 consecutive days', 'shield', 'defensive', 200, 7),
('guardian', 'Guardian', 'Stay in top 3 of a room leaderboard for 7 days', 'shield', 'defensive', 175, 7),
('resilient', 'Resilient', 'Use a streak freeze to save your streak', 'heart', 'defensive', 25, 1),
('weekend_warrior', 'Weekend Warrior', 'Complete quizzes on both Saturday and Sunday', 'calendar', 'special', 100, 2),
('night_owl', 'Night Owl', 'Complete a quiz after 10 PM', 'moon', 'special', 30, 1),
('early_bird', 'Early Bird', 'Complete a quiz before 7 AM', 'sun', 'special', 30, 1)
ON CONFLICT (id) DO NOTHING;

-- Create updated_at trigger for daily_activity
CREATE TRIGGER update_daily_activity_updated_at
BEFORE UPDATE ON public.daily_activity
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();