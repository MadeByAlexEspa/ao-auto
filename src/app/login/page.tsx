import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

async function loginAction(formData: FormData) {
  'use server'
  const email = String(formData.get('email'))
  const password = String(formData.get('password'))

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`)
  }

  redirect('/')
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams

  return (
    <main className="max-w-sm mx-auto px-4 py-16">
      <h1 className="text-2xl font-bold mb-6">Connexion</h1>

      {error && (
        <p className="mb-4 text-sm text-red-600">{error}</p>
      )}

      <form action={loginAction} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1">
          <span className="font-medium">Email</span>
          <input
            type="email"
            name="email"
            required
            className="border rounded-lg px-3 py-2"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="font-medium">Mot de passe</span>
          <input
            type="password"
            name="password"
            required
            className="border rounded-lg px-3 py-2"
          />
        </label>

        <button
          type="submit"
          className="rounded-lg bg-black text-white px-5 py-2 font-medium hover:bg-zinc-800 transition-colors self-start"
        >
          Se connecter
        </button>
      </form>
    </main>
  )
}
