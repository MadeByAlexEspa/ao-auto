import Link from 'next/link'
import { syncBoampNotices } from '@/lib/boamp/sync'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { AppHeader } from '@/components/app-header'

async function syncAction() {
  'use server'
  await syncBoampNotices()
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

  return (
    <main className="flex-1">
      <AppHeader active="/" />

      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Tableau de bord</h1>
          <p className="mt-1 text-slate-500">
            Suivi quotidien des appels d&apos;offre BOAMP par mots-clés et région.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link
            href="/boamp"
            className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md hover:border-slate-300 transition-all"
          >
            <h3 className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
              Appels d&apos;offre →
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              Consultez les derniers avis BOAMP collectés et leurs informations extraites.
            </p>
          </Link>

          <Link
            href="/settings"
            className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md hover:border-slate-300 transition-all"
          >
            <h3 className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
              Paramètres →
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              Choisissez le modèle IA utilisé pour l&apos;extraction des avis.
            </p>
          </Link>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col">
            <h3 className="font-semibold text-slate-900">Synchronisation</h3>
            <p className="mt-2 text-sm text-slate-500 flex-1">
              La synchronisation BOAMP s&apos;exécute automatiquement chaque jour. Vous pouvez aussi la lancer manuellement.
            </p>
            <form action={syncAction} className="mt-4">
              <button
                type="submit"
                className="rounded-lg bg-slate-900 text-white px-4 py-2 text-sm font-medium hover:bg-slate-700 transition-colors"
              >
                Lancer la synchronisation
              </button>
            </form>
          </div>
        </div>
      </div>
    </main>
  )
}
