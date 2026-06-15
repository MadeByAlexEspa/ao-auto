import Link from 'next/link'

const HIGHLIGHTS = [
  {
    title: 'Veille automatisée',
    description: 'Les avis BOAMP pertinents arrivent chaque matin, sans recherche manuelle.',
  },
  {
    title: 'Analyse par IA',
    description: "Résumé, contact et modalités de réponse extraits automatiquement.",
  },
  {
    title: 'Espace par organisation',
    description: 'Chaque workspace garde ses propres statuts et préférences, en toute confidentialité.',
  },
]

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex-1 flex">
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-900 text-white p-12">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          ao-auto
        </Link>

        <div className="max-w-md">
          <h2 className="text-3xl font-bold tracking-tight">
            La veille appels d&apos;offre, automatisée de bout en bout.
          </h2>
          <div className="mt-10 flex flex-col gap-6">
            {HIGHLIGHTS.map(h => (
              <div key={h.title} className="flex gap-3">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-indigo-400 shrink-0" />
                <div>
                  <p className="font-medium">{h.title}</p>
                  <p className="mt-1 text-sm text-slate-300">{h.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-sm text-slate-400">© {new Date().getFullYear()} ao-auto</p>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-sm">
          <Link href="/" className="lg:hidden block text-center text-lg font-semibold tracking-tight text-slate-900 mb-8">
            ao-auto
          </Link>
          {children}
        </div>
      </div>
    </main>
  )
}
