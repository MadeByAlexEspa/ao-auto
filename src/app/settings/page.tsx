import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { DEFAULT_LLM_MODEL } from '@/lib/boamp/extract'
import { EMPTY_FILTERS } from '@/lib/filters'
import { AppShell } from '@/components/app-shell'

function parseList(value: FormDataEntryValue | null): string[] {
  return String(value ?? '')
    .split(',')
    .map(v => v.trim())
    .filter(Boolean)
}

// Each line is a group of synonyms (comma-separated, OR). A tender must
// match at least one synonym in EVERY group (AND across groups).
function parseKeywordGroups(value: FormDataEntryValue | null): string[][] {
  return String(value ?? '')
    .split('\n')
    .map(parseList)
    .filter(group => group.length > 0)
}

function formatKeywordGroups(groups: string[][]): string {
  return groups.map(group => group.join(', ')).join('\n')
}

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

async function saveFiltersAction(formData: FormData) {
  'use server'
  const cpv_codes = parseList(formData.get('cpv_codes'))
  const keyword_groups = parseKeywordGroups(formData.get('keyword_groups'))
  const departments = parseList(formData.get('departments'))

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
    .from('org_filters')
    .upsert({ org_id: profile.org_id, cpv_codes, keyword_groups, departments }, { onConflict: 'org_id' })

  revalidatePath('/settings')
  revalidatePath('/boamp')
}

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return (
      <main className="flex-1 max-w-5xl mx-auto px-6 py-12 w-full">
        <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
          <p className="text-slate-500">Connectez-vous pour accéder aux paramètres.</p>
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
  let currentFilters = EMPTY_FILTERS
  if (profile) {
    const { data: settings } = await supabase
      .from('org_settings')
      .select('llm_model')
      .eq('org_id', profile.org_id)
      .single()
    currentModel = settings?.llm_model ?? DEFAULT_LLM_MODEL

    const { data: filters } = await supabase
      .from('org_filters')
      .select('cpv_codes, keyword_groups, departments')
      .eq('org_id', profile.org_id)
      .single()
    if (filters) currentFilters = filters as typeof currentFilters
  }

  return (
    <AppShell userEmail={user.email}>
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Paramètres</h1>
          <p className="mt-1 text-slate-500">Configuration propre à votre organisation.</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
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

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="font-semibold text-slate-900">Filtres de pertinence</h2>
          <p className="mt-1 text-sm text-slate-500">
            Un avis est pertinent s&apos;il correspond à un code CPV OU à tous les groupes de mots-clés,
            ET à un département (si renseigné). Sans aucun filtre, aucun avis n&apos;est marqué pertinent.
          </p>

          <form action={saveFiltersAction} className="mt-5 flex flex-col gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-slate-700">Codes CPV (préfixes, séparés par des virgules)</span>
              <input
                type="text"
                name="cpv_codes"
                defaultValue={currentFilters.cpv_codes.join(', ')}
                placeholder="ex : 9091, 4500"
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-slate-700">Groupes de mots-clés (un groupe par ligne, synonymes séparés par des virgules)</span>
              <p className="text-xs text-slate-400">
                Un avis doit contenir au moins un terme de CHAQUE ligne pour être considéré comme un mot-clé pertinent.
              </p>
              <textarea
                name="keyword_groups"
                defaultValue={formatKeywordGroups(currentFilters.keyword_groups)}
                rows={4}
                placeholder={"nettoyage, propreté\nbureaux, locaux administratifs"}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-slate-700">Départements (codes, séparés par des virgules)</span>
              <input
                type="text"
                name="departments"
                defaultValue={currentFilters.departments.join(', ')}
                placeholder="ex : 69, 75"
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
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
      </div>
    </AppShell>
  )
}
