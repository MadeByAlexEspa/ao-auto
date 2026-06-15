import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

const NAV_LINKS = [
  { href: '/', label: 'Tableau de bord' },
  { href: '/boamp', label: "Appels d'offre" },
  { href: '/settings', label: 'Paramètres' },
]

async function logoutAction() {
  'use server'
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/')
  redirect('/login')
}

export async function AppHeader({ active }: { active: string }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <header className="border-b border-slate-200 bg-white sticky top-0 z-10">
      <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between gap-6">
        <div className="flex items-center gap-8">
          <Link href="/" className="text-lg font-semibold tracking-tight text-slate-900 shrink-0">
            ao-auto
          </Link>

          <nav className="hidden sm:flex items-center gap-1">
            {NAV_LINKS.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  active === link.href
                    ? 'bg-slate-100 text-slate-900'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        {user && (
          <form action={logoutAction} className="flex items-center gap-3">
            <span className="hidden sm:inline text-sm text-slate-400 truncate max-w-[180px]">{user.email}</span>
            <button
              type="submit"
              className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
            >
              Déconnexion
            </button>
          </form>
        )}
      </div>
    </header>
  )
}
