-- Allow document deletion by uploaders or room owners
CREATE POLICY "Uploaders can delete own documents"
ON public.documents
FOR DELETE
TO authenticated
USING (
  auth.uid() = uploaded_by 
  OR EXISTS (
    SELECT 1 FROM rooms WHERE rooms.id = documents.room_id AND rooms.owner_id = auth.uid()
  )
);

-- Allow quiz deletion by quiz creators or room owners
CREATE POLICY "Quiz creators or room owners can delete quizzes"
ON public.quizzes
FOR DELETE
TO authenticated
USING (
  auth.uid() = created_by 
  OR EXISTS (
    SELECT 1 FROM rooms WHERE rooms.id = quizzes.room_id AND rooms.owner_id = auth.uid()
  )
);

-- Allow question deletion when parent quiz is deleted
CREATE POLICY "Quiz creators can delete questions"
ON public.questions
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM quizzes q WHERE q.id = questions.quiz_id AND (
      q.created_by = auth.uid() 
      OR EXISTS (SELECT 1 FROM rooms r WHERE r.id = q.room_id AND r.owner_id = auth.uid())
    )
  )
);

-- Update room_members delete policy to also allow room owners to remove members
DROP POLICY IF EXISTS "Members can leave rooms" ON public.room_members;
CREATE POLICY "Members can leave or owners can remove"
ON public.room_members
FOR DELETE
TO authenticated
USING (
  auth.uid() = user_id 
  OR EXISTS (
    SELECT 1 FROM rooms WHERE rooms.id = room_members.room_id AND rooms.owner_id = auth.uid()
  )
);