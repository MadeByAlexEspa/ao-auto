import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { AppHeader } from '@/components/app-header'
import { isRelevant, EMPTY_FILTERS } from '@/lib/filters'

export const revalidate = 3600

export default async function BoampPage({
  searchParams,
}: {
  searchParams: Promise<{ relevant?: string }>
}) {
  const { relevant } = await searchParams
  const showRelevantOnly = relevant === '1'

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: notices, error } = await supabase
    .from('boamp_notices')
    .select('idweb, titre, description, url_avis, date_parution, code_departement, nom_acheteur, date_limite_reponse, code_cpv')
    .order('date_parution', { ascending: false })
    .limit(50)

  let filters = EMPTY_FILTERS
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('org_id')
      .eq('id', user.id)
      .single()

    if (profile) {
      const { data: orgFilters } = await supabase
        .from('org_filters')
        .select('cpv_codes, keywords, departments')
        .eq('org_id', profile.org_id)
        .single()
      if (orgFilters) filters = orgFilters
    }
  }

  const hasFilters = filters.cpv_codes.length > 0 || filters.keywords.length > 0 || filters.departments.length > 0
  const visibleNotices = showRelevantOnly
    ? (notices ?? []).filter(n => isRelevant(n, filters))
    : notices

  return (
    <main className="flex-1">
      <AppHeader active="/boamp" />

      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Appels d&apos;offre BOAMP</h1>
            <p className="mt-1 text-slate-500">
              {visibleNotices?.length ?? 0} avis {showRelevantOnly ? 'pertinents' : 'collectés'}
            </p>
          </div>

          {user && (
            <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1 text-sm">
              <Link
                href="/boamp"
                className={`rounded-md px-3 py-1.5 font-medium transition-colors ${
                  !showRelevantOnly ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Tous
              </Link>
              <Link
                href="/boamp?relevant=1"
                className={`rounded-md px-3 py-1.5 font-medium transition-colors ${
                  showRelevantOnly ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Pertinents
              </Link>
            </div>
          )}
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            Erreur : {error.message}
          </div>
        )}

        {!error && showRelevantOnly && !hasFilters && (
          <div className="mb-4 rounded-lg bg-indigo-50 border border-indigo-200 px-4 py-3 text-sm text-indigo-700">
            Aucun filtre configuré.{' '}
            <Link href="/settings" className="font-medium underline">Configurez vos filtres de pertinence</Link>{' '}
            pour voir les avis correspondant à votre activité.
          </div>
        )}

        {!error && !visibleNotices?.length && (showRelevantOnly ? hasFilters : true) && (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <p className="text-slate-500">
              {showRelevantOnly
                ? "Aucun avis pertinent pour le moment."
                : 'Aucun résultat. Lancez une synchronisation depuis le tableau de bord.'}
            </p>
          </div>
        )}

        <ul className="flex flex-col gap-3">
          {visibleNotices?.map(n => (
            <li key={n.idweb} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md hover:border-slate-300 transition-all">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <a
                    href={n.url_avis}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-slate-900 hover:text-indigo-600 line-clamp-2 transition-colors"
                  >
                    {n.titre || 'Sans titre'}
                  </a>

                  {n.description && (
                    <p className="mt-1.5 text-sm text-slate-500 line-clamp-2">{n.description}</p>
                  )}

                  <div className="mt-3 flex flex-wrap gap-2">
                    {n.nom_acheteur && (
                      <span className="inline-flex items-center rounded-full bg-slate-100 text-slate-600 text-xs font-medium px-2.5 py-1">
                        {n.nom_acheteur}
                      </span>
                    )}
                    {n.code_departement && (
                      <span className="inline-flex items-center rounded-full bg-slate-100 text-slate-600 text-xs font-medium px-2.5 py-1">
                        Dép. {n.code_departement}
                      </span>
                    )}
                    {n.code_cpv && (
                      <span className="inline-flex items-center rounded-full bg-slate-100 text-slate-600 text-xs font-medium px-2.5 py-1">
                        CPV {n.code_cpv}
                      </span>
                    )}
                    {n.date_parution && (
                      <span className="inline-flex items-center rounded-full bg-slate-100 text-slate-600 text-xs font-medium px-2.5 py-1">
                        Publié le {new Date(n.date_parution).toLocaleDateString('fr-FR')}
                      </span>
                    )}
                    {n.date_limite_reponse && (
                      <span className="inline-flex items-center rounded-full bg-amber-50 text-amber-700 text-xs font-medium px-2.5 py-1">
                        Limite : {new Date(n.date_limite_reponse).toLocaleString('fr-FR')}
                      </span>
                    )}
                  </div>
                </div>

                <a
                  href={n.url_avis}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors whitespace-nowrap"
                >
                  Voir l&apos;avis →
                </a>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </main>
  )
}
