import { createAdminClient } from '@/lib/supabase/admin'
import { fetchBoampNotices } from '@/lib/boamp/fetch'
import { boampConfig } from '@/lib/boamp/config'

export async function syncBoampNotices() {
  const today = new Date().toISOString().slice(0, 10)

  const notices = await fetchBoampNotices({
    keywords:    boampConfig.keywords,
    departments: boampConfig.departments,
    date:        today,
    limit:       boampConfig.limit,
  })

  if (notices.length === 0) {
    return { inserted: 0, date: today }
  }

  const supabase = createAdminClient()

  const { error } = await supabase
    .from('boamp_notices')
    .upsert(notices, { onConflict: 'idweb', ignoreDuplicates: true })

  if (error) throw error

  return { inserted: notices.length, date: today }
}
