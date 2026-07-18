// Static gallery of the pests the assistant knows about, mirroring the backend
// knowledge base's intent. The authoritative runtime list comes from /api/health,
// but this curated list gives the Bugs page reliable, friendly visuals.
// `beneficial: true` marks creatures the assistant tells farmers NOT to kill.

export const BUGS = [
  // --- 12 general insects (Kaggle Agricultural Pests dataset) ---
  { label: 'ants', name: 'Ants', emoji: '🐜',
    blurb: 'Often farm aphids for honeydew and protect them from predators — a sign of a sap-pest problem nearby.' },
  { label: 'bees', name: 'Bees', emoji: '🐝', beneficial: true,
    blurb: 'Vital pollinators. Protect them — never spray flowering crops while bees are active.' },
  { label: 'beetle', name: 'Beetle', emoji: '🪲',
    blurb: 'A huge group; many chew leaves, roots or stored grain. Identify the type before treating.' },
  { label: 'caterpillar', name: 'Caterpillar', emoji: '🐛',
    blurb: 'Larvae of moths and butterflies. Voracious leaf-eaters — hand-pick when numbers are low.' },
  { label: 'earthworms', name: 'Earthworms', emoji: '🪱', beneficial: true,
    blurb: 'Soil engineers that improve structure and fertility. A healthy sign — leave them be.' },
  { label: 'earwig', name: 'Earwig', emoji: '🦂',
    blurb: 'Mixed reputation: chews seedlings and soft fruit, but also eats aphids and mites.' },
  { label: 'grasshopper', name: 'Grasshopper', emoji: '🦗',
    blurb: 'Chewing pests that can strip leaves fast in swarms. Watch field edges after dry spells.' },
  { label: 'moth', name: 'Moth', emoji: '🦋',
    blurb: 'Adults are mostly harmless, but their caterpillars can be serious crop pests. Trap to monitor.' },
  { label: 'slug', name: 'Slug', emoji: '🐌',
    blurb: 'Rasps holes in leaves and seedlings in damp conditions. Reduce moisture and hiding spots.' },
  { label: 'snail', name: 'Snail', emoji: '🐌',
    blurb: 'Feeds on tender growth, especially in wet paddy and vegetable beds. Hand-collect at dawn.' },
  { label: 'wasp', name: 'Wasp', emoji: '🐝', beneficial: true,
    blurb: 'Many wasps are natural enemies that hunt caterpillars and aphids — usually an ally, not a pest.' },
  { label: 'weevil', name: 'Weevil', emoji: '🐞',
    blurb: 'Snout beetles that damage crops in the field and grain in storage. Keep stores clean and dry.' },

  // --- Sri Lankan crop pests (IP102 dataset) ---
  { label: 'brown_planthopper', name: 'Brown planthopper', emoji: '🦟',
    blurb: 'Sucks sap from rice and causes "hopperburn". Avoid excess nitrogen and protect its predators.' },
  { label: 'rice_stem_borer', name: 'Rice stem borer', emoji: '🌾',
    blurb: 'Larvae tunnel into paddy stems causing "deadhearts" and "whiteheads". Destroy stubble after harvest.' },
  { label: 'fall_armyworm', name: 'Fall armyworm', emoji: '🐛',
    blurb: 'Aggressive maize pest. Scout the whorl early and act while larvae are small.' },
  { label: 'fruit_fly', name: 'Fruit fly', emoji: '🪰',
    blurb: 'Lays eggs in fruit; maggots rot it from inside. Use traps, bagging and prompt sanitation.' },
  { label: 'thrips', name: 'Thrips', emoji: '🐜',
    blurb: 'Tiny raspers that silver leaves and scar fruit, and can spread viruses. Monitor with sticky traps.' },
  { label: 'mealybug', name: 'Mealybug', emoji: '🪳',
    blurb: 'White cottony sap-suckers that weaken plants and leave sticky honeydew. Watch for ant partners.' },
  { label: 'leafhopper', name: 'Leafhopper', emoji: '🦗',
    blurb: 'Sap-suckers that cause leaf yellowing and "hopperburn", and transmit plant diseases.' },
]
