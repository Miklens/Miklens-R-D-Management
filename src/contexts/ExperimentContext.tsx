import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useAuth } from './AuthContext';
import type { 
  ExperimentItem, 
  LabTestItem, 
  StabilityLogItem, 
  FieldTrialItem, 
  ObservationItem,
  ScientificOutcomeStatus,
  DailyExecutionRun
} from '../types/experimentTypes';
import { 
  loadExperiments, saveExperiments,
  loadLabTests, saveLabTests,
  loadStabilityLogs, saveStabilityLogs,
  loadFieldTrials, saveFieldTrials,
  loadObservations, saveObservations
} from '../services/experimentStore';

interface ExperimentContextType {
  experiments: ExperimentItem[];
  labTests: LabTestItem[];
  stabilityLogs: StabilityLogItem[];
  fieldTrials: FieldTrialItem[];
  observations: ObservationItem[];

  addExperiment: (item: Omit<ExperimentItem, 'id' | 'createdAt'>) => ExperimentItem;
  addLabTest: (item: Omit<LabTestItem, 'id' | 'createdAt'>) => LabTestItem;
  addStabilityLog: (item: Omit<StabilityLogItem, 'id' | 'createdAt'>) => StabilityLogItem;
  addFieldTrial: (item: Omit<FieldTrialItem, 'id' | 'createdAt'>) => FieldTrialItem;
  addObservation: (item: Omit<ObservationItem, 'id' | 'createdAt'>) => ObservationItem;

  addDailyRun: (category: 'exp' | 'lab' | 'stability' | 'field', itemId: string, runData: Omit<DailyExecutionRun, 'id'>) => void;
  updateScientificConclusion: (category: 'exp' | 'lab' | 'stability' | 'field', itemId: string, conclusion: string, outcomeStatus: ScientificOutcomeStatus) => void;

  deleteExperiment: (id: string) => void;
  deleteLabTest: (id: string) => void;
  deleteStabilityLog: (id: string) => void;
  deleteFieldTrial: (id: string) => void;
  deleteObservation: (id: string) => void;

  allProducts: string[];
}

const ExperimentContext = createContext<ExperimentContextType | undefined>(undefined);

