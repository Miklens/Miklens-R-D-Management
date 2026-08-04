/**
 * PRODUCT PIPELINE STAGES
 * Defines the standard workflow stages for product development
 */
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
] as const;

/**
 * USER ROLES
 * Define role hierarchy and permissions
 */
export const USER_ROLES = {
  ADMIN: 'Admin',
  MANAGEMENT: 'Management',
  SCIENTIST: 'Scientist'
} as const;

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];

/**
 * CACHE TIME CONFIGURATION (in milliseconds)
 * Centralized configuration for React Query caching behavior
 */
export const CACHE_CONFIG = {
  STALE_TIME: 1000 * 60 * 5, // 5 minutes
  GC_TIME: 1000 * 60 * 30, // 30 minutes (formerly cacheTime)
} as const;

/**
 * VALIDATION CONFIGURATION
 * Form validation rules and constraints
 */
export const VALIDATION = {
  PASSWORD_MIN_LENGTH: 6,
  EMAIL_PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  MAX_FILE_SIZE_MB: 10,
} as const;

/**
 * UI CONFIGURATION
 * Magic numbers and constants for UI/UX
 */
export const UI_CONFIG = {
  PWA_MAX_CACHE_SIZE: 8 * 1024 * 1024, // 8MB
  CHUNK_SIZE_WARNING_LIMIT: 1200, // bytes
  AVATAR_SIZE_LARGE: 'h-12 w-12',
  AVATAR_SIZE_MEDIUM: 'h-10 w-10',
  AVATAR_SIZE_SMALL: 'h-8 w-8',
  NOTIFICATION_TIMEOUT: 3000, // ms
  DEBOUNCE_DELAY: 300, // ms
} as const;

/**
 * STORAGE KEYS
 * Centralized localStorage key management to prevent conflicts
 */
export const STORAGE_KEYS = {
  USERS: 'miklens_users_v3',
  DAILY_LOGS: 'miklens_daily_logs_v3',
  EXPERIMENTS: 'miklens_experiments_v5',
  LAB_TESTS: 'miklens_lab_tests_v5',
  STABILITY: 'miklens_stability_v5',
  FIELD_TRIALS: 'miklens_field_trials_v5',
  OBSERVATIONS: 'miklens_observations_v5',
  SYNCED_TRIALS: 'miklens_rnd_synced_trials_v1',
  FIREBASE_CONFIG: 'miklens_rnd_firebase_config_v1',
  THEME: 'theme',
  AVATAR_PREFIX: 'miklens_user_avatar_',
} as const;

/**
 * FIRESTORE COLLECTIONS
 * Collection names for Trial Manager integration
 */
export const FIRESTORE_COLLECTIONS = {
  USERS: 'users',
  PRODUCTS: 'products',
  TRIALS: 'trials',
  HERBICIDE_TRIALS: 'herbicide_trials',
  FUNGICIDE_TRIALS: 'fungicide_trials',
  PESTICIDE_TRIALS: 'pesticide_trials',
  NUTRITION_TRIALS: 'nutrition_trials',
  BIOSTIMULANT_TRIALS: 'biostimulant_trials',
} as const;

/**
 * APP BRANDING & METADATA
 * Used for PWA manifest, page titles, etc.
 * Load from environment variables with defaults
 */
export const APP_CONFIG = {
  NAME: import.meta.env.VITE_APP_NAME || 'Miklens Bio R&D Platform',
  SHORT_NAME: 'MiklensRND',
  DESCRIPTION: import.meta.env.VITE_APP_DESCRIPTION || 
    'Enterprise AI Powered Research & Development Management Platform',
  THEME_COLOR: import.meta.env.VITE_APP_THEME_COLOR || '#059669',
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || '',
} as const;

/**
 * FEATURE FLAGS
 * Control feature availability at runtime
 */
