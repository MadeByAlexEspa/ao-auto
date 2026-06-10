import Link from 'next/link'
import { syncBoampNotices } from '@/lib/boamp/sync'
import { revalidatePath } from 'next/cache'

async function syncAction() {
  'use server'
  await syncBoampNotices()
  revalidatePath('/boamp')
  revalidatePath('/')
}

export default function Home() {
  return (
    <main className="max-w-2xl mx-auto px-4 py-16 flex flex-col gap-6">
      <h1 className="text-3xl font-bold">ao-auto</h1>
      <p className="text-gray-600">
        Suivi quotidien des appels d&apos;offre BOAMP par mots-clés et région.
      </p>

      <div className="flex gap-4">
        <Link
          href="/boamp"
          className="rounded-lg bg-black text-white px-5 py-3 font-medium hover:bg-zinc-800 transition-colors"
        >
          Voir les appels d&apos;offre →
        </Link>

        <form action={syncAction}>
          <button
            type="submit"
            className="rounded-lg border border-black px-5 py-3 font-medium hover:bg-black hover:text-white transition-colors"
          >
            Lancer la synchronisation
          </button>
        </form>
      </div>
    </main>
  )
}
