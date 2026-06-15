import { NextResponse } from 'next/server'
import { syncPlaceNotices } from '@/lib/place/sync'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET(request: Request) {
  // Protect cron endpoint
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await syncPlaceNotices()
    return NextResponse.json(result)
  } catch (err) {
    console.error('[place/sync]', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
