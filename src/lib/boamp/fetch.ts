const BOAMP_API = 'https://boamp-datadila.opendatasoft.com/api/explore/v2.1/catalog/datasets/boamp/records'

export interface BoampNotice {
  idweb: string
  titre: string
  description: string
  url_avis: string
  date_parution: string
  code_departement: string
  nom_acheteur: string
  raw_data: Record<string, unknown>
}

function extractDescription(donnees: unknown): string {
  try {
    const d = typeof donnees === 'string' ? JSON.parse(donnees) : donnees as Record<string, unknown>
    const initial = (d as Record<string, unknown>)?.FNSimple as Record<string, unknown>
    const nature = initial?.natureMarche as Record<string, unknown>
    const desc = (nature?.descriptionMarche as string) || (nature?.objetMarche as string) || ''
    return desc.slice(0, 500)
  } catch {
    return ''
  }
}

export async function fetchBoampNotices({
  keywords,
  departments,
  date,
  limit = 100,
}: {
  keywords: string[]
  departments: string[]
  date: string  // YYYY-MM-DD
  limit?: number
}): Promise<BoampNotice[]> {
  const deptList = departments.map(d => `"${d}"`).join(',')
  const where = [
    `dateparution>="${date}"`,
    departments.length > 0 ? `code_departement IN (${deptList})` : null,
  ].filter(Boolean).join(' AND ')

  const q = keywords.join(' OR ')

  const params = new URLSearchParams({
    where,
    q,
    select: 'idweb,objet,donnees,url_avis,dateparution,code_departement,nomacheteur',
    limit: String(limit),
    order_by: 'dateparution DESC',
  })

  const res = await fetch(`${BOAMP_API}?${params}`, {
    headers: { Accept: 'application/json' },
    next: { revalidate: 0 },
  })

  if (!res.ok) {
    throw new Error(`BOAMP API error: ${res.status} ${res.statusText}`)
  }

  const json = await res.json() as { results: Record<string, unknown>[] }

  return (json.results ?? []).map(r => ({
    idweb:           String(r.idweb ?? ''),
    titre:           String(r.objet ?? ''),
    description:     extractDescription(r.donnees),
    url_avis:        String(r.url_avis ?? ''),
    date_parution:   String(r.dateparution ?? '').slice(0, 10),
    code_departement: String(r.code_departement ?? ''),
    nom_acheteur:    String(r.nomacheteur ?? ''),
    raw_data:        r as Record<string, unknown>,
  }))
}
