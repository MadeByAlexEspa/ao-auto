import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AppShell } from '@/components/app-shell'
import { updateTenderWorkspace } from '@/lib/actions/tenders'

const STATUS_OPTIONS = [
  { value: 'drafted', label: 'En réponse' },
  { value: 'submitted', label: 'Soumis' },
]

export default async function TenderRespondPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: tender, error } = await supabase
    .from('boamp_notices')
    .select('id, titre, description, url_avis, code_departement, nom_acheteur, date_limite_reponse, code_cpv')
    .eq('id', id)
    .single()

  if (error || !tender) notFound()

  const { data: profile } = await supabase
    .from('profiles')
    .select('org_id')
    .eq('id', user.id)
    .single()
  if (!profile) notFound()

  const [{ data: orgStatus }, { data: extraction }] = await Promise.all([
    supabase
      .from('tender_org_status')
      .select('status, notes')
      .eq('org_id', profile.org_id)
      .eq('tender_id', id)
      .single(),
    supabase
      .from('org_tender_extraction')
      .select('scope_summary, contact, submission_method')
      .eq('org_id', profile.org_id)
      .eq('tender_id', id)
      .single(),
  ])

  const currentStatus = orgStatus?.status ?? 'drafted'
  const currentNotes = orgStatus?.notes ?? ''

  return (
    <AppShell userEmail={user.email}>
      <div className="max-w-3xl mx-auto px-6 py-12">
        <Link href={`/boamp/${tender.id}`} className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">
          ← Retour au détail de l&apos;avis
        </Link>

        <div className="mt-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-xl font-bold text-slate-900">{tender.titre || 'Sans titre'}</h1>

          <div className="mt-3 flex flex-wrap gap-2">
            {tender.nom_acheteur && (
              <span className="inline-flex items-center rounded-full bg-slate-100 text-slate-600 text-xs font-medium px-2.5 py-1">
                {tender.nom_acheteur}
              </span>
            )}
            {tender.code_departement && (
              <span className="inline-flex items-center rounded-full bg-slate-100 text-slate-600 text-xs font-medium px-2.5 py-1">
                Dép. {tender.code_departement}
              </span>
            )}
            {tender.code_cpv && (
              <span className="inline-flex items-center rounded-full bg-slate-100 text-slate-600 text-xs font-medium px-2.5 py-1">
                CPV {tender.code_cpv}
              </span>
            )}
            {tender.date_limite_reponse && (
              <span className="inline-flex items-center rounded-full bg-amber-50 text-amber-700 text-xs font-medium px-2.5 py-1">
                Limite : {new Date(tender.date_limite_reponse).toLocaleString('fr-FR')}
              </span>
            )}
          </div>

          {tender.url_avis && (
            <a
              href={tender.url_avis}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center text-sm font-medium text-indigo-600 hover:underline"
            >
              Voir l&apos;avis officiel →
            </a>
          )}
        </div>

        {extraction && (extraction.scope_summary || extraction.contact || extraction.submission_method) && (
          <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="font-semibold text-slate-900">Extraction par IA</h2>

            {extraction.scope_summary && (
              <div className="mt-3">
                <h3 className="text-sm font-medium text-slate-700">Résumé du marché</h3>
                <p className="mt-1 text-sm text-slate-600 leading-relaxed whitespace-pre-line">{extraction.scope_summary}</p>
              </div>
            )}
            {extraction.contact && (
              <div className="mt-3">
                <h3 className="text-sm font-medium text-slate-700">Contact</h3>
                <p className="mt-1 text-sm text-slate-600 leading-relaxed whitespace-pre-line">{extraction.contact}</p>
              </div>
            )}
            {extraction.submission_method && (
              <div className="mt-3">
                <h3 className="text-sm font-medium text-slate-700">Modalités de soumission</h3>
                <p className="mt-1 text-sm text-slate-600 leading-relaxed whitespace-pre-line">{extraction.submission_method}</p>
              </div>
            )}
          </div>
        )}

        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="font-semibold text-slate-900">Espace de traitement</h2>
          <p className="mt-1 text-sm text-slate-500">
            Suivez l&apos;avancement de votre réponse et notez les informations utiles pour votre équipe.
          </p>

          <form action={updateTenderWorkspace.bind(null, tender.id)} className="mt-5 flex flex-col gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-slate-700">Statut</span>
              <select
                name="status"
                defaultValue={currentStatus}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 max-w-xs"
              >
                {STATUS_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-slate-700">Notes</span>
              <textarea
                name="notes"
                defaultValue={currentNotes}
                rows={6}
                placeholder="Documents à préparer, points de vigilance, répartition des tâches..."
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
    </AppShell>
  )
}
