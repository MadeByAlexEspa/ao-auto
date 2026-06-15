import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AppShell } from '@/components/app-shell'
import { selectForResponse } from '@/lib/actions/tenders'

export default async function TenderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: tender, error } = await supabase
    .from('boamp_notices')
    .select('id, titre, description, url_avis, date_parution, code_departement, nom_acheteur, date_limite_reponse, code_cpv')
    .eq('id', id)
    .single()

  if (error || !tender) notFound()

  let status: string | null = null
  let extraction: { scope_summary: string | null; contact: string | null; submission_method: string | null } | null = null

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('org_id')
      .eq('id', user.id)
      .single()

    if (profile) {
      const [{ data: orgStatus }, { data: orgExtraction }] = await Promise.all([
        supabase
          .from('tender_org_status')
          .select('status')
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

      status = orgStatus?.status ?? null
      extraction = orgExtraction ?? null
    }
  }

  const isSelected = status === 'drafted' || status === 'submitted'

  return (
    <AppShell userEmail={user?.email}>
      <div className="max-w-3xl mx-auto px-6 py-12">
        <Link href="/boamp" className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">
          ← Retour aux appels d&apos;offre
        </Link>

        <div className="mt-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center rounded-full text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 bg-indigo-100 text-indigo-700">
              BOAMP
            </span>
          </div>

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
            {tender.date_parution && (
              <span className="inline-flex items-center rounded-full bg-slate-100 text-slate-600 text-xs font-medium px-2.5 py-1">
                Publié le {new Date(tender.date_parution).toLocaleDateString('fr-FR')}
              </span>
            )}
            {tender.date_limite_reponse && (
              <span className="inline-flex items-center rounded-full bg-amber-50 text-amber-700 text-xs font-medium px-2.5 py-1">
                Limite : {new Date(tender.date_limite_reponse).toLocaleString('fr-FR')}
              </span>
            )}
          </div>

          {tender.description && (
            <p className="mt-5 text-sm text-slate-600 leading-relaxed whitespace-pre-line">{tender.description}</p>
          )}

          {tender.url_avis && (
            <a
              href={tender.url_avis}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex items-center text-sm font-medium text-indigo-600 hover:underline"
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

        {user && (
          <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h2 className="font-semibold text-slate-900">Réponse à cet appel d&apos;offre</h2>
              <p className="mt-1 text-sm text-slate-500">
                {isSelected
                  ? "Cet appel d'offre a été sélectionné pour une réponse."
                  : "Sélectionnez cet appel d'offre pour ouvrir un espace de traitement dédié."}
              </p>
            </div>

            {isSelected ? (
              <Link
                href={`/boamp/${tender.id}/respond`}
                className="rounded-lg bg-slate-900 text-white px-4 py-2.5 text-sm font-medium hover:bg-slate-700 transition-colors"
              >
                Aller à l&apos;espace de traitement →
              </Link>
            ) : (
              <form action={selectForResponse.bind(null, tender.id)}>
                <button
                  type="submit"
                  className="rounded-lg bg-slate-900 text-white px-4 py-2.5 text-sm font-medium hover:bg-slate-700 transition-colors"
                >
                  Sélectionner pour répondre
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </AppShell>
  )
}
