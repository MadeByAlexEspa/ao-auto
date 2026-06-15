export const placeConfig = {
  // PLACE has no API/filter-by-URL like BOAMP; we scrape the "all
  // consultations" search results page (sorted by the portal's default
  // order) and dedupe by reference on upsert.
  searchUrl: 'https://www.marches-publics.gouv.fr/?page=Entreprise.EntrepriseAdvancedSearch&AllCons',

  // Max number of result rows to parse from the page.
  limit: 20,
}
