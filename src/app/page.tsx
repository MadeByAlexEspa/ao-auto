import Link from 'next/link'
import { syncBoampNotices } from '@/lib/boamp/sync'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

async function syncAction() {
  'use server'
  await syncBoampNotices()
  revalidatePath('/boamp')
  revalidatePath('/')
}

async function logoutAction() {
  'use server'
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/')
  redirect('/login')
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
          <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
            <span className="text-lg font-semibold tracking-tight">ao-auto</span>
            <Link
              href="/login"
              className="rounded-lg bg-slate-900 text-white px-4 py-2 text-sm font-medium hover:bg-slate-700 transition-colors"
            >
              Se connecter
            </Link>
          </div>
        </header>

        <section className="flex-1 flex items-center">
          <div className="max-w-5xl mx-auto px-6 py-20 w-full">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold text-indigo-600 mb-3">Veille marchés publics</p>
              <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-slate-900">
                Automatisez votre veille aux appels d&apos;offre
              </h1>
              <p className="mt-5 text-lg text-slate-600">
                ao-auto collecte les avis BOAMP, en extrait les informations clés grâce à l&apos;IA
                et aide votre équipe à préparer une première réponse — sans rien laisser passer.
              </p>
              <div className="mt-8 flex gap-3">
                <Link
                  href="/login"
                  className="rounded-lg bg-slate-900 text-white px-6 py-3 font-medium hover:bg-slate-700 transition-colors"
                >
                  Se connecter
                </Link>
              </div>
            </div>

            <div className="mt-16 grid sm:grid-cols-3 gap-6">
              {FEATURES.map(f => (
                <div key={f.title} className="rounded-xl border border-slate-200 bg-white p-5">
                  <h3 className="font-semibold text-slate-900">{f.title}</h3>
                  <p className="mt-2 text-sm text-slate-600">{f.description}</p>
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
      <header className="border-b border-slate-200 bg-white">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <span className="text-lg font-semibold tracking-tight">ao-auto</span>
          <form action={logoutAction}>
            <button
              type="submit"
              className="text-sm text-slate-500 hover:text-slate-900 transition-colors"
            >
              {user.email} · Se déconnecter
            </button>
          </form>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-12">
        <h1 className="text-2xl font-bold text-slate-900">Tableau de bord</h1>
        <p className="mt-2 text-slate-600">
          Suivi quotidien des appels d&apos;offre BOAMP par mots-clés et région.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/boamp"
            className="rounded-lg bg-slate-900 text-white px-5 py-3 font-medium hover:bg-slate-700 transition-colors"
          >
            Voir les appels d&apos;offre →
          </Link>

          <Link
            href="/settings"
            className="rounded-lg border border-slate-300 px-5 py-3 font-medium hover:bg-slate-100 transition-colors"
          >
            Paramètres
          </Link>

          <form action={syncAction}>
            <button
              type="submit"
              className="rounded-lg border border-slate-300 px-5 py-3 font-medium hover:bg-slate-100 transition-colors"
            >
              Lancer la synchronisation
            </button>
          </form>
        </div>
      </div>
    </main>
  )
}
