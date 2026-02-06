-- Add link_tags and profiles tables (additive, non-breaking)

-- Link tags (many-to-many)
CREATE TABLE IF NOT EXISTS link_tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  link_id UUID REFERENCES links(id) ON DELETE CASCADE NOT NULL,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_link_tags_unique ON link_tags(link_id, tag_id);
CREATE INDEX IF NOT EXISTS idx_link_tags_link_id ON link_tags(link_id);
CREATE INDEX IF NOT EXISTS idx_link_tags_tag_id ON link_tags(tag_id);

ALTER TABLE link_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own link tags" ON link_tags
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM links l
      WHERE l.id = link_id AND l.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own link tags" ON link_tags
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM links l
      WHERE l.id = link_id AND l.user_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM tags t
      WHERE t.id = tag_id AND t.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own link tags" ON link_tags
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM links l
      WHERE l.id = link_id AND l.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM links l
      WHERE l.id = link_id AND l.user_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM tags t
      WHERE t.id = tag_id AND t.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own link tags" ON link_tags
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM links l
      WHERE l.id = link_id AND l.user_id = auth.uid()
    )
  );

-- Profiles
CREATE TABLE IF NOT EXISTS profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profiles" ON profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profiles" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profiles" ON profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own profiles" ON profiles
  FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Profile links (ordered list)
CREATE TABLE IF NOT EXISTS profile_links (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  link_id UUID REFERENCES links(id) ON DELETE CASCADE NOT NULL,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_profile_links_unique ON profile_links(profile_id, link_id);
CREATE INDEX IF NOT EXISTS idx_profile_links_profile_id ON profile_links(profile_id);
CREATE INDEX IF NOT EXISTS idx_profile_links_link_id ON profile_links(link_id);
CREATE INDEX IF NOT EXISTS idx_profile_links_order ON profile_links(profile_id, order_index);

ALTER TABLE profile_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile links" ON profile_links
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = profile_id AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own profile links" ON profile_links
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = profile_id AND p.user_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM links l
      WHERE l.id = link_id AND l.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own profile links" ON profile_links
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
      SELECT 1 FROM links l
      WHERE l.id = link_id AND l.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own profile links" ON profile_links
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = profile_id AND p.user_id = auth.uid()
    )
  );
