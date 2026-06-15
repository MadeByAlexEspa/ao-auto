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

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <main className="max-w-2xl mx-auto px-4 py-16 flex flex-col gap-6">
      <h1 className="text-3xl font-bold">ao-auto</h1>
      <p className="text-gray-600">
        Suivi quotidien des appels d&apos;offre BOAMP par mots-clés et région.
      </p>

      <div className="flex gap-4 flex-wrap">
        <Link
          href="/boamp"
          className="rounded-lg bg-black text-white px-5 py-3 font-medium hover:bg-zinc-800 transition-colors"
        >
          Voir les appels d&apos;offre →
        </Link>

        <Link
          href="/settings"
          className="rounded-lg border border-black px-5 py-3 font-medium hover:bg-black hover:text-white transition-colors"
        >
          Paramètres
        </Link>

        <form action={syncAction}>
          <button
            type="submit"
            className="rounded-lg border border-black px-5 py-3 font-medium hover:bg-black hover:text-white transition-colors"
          >
            Lancer la synchronisation
          </button>
        </form>

        {user ? (
          <form action={logoutAction}>
            <button
              type="submit"
              className="rounded-lg border border-black px-5 py-3 font-medium hover:bg-black hover:text-white transition-colors"
            >
              Se déconnecter ({user.email})
            </button>
          </form>
        ) : (
          <Link
            href="/login"
            className="rounded-lg border border-black px-5 py-3 font-medium hover:bg-black hover:text-white transition-colors"
          >
            Se connecter
          </Link>
        )}
      </div>
    </main>
  )
}
