/** One product, three grades. Each grade is a pouch in the hero carousel and a card in the grading section. */
export const GRADES = [
  {
    id: 'grade-a',
    tier: 'Grade A',
    name: 'Imperial Reserve',
    short: 'Imperial',
    line: 'Grade A',
    origin: 'Western Ghats, India',
    color: '#f2b441',
    deep: '#1a0f06',
    glow: '#ff9f1c',
    ink: '#1a0f06',
    tag: 'Extra-bold \u00b7 Maximum density',
    profile:
      'Extra-bold, heavy, perfectly spherical berries with maximum density. Yields the highest piperine oil content, offering an initial sweet aroma followed by a warm, lingering, complex heat.',
    best: 'Gourmet cooking, high-end dining, artisan charcuterie and table-top pepper mills.',
    points: ['Highest piperine oil content', 'Sweet aroma, lingering complex heat', 'Perfectly spherical, extra-bold berries'],
  },
  {
    id: 'grade-b',
    tier: 'Grade B',
    name: 'Select Kitchen',
    short: 'Select',
    line: 'Grade B',
    origin: 'Western Ghats, India',
    color: '#e8783c',
    deep: '#1c0d07',
    glow: '#ff6a2b',
    ink: '#1c0d07',
    tag: 'Uniform \u00b7 Sharp, clean punch',
    profile:
      'Uniform, clean, medium-to-large sun-certified berries. Exceptionally robust with a sharp, clean punch and a dependable aromatic baseline.',
    best: 'Everyday culinary mastery, family kitchens, boutique catering and sauce crafting.',
    points: ['Medium-to-large, sun-certified berries', 'Sharp, clean punch', 'Dependable aromatic baseline'],
  },
  {
    id: 'grade-c',
    tier: 'Grade C',
    name: 'Standard Grind & Extract',
    short: 'Standard',
    line: 'Grade C',
    origin: 'Western Ghats, India',
    color: '#8fbf86',
    deep: '#0b150b',
    glow: '#6fe08a',
    ink: '#0b150b',
    tag: 'Sound berries \u00b7 Built for volume',
    profile:
      'Fully matured, sound whole berries optimized for dense commercial crushing, spice rubs and heavy culinary blending.',
    best: 'Marinades, slow-cooked broths, industrial spice formulations and large-batch spice rubs.',
    points: ['Fully matured, sound whole berries', 'Optimized for crushing and blending', 'Built for large batches'],
  },
];

export const WEIGHTS = [100, 250, 500, 1000];

/** Section 2: the problem. */
export const CRISIS = [
  {
    n: '01',
    title: 'The adulteration trap',
    text: 'Cheap, spent black pepper shells mixed with dried papaya seeds, light-weight hollow berries, and synthetic mineral oils to fake a glossy shine.',
    stat: 'Papaya seeds \u00b7 Hollow berries \u00b7 Mineral oil',
  },
  {
    n: '02',
    title: 'The aroma deficit',
    text: 'Industrial steam-cleaning and fast-kiln drying vaporize natural piperine oils, leaving you with flat heat and zero depth.',
    stat: 'Flat heat \u00b7 Zero depth',
  },
  {
    n: '03',
    title: 'The broken chain',
    text: 'By the time commercial pepper passes through five different brokers, its origin is lost, its freshness is oxidized, and its quality is an unverified gamble.',
    stat: '5 brokers \u00b7 Origin lost',
  },
];

/** Section 3: the genesis, shown as four pinned scroll chapters. */
export const CHAPTERS = [
  {
    word: 'MIST',
    title: 'Rooted in the mist',
    text: 'True black pepper (Piper nigrum) is not a factory product. It is a child of ancient soil, heavy monsoon rains and tropical altitude. On the high slopes of the Western Ghats, volcanic, nutrient-rich soil and filtered canopy light slow the vines, packing density, resin and pungency into every berry.',
    spot: 'Western Ghats \u00b7 Volcanic soil',
  },
  {
    word: 'HAND',
    title: 'Hand-harvested at peak maturity',
    text: 'We never harvest green or premature spikes. Every cluster is hand-inspected and picked only when the basal berries begin to turn a rich, golden-orange hue.',
    spot: 'Golden-orange basal berries',
  },
  {
    word: 'SUN',
    title: 'Traditional sun-drying',
    text: 'No accelerated chemical drying or high-heat industrial kilns. Berries are sun-dried on clean concrete and bamboo yards for 7 to 10 days, until they reach the ideal moisture and that signature wrinkled, leathery skin.',
    spot: '7\u201310 days in the sun',
  },
  {
    word: 'PURE',
    title: 'Zero chemical interventions',
    text: 'Washed naturally in spring water, free from artificial waxes, chemical brighteners or fumigants. What reaches you is exactly what the vine made.',
    spot: 'No waxes \u00b7 No fumigants',
  },
];

/** Section 5: what sets us apart. Icons are inline SVG paths in index/grades markup. */
export const PROCESS = [
  {
    icon: 'route',
    title: 'Direct-from-estate traceability',
    text: 'We own the relationship from farm gate to your doorstep. No middlemen, no mystery blends.',
  },
  {
    icon: 'drop',
    title: 'High piperine retention',
    text: 'Standard processing loses up to 40% of volatile oils. Our airtight, low-temperature sorting locks in piperine and aromatic terpenes.',
  },
  {
    icon: 'flask',
    title: 'Purity lab-verified',
    text: 'Every batch undergoes rigorous purity screening to guarantee zero foreign matter, mold contamination or adulterant seeds.',
  },
  {
    icon: 'pack',
    title: 'Custom gram-scale packaging',
    text: 'Order exactly what you need, from 100 g trial packs to bulk culinary jars, in UV-resistant, food-grade pouches that lock in freshness.',
  },
];
