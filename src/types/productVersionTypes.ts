import { TrialCategory } from './trialIntegrationTypes';

export type ProductCategory = TrialCategory;

export type ProductVariantType = 
  // Herbicide variants
  | 'Organic Herbicide'
  | 'Inorganic Herbicide'
  | 'IPM Herbicide'
  | 'Microweed / Microbial Herbicide'
  | 'Non-Selective Systemic'
  | 'Selective Post-Emergence'
  | 'Pre-Emergence Herbicide'
  // Fungicide variants
  | 'Bio-fungicide'
  | 'Chemical Fungicide'
  | 'Systemic Fungicide'
  | 'Contact Protectant'
  | 'Broad-Spectrum Fungicide'
  // Pesticide variants
  | 'Bio-pesticide / Botanical'
  | 'IPM Insecticide'
  | 'Microbial Insecticide'
  | 'Bio-nematicide'
  | 'Chemical Insecticide'
  // Nutrition variants
  | 'Chelated Micronutrients'
  | 'Foliar Nutrition / Biochelates'
  | 'NPK Bio-Complex'
  | 'Soil Health Enhancer'
  // Biostimulant variants
  | 'Amino Acid Complex'
  | 'Seaweed Extract'
  | 'Humic & Fulvic Acid'
  | 'Microbial Bio-inoculant'
  | 'General Formulation';

export const CATEGORY_VARIANTS_MAP: Record<ProductCategory, ProductVariantType[]> = {
  herbicide: [
    'Organic Herbicide',
    'Inorganic Herbicide',
    'IPM Herbicide',
    'Microweed / Microbial Herbicide',
    'Non-Selective Systemic',
    'Selective Post-Emergence',
    'Pre-Emergence Herbicide',
    'General Formulation'
  ],
  fungicide: [
    'Bio-fungicide',
    'Chemical Fungicide',
    'Systemic Fungicide',
    'Contact Protectant',
    'Broad-Spectrum Fungicide',
    'General Formulation'
  ],
  pesticide: [
    'Bio-pesticide / Botanical',
    'IPM Insecticide',
    'Microbial Insecticide',
    'Bio-nematicide',
    'Chemical Insecticide',
    'General Formulation'
  ],
  nutrition: [
    'Chelated Micronutrients',
    'Foliar Nutrition / Biochelates',
    'NPK Bio-Complex',
    'Soil Health Enhancer',
    'General Formulation'
  ],
  biostimulant: [
    'Amino Acid Complex',
    'Seaweed Extract',
    'Humic & Fulvic Acid',
    'Microbial Bio-inoculant',
    'General Formulation'
  ]
};

export interface RecipeIngredient {
  name: string;
  quantity?: string | number;
  unit?: string;
  cost?: number;
}

export interface ProductVersion {
  id: string;
  productId: string; // Links to MainProduct.id
  versionTag: string; // e.g. "V1.0", "V1.1", "V2.0", "V2.1", "V3.0"
  versionName: string; // e.g. "F-p43 (35ml/L Test)", "Goweed ultra +", "WeeDrop 150Rs"
  formulaNameOrCode: string; // Raw name/code from Trial Manager
  sourceType: 'trial_manager_formula' | 'field_trial' | 'rd_lab_formulation' | 'manual';
  sourceTrialId?: string; // ID of trial from Trial Manager
  sourceFormulaId?: string; // ID of formula from Trial Manager
  upgradeReason: string; // Scientific rationale for upgrade: what was changed & why
  stage: 'Lab Synthesis' | 'Plot Screening' | 'Multi-Loc Field Trial' | 'Regulatory Testing' | 'Commercial Ready';
  status: 'Draft' | 'Testing' | 'Validated' | 'Active Commercial' | 'Superseded' | 'Discarded';
  dosage?: string;
  ingredients?: RecipeIngredient[];
  estimatedCost?: number;
  costPerUnitStr?: string; // e.g. "₹36.10 / L"
  killRateOrEfficacy?: number; // e.g. 85.0 (% WCE / Kill Rate)
  controlLongevity?: string; // e.g. "20 Days Sustained"
  phytotoxicityScore?: number; // 0-10
  targetWeedsOrPests?: string;
  crop?: string;
  notes?: string;
  linkedTrialsCount?: number;
  linkedTrialCodes?: string[];
  releasedAt: string;
  createdBy: string;
}

export interface MainProduct {
  id: string;
  name: string; // e.g. "Goweed Ultra", "Microweed", "WeeDrop"
  code: string; // e.g. "PRD-GWU", "PRD-MCR"
  category: ProductCategory;
  variantType: ProductVariantType; // e.g. "IPM Herbicide", "Organic Herbicide", "Microweed / Microbial Herbicide"
  description: string;
  targetCrops: string[];
  targetWeedsOrPests: string[];
  commercialStatus: 'In Development' | 'Active Commercial' | 'Pilot / Field Testing' | 'Under Registration' | 'Archived';
  activeVersionId?: string; // Currently active production/flagship version ID
  activeVersionTag?: string; // e.g. "V2.0"
  totalVersionsCount?: number;
  averageEfficacy?: number;
  createdAt: string;
  updatedAt: string;
}

export interface VersionUpgradeComparison {
  baseVersion: ProductVersion;
  targetVersion: ProductVersion;
  efficacyDifference: number; // e.g. +11% WCE
  costDifference: number; // e.g. -₹5.20 / L
  ingredientChanges: {
    added: RecipeIngredient[];
    removed: RecipeIngredient[];
    modified: { name: string; oldQty: string | number; newQty: string | number; unit: string }[];
    unchanged: RecipeIngredient[];
  };
}
