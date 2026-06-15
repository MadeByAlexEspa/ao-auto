import { createAdminClient } from '@/lib/supabase/admin'
import { fetchBoampNotices } from '@/lib/boamp/fetch'
import { boampConfig } from '@/lib/boamp/config'
import { extractTenderInfo, DEFAULT_LLM_MODEL } from '@/lib/boamp/extract'

export async function syncBoampNotices() {
  const today = new Date().toISOString().slice(0, 10)

  const notices = await fetchBoampNotices({
    keywords:    boampConfig.keywords,
    departments: boampConfig.departments,
    date:        today,
    limit:       boampConfig.limit,
  })

  if (notices.length === 0) {
    return { synced: 0, failed: 0, date: today }
  }

  const supabase = createAdminClient()

  // US-5.3: only run LLM extraction for notices not already in the catalog,
  // so existing per-org extractions aren't overwritten.
  const idwebs = notices.map(n => n.idweb)
  const { data: existing } = await supabase
    .from('boamp_notices')
    .select('idweb')
    .in('idweb', idwebs)
  const existingIds = new Set((existing ?? []).map(r => r.idweb))

  // Each org picks its own LLM model for extraction (org_settings.llm_model,
  // falling back to the default if no row exists).
  const { data: orgs } = await supabase
    .from('orgs')
    .select('id, org_settings(llm_model)')
  const orgModels = (orgs ?? []).map(o => ({
    orgId: o.id as string,
    model: ((o.org_settings as { llm_model: string }[] | null)?.[0]?.llm_model) ?? DEFAULT_LLM_MODEL,
  }))

  let synced = 0
  const errors: { idweb: string; error: string }[] = []

  // Upsert one notice at a time so a single malformed record doesn't fail
  // the whole batch.
  for (const notice of notices) {
    const isNew = !existingIds.has(notice.idweb)

    const { data: row, error } = await supabase
      .from('boamp_notices')
      .upsert(notice, { onConflict: 'idweb' })
      .select('id')
      .single()

    if (error || !row) {
      errors.push({ idweb: notice.idweb, error: error?.message ?? 'upsert returned no row' })
      console.error('[boamp/sync] failed to upsert notice', notice.idweb, error?.message)
      continue
    }

    synced++

    if (!isNew) continue

    // Run extraction per org, each with its own configured LLM model.
    for (const { orgId, model } of orgModels) {
      const extracted = await extractTenderInfo(notice.raw_data, model)
      const { error: extractError } = await supabase
        .from('org_tender_extraction')
        .upsert({ org_id: orgId, tender_id: row.id, ...extracted }, { onConflict: 'org_id,tender_id' })

      if (extractError) {
        console.error('[boamp/extract] failed to store extraction', notice.idweb, orgId, extractError.message)
      }
    }
  }

  return { synced, failed: errors.length, date: today, errors: errors.length ? errors : undefined }
}
