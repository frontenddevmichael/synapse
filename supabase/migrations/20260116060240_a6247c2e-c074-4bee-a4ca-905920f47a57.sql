-- =====================================================
-- SYNAPSE ENHANCEMENT: Gamification & Analytics System
-- =====================================================

-- 1. Add gamification columns to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS xp integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS level integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS streak_days integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_activity_date date,
ADD COLUMN IF NOT EXISTS total_quizzes_completed integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_correct_answers integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_questions_answered integer DEFAULT 0;

-- 2. Create achievements table
CREATE TABLE IF NOT EXISTS public.achievements (
  id text PRIMARY KEY,
  name text NOT NULL,
  description text NOT NULL,
  icon text NOT NULL,
  xp_reward integer NOT NULL DEFAULT 0,
  category text NOT NULL DEFAULT 'general',
  requirement_value integer DEFAULT 1,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- 3. Create user_achievements junction table
CREATE TABLE IF NOT EXISTS public.user_achievements (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  achievement_id text NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  earned_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);

-- 4. Create bookmarked_questions table for study features
CREATE TABLE IF NOT EXISTS public.bookmarked_questions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  notes text,
  UNIQUE(user_id, question_id)
);

-- 5. Create active_sessions table for real-time multiplayer
CREATE TABLE IF NOT EXISTS public.active_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  quiz_id uuid NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  room_id uuid NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  current_question integer DEFAULT 0,
  answers_count integer DEFAULT 0,
  started_at timestamp with time zone NOT NULL DEFAULT now(),
  last_activity timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, quiz_id)
);

-- Enable RLS on new tables
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmarked_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.active_sessions ENABLE ROW LEVEL SECURITY;

-- Achievements policies (public read, system write)
CREATE POLICY "Achievements are viewable by everyone" 
ON public.achievements FOR SELECT 
USING (true);

-- User achievements policies
CREATE POLICY "Users can view all achievements" 
ON public.user_achievements FOR SELECT 
USING (true);

CREATE POLICY "Users can earn achievements for themselves" 
ON public.user_achievements FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Bookmarked questions policies
CREATE POLICY "Users can view their own bookmarks" 
ON public.bookmarked_questions FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own bookmarks" 
ON public.bookmarked_questions FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bookmarks" 
ON public.bookmarked_questions FOR DELETE 
USING (auth.uid() = user_id);

-- Active sessions policies (room members can see)
CREATE POLICY "Room members can view active sessions" 
ON public.active_sessions FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.room_members rm
    WHERE rm.room_id = active_sessions.room_id
    AND rm.user_id = auth.uid()
  )
);

CREATE POLICY "Users can manage their own sessions" 
ON public.active_sessions FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions" 
ON public.active_sessions FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sessions" 
ON public.active_sessions FOR DELETE 
USING (auth.uid() = user_id);

-- Insert default achievements
INSERT INTO public.achievements (id, name, description, icon, xp_reward, category, requirement_value) VALUES
('first_quiz', 'First Steps', 'Complete your first quiz', 'trophy', 50, 'milestone', 1),
('quiz_master_10', 'Quiz Enthusiast', 'Complete 10 quizzes', 'star', 100, 'milestone', 10),
('quiz_master_50', 'Quiz Master', 'Complete 50 quizzes', 'crown', 500, 'milestone', 50),
('perfect_score', 'Perfectionist', 'Score 100% on a quiz', 'target', 75, 'performance', 100),
('streak_3', 'On Fire', 'Maintain a 3-day streak', 'flame', 50, 'streak', 3),
('streak_7', 'Unstoppable', 'Maintain a 7-day streak', 'zap', 150, 'streak', 7),
('streak_30', 'Dedication', 'Maintain a 30-day streak', 'medal', 500, 'streak', 30),
('quick_learner', 'Quick Learner', 'Complete a quiz in under 2 minutes', 'clock', 50, 'speed', 120),
('room_creator', 'Host', 'Create your first room', 'home', 25, 'social', 1),
('collaborator', 'Team Player', 'Join 5 different rooms', 'users', 100, 'social', 5)
ON CONFLICT (id) DO NOTHING;

-- Enable realtime for active_sessions
ALTER PUBLICATION supabase_realtime ADD TABLE public.active_sessions;

-- Set REPLICA IDENTITY for realtime updates
ALTER TABLE public.active_sessions REPLICA IDENTITY FULL;
ALTER TABLE public.quiz_attempts REPLICA IDENTITY FULL;

-- Add quiz_attempts to realtime publication if not already
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.quiz_attempts;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON public.user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_active_sessions_room ON public.active_sessions(room_id);
CREATE INDEX IF NOT EXISTS idx_active_sessions_quiz ON public.active_sessions(quiz_id);
CREATE INDEX IF NOT EXISTS idx_bookmarked_questions_user ON public.bookmarked_questions(user_id);