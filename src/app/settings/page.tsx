import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { DEFAULT_LLM_MODEL } from '@/lib/boamp/extract'

const MODEL_OPTIONS = [
  { value: 'openai/gpt-4o-mini', label: 'OpenAI GPT-4o mini' },
  { value: 'openai/gpt-4o', label: 'OpenAI GPT-4o' },
  { value: 'anthropic/claude-haiku-4-5', label: 'Claude Haiku 4.5' },
  { value: 'anthropic/claude-sonnet-4-6', label: 'Claude Sonnet 4.6' },
]

async function saveModelAction(formData: FormData) {
  'use server'
  const llm_model = String(formData.get('llm_model'))

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const { data: profile } = await supabase
    .from('profiles')
    .select('org_id')
    .eq('id', user.id)
    .single()
  if (!profile) return

  await supabase
    .from('org_settings')
    .upsert({ org_id: profile.org_id, llm_model }, { onConflict: 'org_id' })

  revalidatePath('/settings')
}

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return (
      <main className="max-w-2xl mx-auto px-4 py-16">
        <p className="text-gray-500">Connectez-vous pour accéder aux paramètres.</p>
      </main>
    )
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('org_id')
    .eq('id', user.id)
    .single()

  let currentModel = DEFAULT_LLM_MODEL
  if (profile) {
    const { data: settings } = await supabase
      .from('org_settings')
      .select('llm_model')
      .eq('org_id', profile.org_id)
      .single()
    currentModel = settings?.llm_model ?? DEFAULT_LLM_MODEL
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-16">
      <h1 className="text-2xl font-bold mb-6">Paramètres</h1>

      <form action={saveModelAction} className="flex flex-col gap-4 max-w-sm">
        <label className="flex flex-col gap-1">
          <span className="font-medium">Modèle IA pour l&apos;extraction</span>
          <select
            name="llm_model"
            defaultValue={currentModel}
            className="border rounded-lg px-3 py-2"
          >
            {MODEL_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </label>

        <button
          type="submit"
          className="rounded-lg bg-black text-white px-5 py-2 font-medium hover:bg-zinc-800 transition-colors self-start"
        >
          Enregistrer
        </button>
      </form>
    </main>
  )
}
