-- Personal access tokens for the memex-api worker (browser extension capture).
-- Only a SHA-256 hash of each token is stored; the token itself is shown once
-- at creation and never persisted.

CREATE TABLE IF NOT EXISTS api_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_used_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_api_tokens_user_id ON api_tokens(user_id);

ALTER TABLE api_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own api tokens" ON api_tokens
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own api tokens" ON api_tokens
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Revocation is deletion; no UPDATE policy on purpose. last_used_at is
-- maintained by the memex-api worker via the service role.
CREATE POLICY "Users can delete their own api tokens" ON api_tokens
  FOR DELETE USING (auth.uid() = user_id);
