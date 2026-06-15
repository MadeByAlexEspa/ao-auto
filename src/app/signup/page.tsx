import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AuthShell } from '@/components/auth-shell'

async function signupAction(formData: FormData) {
  'use server'
  const email = String(formData.get('email'))
  const password = String(formData.get('password'))
  const orgName = String(formData.get('org_name'))

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { org_name: orgName },
    },
  })

  if (error) {
    redirect(`/signup?error=${encodeURIComponent(error.message)}`)
  }

  if (!data.session) {
    redirect('/login?notice=' + encodeURIComponent('Compte créé — vérifiez vos emails pour confirmer votre adresse.'))
  }

  redirect('/')
}

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams

  return (
    <AuthShell>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Créer un workspace</h1>
        <p className="mt-1 text-sm text-slate-500">
          Démarrez votre espace de veille appels d&apos;offre en quelques secondes.
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        {error && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <form action={signupAction} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-slate-700">Nom du workspace</span>
            <input
              type="text"
              name="org_name"
              required
              placeholder="Acme SAS"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-slate-700">Email</span>
            <input
              type="email"
              name="email"
              required
              autoComplete="email"
              placeholder="vous@entreprise.fr"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-slate-700">Mot de passe</span>
            <input
              type="password"
              name="password"
              required
              minLength={6}
              autoComplete="new-password"
              placeholder="8 caractères minimum"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </label>

          <button
            type="submit"
            className="mt-2 rounded-lg bg-slate-900 text-white px-4 py-2.5 text-sm font-medium hover:bg-slate-700 transition-colors"
          >
            Créer le workspace
          </button>
        </form>
      </div>

      <p className="mt-6 text-center text-sm text-slate-500">
        Vous avez déjà un compte ?{' '}
        <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-700">
          Se connecter
        </Link>
      </p>
    </AuthShell>
  )
}
