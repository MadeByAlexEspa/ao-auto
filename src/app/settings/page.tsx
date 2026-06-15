import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { DEFAULT_LLM_MODEL } from '@/lib/boamp/extract'
import { AppHeader } from '@/components/app-header'

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
      <main className="flex-1">
        <AppHeader active="/settings" />
        <div className="max-w-5xl mx-auto px-6 py-12">
          <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <p className="text-slate-500">Connectez-vous pour accéder aux paramètres.</p>
          </div>
        </div>
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
    <main className="flex-1">
      <AppHeader active="/settings" />

      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Paramètres</h1>
          <p className="mt-1 text-slate-500">Configuration propre à votre organisation.</p>
        </div>

        <div className="max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="font-semibold text-slate-900">Extraction par IA</h2>
          <p className="mt-1 text-sm text-slate-500">
            Modèle utilisé pour résumer les avis et en extraire le contact et les modalités de soumission.
          </p>

          <form action={saveModelAction} className="mt-5 flex flex-col gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-slate-700">Modèle IA</span>
              <select
                name="llm_model"
                defaultValue={currentModel}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                {MODEL_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </label>

            <button
              type="submit"
              className="rounded-lg bg-slate-900 text-white px-4 py-2.5 text-sm font-medium hover:bg-slate-700 transition-colors self-start"
            >
              Enregistrer
            </button>
          </form>
        </div>
      </div>
    </main>
  )
}
