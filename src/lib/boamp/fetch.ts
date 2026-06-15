const BOAMP_API = 'https://boamp-datadila.opendatasoft.com/api/explore/v2.1/catalog/datasets/boamp/records'

export interface BoampNotice {
  idweb: string
  titre: string
  description: string
  url_avis: string
  date_parution: string
  code_departement: string
  nom_acheteur: string
  date_limite_reponse: string | null
  code_cpv: string | null
  raw_data: Record<string, unknown>
}

function parseDonnees(donnees: unknown): Record<string, unknown> | null {
  try {
    return typeof donnees === 'string' ? JSON.parse(donnees) : donnees as Record<string, unknown>
  } catch {
    return null
  }
}

function extractDescription(donnees: unknown): string {
  const d = parseDonnees(donnees)
  if (!d) return ''
  const initial = d.FNSimple as Record<string, unknown>
  const nature = initial?.natureMarche as Record<string, unknown>
  const desc = (nature?.descriptionMarche as string) || (nature?.objetMarche as string) || ''
  return desc.slice(0, 500)
}

// Deadline lives under FNSimple.dateLimiteRemise.{date,heure} when present.
function extractDeadline(donnees: unknown): string | null {
  const d = parseDonnees(donnees)
  if (!d) return null
  const initial = d.FNSimple as Record<string, unknown>
  const limite = initial?.dateLimiteRemise as Record<string, unknown>
  const date = limite?.date as string | undefined
  if (!date) return null
  const heure = (limite?.heure as string) || '00:00'
  const iso = `${date}T${heure}`
  return isNaN(Date.parse(iso)) ? null : new Date(iso).toISOString()
}

// CPV code(s) live under FNSimple.objetMarche.cpv.principal, sometimes with
// secondary/complementary codes alongside.
function extractCpv(donnees: unknown): string | null {
  const d = parseDonnees(donnees)
  if (!d) return null
  const initial = d.FNSimple as Record<string, unknown>
  const objet = initial?.objetMarche as Record<string, unknown>
  const cpv = objet?.cpv as Record<string, unknown>
  const principal = cpv?.principal as string | undefined
  return principal || null
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
    date_limite_reponse: extractDeadline(r.donnees),
    code_cpv:        extractCpv(r.donnees),
    raw_data:        r as Record<string, unknown>,
  }))
}
