import { createAdminClient } from '@/lib/supabase/admin'
import { fetchPlaceNotices } from '@/lib/place/fetch'

export async function syncPlaceNotices() {
  const notices = await fetchPlaceNotices()

  if (notices.length === 0) {
    return { synced: 0, failed: 0 }
  }

  const supabase = createAdminClient()

  let synced = 0
  const errors: { reference: string; error: string }[] = []

  // Upsert one notice at a time so a single malformed record doesn't fail
  // the whole batch (same pattern as the BOAMP sync).
  for (const notice of notices) {
    const { error } = await supabase
      .from('place_notices')
      .upsert(notice, { onConflict: 'reference' })

    if (error) {
      errors.push({ reference: notice.reference, error: error.message })
      console.error('[place/sync] failed to upsert notice', notice.reference, error.message)
    } else {
      synced++
    }
  }

  return { synced, failed: errors.length, errors: errors.length ? errors : undefined }
}
