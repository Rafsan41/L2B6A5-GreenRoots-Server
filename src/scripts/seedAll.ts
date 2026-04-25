/**
 * GreenRoots — Full database seed
 * Runs: users (admin + seller + customer) → categories → products
 *
 * Usage:  npx tsx src/scripts/seedAll.ts
 */

import { prisma } from "../lib/prisma.js";
import crypto from "crypto";

// ── Helper: short random ID (matches Better Auth format) ─────────────────────
const uid = () => crypto.randomBytes(18).toString("base64url").slice(0, 28);

// ── Step 1: Users ─────────────────────────────────────────────────────────────
const ADMIN_ID    = uid();
const SELLER_ID   = uid();
const CUSTOMER_ID = uid();

const users = [
  {
    id: ADMIN_ID,
    name: "GreenRoots Admin",
    email: "admin@greenroots.app",
    emailVerified: true,
    role: "ADMIN"   as const,
    status: "ACTIVE" as const,
    image: null,
    phones: null,
  },
  {
    id: SELLER_ID,
    name: "GreenRoots Herbalist",
    email: "seller@greenroots.app",
    emailVerified: true,
    role: "SELLER"  as const,
    status: "ACTIVE" as const,
    image: null,
    phones: null,
  },
  {
    id: CUSTOMER_ID,
    name: "Herbal Customer",
    email: "customer@greenroots.app",
    emailVerified: true,
    role: "CUSTOMER" as const,
    status: "ACTIVE"  as const,
    image: null,
    phones: null,
  },
];

// ── Step 2: Categories ────────────────────────────────────────────────────────
const categories = [
  {
    name: "Adaptogens",
    slug: "adaptogens",
    description: "Herbs that help your body adapt to stress, restore hormonal balance and build long-term resilience",
  },
  {
    name: "Skin & Hair",
    slug: "skin-hair",
    description: "Natural botanicals for radiant skin, healthy hair and deep cellular nourishment",
  },
  {
    name: "Digestive",
    slug: "digestive",
    description: "Healing herbs for gut health, bowel regularity and digestive fire",
  },
  {
    name: "Vitamins & Minerals",
    slug: "vitamins-minerals",
    description: "Whole-food and plant-based vitamins, minerals and micronutrient complexes",
  },
  {
    name: "Immunity Boost",
    slug: "immunity-boost",
    description: "Herbal allies that activate, modulate and strengthen the immune system",
  },
  {
    name: "Sleep & Calm",
    slug: "sleep-calm",
    description: "Calming botanicals for restful sleep, anxiety relief and nervous system support",
  },
];

