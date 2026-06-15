export interface OrgFilters {
  cpv_codes: string[]
  keywords: string[]
  departments: string[]
}

export const EMPTY_FILTERS: OrgFilters = { cpv_codes: [], keywords: [], departments: [] }

interface TenderForMatching {
  titre: string | null
  description: string | null
  code_cpv: string | null
  code_departement: string | null
}

// US-3.2: a tender is relevant if it matches any CPV prefix OR any keyword,
// AND its department is in the org's list (when departments are set).
// An org with no filters at all matches nothing.
export function isRelevant(tender: TenderForMatching, filters: OrgFilters): boolean {
  const hasAnyFilter = filters.cpv_codes.length > 0 || filters.keywords.length > 0 || filters.departments.length > 0
  if (!hasAnyFilter) return false

  const cpvMatch = filters.cpv_codes.length > 0 && !!tender.code_cpv
    ? filters.cpv_codes.some(prefix => tender.code_cpv!.startsWith(prefix))
    : false

  const text = `${tender.titre ?? ''} ${tender.description ?? ''}`.toLowerCase()
  const keywordMatch = filters.keywords.length > 0
    ? filters.keywords.some(kw => text.includes(kw.toLowerCase()))
    : false

  if (!cpvMatch && !keywordMatch) return false

  if (filters.departments.length > 0) {
    return !!tender.code_departement && filters.departments.includes(tender.code_departement)
  }

  return true
}
