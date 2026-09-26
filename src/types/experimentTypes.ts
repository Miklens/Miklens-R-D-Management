export type ExperimentType = 'Lab' | 'Field' | 'Both';
export type ExperimentStatus = 'InProgress' | 'Completed' | 'Blocked' | 'Queued' | 'Planning';
export type ScientificOutcomeStatus = 'Pending' | 'Passed' | 'Failed' | 'Inconclusive';
export type TemplateType = 'Formulation' | 'Microbiology' | 'Stability' | 'Field' | 'Custom';

// ── 14-Field Formulation Tracker (Management-Mandated) ──────────────────────
export type FormulationPhysicalAppearance = 'Clear Liquid' | 'Emulsion' | 'Suspension' | 'Powder' | 'Granule' | 'Paste' | 'Gel';
export type FormulationSolubility = 'Complete' | 'Partial' | 'Poor' | 'Insoluble';
export type FormulationCompatibility = 'Compatible' | 'Incompatible' | 'Conditional';
export type FormulationStability = 'Stable' | 'Unstable' | 'Under Accelerated Testing' | 'Conditionally Stable';
export type FormulationDecision = 'Continue' | 'Modify' | 'Stop' | 'Under Review' | 'Advance to Field Trial' | 'Advance to Registration';

export interface ScientificFormulation {
  id: string;
  // Field 1: Formulation ID (system-assigned, e.g. GWU-V3)
  formulationId: string;
  // Field 2: Product Name
  name: string;
  // Field 3: Version Number
  version: string;              // V1, V2, V2.1, V2.2, V3
  // Field 4: Parent Version for lineage tracing
  parentVersionId?: string;
  // Field 5: Reason for revision – what changed + why
  reasonForRevision: string;
  // Field 6: Batch Number
  batchNo: string;
  // Field 7: Key actives / composition
  keyActivesComposition: string;
  // Field 8: Physical appearance
  physicalAppearance: FormulationPhysicalAppearance;
  // Field 9: Solubility / dispersibility
  solubilityDispersibility: FormulationSolubility;
  // Field 10: Compatibility
  compatibility: FormulationCompatibility;
  compatibilityNotes?: string;
  // Field 11: pH
  pH?: number;
  // Field 12: Stability status
  stabilityStatus: FormulationStability;
  stabilityNotes?: string;
  // Field 13: Problem identified
  problemIdentified?: string;
  // Field 14: Corrective action
  correctiveAction?: string;
  // Trial result
  trialResultEfficacy?: number;  // % control (WCE/DCE/PRE)
  trialResultNotes?: string;
  // Final decision
  finalDecision: FormulationDecision;
  finalDecisionNotes?: string;
  // Category
  category: 'herbicide' | 'fungicide' | 'pesticide' | 'nutrition' | 'biostimulant' | 'other';
  // Meta
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// ── 4-Tier Scientific Evaluation Structure ───────────────────────────────────
export interface ScientificEvaluationMeasurement {
  weedCoverPct: number;
  baselineCoverPct: number;
  deltaControlPct: number;      // Calculated WCE: (1 - treated/baseline)*100
  phytotoxicityScore: number;   // 0–10 or %
  dominantSpeciesRemaining?: string;
}

export interface ScientificEvaluationRecord {
  id: string;
  trialId: string;
  formulationName: string;
  daysAfterTreatment: number;
  evalDate: string;
  // Tier 1 – Observation
  observation: string;
  // Tier 2 – Quantitative Measurement
  measurement: ScientificEvaluationMeasurement;
  // Tier 3 – Scientific Interpretation
  scientificInterpretation: string;
  // Tier 4 – Decision / Action
  decisionAction: string;
  evaluatedBy: string;
  createdAt: string;
}

// ── Weekly MIS Decision Summary (Management Template) ────────────────────────
export interface ActionItem {
  id: string;
  action: string;
  responsiblePerson: string;
  expectedCompletion: string;   // YYYY-MM-DD
  status: 'Pending' | 'In Progress' | 'Completed' | 'Overdue';
}

export interface ProblemRiskItem {
  id: string;
  problem: string;
  impact: string;
  correctiveAction: string;
  status: 'Open' | 'Pending' | 'Closed';
}

export interface ManagementDecisionItem {
  id: string;
  decisionRequired: string;
  urgency: 'High' | 'Medium' | 'Low';
  deadline?: string;
  status: 'Pending Approval' | 'Approved' | 'Rejected';
}

export interface FormulationEfficacyRankingEntry {
  rank: number;
  formulationName: string;
  wceAtLatestDaa: number;
  latestDaa: number;
  decision: FormulationDecision;
  notes: string;
}

export interface WeeklyMISReport {
  id: string;
  weekNumber: number;
  reportingPeriodStart: string;  // YYYY-MM-DD
  reportingPeriodEnd: string;    // YYYY-MM-DD
  preparedBy: string;
  preparedAt: string;

