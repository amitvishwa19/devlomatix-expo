/**
 * Comprehensive Agrohomeopathy Knowledge Base
 * Derived from "Homoeopathy For Farm And Garden: Toward A Homoeopathic Agriculture"
 * by Vaikunthanath Das Kaviraj
 */

export const BOOK_METADATA = {
  title: "Homoeopathy for Farm and Garden",
  subtitle: "Toward a Homoeopathic Agriculture",
  author: "Vaikunthanath Das Kaviraj",
  edition: "Comprehensive Field Edition",
  summary:
    "The pioneering treatise on agrohomeopathy, detailing non-toxic, potentized homeopathic remedies to heal plant diseases, repel pests, stimulate soil vital force, and recover crops from environmental stress.",
};

export const BOOK_PRINCIPLES = [
  {
    id: "principle_1",
    title: "The Law of Similars in Plants",
    latin: "Similia Similibus Curentur",
    description:
      "A substance that produces specific physiological symptoms in a healthy organism will cure similar morbid symptoms in a diseased plant. Kaviraj discovered this in 1986 when Belladonna (indicated for scarlet fever with red rash) completely cured scarlet-red stripe rust in apple trees.",
    icon: "leaf",
  },
  {
    id: "principle_2",
    title: "Dynamization & The Vital Force",
    latin: "Vis Vitalis & Potentisation",
    description:
      "Plants possess an innate bio-energetic vital force. Homeopathic remedies act not through biochemical toxicity, but through energetic signals that stimulate the plant's own immune and cellular defense mechanisms.",
    icon: "flash",
  },
  {
    id: "principle_3",
    title: "Preparation & Water Dynamization",
    latin: "Succussion & Dosage",
    description:
      "Dissolve 10 to 12 pellets of 6X (or 30C) in 10-20 Litres of clean, unchlorinated water. Stir vigorously in both directions (succussion) for 5-10 minutes to disperse the energetic blueprint evenly throughout the volume.",
    icon: "water",
  },
  {
    id: "principle_4",
    title: "Application Rules & Solar Timing",
    latin: "Regimen & Timing",
    description:
      "Always spray in early morning sunlight or near dusk. Never spray under scorching midday sun or immediately before heavy rain. Use clean dedicated sprayers free of synthetic chemical and pesticide residues.",
    icon: "sunny",
  },
  {
    id: "principle_5",
    title: "Soil Inoculation & Root Watering",
    latin: "Substrate Priming",
    description:
      "For root rot, transplant trauma, or subterranean pests (nematodes, grubs), drench the root zone. For leaf blights, powdery mildew, or caterpillars, apply as a fine foliar mist on both upper and lower leaf surfaces.",
    icon: "flower",
  },
];

export const CATEGORIES = [
  { id: "ALL", label: "All Topics" },
  { id: "FUNGAL", label: "Fungal & Blights" },
  { id: "BACTERIAL", label: "Bacterial & Viral" },
  { id: "PESTS", label: "Pests & Insects" },
  { id: "TRAUMA", label: "Injuries & Weather" },
  { id: "SOIL", label: "Soil & Deficiencies" },
];

