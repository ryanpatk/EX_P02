-- Per-space super favorites: a link can be pinned to the header inside one
-- space without being pinned everywhere. links.is_super_favorite stays as the
-- Home (global) pin; Home shows the union of both.
ALTER TABLE profile_links
  ADD COLUMN IF NOT EXISTS is_super_favorite BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_profile_links_super_favorite
  ON profile_links(profile_id)
  WHERE is_super_favorite = true;