  // The 3 core scientific questions management requires answered
  whatDidWeLearn: string;
  whatDoesDataMeanScientifically: string;
  whatDecisionFollows: string;

  // Structured Sections
  keyAchievements: string[];
  keyScientificFindings: string[];
  formulationEfficacyRanking: FormulationEfficacyRankingEntry[];
  problemsRisks: ProblemRiskItem[];
  decisionsRequiredFromManagement: ManagementDecisionItem[];
  actionsForNextWeek: ActionItem[];

  status: 'Draft' | 'Submitted' | 'Reviewed' | 'Approved';
  managementFeedback?: string;
}

// ── Existing Types (unchanged) ───────────────────────────────────────────────
export interface DailyExecutionRun {
  id: string;
  dayNumber: number;
  date: string;
  scientistName: string;
  activityPerformed: string;
  observationResult: string;
  runStatus: 'Passed' | 'In Progress' | 'Needs Re-Run';
}

export interface ExperimentItem {
  id: string;
  name: string;
  productName: string;
  type: ExperimentType;
  templateType?: TemplateType;
  status: ExperimentStatus;
  startDate: string;
  description?: string;
  hypothesis?: string;
  targetVolume?: string;
  dailyRuns?: DailyExecutionRun[];
  conclusion?: string;
  outcomeStatus?: ScientificOutcomeStatus;
  createdAt: string;
}

export interface LabTestItem {
  id: string;
  name: string;
  productName: string;
  type: string;
  templateType?: TemplateType;
  status: ExperimentStatus;
  lab: string;
  dueDate: string;
  hypothesis?: string;
  dailyRuns?: DailyExecutionRun[];
  conclusion?: string;
  outcomeStatus?: ScientificOutcomeStatus;
  createdAt: string;
}

export interface StabilityLogItem {
  id: string;
  batchNo: string;
  productName: string;
  chamberTemp: string;
  startDate: string;
  duration: string;
  nextTestDate: string;
  nextInterval: string;
  status: 'active' | 'completed' | 'overdue' | 'warning';
  activeRetention: number;
  pH: number;
  hypothesis?: string;
  dailyRuns?: DailyExecutionRun[];
  conclusion?: string;
  outcomeStatus?: ScientificOutcomeStatus;
  createdAt: string;
}

export interface FieldTrialItem {
  id: string;
  name: string;
  productName: string;
  location: string;
  area: string;
  status: string;
  startDate: string;
  duration: string;
  hypothesis?: string;
  dailyRuns?: DailyExecutionRun[];
  conclusion?: string;
  outcomeStatus?: ScientificOutcomeStatus;
  createdAt: string;
}

export interface ObservationItem {
  id: string;
  title: string;
  productName: string;
  type: string;
  location: string;
  date: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'Open' | 'Resolved' | 'Under Review';
  createdAt: string;
}

export type Experiment = ExperimentItem;
export type LabTest = LabTestItem;
export type StabilityLog = StabilityLogItem;
export type FieldTrial = FieldTrialItem;
export type Observation = ObservationItem;

