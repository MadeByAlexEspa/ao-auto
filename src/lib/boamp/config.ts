export const boampConfig = {
  // Mots-clés recherchés (OR entre eux)
  keywords: [
    'informatique',
    'numérique',
    'logiciel',
    'développement',
  ],

  // Codes départements à surveiller
  // Ex: "75" = Paris, "69" = Rhône, "13" = Bouches-du-Rhône
  departments: ['75', '92', '93', '94'],

  // Nombre max de résultats par appel
  limit: 100,
}

// Aide : codes régions → départements courants
export const REGIONS: Record<string, string[]> = {
  'ile-de-france':   ['75','77','78','91','92','93','94','95'],
  'auvergne-rhone-alpes': ['01','03','07','15','26','38','42','43','63','69','73','74'],
  'paca':            ['04','05','06','13','83','84'],
  'occitanie':       ['09','11','12','30','31','32','34','46','48','65','66','81','82'],
  'nouvelle-aquitaine': ['16','17','19','23','24','33','40','47','64','79','86','87'],
  'bretagne':        ['22','29','35','56'],
  'pays-de-la-loire': ['44','49','53','72','85'],
  'normandie':       ['14','27','50','61','76'],
  'hauts-de-france': ['02','59','60','62','80'],
  'grand-est':       ['08','10','51','52','54','55','57','67','68','88'],
  'bourgogne-franche-comte': ['21','25','39','58','70','71','89','90'],
  'centre-val-de-loire': ['18','28','36','37','41','45'],
}