// ── Step 3: Products ──────────────────────────────────────────────────────────
const products = [

  // ── ADAPTOGENS ──────────────────────────────────────────────────────────────
  {
    name: "Ashwagandha KSM-66",
    slug: "ashwagandha-ksm66",
    description: "Clinically validated KSM-66 ashwagandha root extract — the gold-standard adaptogen for cortisol balance, sustained energy and resilience under stress.",
    price: 1290, stock: 120, image: null, images: [],
    manufacturer: "GreenRoots Botanicals", dosage: "2 capsules daily", form: "Capsule",
    prescriptionRequired: false, isActive: true, isFeatured: true,
    keyBadges: ["KSM-66 Certified", "Cortisol Balance", "Clinical-Grade"],
    uses: ["Stress & anxiety relief", "Cortisol regulation", "Energy & stamina", "Sleep quality", "Thyroid support"],
    ingredients: "Ashwagandha Root Extract (KSM-66) 600 mg, Black Pepper Extract (BioPerine) 5 mg",
    sideEffects: ["Mild GI upset if taken on empty stomach", "Drowsiness at high doses (rare)"],
    storage: "Store in a cool, dry place below 25 °C. Protect from moisture and direct light.",
    dosageAdults: "2 capsules daily — 1 morning, 1 night with meals",
    dosageChildren: "Not recommended under 18 years",
    dosageMaxDaily: "Maximum 2 capsules (1 200 mg) per 24 hours",
    dosageNotes: "Take consistently for 8 weeks for best results.",
    categorySlug: "adaptogens",
  },
  {
    name: "Rhodiola Rosea Extract",
    slug: "rhodiola-rosea-extract",
    description: "Siberian root adaptogen prized for mental clarity, physical endurance and mood stability. Standardised to 3 % rosavins + 1 % salidroside.",
    price: 1490, stock: 85, image: null, images: [],
    manufacturer: "Wild Harvest Co.", dosage: "1 capsule daily", form: "Capsule",
    prescriptionRequired: false, isActive: true, isFeatured: true,
    keyBadges: ["Standardised Extract", "Mental Clarity", "Endurance"],
    uses: ["Mental fatigue", "Cognitive performance", "Physical endurance", "Mood support", "High-altitude adaptation"],
    ingredients: "Rhodiola Rosea Root Extract 500 mg (3 % Rosavins, 1 % Salidroside)",
    sideEffects: ["Mild insomnia if taken late evening", "Dizziness (rare)"],
    storage: "Store below 25 °C away from heat and direct sunlight.",
    dosageAdults: "1 capsule in the morning on an empty stomach, 30 min before breakfast",
    dosageChildren: "Not recommended under 18 years",
    dosageMaxDaily: "Maximum 2 capsules per 24 hours",
    dosageNotes: "Rhodiola has mild energising properties — avoid late-evening use.",
    categorySlug: "adaptogens",
  },
  {
    name: "Holy Basil (Tulsi) Complex",
    slug: "holy-basil-tulsi-complex",
    description: "Sacred Indian herb — Ocimum sanctum — revered for 3 000 years as an adaptogen, immune tonic and mood elevator. Triple-leaf extract blend.",
    price: 890, stock: 150, image: null, images: [],
    manufacturer: "Terra Herbals", dosage: "2 capsules daily", form: "Capsule",
    prescriptionRequired: false, isActive: true, isFeatured: false,
    keyBadges: ["Triple-Leaf Blend", "Ayurvedic", "Adaptogen"],
    uses: ["Stress relief", "Immune support", "Blood sugar balance", "Anti-inflammatory", "Respiratory health"],
    ingredients: "Tulsi Leaf Extract Blend 500 mg (Vana Tulsi, Krishna Tulsi, Rama Tulsi)",
    sideEffects: ["May thin blood — consult if on anticoagulants", "Mild hypoglycaemia at very high doses"],
    storage: "Store in a cool, dry place below 25 °C.",
    dosageAdults: "2 capsules daily with meals",
    dosageChildren: "Consult a herbalist before use in children",
    dosageMaxDaily: "Maximum 2 capsules per 24 hours",
    dosageNotes: "Safe for long-term daily use.",
    categorySlug: "adaptogens",
  },
  {
    name: "Maca Root Gold",
    slug: "maca-root-gold",
    description: "Peruvian superfood root — gelatinised for superior bioavailability. Supports hormonal balance, libido and sustained energy without stimulants.",
    price: 1190, stock: 65, image: null, images: [],
    manufacturer: "The Herb Garden", dosage: "1 tsp (3 g) daily", form: "Powder",
    prescriptionRequired: false, isActive: true, isFeatured: false,
    keyBadges: ["Gelatinised", "Hormone Balance", "Energy"],
    uses: ["Hormonal balance", "Energy & stamina", "Libido support", "Menopause symptoms", "Athletic performance"],
    ingredients: "Gelatinised Maca Root Powder (Lepidium meyenii) 3 g per serving",
    sideEffects: ["May cause insomnia in large quantities", "Mild GI discomfort (rare)"],
    storage: "Store in an airtight container in a cool, dry place.",
    dosageAdults: "1 tsp mixed into smoothies, warm milk or yoghurt daily",
    dosageChildren: "Not recommended under 18 years",
    dosageMaxDaily: "Maximum 3 tsp (9 g) per 24 hours",
    dosageNotes: "Start with ½ tsp if new to maca.",
    categorySlug: "adaptogens",
  },

  // ── SKIN & HAIR ──────────────────────────────────────────────────────────────
  {
    name: "Rosehip Seed Oil",
    slug: "rosehip-seed-oil",
    description: "Cold-pressed Rosa canina seed oil — nature's retinol. Rich in trans-retinoic acid, vitamin C and essential fatty acids for scar healing, anti-aging and radiance.",
    price: 1850, stock: 70, image: null, images: [],
    manufacturer: "Forest & Field", dosage: "3–5 drops twice daily", form: "Oil",
    prescriptionRequired: false, isActive: true, isFeatured: true,
    keyBadges: ["Cold-Pressed", "Vitamin C Rich", "Anti-Aging"],
    uses: ["Scar healing", "Anti-aging", "Hyperpigmentation", "Dry skin", "Stretch marks"],
    ingredients: "100 % Cold-Pressed Rosa Canina Seed Oil",
    sideEffects: ["May clog pores in acne-prone skin — patch test first", "Mild photosensitivity — use SPF in daytime"],
    storage: "Refrigerate after opening. Use within 6 months.",
    dosageAdults: "3–5 drops massaged into clean, damp skin morning and/or night",
    dosageChildren: "Safe for children over 2 years",
    dosageMaxDaily: null,
    dosageNotes: "A little goes a long way. Patch-test before full facial use.",
    categorySlug: "skin-hair",
  },
  {
    name: "Brahmi Hair Growth Oil",
    slug: "brahmi-hair-growth-oil",
    description: "Traditional Ayurvedic scalp tonic. Bacopa monnieri + Bhringraj infused in cold-pressed sesame oil to nourish follicles, reduce hair fall and stimulate growth.",
    price: 950, stock: 110, image: null, images: [],
    manufacturer: "Terra Herbals", dosage: "Massage into scalp 2–3 ×/week", form: "Oil",
    prescriptionRequired: false, isActive: true, isFeatured: false,
    keyBadges: ["Ayurvedic", "Follicle Nourishing", "Bhringraj + Brahmi"],
    uses: ["Hair fall reduction", "Scalp nourishment", "Hair thickness", "Dandruff", "Premature greying"],
    ingredients: "Cold-Pressed Sesame Oil infused with Brahmi, Bhringraj, Amla, Hibiscus",
    sideEffects: ["None known — patch-test for scalp sensitivity"],
    storage: "Store below 30 °C. Warm gently if solidified.",
    dosageAdults: "Warm slightly, massage into scalp 5–10 min, leave ≥ 1 hour, wash out",
    dosageChildren: "Safe for all ages",
    dosageMaxDaily: null,
    dosageNotes: "For best results use 3× per week for 8–12 weeks.",
    categorySlug: "skin-hair",
  },
  {
    name: "Neem & Turmeric Face Capsules",
    slug: "neem-turmeric-face-capsules",
    description: "Internal skin purifier. Neem leaf + organic turmeric work from within to clear acne, balance sebum and reduce inflammation for visibly clearer skin.",
    price: 790, stock: 130, image: null, images: [],
    manufacturer: "GreenRoots Botanicals", dosage: "2 capsules daily", form: "Capsule",
    prescriptionRequired: false, isActive: true, isFeatured: true,
    keyBadges: ["Blood Purifier", "Anti-Acne", "Anti-Inflammatory"],
    uses: ["Acne & breakouts", "Oily skin", "Skin inflammation", "Blood purification", "Eczema support"],
    ingredients: "Neem Leaf Extract 250 mg, Turmeric Root Extract 250 mg (95 % Curcuminoids)",
    sideEffects: ["Mild GI upset if taken on empty stomach", "Avoid during pregnancy"],
    storage: "Store in a cool, dry place below 25 °C.",
    dosageAdults: "2 capsules daily after meals",
    dosageChildren: "Consult a healthcare provider before use in children",
    dosageMaxDaily: "Maximum 2 capsules per 24 hours",
    dosageNotes: "Allow 4–6 weeks for visible improvement. Drink plenty of water.",
    categorySlug: "skin-hair",
  },
  {
    name: "Sea Buckthorn Berry Extract",
    slug: "sea-buckthorn-berry-extract",
    description: "Rare Himalayan superfruit with the highest known natural vitamin C content. Supports collagen synthesis, deep hydration and UV damage repair.",
    price: 1650, stock: 45, image: null, images: [],
    manufacturer: "Wild Harvest Co.", dosage: "1 capsule daily", form: "Capsule",
    prescriptionRequired: false, isActive: true, isFeatured: false,
    keyBadges: ["Highest Vitamin C", "Collagen Support", "Himalayan"],
    uses: ["Skin hydration", "Collagen production", "UV repair", "Anti-aging", "Dry eye relief"],
    ingredients: "Sea Buckthorn Berry Extract 500 mg (standardised 10 % flavonoids)",
    sideEffects: ["Mild yellow skin tone at very high doses (harmless, reversible)"],
    storage: "Store in a cool, dry place below 25 °C. Protect from light.",
    dosageAdults: "1 capsule daily with a meal",
    dosageChildren: "Not recommended under 12 years",
    dosageMaxDaily: "Maximum 1 capsule per 24 hours",
    dosageNotes: "Allow 8–12 weeks of consistent use for full skin benefit.",
    categorySlug: "skin-hair",
  },

  // ── DIGESTIVE ────────────────────────────────────────────────────────────────
  {
    name: "Triphala Churna",
    slug: "triphala-churna",
    description: "Ancient Ayurvedic tri-fruit formula — Amalaki, Bibhitaki and Haritaki. Gentle daily bowel tonic, digestive rejuvenator and colonic cleanser.",
    price: 650, stock: 180, image: null, images: [],
    manufacturer: "Terra Herbals", dosage: "1 tsp with warm water before bed", form: "Powder",
    prescriptionRequired: false, isActive: true, isFeatured: true,
    keyBadges: ["Tri-Fruit Formula", "Bowel Tonic", "Ayurvedic Classic"],
    uses: ["Constipation", "Digestive regularity", "Gut detox", "Colon health", "Antioxidant support"],
    ingredients: "Amalaki 33 %, Bibhitaki 33 %, Haritaki 33 % (dried fruit powder)",
    sideEffects: ["Loose stools initially — reduce dose if needed", "Avoid high doses in pregnancy"],
    storage: "Store in an airtight container in a cool, dry place away from moisture.",
    dosageAdults: "½–1 tsp mixed with warm water at bedtime",
    dosageChildren: "Consult a herbalist — half adult dose for ages 6–12",
    dosageMaxDaily: "Maximum 2 tsp per 24 hours",
    dosageNotes: "Start with ½ tsp to gauge digestive response. Add honey if too astringent.",
    categorySlug: "digestive",
  },
  {
    name: "Ginger & Fennel Digestive Capsules",
    slug: "ginger-fennel-digestive",
    description: "Warming carminative blend to banish bloating, gas and indigestion. Fresh-ground ginger root, fennel seed and cardamom in a synergistic digestive formula.",
    price: 720, stock: 160, image: null, images: [],
    manufacturer: "The Herb Garden", dosage: "2 capsules with meals", form: "Capsule",
    prescriptionRequired: false, isActive: true, isFeatured: false,
    keyBadges: ["Carminative Blend", "Bloating Relief", "After-Meal"],
    uses: ["Bloating & gas", "Indigestion", "Nausea", "Poor appetite", "IBS support"],
    ingredients: "Ginger Root 250 mg, Fennel Seed 150 mg, Cardamom 50 mg, Peppermint Leaf 50 mg",
    sideEffects: ["Heartburn in sensitive individuals at high doses"],
    storage: "Store below 25 °C in a dry place.",
    dosageAdults: "2 capsules with or just after main meals, up to 3× daily",
    dosageChildren: "1 capsule for ages 6–12",
    dosageMaxDaily: "Maximum 6 capsules per 24 hours",
    dosageNotes: "Particularly effective for post-meal bloating.",
    categorySlug: "digestive",
  },
  {
    name: "Slippery Elm Gut Powder",
    slug: "slippery-elm-gut-powder",
    description: "Demulcent mucilaginous bark that coats and soothes the gut lining. A cornerstone herb for leaky gut, IBS and acid reflux.",
    price: 980, stock: 90, image: null, images: [],
    manufacturer: "Forest & Field", dosage: "1 tbsp in water before meals", form: "Powder",
    prescriptionRequired: false, isActive: true, isFeatured: false,
    keyBadges: ["Gut Lining Support", "IBS Friendly", "Mucilaginous"],
    uses: ["Leaky gut", "IBS", "Acid reflux", "Ulcerative colitis", "Crohn's support"],
    ingredients: "100 % Organic Slippery Elm Bark Powder (Ulmus rubra)",
    sideEffects: ["May delay absorption of other medications — take separately", "Avoid in late pregnancy"],
    storage: "Store in an airtight container below 25 °C.",
    dosageAdults: "1 tbsp stirred into warm water, 30 min before meals",
    dosageChildren: "1 tsp for ages 6–12",
    dosageMaxDaily: "Maximum 3 tbsp per 24 hours",
    dosageNotes: "Take 30 min before other supplements due to mucilaginous binding.",
    categorySlug: "digestive",
  },
  {
    name: "Dandelion Root Liver Tonic",
    slug: "dandelion-root-liver-tonic",
    description: "Roasted dandelion root — a gentle liver stimulant and natural prebiotic. Encourages bile production, aids fat digestion and feeds beneficial gut flora.",
    price: 840, stock: 75, image: null, images: [],
    manufacturer: "Wild Harvest Co.", dosage: "1 capsule twice daily", form: "Capsule",
    prescriptionRequired: false, isActive: true, isFeatured: false,
    keyBadges: ["Liver Support", "Prebiotic", "Detox"],
    uses: ["Liver detox", "Bile production", "Fat digestion", "Gut flora support", "Mild diuretic"],
    ingredients: "Roasted Dandelion Root Extract 400 mg (5:1 concentrate)",
    sideEffects: ["Avoid if allergic to ragweed family", "May increase urination"],
    storage: "Store below 25 °C in a dry place.",
    dosageAdults: "1 capsule twice daily with meals",
    dosageChildren: "Consult a herbalist before use in children",
    dosageMaxDaily: "Maximum 2 capsules per 24 hours",
    dosageNotes: "Best taken consistently over 4+ weeks.",
    categorySlug: "digestive",
  },

  // ── VITAMINS & MINERALS ──────────────────────────────────────────────────────
  {
    name: "Moringa Leaf Powder",
    slug: "moringa-leaf-powder",
    description: "The 'miracle tree' — more vitamin C than oranges, more iron than spinach, more calcium than milk. Complete plant protein with all essential amino acids.",
    price: 890, stock: 200, image: null, images: [],
    manufacturer: "GreenRoots Botanicals", dosage: "1 tsp daily", form: "Powder",
    prescriptionRequired: false, isActive: true, isFeatured: true,
    keyBadges: ["Complete Protein", "Iron + Calcium", "Superfood"],
    uses: ["Iron deficiency", "Plant protein", "Energy & vitality", "Blood sugar balance", "Anti-inflammatory"],
    ingredients: "100 % Organic Moringa Oleifera Leaf Powder",
    sideEffects: ["May lower blood sugar — monitor if diabetic", "Mild laxative at high doses"],
    storage: "Store in an airtight container away from light and moisture.",
    dosageAdults: "1–2 tsp daily mixed into smoothies, soups or warm water",
    dosageChildren: "1 tsp for ages 4+, added to food",
    dosageMaxDaily: "Maximum 3 tsp per 24 hours",
    dosageNotes: "Best added to cold foods — heat above 40 °C degrades some nutrients.",
    categorySlug: "vitamins-minerals",
  },
  {
    name: "Organic Spirulina Tablets",
    slug: "organic-spirulina-tablets",
    description: "Freshwater blue-green algae — 60–70 % complete protein, B12 precursors, iron, zinc and powerful phycocyanin antioxidants.",
    price: 1090, stock: 150, image: null, images: [],
    manufacturer: "Forest & Field", dosage: "6 tablets daily", form: "Tablet",
    prescriptionRequired: false, isActive: true, isFeatured: false,
    keyBadges: ["60 % Protein", "B12 Precursor", "Phycocyanin"],
    uses: ["Protein supplement", "Iron support", "Antioxidant protection", "Energy", "Detoxification"],
    ingredients: "Organic Spirulina (Arthrospira platensis) 500 mg per tablet",
    sideEffects: ["Strong algae taste / odour", "Mild GI upset initially"],
    storage: "Store in a cool, dry place away from light. Refrigerate after opening.",
    dosageAdults: "6 tablets daily — 3 morning, 3 at lunch",
    dosageChildren: "3 tablets daily for ages 6+",
    dosageMaxDaily: "Maximum 10 tablets per 24 hours",
    dosageNotes: "Build up slowly — start with 2 tablets and increase over 1 week.",
    categorySlug: "vitamins-minerals",
  },
  {
    name: "Amla Berry Vitamin C Complex",
    slug: "amla-berry-vitamin-c",
    description: "Indian gooseberry — nature's most bioavailable vitamin C, 20× more potent than synthetic. Tannin-bound for slow release and superior absorption.",
    price: 990, stock: 120, image: null, images: [],
    manufacturer: "Terra Herbals", dosage: "2 capsules daily", form: "Capsule",
    prescriptionRequired: false, isActive: true, isFeatured: true,
    keyBadges: ["Natural Vitamin C", "20× More Potent", "Slow Release"],
    uses: ["Vitamin C supplementation", "Immune support", "Collagen synthesis", "Iron absorption", "Antioxidant protection"],
    ingredients: "Amla Berry Extract 500 mg (45 % Vitamin C equivalent)",
    sideEffects: ["Very high doses may cause loose stools", "May interact with blood thinners"],
    storage: "Store below 25 °C in a dry place away from light.",
    dosageAdults: "2 capsules daily with meals",
    dosageChildren: "1 capsule daily for ages 6+",
    dosageMaxDaily: "Maximum 4 capsules per 24 hours",
    dosageNotes: "Take with iron-rich meals to boost non-haem iron absorption.",
    categorySlug: "vitamins-minerals",
  },
  {
    name: "Stinging Nettle Leaf Capsules",
    slug: "stinging-nettle-leaf",
    description: "Iron-rich European folk herb prized for energy, bone mineralisation and seasonal allergy management. Wild-harvested, freeze-dried for maximum potency.",
    price: 750, stock: 95, image: null, images: [],
    manufacturer: "Wild Harvest Co.", dosage: "2 capsules twice daily", form: "Capsule",
    prescriptionRequired: false, isActive: true, isFeatured: false,
    keyBadges: ["Wild-Harvested", "Iron Rich", "Allergy Support"],
    uses: ["Iron deficiency", "Bone health", "Seasonal allergies", "Prostate support", "Anti-inflammatory"],
    ingredients: "Freeze-Dried Stinging Nettle Leaf 400 mg (Urtica dioica)",
    sideEffects: ["Mild diuretic effect", "May lower blood pressure", "Avoid with blood thinners"],
    storage: "Store in a cool, dry place below 25 °C.",
    dosageAdults: "2 capsules twice daily with meals",
    dosageChildren: "Consult a herbalist before use in children",
    dosageMaxDaily: "Maximum 4 capsules per 24 hours",
    dosageNotes: "For allergy support, begin 4–6 weeks before allergy season.",
    categorySlug: "vitamins-minerals",
  },

  // ── IMMUNITY BOOST ───────────────────────────────────────────────────────────
  {
    name: "Elderberry & Zinc Syrup",
    slug: "elderberry-zinc-syrup",
    description: "Sambucus nigra berry syrup with raw honey and zinc. Clinically studied to shorten cold and flu duration by up to 56 %.",
    price: 1450, stock: 100, image: null, images: [],
    manufacturer: "The Herb Garden", dosage: "15 ml daily (prevention); 15 ml 4× daily (illness)", form: "Syrup",
    prescriptionRequired: false, isActive: true, isFeatured: true,
    keyBadges: ["Clinically Studied", "Antiviral", "Raw Honey + Zinc"],
    uses: ["Cold & flu prevention", "Flu duration reduction", "Antiviral support", "Immune modulation", "Antioxidant"],
    ingredients: "Elderberry Extract 3 000 mg, Raw Honey, Zinc 5 mg, Vitamin C 100 mg per 15 ml",
    sideEffects: ["Not for infants under 1 year (raw honey)", "High doses may overstimulate immune system"],
    storage: "Refrigerate after opening. Use within 60 days.",
    dosageAdults: "15 ml (1 tbsp) daily for prevention; 15 ml 4× daily during active illness",
    dosageChildren: "7.5 ml daily for ages 1–12; not suitable under 1 year",
    dosageMaxDaily: "Maximum 60 ml per 24 hours during illness",
    dosageNotes: "Shake well before use.",
    categorySlug: "immunity-boost",
  },
  {
    name: "Echinacea & Cat's Claw Complex",
    slug: "echinacea-cats-claw-complex",
    description: "Two of the world's most clinically-validated immune herbs. Echinacea purpurea activates innate immunity; Cat's Claw modulates inflammation and viral defence.",
    price: 1290, stock: 85, image: null, images: [],
    manufacturer: "GreenRoots Botanicals", dosage: "2 capsules at first sign of illness", form: "Capsule",
    prescriptionRequired: false, isActive: true, isFeatured: false,
    keyBadges: ["Dual Immune Herbs", "Clinically Validated", "Antiviral"],
    uses: ["Cold prevention", "Immune activation", "Antiviral support", "Inflammation reduction", "Respiratory health"],
    ingredients: "Echinacea purpurea Root Extract 300 mg (4 % alkylamides), Cat's Claw Bark Extract 200 mg (3 % alkaloids)",
    sideEffects: ["Not for autoimmune conditions", "Rare allergic reaction", "Avoid in organ transplant patients"],
    storage: "Store below 25 °C in a dry place.",
    dosageAdults: "2 capsules at illness onset, then 2 every 4 h for 2 days, then 1 twice daily for 5 days",
    dosageChildren: "Consult a healthcare provider before use",
    dosageMaxDaily: "Maximum 8 capsules per 24 hours in acute phase",
    dosageNotes: "Not for long-term daily use — short courses up to 10 days.",
    categorySlug: "immunity-boost",
  },
  {
    name: "Turmeric Golden Blend",
    slug: "turmeric-golden-blend",
    description: "A potent anti-inflammatory tonic. Organic turmeric standardised to 95 % curcuminoids, paired with BioPerine for 2 000 % improved absorption.",
    price: 1090, stock: 140, image: null, images: [],
    manufacturer: "Forest & Field", dosage: "2 capsules daily", form: "Capsule",
    prescriptionRequired: false, isActive: true, isFeatured: true,
    keyBadges: ["95 % Curcuminoids", "BioPerine Enhanced", "Anti-Inflammatory"],
    uses: ["Chronic inflammation", "Joint pain", "Immunity", "Antioxidant protection", "Gut inflammation"],
    ingredients: "Turmeric Root Extract 500 mg (95 % Curcuminoids), Boswellia Resin 200 mg, Black Pepper Extract (BioPerine) 5 mg",
    sideEffects: ["May thin blood at very high doses", "Avoid before surgery", "Mild GI upset on empty stomach"],
    storage: "Store below 25 °C in a dry place away from light.",
    dosageAdults: "2 capsules daily with a fatty meal for best absorption",
    dosageChildren: "Not recommended under 18 years without medical advice",
    dosageMaxDaily: "Maximum 2 capsules per 24 hours",
    dosageNotes: "Curcumin is fat-soluble — take with a meal containing healthy fats.",
    categorySlug: "immunity-boost",
  },
  {
    name: "Reishi Mushroom Dual Extract",
    slug: "reishi-mushroom-dual-extract",
    description: "The 'mushroom of immortality' — dual-extracted Ganoderma lucidum with hot-water (beta-glucans) and alcohol (triterpenoids) fractions.",
    price: 1890, stock: 55, image: null, images: [],
    manufacturer: "Wild Harvest Co.", dosage: "1 capsule twice daily", form: "Capsule",
    prescriptionRequired: false, isActive: true, isFeatured: false,
    keyBadges: ["Dual-Extracted", "Beta-Glucans", "Triterpenoids"],
    uses: ["Immune modulation", "Liver support", "Anti-tumor activity", "Stress reduction", "Heart health"],
    ingredients: "Reishi Mushroom Dual Extract 500 mg (30 % polysaccharides, 5 % triterpenoids)",
    sideEffects: ["Avoid in first trimester of pregnancy", "May interact with blood thinners", "Mild dizziness initially"],
    storage: "Store in a cool, dry place below 25 °C.",
    dosageAdults: "1 capsule twice daily — morning and evening with meals",
    dosageChildren: "Not recommended under 18 years",
    dosageMaxDaily: "Maximum 2 capsules per 24 hours",
    dosageNotes: "Dual-extraction gives both water-soluble and fat-soluble fractions.",
    categorySlug: "immunity-boost",
  },

  // ── SLEEP & CALM ─────────────────────────────────────────────────────────────
  {
    name: "Valerian & Hops Sleep Formula",
    slug: "valerian-hops-sleep-formula",
    description: "Time-tested European sleep duo. Valerian root raises GABA levels for natural sedation; hops strobile enhances sleep onset. Non-habit-forming.",
    price: 1190, stock: 100, image: null, images: [],
    manufacturer: "Terra Herbals", dosage: "2 capsules 30–60 min before bed", form: "Capsule",
    prescriptionRequired: false, isActive: true, isFeatured: true,
    keyBadges: ["GABA Support", "Non-Habit Forming", "European Classic"],
    uses: ["Insomnia", "Sleep onset", "Restless sleep", "Anxiety-related sleeplessness", "Jet lag"],
    ingredients: "Valerian Root Extract 300 mg (0.8 % Valerenic Acid), Hops Strobile Extract 100 mg",
    sideEffects: ["Vivid dreams (occasional)", "Morning grogginess at high doses", "Do not combine with sedatives"],
    storage: "Store below 25 °C in a dry place away from light.",
    dosageAdults: "2 capsules 30–60 min before bedtime",
    dosageChildren: "Not recommended under 18 years",
    dosageMaxDaily: "Maximum 3 capsules per 24 hours",
    dosageNotes: "Benefits often strengthen over the first 2 weeks.",
    categorySlug: "sleep-calm",
  },
  {
    name: "Chamomile & Lavender Calm Capsules",
    slug: "chamomile-lavender-calm",
    description: "Apothecary-grade floral calm blend. Whole-flower Roman chamomile with provençal lavender — the equivalent of 3 cups of therapeutic chamomile tea, concentrated.",
    price: 890, stock: 130, image: null, images: [],
    manufacturer: "The Herb Garden", dosage: "2 capsules in the evening", form: "Capsule",
    prescriptionRequired: false, isActive: true, isFeatured: false,
    keyBadges: ["Whole Flower", "Apothecary Grade", "Anxiety Relief"],
    uses: ["Anxiety", "Evening relaxation", "Mild insomnia", "Nervous digestion", "Muscle tension"],
    ingredients: "Roman Chamomile Flower Extract 300 mg (1.2 % Apigenin), Lavender Flower Extract 100 mg, Lemon Balm 100 mg",
    sideEffects: ["Avoid if allergic to ragweed / daisy family", "May cause drowsiness — do not drive after taking"],
    storage: "Store below 25 °C in a dry place.",
    dosageAdults: "2 capsules in the evening, 1–2 hours before bed",
    dosageChildren: "Consult a herbalist — gentle for children over 6 in reduced doses",
    dosageMaxDaily: "Maximum 4 capsules per 24 hours",
    dosageNotes: "Avoid screen time after taking for best effect.",
    categorySlug: "sleep-calm",
  },
  {
    name: "Passionflower & Lemon Balm",
    slug: "passionflower-lemon-balm",
    description: "Gentle anxiolytic for the modern nervous system. Passionflower calms racing thoughts; Lemon Balm reduces cortisol and promotes calm focus — without sedation.",
    price: 1050, stock: 75, image: null, images: [],
    manufacturer: "Forest & Field", dosage: "2 capsules as needed or at bedtime", form: "Capsule",
    prescriptionRequired: false, isActive: true, isFeatured: true,
    keyBadges: ["Anxiolytic", "Non-Sedating", "Cortisol Reducer"],
    uses: ["Anxiety", "Nervous tension", "Racing thoughts", "Stress-induced insomnia", "Exam stress"],
    ingredients: "Passionflower Aerial Extract 300 mg (3.5 % Isovitexin), Lemon Balm Leaf Extract 200 mg (3 % Rosmarinic Acid)",
    sideEffects: ["May cause drowsiness in sensitive individuals", "Avoid with sedative medications", "Do not take during pregnancy"],
    storage: "Store below 25 °C away from heat and light.",
    dosageAdults: "2 capsules as needed for anxiety, or 2 at bedtime for sleep",
    dosageChildren: "Not recommended under 18 years",
    dosageMaxDaily: "Maximum 4 capsules per 24 hours",
    dosageNotes: "Non-habit-forming and safe for regular use.",
    categorySlug: "sleep-calm",
  },
  {
    name: "Magnesium Glycinate & Ashwagandha Night",
    slug: "magnesium-glycinate-ashwagandha-night",
    description: "The most bioavailable form of magnesium paired with evening-dose ashwagandha. Replenishes mineral deficiency while calming the nervous system for deep, restorative sleep.",
    price: 1350, stock: 60, image: null, images: [],
    manufacturer: "GreenRoots Botanicals", dosage: "2 capsules before bed", form: "Capsule",
    prescriptionRequired: false, isActive: true, isFeatured: false,
    keyBadges: ["Magnesium Glycinate", "Sleep Support", "Muscle Relaxant"],
    uses: ["Magnesium deficiency", "Deep sleep", "Muscle cramps at night", "Restless legs", "Nervous system calm"],
    ingredients: "Magnesium Glycinate 300 mg (elemental Mg), Ashwagandha Root Extract 300 mg (KSM-66)",
    sideEffects: ["Loose stools at high magnesium doses", "Avoid with certain antibiotics — take 2 h apart"],
    storage: "Store in a cool, dry place below 25 °C.",
    dosageAdults: "2 capsules 30–60 min before bed",
    dosageChildren: "Not recommended under 18 years",
    dosageMaxDaily: "Maximum 2 capsules per 24 hours",
    dosageNotes: "Magnesium glycinate is the gentlest form — least likely to cause GI upset.",
    categorySlug: "sleep-calm",
  },
];

