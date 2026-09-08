/**
 * One-time migration: legacy memex `notes` → new memex `notes`.
 *
 * Legacy notes stored AES-GCM-encrypted plain-text bodies (the legacy editor
 * was a bare textarea, so no format conversion is needed) with a nullable
 * collection_id. Per the decision on 2026-09-07 every note lands in the root
 * with NO space association — collections are ignored and no spaces are
 * created. Titles and timestamps are preserved.
 *
 * Re-running is safe: a legacy note is skipped when the new project already
 * has a note for this user with the same title and created_at (the notes
 * table has no legacy_id column, so this pair is the identity).
 *
 * Usage (same env file as the Notes to Self migration):
 *   node --env-file=.env.migrate scripts/migrate-notes.mjs --email you@example.com [--dry-run]
 *   --legacy-user / --user   Explicit user ids instead of --email.
 *   --unescape   Decode HTML entities (&gt; &lt; &amp; &quot; &#39;) in bodies and titles,
 *                for notes the legacy app stored HTML-escaped. The dry run
 *                reports how many notes contain entities so you can decide.
 */
import { createClient } from '@supabase/supabase-js'
import { webcrypto } from 'node:crypto'

const args = process.argv.slice(2)
const flag = (name) => {
  const i = args.indexOf(name)
  return i === -1 ? undefined : args[i + 1]
}
const DRY_RUN = args.includes('--dry-run')
const UNESCAPE = args.includes('--unescape')
const EMAIL = flag('--email')
let LEGACY_USER_ID = flag('--legacy-user')
let NEW_USER_ID = flag('--user')

const LEGACY_URL = process.env.LEGACY_SUPABASE_URL
const LEGACY_KEY = process.env.LEGACY_SERVICE_ROLE_KEY
const LEGACY_ENC_KEY = process.env.LEGACY_NOTE_ENCRYPTION_KEY
const NEW_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const NEW_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

const missing = [
  ['LEGACY_SUPABASE_URL', LEGACY_URL],
  ['LEGACY_SERVICE_ROLE_KEY', LEGACY_KEY],
  ['LEGACY_NOTE_ENCRYPTION_KEY', LEGACY_ENC_KEY],
  ['SUPABASE_URL', NEW_URL],
  ['SUPABASE_SERVICE_ROLE_KEY', NEW_KEY],
]
  .filter(([, v]) => !v)
  .map(([k]) => k)
if (missing.length > 0) {
  console.error(`Missing env: ${missing.join(', ')}`)
  process.exit(1)
}
if (!EMAIL && !(LEGACY_USER_ID && NEW_USER_ID)) {
  console.error('Pass --email <address>, or both --legacy-user <uuid> and --user <uuid>')
  process.exit(1)
}

const legacy = createClient(LEGACY_URL, LEGACY_KEY, { auth: { persistSession: false } })
const next = createClient(NEW_URL, NEW_KEY, { auth: { persistSession: false } })

/* ---- Decryption: mirrors MEMEX-legacy/src/utils/encryption.ts ---- */

const b64ToBytes = (b64) => Uint8Array.from(Buffer.from(b64, 'base64'))

const cryptoKey = await webcrypto.subtle.importKey(
  'raw',
  b64ToBytes(LEGACY_ENC_KEY),
  'AES-GCM',
  false,
  ['decrypt'],
)

const decrypt = async (encrypted_content, content_nonce) => {
  const plain = await webcrypto.subtle.decrypt(
    { name: 'AES-GCM', iv: b64ToBytes(content_nonce) },
    cryptoKey,
    b64ToBytes(encrypted_content),
  )
  return new TextDecoder().decode(plain)
}

/* ---- Resolve users ---- */

const findUserByEmail = async (client, label) => {
  const wanted = EMAIL.toLowerCase()
  let page = 1
  for (;;) {
    const { data, error } = await client.auth.admin.listUsers({ page, perPage: 200 })
    if (error) throw new Error(`${label}: listUsers failed — ${error.message}`)
    const hit = data.users.find((u) => u.email?.toLowerCase() === wanted)
    if (hit) return hit.id
    if (data.users.length < 200) break
    page += 1
  }
  throw new Error(`${label}: no user with email ${EMAIL}`)
}

if (EMAIL) {
  LEGACY_USER_ID = LEGACY_USER_ID ?? (await findUserByEmail(legacy, 'legacy'))
  NEW_USER_ID = NEW_USER_ID ?? (await findUserByEmail(next, 'new'))
}
console.log(`legacy user ${LEGACY_USER_ID} → new user ${NEW_USER_ID}${DRY_RUN ? ' (dry run)' : ''}`)

