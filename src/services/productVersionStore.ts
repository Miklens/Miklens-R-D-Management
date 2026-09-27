import { MainProduct, ProductVersion, ProductCategory, ProductVariantType } from '../types/productVersionTypes';
import { ExternalFieldTrial } from '../types/trialIntegrationTypes';
import { ExternalFormulation, getSyncedTrials, getSyncedFormulations } from './trialManagerSync';
import { collection, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../config/firebase';

const MAIN_PRODUCTS_KEY = 'miklens_main_products_v2';
const PRODUCT_VERSIONS_KEY = 'miklens_product_versions_v2';

// ── Initial Seed Data Grounded in Real Miklens Trial Manager Data ───────────────
const INITIAL_MAIN_PRODUCTS: MainProduct[] = [
  {
    id: 'prod-goweed-ultra',
    name: 'Goweed Ultra',
    code: 'PRD-GWU',
    category: 'herbicide',
    variantType: 'IPM Herbicide',
    description: 'Integrated weed management herbicide line combining botanical desiccants and synergized surfactant matrix for rapid burn-down and extended residual control.',
    targetCrops: ['Cotton', 'Sugarcane', 'Tea', 'Maize', 'Non-Crop Land'],
    targetWeedsOrPests: ['Bermuda Grass (Cynodon dactylon)', 'Goatweed (Ageratum conyzoides)', 'Spreading Dayflower (Commelina diffusa)', 'Horse Purslane'],
    commercialStatus: 'Active Commercial',
    activeVersionTag: 'V2.0',
    totalVersionsCount: 5,
    averageEfficacy: 82,
    createdAt: '2026-06-15T09:00:00.000Z',
    updatedAt: '2026-09-23T15:10:00.000Z'
  },
  {
    id: 'prod-microweed',
    name: 'Microweed',
    code: 'PRD-MCR',
    category: 'herbicide',
    variantType: 'Microweed / Microbial Herbicide',
    description: 'Targeted microbial-based bio-herbicide formulation with extended 19-day residual weed seed germination suppression.',
    targetCrops: ['Cereals', 'Pulses', 'Orchards'],
    targetWeedsOrPests: ['12 Weed Species Complex', 'Parthenium hysterophorus', 'Echinochloa'],
    commercialStatus: 'Active Commercial',
    activeVersionTag: 'V1.0',
    totalVersionsCount: 2,
    averageEfficacy: 72,
    createdAt: '2026-07-01T10:00:00.000Z',
    updatedAt: '2026-09-20T14:30:00.000Z'
  },
  {
    id: 'prod-weedrop',
    name: 'WeeDrop',
    code: 'PRD-WDR',
    category: 'herbicide',
    variantType: 'Organic Herbicide',
    description: '100% Organic certified fast-acting contact bio-herbicide. Formulated with natural botanical acids, vinegar, and organic mineral salts with zero synthetic residue.',
    targetCrops: ['Organic Vegetable Farms', 'Horticulture', 'Tea Plantations', 'Urban Gardens'],
    targetWeedsOrPests: ['Broadleaf Weeds', 'Annual Grasses', 'Moss', 'Liverworts'],
    commercialStatus: 'Active Commercial',
    activeVersionTag: 'V2.0',
    totalVersionsCount: 2,
    averageEfficacy: 98,
    createdAt: '2026-05-10T11:00:00.000Z',
    updatedAt: '2026-09-22T16:00:00.000Z'
  },
  {
    id: 'prod-gmea2',
    name: 'GMEA-2',
    code: 'PRD-GMEA',
    category: 'herbicide',
    variantType: 'Inorganic Herbicide',
    description: 'Specialty inorganic contact desiccant for ultra-rapid target foliage desiccation and non-selective perimeter maintenance.',
    targetCrops: ['Industrial Sites', 'Railway Tracks', 'Pre-Planting Fallow'],
    targetWeedsOrPests: ['Hardy Grassy Weeds', 'Perennial Woody Shrubs'],
    commercialStatus: 'Pilot / Field Testing',
    activeVersionTag: 'V1.0',
    totalVersionsCount: 1,
    averageEfficacy: 98,
    createdAt: '2026-08-01T08:00:00.000Z',
    updatedAt: '2026-09-18T10:00:00.000Z'
  },
  {
    id: 'prod-microshield',
    name: 'MicroShield Bio',
    code: 'PRD-MSB',
    category: 'fungicide',
    variantType: 'Bio-fungicide',
    description: 'Multi-strain biological fungicide with active hyperparasitism against fungal phytopathogens.',
    targetCrops: ['Tomato', 'Grapes', 'Chilli', 'Pomegranate'],
    targetWeedsOrPests: ['Powdery Mildew', 'Downy Mildew', 'Fusarium Wilt', 'Rhizoctonia'],
    commercialStatus: 'Under Registration',
    activeVersionTag: 'V2.0',
    totalVersionsCount: 2,
    averageEfficacy: 86,
    createdAt: '2026-06-20T10:00:00.000Z',
    updatedAt: '2026-09-15T12:00:00.000Z'
  },
  {
    id: 'prod-actigrowth',
    name: 'ActiGrowth Foliar',
    code: 'PRD-AGF',
    category: 'nutrition',
    variantType: 'Foliar Nutrition / Biochelates',
    description: 'Enzymatically chelated micronutrient and bio-activator foliar complex promoting rapid chloroplastic recovery and stress mitigation.',
    targetCrops: ['Cotton', 'Soybean', 'Paddy', 'Vegetables'],
    targetWeedsOrPests: ['Micronutrient Deficiencies (Zn, Fe, Mn, B)'],
    commercialStatus: 'Active Commercial',
    activeVersionTag: 'V1.0',
    totalVersionsCount: 1,
    averageEfficacy: 90,
    createdAt: '2026-07-15T09:30:00.000Z',
    updatedAt: '2026-09-24T11:00:00.000Z'
  },
  {
    id: 'prod-amino-booster',
    name: 'Amino Acid Foliar Booster 50%',
    code: 'PRD-AAB',
    category: 'biostimulant',
    variantType: 'Amino Acid Complex',
    description: 'Pure 50% L-amino acid polypeptide bio-stimulant derived from enzymatic hydrolysis for abiotic stress tolerance.',
    targetCrops: ['All Agricultural & Horticultural Crops'],
    targetWeedsOrPests: ['Drought, Heat & Salinity Stress'],
    commercialStatus: 'In Development',
    activeVersionTag: 'V1.0',
    totalVersionsCount: 1,
    averageEfficacy: 88,
    createdAt: '2026-08-10T14:00:00.000Z',
    updatedAt: '2026-09-25T17:00:00.000Z'
  },
  {
    id: 'prod-neem-shield',
    name: 'BioPest Neem Shield',
    code: 'PRD-BPN',
    category: 'pesticide',
    variantType: 'Bio-pesticide / Botanical',
    description: 'Cold-pressed high-azadirachtin botanical emulsion for anti-feedant, repellent, and insect growth regulation.',
    targetCrops: ['Cotton', 'Cabbage', 'Cauliflower', 'Pulses'],
    targetWeedsOrPests: ['Whitefly', 'Aphids', 'Helicoverpa', 'Spodoptera'],
    commercialStatus: 'Active Commercial',
    activeVersionTag: 'V1.0',
    totalVersionsCount: 1,
    averageEfficacy: 84,
    createdAt: '2026-07-25T08:00:00.000Z',
    updatedAt: '2026-09-21T13:00:00.000Z'
  }
];

const INITIAL_PRODUCT_VERSIONS: ProductVersion[] = [
  // ── Goweed Ultra Versions Lineage ──
  {
    id: 'ver-gwu-v1',
    productId: 'prod-goweed-ultra',
    versionTag: 'V1.0 (Baseline)',
    versionName: 'Goweed Ultra Base Recipe',
    formulaNameOrCode: 'Goweed Ultra',
    sourceType: 'trial_manager_formula',
    upgradeReason: 'Initial baseline formulation benchmark. Tested across broad weed spectrum in research farm plot.',
    stage: 'Commercial Ready',
    status: 'Superseded',
    dosage: '40 ml/L',
    ingredients: [{ name: 'Carrier & Water', quantity: 1000, unit: 'ml' }, { name: 'Botanical Active 1', quantity: 40, unit: 'ml' }],
    estimatedCost: 18.5,
    costPerUnitStr: '₹18.50 / L',
    killRateOrEfficacy: 74,
    controlLongevity: '15 Days Sustained',
    targetWeedsOrPests: '70 Weeds Spectrum',
    linkedTrialsCount: 42,
    linkedTrialCodes: ['TR-GWU-BASE-01'],
    releasedAt: '2026-06-15T09:00:00.000Z',
    createdBy: 'Pavan Dev'
  },
  {
    id: 'ver-gwu-v1-1',
    productId: 'prod-goweed-ultra',
    versionTag: 'V1.1',
    versionName: 'F-p43 (35 ml/L Low-Dose Test)',
    formulaNameOrCode: 'F-p43',
    sourceType: 'field_trial',
    upgradeReason: 'Tested reduced dosage from 40ml/L to 35ml/L with enhanced penetration adjuvant on Bermuda Grass & Goatweed.',
    stage: 'Multi-Loc Field Trial',
    status: 'Validated',
    dosage: '35 ml/L',
    ingredients: [{ name: 'Base Formula Active', quantity: 35, unit: 'ml' }, { name: 'Penetration Adjuvant', quantity: 5, unit: 'ml' }],
    estimatedCost: 16.2,
    costPerUnitStr: '₹16.20 / L',
    killRateOrEfficacy: 78,
    controlLongevity: '16 Days Sustained',
    targetWeedsOrPests: 'Bermuda Grass (Cynodon dactylon), Goatweed',
    linkedTrialsCount: 18,
    linkedTrialCodes: ['TR-F-P43-35ML'],
    releasedAt: '2026-09-23T15:11:00.000Z',
    createdBy: 'Pavan Dev'
  },
  {
    id: 'ver-gwu-v1-2',
    productId: 'prod-goweed-ultra',
    versionTag: 'V1.2',
    versionName: 'F-p43 (50 ml/L High-Pressure Test)',
    formulaNameOrCode: 'F-p43',
    sourceType: 'field_trial',
    upgradeReason: 'Tested 50ml/L dosage under heavy infestation of Spreading Dayflower (Commelina diffusa). Demonstrated quick burn-down.',
    stage: 'Multi-Loc Field Trial',
    status: 'Validated',
    dosage: '50 ml/L',
    ingredients: [{ name: 'Base Formula Active', quantity: 50, unit: 'ml' }],
    estimatedCost: 22.0,
    costPerUnitStr: '₹22.00 / L',
    killRateOrEfficacy: 82,
    controlLongevity: '18 Days Sustained',
    targetWeedsOrPests: 'Spreading Dayflower, Bermuda Grass',
    linkedTrialsCount: 12,
    linkedTrialCodes: ['TR-F-P43-50ML'],
    releasedAt: '2026-09-23T15:11:00.000Z',
    createdBy: 'Pavan Dev'
  },
  {
    id: 'ver-gwu-v2',
    productId: 'prod-goweed-ultra',
    versionTag: 'V2.0 (Active Flagship)',
    versionName: 'Goweed ultra +',
    formulaNameOrCode: 'Goweed ultra +',
    sourceType: 'field_trial',
    upgradeReason: 'Formulation upgrade: Added specialized silicone-free surfactant booster that improves leaf cuticle wet-out at 35ml/L without causing crop injury.',
    stage: 'Commercial Ready',
    status: 'Active Commercial',
    dosage: '35 ml/L',
    ingredients: [{ name: 'Goweed Technical', quantity: 35, unit: 'ml' }, { name: 'Silicone-Free Wetting Agent', quantity: 4, unit: 'ml' }],
    estimatedCost: 19.8,
    costPerUnitStr: '₹19.80 / L',
    killRateOrEfficacy: 85,
    controlLongevity: '20 Days Sustained',
    targetWeedsOrPests: 'Horse Purslane, Bermuda Grass, Crowfoot Grass',
    linkedTrialsCount: 35,
    linkedTrialCodes: ['TR-GWU-PLUS-01'],
    releasedAt: '2026-09-23T15:10:00.000Z',
    createdBy: 'Pavan Dev'
  },
  {
    id: 'ver-gwu-v2-1',
    productId: 'prod-goweed-ultra',
    versionTag: 'V2.1 (Combo)',
    versionName: 'GOWEED ULTRA + MICROWEED',
    formulaNameOrCode: 'GOWEED ULTRA + MICROWEED',
    sourceType: 'trial_manager_formula',
    upgradeReason: 'Synergistic tank-mix formulation combining Goweed ultra fast burn-down with Microweed long-lasting pre/early post seed inhibition. Dual MOA efficacy.',
    stage: 'Multi-Loc Field Trial',
    status: 'Testing',
    dosage: '30 ml/L + 15 ml/L',
    ingredients: [{ name: 'Goweed Technical', quantity: 30, unit: 'ml' }, { name: 'Microweed Bio-Broth', quantity: 15, unit: 'ml' }, { name: 'H2O', quantity: 1, unit: 'ml' }],
    estimatedCost: 24.5,
    costPerUnitStr: '₹24.50 / L',
    killRateOrEfficacy: 85,
    controlLongevity: '20 Days Sustained',
    targetWeedsOrPests: '6 Weed Species Complex',
    linkedTrialsCount: 7,
    linkedTrialCodes: ['TR-GWU-MCR-COMBO'],
    releasedAt: '2026-09-24T10:00:00.000Z',
    createdBy: 'Pavan Dev'
  },

  // ── Microweed Versions Lineage ──
  {
    id: 'ver-mcr-v1',
    productId: 'prod-microweed',
    versionTag: 'V1.0',
    versionName: 'Microweed Standard Bio-Inoculum',
    formulaNameOrCode: 'Microweed',
    sourceType: 'trial_manager_formula',
    upgradeReason: 'Original microbial herbicide suspension with 19 days sustained suppression across 12 weed species.',
    stage: 'Commercial Ready',
    status: 'Active Commercial',
    dosage: '25 ml/L',
    ingredients: [{ name: 'Bio-Inoculum Broth', quantity: 25, unit: 'ml' }, { name: 'H2O', quantity: 1, unit: 'ml' }],
    estimatedCost: 14.0,
    costPerUnitStr: '₹14.00 / L',
    killRateOrEfficacy: 72,
    controlLongevity: '19 Days Sustained',
    targetWeedsOrPests: '12 Weed Species',
    linkedTrialsCount: 15,
    linkedTrialCodes: ['TR-MCR-15PLOT'],
    releasedAt: '2026-07-01T10:00:00.000Z',
    createdBy: 'Pavan Dev'
  },

  // ── WeeDrop Versions Lineage ──
  {
    id: 'ver-wdr-v1',
    productId: 'prod-weedrop',
    versionTag: 'V1.0',
    versionName: 'WeeDrop (193-A)',
    formulaNameOrCode: 'WeeDrop(193-A)',
    sourceType: 'trial_manager_formula',
    upgradeReason: 'Dual MOA: HRAC 22 + Bio-Desiccant organic formulation. 97% complete burn-down within 24 hours.',
    stage: 'Commercial Ready',
    status: 'Superseded',
    dosage: '50 ml/L',
    ingredients: [{ name: 'Natural Acetic Acid', quantity: 200, unit: 'ml' }, { name: 'Bio-Desiccant Extract', quantity: 100, unit: 'ml' }, { name: 'Water', quantity: 700, unit: 'ml' }],
    estimatedCost: 48.0,
    costPerUnitStr: '₹48.00 / L',
    killRateOrEfficacy: 97,
    controlLongevity: '14 Days Sustained',
    targetWeedsOrPests: 'Annual Broadleaf & Grassy Weeds',
    linkedTrialsCount: 8,
    linkedTrialCodes: ['TR-WDR-193A'],
    releasedAt: '2026-05-10T11:00:00.000Z',
    createdBy: 'Pavan Dev'
  },
  {
    id: 'ver-wdr-v2',
    productId: 'prod-weedrop',
    versionTag: 'V2.0 (Cost-Optimized)',
    versionName: 'WeeDrop 150Rs (Cost-Optimized Recipe)',
    formulaNameOrCode: 'WeeDrop 150Rs',
    sourceType: 'trial_manager_formula',
    upgradeReason: 'Scientific breakthrough in recipe economics: Rebalanced Vinegar (500ml), Acetic acid (150ml), and Sodium chloride salt (300g) reducing cost from ₹48/L to ₹36.10/L while boosting kill rate to 98%.',
    stage: 'Commercial Ready',
    status: 'Active Commercial',
    dosage: '50 ml/L',
    ingredients: [
      { name: 'Vinegar', quantity: 500, unit: 'ml', cost: 15.0 },
      { name: 'Acetic acid', quantity: 150, unit: 'ml', cost: 16.5 },
      { name: 'Sodium chloride salt', quantity: 300, unit: 'g', cost: 4.6 }
    ],
    estimatedCost: 36.1,
    costPerUnitStr: '₹36.10 / L',
    killRateOrEfficacy: 98,
    controlLongevity: '14 Days Sustained',
    targetWeedsOrPests: 'Broadleaf & Grass Weeds',
    linkedTrialsCount: 1,
    linkedTrialCodes: ['TR-WDR-150RS'],
    releasedAt: '2026-09-22T16:00:00.000Z',
    createdBy: 'Pavan Dev'
  },

  // ── GMEA-2 Version ──
  {
    id: 'ver-gmea-v1',
    productId: 'prod-gmea2',
    versionTag: 'V1.0',
    versionName: 'GMEA-2 Technical Desiccant',
    formulaNameOrCode: 'GMEA-2',
    sourceType: 'trial_manager_formula',
    upgradeReason: 'Specialty inorganic desiccant formulated for rapid burndown with 98% complete kill on 4 major weed species.',
    stage: 'Plot Screening',
    status: 'Active Commercial',
    dosage: '40 ml/L',
    ingredients: [{ name: 'Inorganic Desiccant Base', quantity: 40, unit: 'ml' }],
    estimatedCost: 28.0,
    costPerUnitStr: '₹28.00 / L',
    killRateOrEfficacy: 98,
    controlLongevity: '9 Days Sustained',
    targetWeedsOrPests: '4 Weeds Target',
    linkedTrialsCount: 3,
    linkedTrialCodes: ['TR-GMEA2-01'],
    releasedAt: '2026-08-01T08:00:00.000Z',
    createdBy: 'Pavan Dev'
  },

  // ── Fungicide Version ──
  {
    id: 'ver-msb-v1',
    productId: 'prod-microshield',
    versionTag: 'V1.0',
    versionName: 'MicroShield WP Baseline',
    formulaNameOrCode: 'MicroShield WP',
    sourceType: 'rd_lab_formulation',
    upgradeReason: 'Initial wettable powder bio-fungicide formulation.',
    stage: 'Multi-Loc Field Trial',
    status: 'Superseded',
    dosage: '2.5 g/L',
    ingredients: [{ name: 'Trichoderma viride Spores', quantity: 15, unit: 'g' }, { name: 'Kaolin Carrier', quantity: 85, unit: 'g' }],
    estimatedCost: 12.0,
    costPerUnitStr: '₹12.00 / 100g',
    killRateOrEfficacy: 80,
    controlLongevity: '14 Days Sustained',
    targetWeedsOrPests: 'Fusarium Wilt, Root Rot',
    linkedTrialsCount: 14,
    releasedAt: '2026-06-20T10:00:00.000Z',
    createdBy: 'Bindushree B U'
  },
  {
    id: 'ver-msb-v2',
    productId: 'prod-microshield',
    versionTag: 'V2.0',
    versionName: 'MicroShield Bio Liquid SC',
    formulaNameOrCode: 'MicroShield Bio',
    sourceType: 'rd_lab_formulation',
    upgradeReason: 'Suspension concentrate upgrade: Improved spore shelf-life from 6 months to 18 months at room temp.',
    stage: 'Regulatory Testing',
    status: 'Active Commercial',
    dosage: '2.0 ml/L',
    ingredients: [{ name: 'Trichoderma Viable Spores (1x10^9 CFU/ml)', quantity: 20, unit: 'ml' }, { name: 'Sterile Osmoprotectant Liquid', quantity: 80, unit: 'ml' }],
    estimatedCost: 15.5,
    costPerUnitStr: '₹15.50 / 100ml',
    killRateOrEfficacy: 88,
    controlLongevity: '21 Days Sustained',
    targetWeedsOrPests: 'Powdery Mildew, Downy Mildew',
    linkedTrialsCount: 16,
    releasedAt: '2026-09-15T12:00:00.000Z',
    createdBy: 'Bindushree B U'
  }
];

// ── In-Memory Listeners ────────────────────────────────────────────────────────
type ProductStoreListener = () => void;
const productListeners: Set<ProductStoreListener> = new Set();

export const subscribeToProductChanges = (listener: ProductStoreListener) => {
  productListeners.add(listener);
  return () => {
    productListeners.delete(listener);
  };
};

const notifyProductListeners = () => {
  productListeners.forEach(l => l());
};

// ── Storage Operations ─────────────────────────────────────────────────────────

export const getMainProducts = (category?: ProductCategory | 'all'): MainProduct[] => {
  try {
    const raw = localStorage.getItem(MAIN_PRODUCTS_KEY);
    let list: MainProduct[] = [];
    if (!raw) {
      list = INITIAL_MAIN_PRODUCTS;
      localStorage.setItem(MAIN_PRODUCTS_KEY, JSON.stringify(list));
    } else {
      list = JSON.parse(raw);
    }

    if (category && category !== 'all') {
      return list.filter(p => p.category.toLowerCase() === category.toLowerCase());
    }
    return list;
  } catch (err) {
    return INITIAL_MAIN_PRODUCTS;
  }
};

export const getMainProductById = (id: string): MainProduct | undefined => {
  const products = getMainProducts();
  return products.find(p => p.id === id);
};

export const saveMainProducts = (products: MainProduct[]): void => {
  try {
    localStorage.setItem(MAIN_PRODUCTS_KEY, JSON.stringify(products));
    notifyProductListeners();

    // Dual-write to Firebase Firestore if available
    if (isFirebaseConfigured()) {
      products.forEach(async (p) => {
        try {
          await setDoc(doc(db, 'rnd_main_products', p.id), p, { merge: true });
        } catch (e) {
          // ignore offline firestore
        }
      });
    }
  } catch (err) {
    console.error('Failed to save main products:', err);
  }
};

export const addMainProduct = (data: Omit<MainProduct, 'id' | 'createdAt' | 'updatedAt' | 'totalVersionsCount'>): MainProduct => {
  const current = getMainProducts();
  const id = `prod-${data.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now().toString().slice(-4)}`;
  const now = new Date().toISOString();
  
  const newProduct: MainProduct = {
    ...data,
    id,
    totalVersionsCount: 0,
    createdAt: now,
    updatedAt: now,
  };

  saveMainProducts([newProduct, ...current]);
  return newProduct;
};

export const updateMainProduct = (id: string, updates: Partial<MainProduct>): MainProduct => {
  const current = getMainProducts();
  const index = current.findIndex(p => p.id === id);
  if (index === -1) throw new Error(`Product not found: ${id}`);

  const updated: MainProduct = {
    ...current[index],
    ...updates,
    updatedAt: new Date().toISOString()
  };

  current[index] = updated;
  saveMainProducts(current);
  return updated;
};

export const deleteMainProduct = (id: string): void => {
  const current = getMainProducts();
  saveMainProducts(current.filter(p => p.id !== id));

  // Also remove all associated versions
  const versions = getProductVersions();
  saveProductVersions(versions.filter(v => v.productId !== id));

  if (isFirebaseConfigured()) {
    try {
      deleteDoc(doc(db, 'rnd_main_products', id));
    } catch { /* ignore */ }
  }
};

// ── Version Operations ─────────────────────────────────────────────────────────

export const getProductVersions = (productId?: string): ProductVersion[] => {
  try {
    const raw = localStorage.getItem(PRODUCT_VERSIONS_KEY);
    let list: ProductVersion[] = [];
    if (!raw) {
      list = INITIAL_PRODUCT_VERSIONS;
      localStorage.setItem(PRODUCT_VERSIONS_KEY, JSON.stringify(list));
    } else {
      list = JSON.parse(raw);
    }

    if (productId) {
      return list.filter(v => v.productId === productId);
    }
    return list;
  } catch (err) {
    return INITIAL_PRODUCT_VERSIONS;
  }
};

export const saveProductVersions = (versions: ProductVersion[]): void => {
  try {
    localStorage.setItem(PRODUCT_VERSIONS_KEY, JSON.stringify(versions));
    notifyProductListeners();

    if (isFirebaseConfigured()) {
      versions.forEach(async (v) => {
        try {
          await setDoc(doc(db, 'rnd_product_versions', v.id), v, { merge: true });
        } catch (e) {
          // ignore offline firestore
        }
      });
    }
  } catch (err) {
    console.error('Failed to save product versions:', err);
  }
};

export const addProductVersion = (data: Omit<ProductVersion, 'id' | 'releasedAt'>): ProductVersion => {
  const current = getProductVersions();
  const id = `ver-${data.productId}-${Date.now().toString().slice(-4)}`;
  const now = new Date().toISOString();

  const newVersion: ProductVersion = {
    ...data,
    id,
    releasedAt: now
  };

  saveProductVersions([newVersion, ...current]);

  // Update MainProduct versions count & active version if marked active
  const products = getMainProducts();
  const pIdx = products.findIndex(p => p.id === data.productId);
  if (pIdx !== -1) {
    const allProdVers = [newVersion, ...current.filter(v => v.productId === data.productId)];
    const activeVer = allProdVers.find(v => v.status === 'Active Commercial') || newVersion;
    
    // Compute average efficacy across versions
    const effs = allProdVers.map(v => v.killRateOrEfficacy).filter((e): e is number => e !== undefined && e > 0);
    const avgEff = effs.length > 0 ? Math.round(effs.reduce((a, b) => a + b, 0) / effs.length) : undefined;

    products[pIdx] = {
      ...products[pIdx],
      totalVersionsCount: allProdVers.length,
      activeVersionId: activeVer.id,
      activeVersionTag: activeVer.versionTag,
      averageEfficacy: avgEff || products[pIdx].averageEfficacy,
      updatedAt: now
    };
    saveMainProducts(products);
  }

  return newVersion;
};

export const updateProductVersion = (id: string, updates: Partial<ProductVersion>): ProductVersion => {
  const current = getProductVersions();
  const index = current.findIndex(v => v.id === id);
  if (index === -1) throw new Error(`Version not found: ${id}`);

  const updated: ProductVersion = {
    ...current[index],
    ...updates
  };

  current[index] = updated;
  saveProductVersions(current);

  // If status is Active Commercial, set activeVersion in parent product
  if (updates.status === 'Active Commercial') {
    promoteActiveVersion(updated.productId, updated.id);
  }

  return updated;
};

export const deleteProductVersion = (id: string): void => {
  const current = getProductVersions();
  const target = current.find(v => v.id === id);
  if (!target) return;

  saveProductVersions(current.filter(v => v.id !== id));

  // Update parent product versions count
  const products = getMainProducts();
  const pIdx = products.findIndex(p => p.id === target.productId);
  if (pIdx !== -1) {
    const remaining = current.filter(v => v.productId === target.productId && v.id !== id);
    products[pIdx] = {
      ...products[pIdx],
      totalVersionsCount: remaining.length,
      updatedAt: new Date().toISOString()
    };
    saveMainProducts(products);
  }

  if (isFirebaseConfigured()) {
    try {
      deleteDoc(doc(db, 'rnd_product_versions', id));
    } catch { /* ignore */ }
  }
};

export const promoteActiveVersion = (productId: string, versionId: string): void => {
  const versions = getProductVersions();
  const targetVer = versions.find(v => v.id === versionId && v.productId === productId);
  if (!targetVer) return;

  // Mark all other versions of this product as not active
  const updatedVersions = versions.map(v => {
    if (v.productId === productId) {
      if (v.id === versionId) {
        return { ...v, status: 'Active Commercial' as const };
      } else if (v.status === 'Active Commercial') {
        return { ...v, status: 'Superseded' as const };
      }
    }
    return v;
  });
  saveProductVersions(updatedVersions);

  // Update MainProduct
  updateMainProduct(productId, {
    activeVersionId: targetVer.id,
    activeVersionTag: targetVer.versionTag
  });
};

// ── Smart Auto-Matching & Lineage Helpers ─────────────────────────────────────

export const findProductForTrialOrFormula = (nameOrCode: string): { product?: MainProduct; version?: ProductVersion } => {
  if (!nameOrCode) return {};
  const clean = nameOrCode.toLowerCase().trim();
  const products = getMainProducts();
  const versions = getProductVersions();

  // 1. Check direct version formula code match
  const matchingVer = versions.find(v => 
    v.formulaNameOrCode.toLowerCase().trim() === clean ||
    v.versionName.toLowerCase().trim() === clean ||
    clean.includes(v.formulaNameOrCode.toLowerCase().trim())
  );
  if (matchingVer) {
    const p = products.find(prod => prod.id === matchingVer.productId);
    return { product: p, version: matchingVer };
  }

  // 2. Check main product name match
  const matchingProd = products.find(p => 
    clean.includes(p.name.toLowerCase().trim()) ||
    p.name.toLowerCase().trim().includes(clean) ||
    clean.includes(p.code.toLowerCase().trim())
  );

  return { product: matchingProd };
};

export const linkTrialAsVersion = (
  trial: ExternalFieldTrial,
  productId: string,
  versionData: {
    versionTag: string;
    versionName?: string;
    upgradeReason: string;
    status?: 'Draft' | 'Testing' | 'Validated' | 'Active Commercial' | 'Superseded';
    dosage?: string;
    stage?: 'Lab Synthesis' | 'Plot Screening' | 'Multi-Loc Field Trial' | 'Regulatory Testing' | 'Commercial Ready';
    notes?: string;
  }
): ProductVersion => {
  const product = getMainProductById(productId);
  if (!product) throw new Error(`Product not found: ${productId}`);

  // Extract efficacy from evaluations
  let latestEfficacy = 0;
  if (trial.evaluations && trial.evaluations.length > 0) {
    latestEfficacy = trial.evaluations[trial.evaluations.length - 1].efficacyPercent;
  } else if (trial.resultRating === 'Excellent') {
    latestEfficacy = 85;
  }

  const ver = addProductVersion({
    productId,
    versionTag: versionData.versionTag,
    versionName: versionData.versionName || `${trial.productName || trial.title} (${versionData.dosage || trial.dosage || 'Trial'})`,
    formulaNameOrCode: trial.productName || trial.title,
    sourceType: 'field_trial',
    sourceTrialId: trial.id,
    upgradeReason: versionData.upgradeReason || 'Field trial evaluation of formulation variant.',
    stage: versionData.stage || 'Multi-Loc Field Trial',
    status: versionData.status || (trial.isCompleted ? 'Validated' : 'Testing'),
    dosage: versionData.dosage || trial.dosage || '35 ml/L',
    killRateOrEfficacy: latestEfficacy || undefined,
    controlLongevity: '14-20 Days Sustained',
    targetWeedsOrPests: trial.targetWeedOrPathogen,
    crop: trial.cropName,
    notes: versionData.notes || trial.summaryConclusion,
    linkedTrialsCount: 1,
    linkedTrialCodes: [trial.trialCode],
    createdBy: trial.scientistName || 'Scientist'
  });

  return ver;
};

export const linkFormulaAsVersion = (
  formula: ExternalFormulation,
  productId: string,
  versionData: {
    versionTag: string;
    versionName?: string;
    upgradeReason: string;
    status?: 'Draft' | 'Testing' | 'Validated' | 'Active Commercial' | 'Superseded';
    stage?: 'Lab Synthesis' | 'Plot Screening' | 'Multi-Loc Field Trial' | 'Regulatory Testing' | 'Commercial Ready';
    dosage?: string;
  }
): ProductVersion => {
  const product = getMainProductById(productId);
  if (!product) throw new Error(`Product not found: ${productId}`);

  const ver = addProductVersion({
    productId,
    versionTag: versionData.versionTag,
    versionName: versionData.versionName || formula.name,
    formulaNameOrCode: formula.code || formula.name,
    sourceType: 'trial_manager_formula',
    sourceFormulaId: formula.id,
    upgradeReason: versionData.upgradeReason || 'Formulation iteration imported from Trial Manager.',
    stage: versionData.stage || (formula.linkedTrialsCount && formula.linkedTrialsCount > 0 ? 'Multi-Loc Field Trial' : 'Lab Synthesis'),
    status: versionData.status || (formula.status === 'Active' ? 'Validated' : 'Testing'),
    dosage: versionData.dosage || '35 ml/L',
    ingredients: formula.ingredients || [],
    estimatedCost: formula.estimatedCost,
    costPerUnitStr: formula.estimatedCost ? `₹${formula.estimatedCost.toFixed(2)} / L` : undefined,
    killRateOrEfficacy: formula.killRate,
    controlLongevity: formula.controlLongevity,
    notes: formula.notes,
    linkedTrialsCount: formula.linkedTrialsCount || 0,
    createdBy: formula.createdBy || 'Trial Manager R&D'
  });

  return ver;
};
