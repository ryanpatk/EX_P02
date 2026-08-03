-- Add tasks primitive: tasks table + tag and profile (space) membership joins
-- Mirrors the links / link_tags / profile_links shape (additive, non-breaking)

-- Tasks
CREATE TABLE IF NOT EXISTS tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  detail TEXT,
  is_done BOOLEAN DEFAULT FALSE NOT NULL,
  due_date DATE,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_order ON tasks(user_id, is_done, order_index);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own tasks" ON tasks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tasks" ON tasks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tasks" ON tasks
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tasks" ON tasks
  FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Task tags (many-to-many, shared tag vocabulary)
CREATE TABLE IF NOT EXISTS task_tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_task_tags_unique ON task_tags(task_id, tag_id);
CREATE INDEX IF NOT EXISTS idx_task_tags_task_id ON task_tags(task_id);
CREATE INDEX IF NOT EXISTS idx_task_tags_tag_id ON task_tags(tag_id);

ALTER TABLE task_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own task tags" ON task_tags
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM tasks t
      WHERE t.id = task_id AND t.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own task tags" ON task_tags
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM tasks t
      WHERE t.id = task_id AND t.user_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM tags g
      WHERE g.id = tag_id AND g.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own task tags" ON task_tags
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM tasks t
      WHERE t.id = task_id AND t.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tasks t
      WHERE t.id = task_id AND t.user_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM tags g
      WHERE g.id = tag_id AND g.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own task tags" ON task_tags
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM tasks t
      WHERE t.id = task_id AND t.user_id = auth.uid()
    )
  );

-- Profile (space) tasks membership (ordered)
CREATE TABLE IF NOT EXISTS profile_tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_profile_tasks_unique ON profile_tasks(profile_id, task_id);
CREATE INDEX IF NOT EXISTS idx_profile_tasks_profile_id ON profile_tasks(profile_id);
CREATE INDEX IF NOT EXISTS idx_profile_tasks_task_id ON profile_tasks(task_id);
CREATE INDEX IF NOT EXISTS idx_profile_tasks_order ON profile_tasks(profile_id, order_index);

ALTER TABLE profile_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile tasks" ON profile_tasks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = profile_id AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own profile tasks" ON profile_tasks
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = profile_id AND p.user_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM tasks t
      WHERE t.id = task_id AND t.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own profile tasks" ON profile_tasks
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
      SELECT 1 FROM tasks t
      WHERE t.id = task_id AND t.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own profile tasks" ON profile_tasks
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = profile_id AND p.user_id = auth.uid()
    )
  );
