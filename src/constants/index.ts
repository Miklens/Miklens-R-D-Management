export const PRODUCT_STAGES = [
  'Idea',
  'Literature Review',
  'Research',
  'Raw Material Selection',
  'Prototype',
  'Formulation',
  'Optimization',
  'Lab Testing',
  'Shelf Life',
  'Greenhouse Trial',
  'Field Trial',
  'Commercial Validation',
  'Packaging',
  'Registration',
  'Production Ready',
  'Commercial Launch',
  'Completed'
];

export const USER_ROLES = {
  ADMIN: 'Admin',
  MANAGEMENT: 'Management',
  SCIENTIST: 'Scientist'
};

// Reference data shared across Research Log, Team Activity, Profiles, etc.
// so logs and dashboards can resolve human-readable names from ids.
export const PRODUCTS = [
  { id: 'p1', name: 'BioShield Alpha' },
  { id: 'p2', name: 'NemaKill Pro' },
  { id: 'p3', name: 'RootBoost X' },
  { id: 'p4', name: 'AeroSpore V2' },
];

export const EXPERIMENTS = [
  { id: 'exp1', name: 'EXP-2023-089', productId: 'p1' },
  { id: 'exp2', name: 'EXP-2023-090', productId: 'p1' },
  { id: 'exp3', name: 'EXP-2023-045', productId: 'p2' },
  { id: 'exp4', name: 'EXP-2023-046', productId: 'p2' },
  { id: 'exp5', name: 'EXP-2023-071', productId: 'p3' },
  { id: 'exp6', name: 'EXP-2023-012', productId: 'p4' },
];

export const getProductName = (id: string) => PRODUCTS.find(p => p.id === id)?.name || id;
export const getExperimentName = (id: string) => EXPERIMENTS.find(e => e.id === id)?.name || id;
export const getExperimentsForProduct = (productId: string) =>
  EXPERIMENTS.filter(e => e.productId === productId);

// Which sidebar/routes each role is allowed to see.
// Admin and Management get full visibility (per SRS "Management Visibility" goal).
// Scientists get a focused, personal-work-only view.
export const MANAGEMENT_ROLES = ['Admin', 'Management'] as const;
