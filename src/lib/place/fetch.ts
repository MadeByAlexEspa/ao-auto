import * as cheerio from 'cheerio'
import { placeConfig } from '@/lib/place/config'

export interface PlaceNotice {
  reference: string
  titre: string
  description: string
  organisme: string | null
  code_departement: string | null
  date_parution: string | null
  date_limite_reponse: string | null
  url_avis: string
  raw_data: Record<string, unknown>
}

const MONTHS: Record<string, number> = {
  janv: 1, jan: 1, fev: 2, févr: 2, fevr: 2, mars: 3, avr: 4, mai: 5, juin: 6,
  juil: 7, aout: 8, août: 8, sept: 9, oct: 10, nov: 11, dec: 12, déc: 12,
}

// Parses the portal's "10 / Fév. / 2026" day/month/year blocks into an ISO date.
function parseFrDate(day: string | undefined, month: string | undefined, year: string | undefined): string | null {
  if (!day || !month || !year) return null
  const key = month.toLowerCase().replace(/[.\s]/g, '').normalize('NFD').replace(/[̀-ͯ]/g, '')
  const monthNum = MONTHS[key]
  if (!monthNum) return null
  const d = day.padStart(2, '0')
  const m = String(monthNum).padStart(2, '0')
  const iso = `${year}-${m}-${d}`
  return isNaN(Date.parse(iso)) ? null : iso
}

// Scrapes the "all consultations" results page of PLACE
// (marches-publics.gouv.fr). The portal has no public API, so this parses
// the server-rendered HTML directly — fragile to markup changes.
export async function fetchPlaceNotices(): Promise<PlaceNotice[]> {
  const res = await fetch(placeConfig.searchUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; ao-auto/1.0; +https://ao-auto.example)',
      Accept: 'text/html',
    },
  })

  if (!res.ok) {
    throw new Error(`PLACE portal error: ${res.status} ${res.statusText}`)
  }

  const html = await res.text()
  const $ = cheerio.load(html)

  const notices: PlaceNotice[] = []

  $('.item_consultation').each((_, el) => {
    if (notices.length >= placeConfig.limit) return

    const row = $(el)

    const reference = row.find('input[id$="_refCons"]').attr('value')?.trim()
    const orgAcronyme = row.find('input[id$="_orgCons"]').attr('value')?.trim()
    if (!reference || !orgAcronyme) return

    const intituleSpans = row.find('.objet-line .small.pull-left')
    const titre = intituleSpans.length > 1
      ? intituleSpans.eq(1).text().trim().replace(/\s+/g, ' ')
      : ''

    const description = row.find('[id$="_panelBlocObjet"] .small > span').first().text().trim().replace(/\s+/g, ' ')
    const organisme = row.find('[id$="_panelBlocDenomination"] .small').first().text().trim().replace(/\s+/g, ' ') || null

    const lieu = row.find('.lieux-exe span').first().text().trim()
    const deptMatch = lieu.match(/\((\d{2,3})\)/)
    const code_departement = deptMatch ? deptMatch[1] : null

    const dateMin = row.find('.date-min')
    const date_parution = parseFrDate(
      dateMin.find('.day span').first().text().trim(),
      dateMin.find('.month span').first().text().trim(),
      dateMin.find('.year span').first().text().trim(),
    )

    const dateEnd = row.find('#cons_dateEnd .date, .cons_dateEnd .date').first()
    const date_limite_reponse = parseFrDate(
      dateEnd.find('.day span').first().text().trim(),
      dateEnd.find('.month span').first().text().trim(),
      dateEnd.find('.year span').first().text().trim(),
    )

    notices.push({
      reference,
      titre: titre || reference,
      description: description.slice(0, 500),
      organisme,
      code_departement,
      date_parution,
      date_limite_reponse,
      url_avis: `https://www.marches-publics.gouv.fr/app.php/entreprise/consultation/${reference}?orgAcronyme=${orgAcronyme}`,
      raw_data: { reference, orgAcronyme },
    })
  })

  return notices
}
