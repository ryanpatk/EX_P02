-- Notes to Self: a chat-style feed of short messages the user leaves for
-- themself. Scoped to a space via profile_id, or to Home when profile_id is
-- NULL. Ported from the legacy memex `self_messages` table (there: per-user
-- only, AES-GCM encrypted); here bodies are plain text like notes, and
-- legacy_id keeps the migration idempotent.
CREATE TABLE IF NOT EXISTS self_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  body TEXT DEFAULT '' NOT NULL,
  legacy_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_self_messages_user_scope_created
  ON self_messages(user_id, profile_id, created_at);
CREATE INDEX IF NOT EXISTS idx_self_messages_profile_id
  ON self_messages(profile_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_self_messages_legacy_id
  ON self_messages(legacy_id)
  WHERE legacy_id IS NOT NULL;

ALTER TABLE self_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own self messages" ON self_messages;
CREATE POLICY "Users can view their own self messages" ON self_messages
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own self messages" ON self_messages;
CREATE POLICY "Users can insert their own self messages" ON self_messages
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND (
      profile_id IS NULL
      OR EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.id = profile_id AND p.user_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "Users can update their own self messages" ON self_messages;
CREATE POLICY "Users can update their own self messages" ON self_messages
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own self messages" ON self_messages;
CREATE POLICY "Users can delete their own self messages" ON self_messages
  FOR DELETE USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS update_self_messages_updated_at ON self_messages;
CREATE TRIGGER update_self_messages_updated_at BEFORE UPDATE ON self_messages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
