import Link from 'next/link'
import { syncBoampNotices } from '@/lib/boamp/sync'
import { syncPlaceNotices } from '@/lib/place/sync'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { AppShell } from '@/components/app-shell'

const STATUS_LABELS: Record<string, string> = {
  drafted: 'En réponse',
  submitted: 'Soumis',
}

async function syncAction() {
  'use server'
  await Promise.all([syncBoampNotices(), syncPlaceNotices()])
  revalidatePath('/boamp')
  revalidatePath('/')
}

const FEATURES = [
  {
    title: 'Collecte automatique',
    description: "Les avis BOAMP sont synchronisés chaque jour selon vos mots-clés, départements et CPV.",
  },
  {
    title: 'Extraction intelligente',
    description: "Résumé du marché, contact et modalités de soumission extraits automatiquement par IA — configurable par organisation.",
  },
  {
    title: 'Suivi multi-équipe',
    description: "Chaque organisation suit ses propres statuts (nouveau, étudié, en réponse, soumis) en toute confidentialité.",
  },
]

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return (
      <main className="flex-1 flex flex-col">
        <header className="border-b border-slate-200 bg-white">
          <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
            <span className="text-lg font-semibold tracking-tight text-slate-900">ao-auto</span>
            <div className="flex gap-2">
              <Link
                href="/login"
                className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Se connecter
              </Link>
              <Link
                href="/signup"
                className="rounded-lg bg-slate-900 text-white px-4 py-2 text-sm font-medium hover:bg-slate-700 transition-colors"
              >
                Créer un workspace
              </Link>
            </div>
          </div>
        </header>

        <section className="flex-1 flex items-center bg-gradient-to-b from-white to-slate-50">
          <div className="max-w-5xl mx-auto px-6 py-20 w-full">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold text-indigo-600 mb-3 tracking-wide uppercase">Veille marchés publics</p>
              <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-slate-900">
                Automatisez votre veille aux appels d&apos;offre
              </h1>
              <p className="mt-5 text-lg text-slate-600 leading-relaxed">
                ao-auto collecte les avis BOAMP, en extrait les informations clés grâce à l&apos;IA
                et aide votre équipe à préparer une première réponse — sans rien laisser passer.
              </p>
              <div className="mt-8 flex gap-3">
                <Link
                  href="/signup"
                  className="rounded-lg bg-slate-900 text-white px-6 py-3 font-medium hover:bg-slate-700 transition-colors shadow-sm"
                >
                  Créer un workspace
                </Link>
                <Link
                  href="/login"
                  className="rounded-lg border border-slate-300 bg-white px-6 py-3 font-medium hover:bg-slate-50 transition-colors"
                >
                  Se connecter
                </Link>
              </div>
            </div>

            <div className="mt-16 grid sm:grid-cols-3 gap-6">
              {FEATURES.map(f => (
                <div key={f.title} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <h3 className="font-semibold text-slate-900">{f.title}</h3>
                  <p className="mt-2 text-sm text-slate-600 leading-relaxed">{f.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    )
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('org_id')
    .eq('id', user.id)
    .single()

  let selectedTenders: {
    status: string
    tender_id: string
    boamp_notices: {
      id: string
      titre: string | null
      nom_acheteur: string | null
      code_departement: string | null
      date_limite_reponse: string | null
      url_avis: string | null
    } | null
  }[] = []

  if (profile) {
    const { data } = await supabase
      .from('tender_org_status')
      .select('status, tender_id, boamp_notices(id, titre, nom_acheteur, code_departement, date_limite_reponse, url_avis)')
      .eq('org_id', profile.org_id)
      .in('status', ['drafted', 'submitted'])
      .order('updated_at', { ascending: false })

    selectedTenders = (data ?? []) as unknown as typeof selectedTenders
  }

  return (
    <AppShell userEmail={user.email}>
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Tableau de bord</h1>
            <p className="mt-1 text-slate-500">
              Les appels d&apos;offre sélectionnés pour une réponse par votre équipe.
            </p>
          </div>

          <form action={syncAction}>
            <button
              type="submit"
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
            >
              Lancer la synchronisation
            </button>
          </form>
        </div>

        <div className="mb-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href="/boamp"
            className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md hover:border-slate-300 transition-all"
          >
            <h3 className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
              Avis pertinents →
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              Parcourez les appels d&apos;offre correspondant à vos filtres.
            </p>
          </Link>

          <Link
            href="/boamp?relevant=0"
            className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md hover:border-slate-300 transition-all"
          >
            <h3 className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
              Tous les avis →
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              Consultez l&apos;ensemble des avis collectés, BOAMP &amp; PLACE.
            </p>
          </Link>
        </div>

        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
          Sélectionnés pour réponse
        </h2>

        {selectedTenders.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <p className="text-slate-500">
              Aucun appel d&apos;offre sélectionné pour le moment.{' '}
              <Link href="/boamp" className="font-medium text-indigo-600 underline">
                Parcourez les avis pertinents
              </Link>{' '}
              et sélectionnez-en un pour démarrer une réponse.
            </p>
          </div>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {selectedTenders.map(t => t.boamp_notices && (
              <li key={t.tender_id}>
                <Link
                  href={`/boamp/${t.tender_id}/respond`}
                  className="flex h-full flex-col justify-between gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md hover:border-slate-300 transition-all"
                >
                  <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="inline-flex items-center rounded-full bg-amber-50 text-amber-700 text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5">
                          {STATUS_LABELS[t.status] ?? t.status}
                        </span>
                      </div>
                      <p className="font-semibold text-slate-900 line-clamp-2">
                        {t.boamp_notices.titre || 'Sans titre'}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {t.boamp_notices.nom_acheteur && (
                          <span className="inline-flex items-center rounded-full bg-slate-100 text-slate-600 text-xs font-medium px-2.5 py-1">
                            {t.boamp_notices.nom_acheteur}
                          </span>
                        )}
                        {t.boamp_notices.code_departement && (
                          <span className="inline-flex items-center rounded-full bg-slate-100 text-slate-600 text-xs font-medium px-2.5 py-1">
                            Dép. {t.boamp_notices.code_departement}
                          </span>
                        )}
                        {t.boamp_notices.date_limite_reponse && (
                          <span className="inline-flex items-center rounded-full bg-amber-50 text-amber-700 text-xs font-medium px-2.5 py-1">
                            Limite : {new Date(t.boamp_notices.date_limite_reponse).toLocaleString('fr-FR')}
                          </span>
                        )}
                      </div>
                    </div>
                  <span className="self-start rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 whitespace-nowrap">
                    Espace de traitement →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AppShell>
  )
}