// No /g flag: this is used with .test()/.search(), which would otherwise carry lastIndex state
const ENTITY_PATTERN = /&(?:gt|lt|amp|quot|#39|#x27|nbsp);/
const unescapeHtml = (text) =>
  text
    .replace(/&gt;/g, '>')
    .replace(/&lt;/g, '<')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&#x27;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')

/* ---- Read + decrypt legacy notes ---- */

const { data: rows, error: readError } = await legacy
  .from('notes')
  .select('id, title, encrypted_content, content_nonce, collection_id, created_at, updated_at')
  .eq('user_id', LEGACY_USER_ID)
  .order('created_at', { ascending: true })
if (readError) throw readError

const inCollections = rows.filter((r) => r.collection_id).length
console.log(
  `${rows.length} legacy notes found (${inCollections} were in collections — ignored, all go to root)`,
)

const decrypted = []
let failed = 0
let emptyBodies = 0
for (const row of rows) {
  let body = ''
  if (row.encrypted_content && row.content_nonce) {
    try {
      body = await decrypt(row.encrypted_content, row.content_nonce)
    } catch (error) {
      failed += 1
      console.warn(`  decrypt failed for ${row.id} (“${row.title}”): ${error.message}`)
      continue
    }
  } else {
    emptyBodies += 1
  }
  let title = row.title?.trim() || null
  if (UNESCAPE) {
    body = unescapeHtml(body)
    title = title ? unescapeHtml(title) : title
  }
  decrypted.push({
    title,
    body,
    created_at: row.created_at,
    updated_at: row.updated_at ?? row.created_at,
  })
}
console.log(`${decrypted.length} ready, ${failed} failed to decrypt, ${emptyBodies} had empty bodies`)

const withEntities = decrypted.filter(
  (n) => ENTITY_PATTERN.test(n.body) || (n.title && ENTITY_PATTERN.test(n.title)),
).length
if (withEntities > 0) {
  console.log(
    `  ${withEntities} note${withEntities === 1 ? '' : 's'} contain HTML entities (&gt; &lt; &amp; …)${
      UNESCAPE ? ' — still present after --unescape (double-encoded?)' : ' — re-run with --unescape to decode them'
    }`,
  )
  const ex = decrypted.find((n) => ENTITY_PATTERN.test(n.body))
  if (ex) {
    const at = ex.body.search(ENTITY_PATTERN)
    console.log(`  e.g. “${ex.title ?? '(untitled)'}”: …${ex.body.slice(Math.max(0, at - 30), at + 30).replace(/\s+/g, ' ')}…`)
  }
} else {
  console.log('  no HTML entities detected in bodies or titles')
}

if (decrypted.length > 0) {
  const sample = decrypted[decrypted.length - 1]
  const preview = sample.body.replace(/\s+/g, ' ').slice(0, 60)
  console.log(
    `  latest: ${new Date(sample.created_at).toLocaleString()} — “${sample.title ?? '(untitled)'}” · ${preview}${sample.body.length > 60 ? '…' : ''}`,
  )
}

/* ---- Skip notes already present (same title + created_at) ---- */

const { data: existing, error: existingError } = await next
  .from('notes')
  .select('title, created_at')
  .eq('user_id', NEW_USER_ID)
if (existingError) throw existingError

const identity = (title, createdAt) => `${title ?? ''}|${new Date(createdAt).toISOString()}`
const have = new Set((existing ?? []).map((n) => identity(n.title, n.created_at)))

const toInsert = decrypted
  .filter((n) => !have.has(identity(n.title, n.created_at)))
  .map((n) => ({
    user_id: NEW_USER_ID,
    title: n.title,
    body: n.body,
    order_index: 0,
    created_at: n.created_at,
    updated_at: n.updated_at,
  }))

console.log(`${toInsert.length} to insert (${decrypted.length - toInsert.length} already present)`)

if (DRY_RUN || toInsert.length === 0) {
  console.log('Done (nothing written).')
  process.exit(0)
}

/* ---- Insert in batches ---- */

const BATCH = 50
let inserted = 0
for (let i = 0; i < toInsert.length; i += BATCH) {
  const batch = toInsert.slice(i, i + BATCH)
  const { error } = await next.from('notes').insert(batch)
  if (error) throw error
  inserted += batch.length
  console.log(`  inserted ${inserted}/${toInsert.length}`)
}

console.log(`Done. ${inserted} notes migrated into the root (no space association).`)
