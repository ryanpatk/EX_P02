-- Add notes primitive: notes table + tag and profile (space) membership joins
-- Mirrors the tasks / task_tags / profile_tasks shape (additive, non-breaking)

-- Notes (body is markdown source). Fresh environments create the new shape
-- directly; environments still carrying the legacy notes table from the
-- initial schema (project_id + encrypted_content, recorded as dropped by
-- 20251127151751 but present in practice) are evolved in place below,
-- preserving their rows.
CREATE TABLE IF NOT EXISTS notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT,
  body TEXT DEFAULT '' NOT NULL,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Legacy → new shape: encrypted_content becomes body (same type, not-null,
-- default ''), and the project coupling goes away with the projects concept.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'notes'
      AND column_name = 'encrypted_content'
  ) THEN
    ALTER TABLE notes RENAME COLUMN encrypted_content TO body;
  END IF;
END $$;

DROP TRIGGER IF EXISTS update_project_last_modified_on_notes_change ON notes;
-- Dropping the column also drops its FK and the indexes that include it
-- (idx_notes_project_id, idx_notes_order)
ALTER TABLE notes DROP COLUMN IF EXISTS project_id;

CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_updated ON notes(user_id, updated_at DESC);

ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own notes" ON notes;
CREATE POLICY "Users can view their own notes" ON notes
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own notes" ON notes;
CREATE POLICY "Users can insert their own notes" ON notes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own notes" ON notes;
CREATE POLICY "Users can update their own notes" ON notes
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own notes" ON notes;
CREATE POLICY "Users can delete their own notes" ON notes
  FOR DELETE USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS update_notes_updated_at ON notes;
CREATE TRIGGER update_notes_updated_at BEFORE UPDATE ON notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Note tags (many-to-many, shared tag vocabulary)
CREATE TABLE IF NOT EXISTS note_tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  note_id UUID REFERENCES notes(id) ON DELETE CASCADE NOT NULL,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_note_tags_unique ON note_tags(note_id, tag_id);
CREATE INDEX IF NOT EXISTS idx_note_tags_note_id ON note_tags(note_id);
CREATE INDEX IF NOT EXISTS idx_note_tags_tag_id ON note_tags(tag_id);

ALTER TABLE note_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own note tags" ON note_tags
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM notes n
      WHERE n.id = note_id AND n.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own note tags" ON note_tags
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM notes n
      WHERE n.id = note_id AND n.user_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM tags g
      WHERE g.id = tag_id AND g.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own note tags" ON note_tags
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM notes n
      WHERE n.id = note_id AND n.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM notes n
      WHERE n.id = note_id AND n.user_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM tags g
      WHERE g.id = tag_id AND g.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own note tags" ON note_tags
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM notes n
      WHERE n.id = note_id AND n.user_id = auth.uid()
    )
  );

-- Profile (space) notes membership (ordered)
CREATE TABLE IF NOT EXISTS profile_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  note_id UUID REFERENCES notes(id) ON DELETE CASCADE NOT NULL,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_profile_notes_unique ON profile_notes(profile_id, note_id);
CREATE INDEX IF NOT EXISTS idx_profile_notes_profile_id ON profile_notes(profile_id);
CREATE INDEX IF NOT EXISTS idx_profile_notes_note_id ON profile_notes(note_id);
CREATE INDEX IF NOT EXISTS idx_profile_notes_order ON profile_notes(profile_id, order_index);

ALTER TABLE profile_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile notes" ON profile_notes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = profile_id AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own profile notes" ON profile_notes
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = profile_id AND p.user_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM notes n
      WHERE n.id = note_id AND n.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own profile notes" ON profile_notes
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = profile_id AND p.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = profile_id AND p.user_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM notes n
      WHERE n.id = note_id AND n.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own profile notes" ON profile_notes
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = profile_id AND p.user_id = auth.uid()
    )
  );