export const FEATURE_FLAGS = {
  ENABLE_AI_CHATBOT: import.meta.env.VITE_ENABLE_AI_CHATBOT !== 'false',
  ENABLE_ANALYTICS: import.meta.env.VITE_ENABLE_ANALYTICS !== 'false',
  ENABLE_AUDIT_LOGS: import.meta.env.VITE_ENABLE_AUDIT_LOGS !== 'false',
  ENABLE_GOOGLE_DRIVE: import.meta.env.VITE_ENABLE_GOOGLE_DRIVE === 'true',
} as const;

/**
 * DEFAULT REFERENCE DATA
 * These are bootstrap/default values loaded when no data is available.
 * In production, this data should come from Firestore, not be hardcoded.
 */
export const DEFAULT_REFERENCE_DATA = {
  PRODUCTS: [] as Array<{ id: string; name: string }>,
  EXPERIMENTS: [] as Array<{ id: string; name: string; productId: string }>,
} as const;

/**
 * ROUTE CONFIGURATION
 * Map routes to display titles and role access
 */
export const ROUTES_CONFIG = {
  '/': { title: 'Dashboard', roles: ['Admin', 'Management', 'Scientist'] },
  '/products': { title: 'Products', roles: ['Admin', 'Management', 'Scientist'] },
  '/experiments': { title: 'Experiments', roles: ['Admin', 'Management', 'Scientist'] },
  '/research-log': { title: 'Daily Research Log', roles: ['Admin', 'Management', 'Scientist'] },
  '/profile': { title: 'Profile', roles: ['Admin', 'Management', 'Scientist'] },
  '/projects': { title: 'Projects', roles: ['Admin', 'Management', 'Scientist'] },
  '/tasks': { title: 'Tasks', roles: ['Admin', 'Management', 'Scientist'] },
  '/documents': { title: 'Documents', roles: ['Admin', 'Management', 'Scientist'] },
  '/calendar': { title: 'Calendar', roles: ['Admin', 'Management', 'Scientist'] },
  '/ai-insights': { title: 'AI Insights', roles: ['Admin', 'Management', 'Scientist'] },
  '/notifications': { title: 'Notifications', roles: ['Admin', 'Management', 'Scientist'] },
  '/audit-logs': { title: 'Audit Logs', roles: ['Admin'] },
  '/team-activity': { title: 'Team Activity', roles: ['Admin', 'Management'] },
  '/time-motion': { title: 'Time Motion', roles: ['Admin', 'Management', 'Scientist'] },
  '/field-trials': { title: 'Field Trials', roles: ['Admin', 'Management', 'Scientist'] },
  '/formulation': { title: 'Formulation Builder', roles: ['Admin', 'Scientist'] },
  '/employees': { title: 'Employees', roles: ['Admin', 'Management'] },
  '/settings': { title: 'Settings', roles: ['Admin', 'Management', 'Scientist'] },
} as const;

/**
 * Get product name by ID
 * Import from src/config/defaultData for production data
 */
export const getProductName = (id: string, products?: { id: string; name: string }[]): string => {
  if (!products) return id;
  return products.find(p => p.id === id)?.name || id;
};

/**
 * Get experiment name by ID
 * Import from src/config/defaultData for production data
 */
export const getExperimentName = (id: string, experiments?: { id: string; name: string; productId: string }[]): string => {
  if (!experiments) return id;
  return experiments.find(e => e.id === id)?.name || id;
};

/**
 * Get experiments for a product
 * Import from src/config/defaultData for production data
 */
export const getExperimentsForProduct = (
  productId: string,
  experiments?: { id: string; name: string; productId: string }[]
) => {
  if (!experiments) return [];
  return experiments.filter(e => e.productId === productId);
};

// Which sidebar/routes each role is allowed to see.
// Admin and Management get full visibility (per SRS "Management Visibility" goal).
// Scientists get a focused, personal-work-only view.
export const MANAGEMENT_ROLES = ['Admin', 'Management'] as const;
