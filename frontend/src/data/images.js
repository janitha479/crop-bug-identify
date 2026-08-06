// Central photography library. Real Unsplash imagery (agriculture / Sri Lankan
// farming themed) used across the redesigned pages. Every consumer renders these
// through <Img/>, which falls back to a themed gradient if a URL ever fails.
const U = (id, w = 1200, q = 72) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=${q}`

export const PHOTOS = {
  // Hero / large banners
  heroField: U('1500382017468-9049fed747ef', 1920),
  paddyTerrace: U('1536062103-01c4bea2b3d4', 1600),
  sunriseField: U('1470071459604-3b5ec3a7fe05', 1600),

  // People / working the land
  farmerHands: U('1625246333195-78d9c38ad449', 1200),
  farmerField: U('1592982537447-7440770cbfc9', 1200),
  harvest: U('1574943320219-553eb213f72d', 1200),

  // Crops & detail
  riceCrop: U('1536062103-01c4bea2b3d4', 1000),
  greenLeaves: U('1416879595882-3373a0480b5b', 1000),
  seedling: U('1416879595882-3373a0480b5b', 800),
  cropRows: U('1465400360850-cc9ce33cc8f5', 1200),

  // Feature / section supporting imagery
  inspectLeaf: U('1471193945509-9ad0617afabf', 1000),
  weatherSky: U('1470072768013-bf9532016c10', 1200),
  marketProduce: U('1519162808019-7de1683fa2ad', 1000),
}

// Per-page banner choices, so pages stay visually distinct.
export const PAGE_IMAGES = {
  bugs: PHOTOS.inspectLeaf,
  news: PHOTOS.weatherSky,
  forecast: PHOTOS.sunriseField,
  auth: PHOTOS.paddyTerrace,
}
