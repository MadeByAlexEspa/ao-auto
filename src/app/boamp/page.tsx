import { createClient } from '@/lib/supabase/server'

export const revalidate = 3600

export default async function BoampPage() {
  const supabase = await createClient()

  const { data: notices, error } = await supabase
    .from('boamp_notices')
    .select('idweb, titre, description, url_avis, date_parution, code_departement, nom_acheteur, date_limite_reponse, code_cpv')
    .order('date_parution', { ascending: false })
    .limit(50)

  if (error) {
    return <p className="p-8 text-red-600">Erreur : {error.message}</p>
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Appels d&apos;offre BOAMP</h1>

      {!notices?.length && (
        <p className="text-gray-500">Aucun résultat. Lancez une synchronisation.</p>
      )}

      <ul className="space-y-4">
        {notices?.map(n => (
          <li key={n.idweb} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <a
                  href={n.url_avis}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-blue-600 hover:underline line-clamp-2"
                >
                  {n.titre || 'Sans titre'}
                </a>
                {n.description && (
                  <p className="mt-1 text-sm text-gray-600 line-clamp-3">{n.description}</p>
                )}
                <div className="mt-2 flex flex-wrap gap-3 text-xs text-gray-400">
                  {n.nom_acheteur && <span>{n.nom_acheteur}</span>}
                  {n.code_departement && <span>Dép. {n.code_departement}</span>}
                  {n.date_parution && (
                    <span>{new Date(n.date_parution).toLocaleDateString('fr-FR')}</span>
                  )}
                  {n.code_cpv && <span>CPV {n.code_cpv}</span>}
                  {n.date_limite_reponse && (
                    <span>Limite : {new Date(n.date_limite_reponse).toLocaleString('fr-FR')}</span>
                  )}
                </div>
              </div>
              <a
                href={n.url_avis}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 text-xs text-blue-500 hover:underline whitespace-nowrap"
              >
                Voir l&apos;avis →
              </a>
            </div>
          </li>
        ))}
      </ul>
    </main>
  )
}
