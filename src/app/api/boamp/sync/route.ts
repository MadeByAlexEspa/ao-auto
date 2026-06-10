import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { fetchBoampNotices } from '@/lib/boamp/fetch'
import { boampConfig } from '@/lib/boamp/config'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET(request: Request) {
  // Protect cron endpoint
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const today = new Date().toISOString().slice(0, 10)

  try {
    const notices = await fetchBoampNotices({
      keywords:    boampConfig.keywords,
      departments: boampConfig.departments,
      date:        today,
      limit:       boampConfig.limit,
    })

    if (notices.length === 0) {
      return NextResponse.json({ inserted: 0, message: 'No new notices' })
    }

    const supabase = await createClient()

    const { error } = await supabase
      .from('boamp_notices')
      .upsert(notices, { onConflict: 'idweb', ignoreDuplicates: true })

    if (error) throw error

    return NextResponse.json({ inserted: notices.length, date: today })
  } catch (err) {
    console.error('[boamp/sync]', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
