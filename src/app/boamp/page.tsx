import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { AppShell } from '@/components/app-shell'
import { isRelevant, EMPTY_FILTERS } from '@/lib/filters'

export const revalidate = 3600

interface UnifiedNotice {
  id: string
  source: 'BOAMP' | 'PLACE'
  titre: string
  description: string | null
  url_avis: string
  date_parution: string | null
  code_departement: string | null
  nom_acheteur: string | null
  date_limite_reponse: string | null
  code_cpv: string | null
  detailHref: string | null
}

const PAGE_SIZE = 10

export default async function BoampPage({
  searchParams,
}: {
  searchParams: Promise<{ relevant?: string; page?: string }>
}) {
  const { relevant, page } = await searchParams
  // Default to relevant-only; pass relevant=0 to see everything.
  const showRelevantOnly = relevant !== '0'
  const currentPage = Math.max(1, parseInt(page ?? '1', 10) || 1)

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: boampNotices, error: boampError }, { data: placeNotices, error: placeError }] = await Promise.all([
    supabase
      .from('boamp_notices')
      .select('id, idweb, titre, description, url_avis, date_parution, code_departement, nom_acheteur, date_limite_reponse, code_cpv')
      .order('date_parution', { ascending: false })
      .limit(200),
    supabase
      .from('place_notices')
      .select('reference, titre, description, url_avis, date_parution, code_departement, organisme, date_limite_reponse')
      .order('date_parution', { ascending: false })
      .limit(200),
  ])

  const error = boampError ?? placeError

  const unified: UnifiedNotice[] = [
    ...(boampNotices ?? []).map(n => ({
      id: n.idweb,
      source: 'BOAMP' as const,
      titre: n.titre,
      description: n.description,
      url_avis: n.url_avis,
      date_parution: n.date_parution,
      code_departement: n.code_departement,
      nom_acheteur: n.nom_acheteur,
      date_limite_reponse: n.date_limite_reponse,
      code_cpv: n.code_cpv,
      detailHref: `/boamp/${n.id}`,
    })),
    ...(placeNotices ?? []).map(n => ({
      id: n.reference,
      source: 'PLACE' as const,
      titre: n.titre,
      description: n.description,
      url_avis: n.url_avis,
      date_parution: n.date_parution,
      code_departement: n.code_departement,
      nom_acheteur: n.organisme,
      date_limite_reponse: n.date_limite_reponse,
      code_cpv: null,
      detailHref: null,
    })),
  ].sort((a, b) => (b.date_parution ?? '').localeCompare(a.date_parution ?? ''))

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
  const filteredNotices = showRelevantOnly
    ? unified.filter(n => isRelevant(n, filters))
    : unified

  const totalPages = Math.max(1, Math.ceil(filteredNotices.length / PAGE_SIZE))
  const safePage = Math.min(currentPage, totalPages)
  const visibleNotices = filteredNotices.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  const relevantParam = showRelevantOnly ? '1' : '0'
  const pageHref = (p: number) => `/boamp?relevant=${relevantParam}&page=${p}`

  return (
    <AppShell userEmail={user?.email}>
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Appels d&apos;offre</h1>
            <p className="mt-1 text-slate-500">
              {filteredNotices.length} avis {showRelevantOnly ? 'pertinents' : 'collectés'} · BOAMP &amp; PLACE
              {totalPages > 1 && ` · page ${safePage}/${totalPages}`}
            </p>
          </div>

          {user && (
            <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1 text-sm">
              <Link
                href="/boamp?relevant=0"
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

        {!error && !filteredNotices.length && (showRelevantOnly ? hasFilters : true) && (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <p className="text-slate-500">
              {showRelevantOnly
                ? "Aucun avis pertinent pour le moment."
                : 'Aucun résultat. Lancez une synchronisation depuis le tableau de bord.'}
            </p>
          </div>
        )}

        <ul className="flex flex-col gap-3">
          {visibleNotices.map(n => (
            <li key={`${n.source}-${n.id}`} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md hover:border-slate-300 transition-all">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`inline-flex items-center rounded-full text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 ${
                      n.source === 'BOAMP' ? 'bg-indigo-100 text-indigo-700' : 'bg-teal-100 text-teal-700'
                    }`}>
                      {n.source}
                    </span>
                  </div>
                  {n.detailHref ? (
                    <Link
                      href={n.detailHref}
                      className="font-semibold text-slate-900 hover:text-indigo-600 line-clamp-2 transition-colors"
                    >
                      {n.titre || 'Sans titre'}
                    </Link>
                  ) : (
                    <a
                      href={n.url_avis}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-slate-900 hover:text-indigo-600 line-clamp-2 transition-colors"
                    >
                      {n.titre || 'Sans titre'}
                    </a>
                  )}

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

                {n.detailHref ? (
                  <Link
                    href={n.detailHref}
                    className="shrink-0 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors whitespace-nowrap"
                  >
                    Voir le détail →
                  </Link>
                ) : (
                  <a
                    href={n.url_avis}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors whitespace-nowrap"
                  >
                    Voir l&apos;avis →
                  </a>
                )}
              </div>
            </li>
          ))}
        </ul>

        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-center gap-2">
            <Link
              href={pageHref(Math.max(1, safePage - 1))}
              aria-disabled={safePage <= 1}
              className={`rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium transition-colors ${
                safePage <= 1 ? 'pointer-events-none opacity-40' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              ← Précédent
            </Link>
            <span className="text-sm text-slate-500">
              Page {safePage} sur {totalPages}
            </span>
            <Link
              href={pageHref(Math.min(totalPages, safePage + 1))}
              aria-disabled={safePage >= totalPages}
              className={`rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium transition-colors ${
                safePage >= totalPages ? 'pointer-events-none opacity-40' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              Suivant →
            </Link>
          </div>
        )}
      </div>
    </AppShell>
  )
}
