// Curated "farming tips & guides" content - evergreen educational material for Sri
// Lankan farmers. Shown alongside the LIVE headlines (from /api/news) and used as the
// fallback when the live feed is unavailable. Images are verified Unsplash stock photos.

const U = (id) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=800&q=70`

export const CATEGORIES = ['All', 'Weather', 'Crops', 'Bugs', 'Agriculture']

export const NEWS = [
  {
    id: 'maha-season-monsoon',
    category: 'Weather',
    emoji: '🌧️',
    image: U('1470072768013-bf9532016c10'),
    title: 'Maha season & the North-East monsoon',
    date: '2026-07-05',
    summary:
      'The Maha cultivation season runs roughly September to March on the North-East monsoon rains. ' +
      'Plan paddy nurseries and land preparation around the first reliable rains, and keep drainage ' +
      'channels clear before heavy downpours.',
    source: 'Department of Meteorology',
  },
  {
    id: 'yala-dry-spell',
    category: 'Weather',
    emoji: '☀️',
    image: U('1523348837708-15d4a09cfac2'),
    title: 'Managing crops through a Yala dry spell',
    date: '2026-06-28',
    summary:
      'During the drier Yala season (May to August) in the dry zone, mulch beds to hold soil moisture, ' +
      'irrigate early morning or evening to cut evaporation, and prioritise water for flowering and ' +
      'fruiting stages when crops are most sensitive to stress.',
    source: 'Agri advisory',
  },
  {
    id: 'brown-planthopper-watch',
    category: 'Bugs',
    emoji: '🦗',
    image: U('1605000797499-95a51c5269ae'),
    title: 'Brown planthopper watch in paddy',
    date: '2026-07-02',
    summary:
      'Brown planthopper can cause "hopperburn": patches of paddy drying out and collapsing. ' +
      'Avoid over-applying nitrogen, keep field bunds weed-free, and scout the base of the plants ' +
      'weekly. Encourage natural predators like spiders rather than spraying at first sight.',
    source: 'Pest advisory',
  },
  {
    id: 'fall-armyworm-maize',
    category: 'Bugs',
    emoji: '🐛',
    image: U('1519162808019-7de1683fa2ad'),
    title: 'Fall armyworm in maize: scout early',
    date: '2026-06-20',
    summary:
      'Check the whorl of young maize plants for ragged, window-pane feeding and moist sawdust-like ' +
      'frass. Hand-pick egg masses where practical and act while larvae are small, since older larvae hide ' +
      'deep in the whorl and are much harder to control.',
    source: 'Pest advisory',
  },
  {
    id: 'beneficial-insects',
    category: 'Bugs',
    emoji: '🐝',
    image: U('1592982537447-7440770cbfc9'),
    title: "Don't kill your helpers: bees, earthworms & wasps",
    date: '2026-06-15',
    summary:
      'Not every insect in the field is a pest. Bees pollinate, earthworms build healthy soil, and ' +
      'many wasps hunt caterpillars. Broad sprays kill these allies too, so identify first, then treat ' +
      'only the real problem.',
    source: 'Knowledge base',
  },
  {
    id: 'paddy-fertiliser-basics',
    category: 'Crops',
    emoji: '🌾',
    image: U('1574943320219-553eb213f72d'),
    title: 'Paddy fertiliser timing basics',
    date: '2026-07-01',
    summary:
      'Split nitrogen across the crop rather than dumping it early: a basal dose, then top-dressing ' +
      'at active tillering and again at panicle initiation. Well-timed splits mean stronger plants and ' +
      'fewer sudden pest flare-ups from lush, soft growth.',
    source: 'Agri advisory',
  },
  {
    id: 'tea-plucking-quality',
    category: 'Crops',
    emoji: '🍃',
    image: U('1585320806297-9794b3e4eeae'),
    title: 'Tea: two leaves and a bud',
    date: '2026-06-25',
    summary:
      'Regular plucking rounds of the tender "two leaves and a bud" keep quality high and the bush ' +
      'productive. Longer intervals during flush periods let leaves coarsen and lower the grade at the ' +
      'factory.',
    source: 'Plantation notes',
  },
  {
    id: 'vegetable-crop-rotation',
    category: 'Crops',
    emoji: '🥬',
    image: U('1416879595882-3373a0480b5b'),
    title: 'Rotate vegetables to break pest cycles',
    date: '2026-06-18',
    summary:
      'Growing the same crop in the same bed season after season lets soil pests and diseases build up. ' +
      'Rotate families, for example following leafy greens with legumes, to starve specialist pests and ' +
      'refresh soil fertility.',
    source: 'Agri advisory',
  },
  {
    id: 'soil-health-compost',
    category: 'Agriculture',
    emoji: '🌱',
    image: U('1560493676-04071c5f467b'),
    title: 'Build soil health with compost',
    date: '2026-07-03',
    summary:
      'Adding well-rotted compost improves soil structure, water-holding and the beneficial microbes ' +
      'that help plants resist pests. Healthy soil is the cheapest long-term crop protection you can ' +
      'invest in.',
    source: 'Knowledge base',
  },
  {
    id: 'ipm-intro',
    category: 'Agriculture',
    emoji: '🧑‍🌾',
    image: U('1625246333195-78d9c38ad449'),
    title: 'Integrated Pest Management, in plain terms',
    date: '2026-06-22',
    summary:
      'IPM means using the least-harmful tools first: pick resistant varieties, keep fields clean, ' +
      'encourage natural predators, scout regularly, and reach for chemicals only as a last resort and ' +
      'at the right dose. Fewer sprays, healthier fields, lower cost.',
    source: 'Knowledge base',
  },
  {
    id: 'water-management',
    category: 'Agriculture',
    emoji: '💧',
    image: U('1444858291040-58f756a3bdd6'),
    title: 'Smart water management for smallholders',
    date: '2026-06-12',
    summary:
      'Line channels to cut seepage, level fields so water spreads evenly, and match irrigation to the ' +
      'crop stage. Small changes save water and reduce the waterlogging that invites root disease and ' +
      'snails.',
    source: 'Irrigation notes',
  },
  {
    id: 'safe-pesticide-use',
    category: 'Agriculture',
    emoji: '🧴',
    image: U('1471193945509-9ad0617afabf'),
    title: 'Using pesticides safely',
    date: '2026-06-08',
    summary:
      'If you must spray: read the label, wear gloves and a mask, mix the correct dose, spray in calm ' +
      'weather, and respect the pre-harvest interval. More is not better, because overuse breeds resistant ' +
      'pests and risks your health.',
    source: 'Safety advisory',
  },
]

// Hero + section imagery (verified Unsplash stock).
export const IMAGES = {
  hero: U('1500382017468-9049fed747ef'),
  field: U('1574943320219-553eb213f72d'),
  farmer: U('1625246333195-78d9c38ad449'),
  crops: U('1416879595882-3373a0480b5b'),
}
