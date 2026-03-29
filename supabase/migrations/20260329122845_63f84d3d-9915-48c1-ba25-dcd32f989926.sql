
-- Feature 1: Recall cards table
CREATE TABLE public.recall_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  question_id uuid REFERENCES public.questions(id) ON DELETE CASCADE NOT NULL,
  next_review_at timestamptz DEFAULT now(),
  interval_days integer DEFAULT 1,
  ease_factor float DEFAULT 2.5,
  repetitions integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, question_id)
);

ALTER TABLE public.recall_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own recall cards" ON public.recall_cards
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own recall cards" ON public.recall_cards
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own recall cards" ON public.recall_cards
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX idx_recall_cards_user_next_review ON public.recall_cards(user_id, next_review_at);

-- Feature 3: User questions table
CREATE TABLE public.user_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid REFERENCES public.rooms(id) ON DELETE CASCADE NOT NULL,
  author_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  question_text text NOT NULL,
  option_a text,
  option_b text,
  option_c text,
  option_d text,
  correct_answer text NOT NULL,
  question_type text NOT NULL DEFAULT 'multiple_choice',
  difficulty text NOT NULL DEFAULT 'medium',
  status text NOT NULL DEFAULT 'pending',
  rejection_reason text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.user_questions ENABLE ROW LEVEL SECURITY;

-- Members can insert where they belong to the room
CREATE POLICY "Members can submit questions" ON public.user_questions
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = author_id AND
    EXISTS (SELECT 1 FROM public.room_members WHERE room_id = user_questions.room_id AND user_id = auth.uid())
  );

-- Members can read their own submissions
CREATE POLICY "Members can read own submissions" ON public.user_questions
  FOR SELECT TO authenticated
  USING (
    auth.uid() = author_id OR
    EXISTS (SELECT 1 FROM public.rooms WHERE id = user_questions.room_id AND owner_id = auth.uid())
  );

-- Room owner can update status
CREATE POLICY "Owner can update question status" ON public.user_questions
  FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.rooms WHERE id = user_questions.room_id AND owner_id = auth.uid())
  );