export const DISEASES_AND_PESTS = [
  {
    id: "dp_rust",
    category: "FUNGAL",
    name: "Rusts & Stripe Rust (Puccinia spp.)",
    pathogen: "Puccinia striiformis / Puccinia graminis",
    crops: "Apple, Wheat, Barley, Beans, Roses",
    symptoms:
      "Bright yellow, scarlet-red, or brownish pustules forming streaks on leaf blades and stems. Leaves dry out, curl, and drop prematurely.",
    primaryRemedy: "Belladonna",
    potency: "6X or 30C",
    secondaryRemedies: ["Ferrum Phosphoricum", "Sulphur"],
    dosage: "10-12 pellets in 10L water; spray early morning. Repeat after 7 days if weather is damp.",
    notes:
      "Kaviraj's foundational discovery: Belladonna matches the fiery redness, heat, and rapid onset of rust.",
  },
  {
    id: "dp_late_blight",
    category: "FUNGAL",
    name: "Late Blight & Downy Mildew",
    pathogen: "Phytophthora infestans / Plasmopara",
    crops: "Potato, Tomato, Grapevine, Cucurbits",
    symptoms:
      "Water-soaked dark lesions on leaves and stems with white fungal fuzz underneath in humid conditions. Rapid collapse of foliage and rotten tubers/fruits.",
    primaryRemedy: "Carbo Vegetabilis",
    potency: "6X or 30C",
    secondaryRemedies: ["Phosphorus", "Silicea", "Natrum Sulphuricum"],
    dosage: "Foliar mist every 5 days during persistent cool, wet conditions.",
    notes:
      "Carbo Veg revives decaying, oxygen-starved plant tissues and prevents systemic collapse.",
  },
  {
    id: "dp_powdery_mildew",
    category: "FUNGAL",
    name: "Powdery Mildew (Erysiphe / Oidium)",
    pathogen: "Erysiphe cichoracearum / Podosphaera",
    crops: "Squash, Cucumber, Grape, Apple, Rose, Peas",
    symptoms:
      "White powdery talc-like fungal coating on upper leaf surfaces, distorted young leaves, stunted budding and poor fruit set.",
    primaryRemedy: "Sulphur",
    potency: "6X or 30C",
    secondaryRemedies: ["Silicea", "Thuja Occidentalis"],
    dosage: "Foliar spray twice weekly at first appearance of white dust.",
    notes:
      "Sulphur addresses surface fungal parasites; follow with Silicea 6X to strengthen leaf cuticle.",
  },
  {
    id: "dp_damping_off",
    category: "FUNGAL",
    name: "Damping-Off & Seedling Collapse",
    pathogen: "Pythium spp. / Rhizoctonia solani",
    crops: "Nursery Seedlings, Greenhouse Starts",
    symptoms:
      "Seedlings rot at soil line, become waterlogged, topple over, and die rapidly in flats or seedbeds.",
    primaryRemedy: "Aconitum Napellus",
    potency: "6X or 30C",
    secondaryRemedies: ["Carbo Vegetabilis", "Silicea"],
    dosage: "Water soil beds thoroughly before sowing and at first sign of collapse.",
    notes:
      "Aconitum stops acute sudden seedling shock caused by cold drafts, damp seedbeds, or temperature swings.",
  },
  {
    id: "dp_canker",
    category: "BACTERIAL",
    name: "Bacterial Canker & Fire Blight",
    pathogen: "Erwinia amylovora / Pseudomonas syringae",
    crops: "Pear, Apple, Stone Fruits, Citrus, Tomato",
    symptoms:
      "Shepherd's crook bending of branch tips, blackened scorched leaves adhering to branches, gum oozing from bark cankers.",
    primaryRemedy: "Phosphorus",
    potency: "6X or 30C",
    secondaryRemedies: ["Carbo Vegetabilis", "Arsenicum Album"],
    dosage: "Trunk spray and root drench 15L per mature tree in spring.",
    notes:
      "Phosphorus treats burning diseases and destructive bacterial necrosis; halt infected shoots from dying back.",
  },
  {
    id: "dp_crown_gall",
    category: "BACTERIAL",
    name: "Crown Gall & Tumor Outgrowths",
    pathogen: "Agrobacterium tumefaciens",
    crops: "Roses, Fruit Trees, Vines, Nut Trees",
    symptoms:
      "Rough, spongy or woody tumorous gall formations at the crown or graft union, hindering sap flow.",
    primaryRemedy: "Thuja Occidentalis",
    potency: "6X or 30C",
    secondaryRemedies: ["Staphysagria", "Silicea"],
    dosage: "Root watering every 14 days for 6 weeks.",
    notes:
      "Thuja is the chief sycotic remedy in homeopathy, dissolving abnormal vegetative proliferations and warty growths.",
  },
  {
    id: "dp_mosaic_virus",
    category: "BACTERIAL",
    name: "Mosaic Virus & Leaf Curl",
    pathogen: "TMV / CMV / Begomovirus",
    crops: "Tomato, Tobacco, Pepper, Papaya, Cucurbits",
    symptoms:
      "Mottled yellow-green mosaic pattern, puckering, upward curling, shoestringing of leaves, and severe stunting.",
    primaryRemedy: "Thuja Occidentalis",
    potency: "30C",
    secondaryRemedies: ["Sulphur", "Silicea"],
    dosage: "Foliar mist every 7 days; rogue out heavily necrotic index plants.",
    notes:
      "Viral states in plants require deep anti-sycotic constitutional remedies like Thuja and Sulphur.",
  },
  {
    id: "dp_aphids",
    category: "PESTS",
    name: "Aphids & Greenflies (Aphidoidea)",
    pathogen: "Aphis fabae / Myzus persicae",
    crops: "Vegetables, Fruit Trees, Ornamentals, Cereals",
    symptoms:
      "Dense colonies of green, black, or grey soft-bodied insects clustering under leaves and on young shoots, curling leaves and secreting sticky honeydew.",
    primaryRemedy: "Coccinella Septempunctata",
    potency: "6X or 30C",
    secondaryRemedies: ["Allium Cepa", "Aphis Papaveris"],
    dosage: "Fine foliar spray on undersides of leaves every 3-4 days until cleared.",
    notes:
      "Coccinella (Ladybird potentized) is the natural homeopathic simillimum that triggers aphid deterrence.",
  },
  {
    id: "dp_snails_slugs",
    category: "PESTS",
    name: "Snails & Slugs (Mollusca)",
    pathogen: "Helix aspersa / Deroceras reticulatum",
    crops: "Lettuce, Strawberries, Hostas, Seedlings, Brassicas",
    symptoms:
      "Irregular holes with smooth edges on leaves, slime trails across foliage and soil beds, seedlings eaten down to ground overnight.",
    primaryRemedy: "Helix Tosta",
    potency: "6X",
    secondaryRemedies: ["Silicea"],
    dosage: "Water soil perimeter and beds in late afternoon before nocturnal gastropod activity.",
    notes:
      "Helix Tosta (roasted snail shell) acts as an energetic barrier; slugs and snails will refuse to cross treated soil.",
  },
  {
    id: "dp_caterpillars",
    category: "PESTS",
    name: "Caterpillars & Leaf Miners",
    pathogen: "Pieris brassicae / Spodoptera / Tuta absoluta",
    crops: "Cabbage, Tomato, Maize, Orchard Trees",
    symptoms:
      "Skeletonized foliage, large irregular chews, serpentine tunnels inside leaf tissue, frass (droppings) in leaf axils.",
    primaryRemedy: "Bombyx Processionea",
    potency: "6X or 30C",
    secondaryRemedies: ["Thuja Occidentalis", "Sulphur"],
    dosage: "Foliar spray across upper and lower canopy every 4 days.",
    notes:
      "Bombyx (processionary caterpillar nosode) repels lepidopteran pests effectively without harming honeybees.",
  },
  {
    id: "dp_spider_mites",
    category: "PESTS",
    name: "Red Spider Mites (Tetranychidae)",
    pathogen: "Tetranychus urticae",
    crops: "Polyhouse vegetables, Fruit trees, Roses, Beans",
    symptoms:
      "Fine yellow stippling on leaf tops, delicate silken webbing under leaves, leaves turning bronzed, dry, and brittle.",
    primaryRemedy: "Sulphur",
    potency: "6X or 30C",
    secondaryRemedies: ["Bovista", "Coccinella"],
    dosage: "Mist underside of canopy in warm weather.",
    notes:
      "Sulphur alters the plant surface micro-environment, making it uninhabitable for acarine mites.",
  },
  {
    id: "dp_nematodes",
    category: "PESTS",
    name: "Root-Knot Nematodes",
    pathogen: "Meloidogyne spp.",
    crops: "Tomato, Potato, Carrot, Cotton, Bananas",
    symptoms:
      "Swollen root galls, knotted root systems, poor nutrient uptake, wilting during hot days despite moist soil.",
    primaryRemedy: "Cina",
    potency: "6X or 30C",
    secondaryRemedies: ["Tanacetum Vulgare", "Santoninum"],
    dosage: "Soil drench around root zone before planting or during active vegetative growth.",
    notes:
      "Cina (wormseed) is the classical anthelmintic remedy, restoring root vitality and clearing nematode swarms.",
  },
  {
    id: "dp_pruning_trauma",
    category: "TRAUMA",
    name: "Mechanical Injury, Pruning & Grafting",
    pathogen: "Mechanical Wounds / Plant Surgery",
    crops: "Fruit Trees, Vines, Bonsai, Roses, Transplants",
    symptoms:
      "Broken limbs from windstorms, fresh pruning cuts, bleeding sap, damaged cambium, grafting failure.",
    primaryRemedy: "Arnica Montana",
    potency: "6X or 30C",
    secondaryRemedies: ["Calendula Officinalis", "Hypericum Perforatum"],
    dosage: "Wash cuts with Arnica solution; apply root drench immediately after heavy pruning.",
    notes:
      "Arnica prevents sap extravasation, stops traumatic shock, and initiates rapid wound callusing.",
  },
  {
    id: "dp_transplant_shock",
    category: "TRAUMA",
    name: "Transplant Shock & Root Tearing",
    pathogen: "Root System Disturbance",
    crops: "All Transplants, Seedlings, Bare-Root Trees",
    symptoms:
      "Wilting immediately upon transplanting, yellowing lower leaves, failure to establish new feeder roots.",
    primaryRemedy: "Calendula Officinalis",
    potency: "6X or 30C",
    secondaryRemedies: ["Arnica Montana", "Silicea"],
    dosage: "Dip root balls in Calendula solution prior to planting; water newly potted soil.",
    notes:
      "Calendula is the supreme antiseptic and tissue-regenerator in botany, preventing root rot in torn roots.",
  },
  {
    id: "dp_frost_injury",
    category: "TRAUMA",
    name: "Frostbite, Cold Snap & Hail Damage",
    pathogen: "Sub-Zero Temperature Shock",
    crops: "Early Spring Blossoms, Citrus, Vineyards, Vegetables",
    symptoms:
      "Blackened leaf margins, dropped blossoms, shattered leaves from hail, bark cracking in freeze-thaw cycles.",
    primaryRemedy: "Aconitum Napellus",
    potency: "6X or 30C",
    secondaryRemedies: ["Arnica Montana", "Agaricus Muscarius"],
    dosage: "Spray immediately after frost event or hail storm as soon as ice thaws.",
    notes:
      "Aconitum addresses acute cold shock and prevents cellular rupture in freezing tissues.",
  },
  {
    id: "dp_drought_heat",
    category: "TRAUMA",
    name: "Drought, Sunscald & Extreme Heat",
    pathogen: "Thermal Desiccation & Water Stress",
    crops: "Field Crops, Greenhouse Vegetables, Orchard Fruit",
    symptoms:
      "Sunburnt fruit patches, curled scorched foliage, limp wilting during heatwaves, severe transpiration stress.",
    primaryRemedy: "Carbo Vegetabilis",
    potency: "6X or 30C",
    secondaryRemedies: ["Belladonna", "Silicea"],
    dosage: "Spray in evening after a hot day; root water with 10L per bed.",
    notes:
      "Carbo Veg is the 'corpse reviver' of the plant world, restoring plants on the verge of desiccation.",
  },
  {
    id: "dp_blossom_end_rot",
    category: "SOIL",
    name: "Blossom-End Rot & Calcium Assimilation",
    pathogen: "Physiological Calcium Uptake Blockage",
    crops: "Tomato, Pepper, Eggplant, Watermelon",
    symptoms:
      "Dark, sunken, leathery black spots on the blossom end of developing fruits despite adequate watering.",
    primaryRemedy: "Ocymum Basilicum",
    potency: "6X",
    secondaryRemedies: ["Calcarea Phosphorica", "Silicea"],
    dosage: "Foliar mist every 5 days during fruit set and initial swelling.",
    notes:
      "Ocymum (Basil) dynamically stimulates the plant roots to assimilate bound calcium and trace minerals from the soil.",
  },
  {
    id: "dp_chlorosis",
    category: "SOIL",
    name: "Iron Chlorosis & Mineral Yellowing",
    pathogen: "Nutrient Lockup in Alkaline / Compacted Soil",
    crops: "Citrus, Gardenia, Strawberries, Maize, Vines",
    symptoms:
      "Interveinal chlorosis where leaf tissue turns pale yellow while veins remain distinctly green.",
    primaryRemedy: "Ferrum Phosphoricum",
    potency: "6X",
    secondaryRemedies: ["Sulphur", "Silicea"],
    dosage: "Soil drench and foliar spray in morning sunlight.",
    notes:
      "Ferrum Phos unblocks iron metabolism and enhances chlorophyll synthesis without soil acidifiers.",
  },
  {
    id: "dp_weak_stems",
    category: "SOIL",
    name: "Lodging, Weak Stems & Fungal Susceptibility",
    pathogen: "Silicon Deficiency / Soft Cellular Walls",
    crops: "Wheat, Paddy Rice, Bamboo, Cucurbits, Ornamentals",
    symptoms:
      "Plants fall over under wind/rain (lodging), weak stems prone to snapping, soft leaves easily penetrated by fungal hyphae.",
    primaryRemedy: "Silicea",
    potency: "6X or 30C",
    secondaryRemedies: ["Calcarea Carbonica"],
    dosage: "Apply twice during early vegetative stage and before flowering.",
    notes:
      "Silicea deposits microscopic biogenic silica crystals into plant cell walls, creating an armor against fungi and pests.",
  },
];