// ── Main ──────────────────────────────────────────────────────────────────────
async function seedAll() {
  console.log("🌿 GreenRoots — full database seed starting...\n");

  // ─── Users ────────────────────────────────────────────────────────────────
  console.log("👥 Upserting users...");
  for (const user of users) {
    await prisma.user.upsert({
      where:  { email: user.email },
      create: user,
      update: { role: user.role, status: user.status, emailVerified: true },
    });
    console.log(`   ✓ ${user.role.padEnd(8)} — ${user.email}`);
  }

  // Resolve the seller's actual DB id (upsert may return different id if email already existed)
  const dbSeller = await prisma.user.findUnique({ where: { email: "seller@greenroots.app" } });
  const sellerId = dbSeller!.id;
  console.log(`\n👤 Using seller ID: ${sellerId}`);

  // ─── Categories ───────────────────────────────────────────────────────────
  console.log("\n📂 Upserting categories...");
  const categoryMap = new Map<string, string>();
  for (const cat of categories) {
    const result = await prisma.category.upsert({
      where:  { slug: cat.slug },
      create: cat,
      update: {},
    });
    categoryMap.set(cat.slug, result.id);
    console.log(`   ✓ ${cat.name}`);
  }

  // ─── Products ─────────────────────────────────────────────────────────────
  console.log("\n🌱 Upserting products...");
  let created = 0, skipped = 0;

  for (const product of products) {
    const categoryId = categoryMap.get(product.categorySlug);
    if (!categoryId) {
      console.warn(`   ⚠  No category for slug "${product.categorySlug}" — skipping ${product.name}`);
      skipped++;
      continue;
    }

    const { categorySlug, ...productData } = product;

    await prisma.medicine.upsert({
      where:  { slug: product.slug },
      create: { ...productData, categoryId, sellerId },
      update: {},
    });

    console.log(`   ✓ ${product.name}`);
    created++;
  }

  console.log(`\n✅ Seed complete!`);
  console.log(`   • Users:    ${users.length} upserted`);
  console.log(`   • Categories: ${categories.length} upserted`);
  console.log(`   • Products:  ${created} upserted, ${skipped} skipped`);
  console.log("\n🍃 GreenRoots database is ready.\n");

  // Print user IDs for reference
  const admin    = await prisma.user.findUnique({ where: { email: "admin@greenroots.app"    } });
  const seller   = await prisma.user.findUnique({ where: { email: "seller@greenroots.app"   } });
  const customer = await prisma.user.findUnique({ where: { email: "customer@greenroots.app" } });

  console.log("📋 User IDs (save these for testing):");
  console.log(`   Admin    : ${admin?.id}`);
  console.log(`   Seller   : ${seller?.id}`);
  console.log(`   Customer : ${customer?.id}`);
}

seedAll()
  .catch((e) => { console.error("❌ Seed failed:", e); process.exit(1); })
  .finally(() => prisma.$disconnect());
