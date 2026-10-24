-- Where a link came from, so captures can be told apart and filtered later.
-- NULL = saved in the app. Set by memex-api: 'extension' (toolbar, shortcut,
-- context menu), 'x:bookmark', 'pinterest:save'.
ALTER TABLE links ADD COLUMN IF NOT EXISTS source TEXT;

-- memex-api looks up an existing link by URL before inserting, so passive
-- captures (bookmarking the same tweet twice) never create duplicates.
CREATE INDEX IF NOT EXISTS idx_links_user_url ON links(user_id, url);
