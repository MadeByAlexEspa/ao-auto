'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import type { SupabaseClient } from '@supabase/supabase-js'

export type TenderStatus = 'new' | 'reviewed' | 'drafted' | 'submitted'

async function getOrgId(supabase: SupabaseClient): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('org_id')
    .eq('id', user.id)
    .single()

  return profile?.org_id ?? null
}

// Marks a tender as selected for response and sends the user to its
// dedicated workspace.
export async function selectForResponse(tenderId: string) {
  const supabase = await createClient()
  const orgId = await getOrgId(supabase)
  if (!orgId) return

  await supabase
    .from('tender_org_status')
    .upsert({ tender_id: tenderId, org_id: orgId, status: 'drafted' }, { onConflict: 'tender_id,org_id' })

  revalidatePath('/')
  revalidatePath(`/boamp/${tenderId}`)
  redirect(`/boamp/${tenderId}/respond`)
}

export async function updateTenderWorkspace(tenderId: string, formData: FormData) {
  const supabase = await createClient()
  const orgId = await getOrgId(supabase)
  if (!orgId) return

  const status = String(formData.get('status')) as TenderStatus
  const notes = String(formData.get('notes') ?? '')

  await supabase
    .from('tender_org_status')
    .upsert({ tender_id: tenderId, org_id: orgId, status, notes }, { onConflict: 'tender_id,org_id' })

  revalidatePath('/')
  revalidatePath(`/boamp/${tenderId}`)
  revalidatePath(`/boamp/${tenderId}/respond`)
}