export const MATERIA_MEDICA = [
  {
    id: "mm_arnica",
    name: "Arnica Montana",
    commonName: "Mountain Daisy / Leopard's Bane",
    source: "Vegetable Kingdom (Asteraceae)",
    keynotes: "Trauma, bruising, mechanical injury, sap loss, surgery, pruning, grafting.",
    plantIndications:
      "The premier remedy for any physical trauma to plants. Indicated after violent winds, hail storms, heavy pruning, broken limbs, grafting, or root severance during tilling. It arrests sap bleeding and prevents bacterial/fungal entry into wounds.",
    pestsTargeted: "Trauma-induced secondary pests, wound opportunists.",
    potencyAdvice: "6X for direct field spraying; 30C for severe shock after grafting.",
    applicationMethod: "Foliar mist and wound wash: 10 pellets in 10L clean water.",
    synergies: "Follow with Calendula for open lacerations or Silicea for structural healing.",
  },
  {
    id: "mm_belladonna",
    name: "Belladonna",
    commonName: "Deadly Nightshade",
    source: "Vegetable Kingdom (Solanaceae)",
    keynotes: "Violent acute onset, redness, heat, congestion, scarlet pustules, sunstroke.",
    plantIndications:
      "Kaviraj's landmark remedy for agricultural rusts (Puccinia spp.). Indicated when diseases strike suddenly with fiery red, orange, or yellow spots. Also useful for young shoots suffering sudden sunstroke or heat congestion after cool rainy periods.",
    pestsTargeted: "Fungal rusts, leaf spot congestions.",
    potencyAdvice: "6X is most effective for field rust control.",
    applicationMethod: "Foliar spray early morning. Do not mix with chemicals.",
    synergies: "Complements Ferrum Phos and Sulphur.",
  },
  {
    id: "mm_calendula",
    name: "Calendula Officinalis",
    commonName: "Pot Marigold",
    source: "Vegetable Kingdom (Asteraceae)",
    keynotes: "Lacerated wounds, torn roots, transplanting, antiseptic healing, root rot prevention.",
    plantIndications:
      "The greatest healing agent for open, jagged wounds in plants. Essential when transplanting seedlings or bare-root trees to prevent root rot and promote vigorous rootlet growth. Leaves clean wounds without scar tissue.",
    pestsTargeted: "Soil fungi entering torn roots, damping-off organisms.",
    potencyAdvice: "6X or Mother Tincture Q (10 drops in 5L water).",
    applicationMethod: "Root dip prior to planting and soil drench around new plantings.",
    synergies: "Works hand-in-hand with Arnica Montana.",
  },
  {
    id: "mm_carbo_veg",
    name: "Carbo Vegetabilis",
    commonName: "Vegetable Charcoal",
    source: "Vegetable / Mineral Kingdom",
    keynotes: "Decay, oxygen starvation, collapse, late blight, rotting, drought recovery.",
    plantIndications:
      "The 'plant reviver'. Indicated for plants near death from waterlogged asphyxiation, extreme drought, late blight (Phytophthora), or foul-smelling rot. Restores vitality to stagnant, oxygen-starved root zones and stops rapid decay.",
    pestsTargeted: "Late blight, soft rots, bacterial decay.",
    potencyAdvice: "6X or 30C.",
    applicationMethod: "Soil drench and foliar spray; 12 pellets in 15L water.",
    synergies: "Follow with Silicea or Phosphorus once plant revives.",
  },
  {
    id: "mm_coccinella",
    name: "Coccinella Septempunctata",
    commonName: "Seven-Spotted Ladybird",
    source: "Animal Kingdom (Insecta)",
    keynotes: "Aphid infestations, greenflies, honeydew secretion, curled leaf tips.",
    plantIndications:
      "Prepared from the ladybird beetle, the natural predator of aphids. Potentized Coccinella broadcasts the energetic predator signature, causing aphids to detach, stop feeding, and vacate treated plants.",
    pestsTargeted: "Aphids (Green, Black, Woolly), soft scale insects.",
    potencyAdvice: "6X or 30C.",
    applicationMethod: "Fine foliar mist targeting undersides of leaves where aphids shelter.",
    synergies: "Alternate with Allium Cepa or Sulphur if mould grows on honeydew.",
  },
  {
    id: "mm_helix_tosta",
    name: "Helix Tosta",
    commonName: "Toasted Snail Shell",
    source: "Animal Kingdom (Mollusca)",
    keynotes: "Gastropod repellent, snail deterrent, slug barrier, nocturnal leaf damage.",
    plantIndications:
      "One of the most widely validated agrohomeopathic discoveries of Kaviraj. Helix Tosta creates an energetic bio-field that gastropods refuse to cross. Completely harmless to earthworms, beneficial insects, pets, and children.",
    pestsTargeted: "Garden snails (Helix aspersa), black slugs, grey field slugs.",
    potencyAdvice: "6X is the optimal field potency.",
    applicationMethod: "Water the perimeter of garden beds and vegetable patches at dusk.",
    synergies: "Can be paired with Silicea to harden plant cuticle against chewing.",
  },
  {
    id: "mm_ocymum",
    name: "Ocymum Basilicum",
    commonName: "Sweet Basil",
    source: "Vegetable Kingdom (Lamiaceae)",
    keynotes: "Blossom-end rot, calcium assimilation, insect repellent, companion vitality.",
    plantIndications:
      "Specific for Solanaceae crops (tomatoes, peppers, eggplants) suffering from blossom-end rot. It acts as a bio-catalyst, enabling plant roots to mobilize and transport calcium efficiently even in alkaline or heavy clay soils.",
    pestsTargeted: "Whiteflies, tomato hornworms, horn fly deterrent.",
    potencyAdvice: "6X.",
    applicationMethod: "Foliar spray every 7-10 days throughout flowering and fruit setting.",
    synergies: "Follow with Calcarea Phos 6X.",
  },
  {
    id: "mm_silicea",
    name: "Silicea (Silica)",
    commonName: "Pure Flint / Silicon Dioxide",
    source: "Mineral Kingdom",
    keynotes: "Structural rigidity, stem strength, fungal resistance, root development, nutrient conduit.",
    plantIndications:
      "The 'architect' of the plant kingdom. Silicea deposits crystalline silica into epidermal cells, strengthening cell walls against fungal hyphae penetration and insect mouthparts. Prevents lodging in grains and improves drought tolerance.",
    pestsTargeted: "Powdery mildew, rusts, blights, stem borers.",
    potencyAdvice: "6X or 30C (30C for deep structural effect).",
    applicationMethod: "Apply during early growth and before ear emergence in grains.",
    synergies: "Acts as a deep constitutional finisher after acute remedies.",
  },
  {
    id: "mm_sulphur",
    name: "Sulphur",
    commonName: "Brimstone / Sublimed Sulphur",
    source: "Mineral Kingdom",
    keynotes: "Fungal infestations, powdery mildew, red spider mites, soil acid balance, sluggish vitality.",
    plantIndications:
      "The great centrifugal cleanser in homeopathy. Indicated for persistent powdery mildew, black spot on roses, red spider mite outbreaks, and plants that appear dirty, dull, and unresponsive to fertilizers.",
    pestsTargeted: "Powdery mildew, mites, thrips, scab.",
    potencyAdvice: "6X or 30C.",
    applicationMethod: "Spray in sunny morning conditions. Do not apply during full bloom.",
    synergies: "Follow with Silicea or Thuja.",
  },
  {
    id: "mm_thuja",
    name: "Thuja Occidentalis",
    commonName: "Arbor Vitae / Tree of Life",
    source: "Vegetable Kingdom (Cupressaceae)",
    keynotes: "Sycotic miasm, warty outgrowths, crown gall, viral mosaic, fungal blights, scale insects.",
    plantIndications:
      "The supreme anti-sycotic remedy. Clears plant tumors, crown galls (Agrobacterium), viral mosaic distortions, and scale insect infestations. Essential for plants in damp, overcast climates with stagnant humidity.",
    pestsTargeted: "Scale insects, mealybugs, whiteflies, crown gall, mosaic virus.",
    potencyAdvice: "6X or 30C.",
    applicationMethod: "Foliar spray and stem wash.",
    synergies: "Complements Silicea and Sulphur.",
  },
  {
    id: "mm_aconitum",
    name: "Aconitum Napellus",
    commonName: "Monkshood",
    source: "Vegetable Kingdom (Ranunculaceae)",
    keynotes: "Sudden violent shock, acute frostbite, cold dry winds, damping-off, early fever.",
    plantIndications:
      "Indicated for acute conditions that strike with immense rapidity after exposure to cold, dry winds or unseasonal frost. Stops seedling damping-off when given at the very first sign of wilting.",
    pestsTargeted: "Early damping-off, acute sudden wilt.",
    potencyAdvice: "6X or 30C.",
    applicationMethod: "Spray immediately during or directly following cold weather shock.",
    synergies: "Precedes Belladonna or Arnica.",
  },
  {
    id: "mm_phosphorus",
    name: "Phosphorus",
    commonName: "Elemental Phosphorus",
    source: "Mineral Kingdom",
    keynotes: "Bacterial necrosis, fire blight, cankers, root development, burning leaf margins.",
    plantIndications:
      "Indicated for severe destructive necrosis like fire blight (Erwinia) and bacterial canker where leaves appear scorched as if by fire. Also stimulates root branching and flower bud initiation.",
    pestsTargeted: "Fire blight, bacterial necrosis, leaf scorch.",
    potencyAdvice: "6X or 30C.",
    applicationMethod: "Trunk spray and root drench.",
    synergies: "Follow with Carbo Veg if decay sets in.",
  },
];
