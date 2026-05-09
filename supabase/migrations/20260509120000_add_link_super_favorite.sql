-- SuperFavorites: header quick-access favicons
ALTER TABLE links
  ADD COLUMN IF NOT EXISTS is_super_favorite BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_links_user_super_favorite
  ON links(user_id)
  WHERE is_super_favorite = true;
