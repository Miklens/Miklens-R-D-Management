/**
 * DEFAULT DATA CONFIGURATION
 * These are bootstrap/example values used when no real data is available.
 * In production, this data should come from Firestore, not be hardcoded.
 * 
 * Use these constants throughout the app instead of hardcoding product/experiment names.
 */

export interface Product {
  id: string;
  name: string;
  category?: string;
  stage?: string;
}

export interface Experiment {
  id: string;
  name: string;
  productId: string;
  description?: string;
}

/**
 * Default/Example Products
 * Replace with data loaded from Firestore in production
 */
export const getDefaultProducts = (): Product[] => {
  // Returns empty — real products come from user input / Firestore
  return [];
};

/**
 * Default/Example Experiments
 * Replace with data loaded from Firestore in production
 */
export const getDefaultExperiments = (): Experiment[] => {
  // Returns empty — real experiments come from user input / Firestore
  return [];
};

/**
 * Get product name by ID
 * Utility function to resolve product names from IDs
 */
export const getProductName = (productId: string, products?: Product[]): string => {
  const productList = products || getDefaultProducts();
  return productList.find((p) => p.id === productId)?.name || 'Unknown Product';
};

/**
 * Get experiment name by ID
 * Utility function to resolve experiment names from IDs
 */
export const getExperimentName = (experimentId: string, experiments?: Experiment[]): string => {
  const experimentList = experiments || getDefaultExperiments();
  return experimentList.find((e) => e.id === experimentId)?.name || 'Unknown Experiment';
};

/**
 * Sample Daily Log Entry
 * Example structure for research logs
 */
export interface SampleDailyLogEntry {
  id: string;
  date: string;
  scientist: string;
  experiment: string;
  notes: string;
  status: 'in-progress' | 'completed' | 'pending-review';
}

export const getSampleDailyLogs = (): SampleDailyLogEntry[] => {
  return [
    {
      id: 'log1',
      date: new Date().toISOString().split('T')[0],
      scientist: 'Sandeep',
      experiment: 'exp1',
      notes: 'Conducted pathogenic assay testing against Botrytis cinerea',
      status: 'in-progress',
    },
  ];
};

/**
 * Sample Field Trial Data
 * Example structure for field trial records
 */
export interface SampleFieldTrial {
  id: string;
  name: string;
  location: string;
  crop: string;
  disease: string;
  startDate: string;
  status: 'planned' | 'in-progress' | 'completed';
}

export const getSampleFieldTrials = (): SampleFieldTrial[] => {
  return [
    {
      id: 'ft1',
      name: 'Punjab Wheat Field Plot Trial',
      location: 'Punjab, India',
      crop: 'Wheat',
      disease: 'Yellow Rust',
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'in-progress',
    },
  ];
};

/**
 * Sample Team Members
 * Example scientist/team data
 */
export interface SampleTeamMember {
  id: string;
  name: string;
  role: string;
  department: string;
  email: string;
}

export const getSampleTeamMembers = (): SampleTeamMember[] => {
  return [
    {
      id: 'user1',
      name: 'Sandeep',
      role: 'Research Scientist',
      department: 'Research & Development',
      email: 'sandeep.431441@gmail.com',
    },
    {
      id: 'user2',
      name: 'Bindu',
      role: 'Senior Research Officer',
      department: 'Research & Development',
      email: 'bindushreebu01@gmail.com',
    },
    {
      id: 'user3',
      name: 'Pavan',
      role: 'Field Trial Manager',
      department: 'Field Operations',
      email: 'Pavan@miklensbio.com',
    },
  ];
};