export const ExperimentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profile } = useAuth();
  const currentScientistName = profile?.name || 'Lead Scientist';

  const [experiments, setExperiments] = useState<ExperimentItem[]>(loadExperiments);
  const [labTests, setLabTests] = useState<LabTestItem[]>(loadLabTests);
  const [stabilityLogs, setStabilityLogs] = useState<StabilityLogItem[]>(loadStabilityLogs);
  const [fieldTrials, setFieldTrials] = useState<FieldTrialItem[]>(loadFieldTrials);
  const [observations, setObservations] = useState<ObservationItem[]>(loadObservations);

  useEffect(() => { saveExperiments(experiments); }, [experiments]);
  useEffect(() => { saveLabTests(labTests); }, [labTests]);
  useEffect(() => { saveStabilityLogs(stabilityLogs); }, [stabilityLogs]);
  useEffect(() => { saveFieldTrials(fieldTrials); }, [fieldTrials]);
  useEffect(() => { saveObservations(observations); }, [observations]);

  const addExperiment = (item: Omit<ExperimentItem, 'id' | 'createdAt'>): ExperimentItem => {
    const newItem: ExperimentItem = {
      ...item,
      id: `exp-${Date.now()}`,
      dailyRuns: item.dailyRuns || [
        {
          id: `run-${Date.now()}`,
          dayNumber: 1,
          date: new Date().toISOString().split('T')[0],
          scientistName: currentScientistName,
          activityPerformed: 'Initial experiment setup & baseline measurement.',
          observationResult: 'Sample prepared, baseline parameters recorded.',
          runStatus: 'In Progress',
        },
      ],
      outcomeStatus: item.outcomeStatus || 'Pending',
      createdAt: new Date().toISOString(),
    };
    setExperiments((prev) => [newItem, ...prev]);
    return newItem;
  };

  const addLabTest = (item: Omit<LabTestItem, 'id' | 'createdAt'>): LabTestItem => {
    const newItem: LabTestItem = {
      ...item,
      id: `lab-${Date.now()}`,
      dailyRuns: item.dailyRuns || [
        {
          id: `run-${Date.now()}`,
          dayNumber: 1,
          date: new Date().toISOString().split('T')[0],
          scientistName: currentScientistName,
          activityPerformed: 'Initial assay dilution & plate preparation.',
          observationResult: 'Reagents & culture plates initialized.',
          runStatus: 'In Progress',
        },
      ],
      outcomeStatus: item.outcomeStatus || 'Pending',
      createdAt: new Date().toISOString(),
    };
    setLabTests((prev) => [newItem, ...prev]);
    return newItem;
  };

  const addStabilityLog = (item: Omit<StabilityLogItem, 'id' | 'createdAt'>): StabilityLogItem => {
    const newItem: StabilityLogItem = {
      ...item,
      id: `stab-${Date.now()}`,
      dailyRuns: item.dailyRuns || [
        {
          id: `run-${Date.now()}`,
          dayNumber: 1,
          date: new Date().toISOString().split('T')[0],
          scientistName: currentScientistName,
          activityPerformed: 'Oven placement at thermal chamber temperature.',
          observationResult: 'Initial pH and viscosity recorded.',
          runStatus: 'Passed',
        },
      ],
      outcomeStatus: item.outcomeStatus || 'Pending',
      createdAt: new Date().toISOString(),
    };
    setStabilityLogs((prev) => [newItem, ...prev]);
    return newItem;
  };

  const addFieldTrial = (item: Omit<FieldTrialItem, 'id' | 'createdAt'>): FieldTrialItem => {
    const newItem: FieldTrialItem = {
      ...item,
      id: `field-${Date.now()}`,
      dailyRuns: item.dailyRuns || [
        {
          id: `run-${Date.now()}`,
          dayNumber: 1,
          date: new Date().toISOString().split('T')[0],
          scientistName: currentScientistName,
          activityPerformed: 'Plot mapping & initial foliar spray application.',
          observationResult: 'Target plot acreage treated uniformly.',
          runStatus: 'Passed',
        },
      ],
      outcomeStatus: item.outcomeStatus || 'Pending',
      createdAt: new Date().toISOString(),
    };
    setFieldTrials((prev) => [newItem, ...prev]);
    return newItem;
  };

  const addObservation = (item: Omit<ObservationItem, 'id' | 'createdAt'>): ObservationItem => {
    const newItem: ObservationItem = {
      ...item,
      id: `obs-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setObservations((prev) => [newItem, ...prev]);
    return newItem;
  };

  // Add Daily Execution Run
  const addDailyRun = (
    category: 'exp' | 'lab' | 'stability' | 'field',
    itemId: string,
    runData: Omit<DailyExecutionRun, 'id'>
  ) => {
    const newRun: DailyExecutionRun = {
      ...runData,
      id: `run-${Date.now()}`,
    };

    const updateItem = (item: any) => ({
      ...item,
      dailyRuns: [...(item.dailyRuns || []), newRun],
    });

    if (category === 'exp') setExperiments((prev) => prev.map((e) => (e.id === itemId ? updateItem(e) : e)));
    if (category === 'lab') setLabTests((prev) => prev.map((e) => (e.id === itemId ? updateItem(e) : e)));
    if (category === 'stability') setStabilityLogs((prev) => prev.map((e) => (e.id === itemId ? updateItem(e) : e)));
    if (category === 'field') setFieldTrials((prev) => prev.map((e) => (e.id === itemId ? updateItem(e) : e)));
  };

  // Update Scientific Conclusion & Outcome
  const updateScientificConclusion = (
    category: 'exp' | 'lab' | 'stability' | 'field',
    itemId: string,
    conclusion: string,
    outcomeStatus: ScientificOutcomeStatus
  ) => {
    const updateItem = (item: any) => ({
      ...item,
      conclusion,
      outcomeStatus,
      status: outcomeStatus === 'Passed' || outcomeStatus === 'Failed' ? 'Completed' : item.status,
    });

    if (category === 'exp') setExperiments((prev) => prev.map((e) => (e.id === itemId ? updateItem(e) : e)));
    if (category === 'lab') setLabTests((prev) => prev.map((e) => (e.id === itemId ? updateItem(e) : e)));
    if (category === 'stability') setStabilityLogs((prev) => prev.map((e) => (e.id === itemId ? updateItem(e) : e)));
    if (category === 'field') setFieldTrials((prev) => prev.map((e) => (e.id === itemId ? updateItem(e) : e)));
  };

  const deleteExperiment = (id: string) => setExperiments((prev) => prev.filter((e) => e.id !== id));
  const deleteLabTest = (id: string) => setLabTests((prev) => prev.filter((e) => e.id !== id));
  const deleteStabilityLog = (id: string) => setStabilityLogs((prev) => prev.filter((e) => e.id !== id));
  const deleteFieldTrial = (id: string) => setFieldTrials((prev) => prev.filter((e) => e.id !== id));
  const deleteObservation = (id: string) => setObservations((prev) => prev.filter((e) => e.id !== id));

  const allProducts = useMemo(() => {
    const set = new Set<string>();
    // Only add real user-entered product names — no hardcoded seeds
    experiments.forEach((e) => e.productName && set.add(e.productName));
    labTests.forEach((e) => e.productName && set.add(e.productName));
    stabilityLogs.forEach((e) => e.productName && set.add(e.productName));
    fieldTrials.forEach((e) => e.productName && set.add(e.productName));
    observations.forEach((e) => e.productName && set.add(e.productName));
    return Array.from(set);
  }, [experiments, labTests, stabilityLogs, fieldTrials, observations]);

  return (
    <ExperimentContext.Provider
      value={{
        experiments,
        labTests,
        stabilityLogs,
        fieldTrials,
        observations,
        addExperiment,
        addLabTest,
        addStabilityLog,
        addFieldTrial,
        addObservation,
        addDailyRun,
        updateScientificConclusion,
        deleteExperiment,
        deleteLabTest,
        deleteStabilityLog,
        deleteFieldTrial,
        deleteObservation,
        allProducts,
      }}
    >
      {children}
    </ExperimentContext.Provider>
  );
};

export const useExperiments = (): ExperimentContextType => {
  const context = useContext(ExperimentContext);
  if (!context) {
    throw new Error('useExperiments must be used within an ExperimentProvider');
  }
  return context;
};
