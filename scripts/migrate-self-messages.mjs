/**
 * One-time migration: legacy memex "Notes to Self" → new memex `self_messages`.
 *
 * The legacy table (`self_messages` in the MEMEX-legacy Supabase project)
 * stored AES-GCM-encrypted bodies with a per-row nonce and a single shared
 * key (VITE_NOTE_ENCRYPTION_KEY). This script decrypts each row and inserts
 * it as plain text into the new project's `self_messages`, scoped to Home
 * (profile_id NULL), preserving created_at. Re-running is safe: rows are
 * matched on legacy_id and skipped if already present.
 *
 * Usage:
 *   LEGACY_SUPABASE_URL=... LEGACY_SERVICE_ROLE_KEY=... LEGACY_NOTE_ENCRYPTION_KEY=... \
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
 *     node scripts/migrate-self-messages.mjs --email you@example.com [--dry-run]
 *
 *   --email      Resolves the user in BOTH projects by email (auth admin API),
 *                since the two projects have different auth user ids.
 *   --legacy-user / --user   Pass explicit user ids instead of --email.
 *   --dry-run    Decrypt and report; write nothing.
 *
 * Legacy values live in ../MEMEX-legacy/env/.env (VITE_SUPABASE_URL and
 * VITE_NOTE_ENCRYPTION_KEY); the service-role key comes from that project's
 * Supabase dashboard (Settings → API). Never commit any of these.
 */
import { createClient } from '@supabase/supabase-js'
import { webcrypto } from 'node:crypto'

const args = process.argv.slice(2)
const flag = (name) => {
  const i = args.indexOf(name)
  return i === -1 ? undefined : args[i + 1]
}
const DRY_RUN = args.includes('--dry-run')
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

/* ---- Read + decrypt legacy rows ---- */

const { data: rows, error: readError } = await legacy
  .from('self_messages')
  .select('id, encrypted_content, content_nonce, created_at, updated_at')
  .eq('user_id', LEGACY_USER_ID)
  .order('created_at', { ascending: true })
if (readError) throw readError

console.log(`${rows.length} legacy notes to self found`)

const decrypted = []
let failed = 0
for (const row of rows) {
  if (!row.encrypted_content || !row.content_nonce) {
    console.warn(`  skip ${row.id}: empty content`)
    continue
  }
  try {
    decrypted.push({
      legacy_id: row.id,
      body: await decrypt(row.encrypted_content, row.content_nonce),
      created_at: row.created_at,
      updated_at: row.updated_at ?? row.created_at,
    })
  } catch (error) {
    failed += 1
    console.warn(`  decrypt failed for ${row.id}: ${error.message}`)
  }
}
console.log(`${decrypted.length} decrypted, ${failed} failed`)

if (decrypted.length > 0) {
  const sample = decrypted[decrypted.length - 1]
  console.log(`  latest: ${new Date(sample.created_at).toLocaleString()} — “${sample.body.slice(0, 60)}${sample.body.length > 60 ? '…' : ''}”`)
}

/* ---- Skip already-migrated rows ---- */

const { data: existing, error: existingError } = await next
  .from('self_messages')
  .select('legacy_id')
  .eq('user_id', NEW_USER_ID)
  .not('legacy_id', 'is', null)
if (existingError) throw existingError
const have = new Set((existing ?? []).map((r) => r.legacy_id))

const toInsert = decrypted
  .filter((r) => !have.has(r.legacy_id))
  .map((r) => ({
    user_id: NEW_USER_ID,
    profile_id: null,
    body: r.body,
    legacy_id: r.legacy_id,
    created_at: r.created_at,
    updated_at: r.updated_at,
  }))

console.log(`${toInsert.length} to insert (${have.size} already migrated)`)

if (DRY_RUN || toInsert.length === 0) {
  console.log('Done (nothing written).')
  process.exit(0)
}

/* ---- Insert in batches ---- */

const BATCH = 100
let inserted = 0
for (let i = 0; i < toInsert.length; i += BATCH) {
  const batch = toInsert.slice(i, i + BATCH)
  const { error } = await next.from('self_messages').insert(batch)
  if (error) throw error
  inserted += batch.length
  console.log(`  inserted ${inserted}/${toInsert.length}`)
}

console.log(`Done. ${inserted} notes to self migrated into Home.`)
