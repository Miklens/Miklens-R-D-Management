import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import type { 
  ExperimentItem, 
  LabTestItem, 
  StabilityLogItem, 
  FieldTrialItem, 
  ObservationItem 
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

  deleteExperiment: (id: string) => void;
  deleteLabTest: (id: string) => void;
  deleteStabilityLog: (id: string) => void;
  deleteFieldTrial: (id: string) => void;
  deleteObservation: (id: string) => void;

  allProducts: string[];
}

const ExperimentContext = createContext<ExperimentContextType | undefined>(undefined);

export const ExperimentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
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
      createdAt: new Date().toISOString(),
    };
    setExperiments((prev) => [newItem, ...prev]);
    return newItem;
  };

  const addLabTest = (item: Omit<LabTestItem, 'id' | 'createdAt'>): LabTestItem => {
    const newItem: LabTestItem = {
      ...item,
      id: `lab-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setLabTests((prev) => [newItem, ...prev]);
    return newItem;
  };

  const addStabilityLog = (item: Omit<StabilityLogItem, 'id' | 'createdAt'>): StabilityLogItem => {
    const newItem: StabilityLogItem = {
      ...item,
      id: `stab-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setStabilityLogs((prev) => [newItem, ...prev]);
    return newItem;
  };

  const addFieldTrial = (item: Omit<FieldTrialItem, 'id' | 'createdAt'>): FieldTrialItem => {
    const newItem: FieldTrialItem = {
      ...item,
      id: `field-${Date.now()}`,
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

  const deleteExperiment = (id: string) => setExperiments((prev) => prev.filter((e) => e.id !== id));
  const deleteLabTest = (id: string) => setLabTests((prev) => prev.filter((e) => e.id !== id));
  const deleteStabilityLog = (id: string) => setStabilityLogs((prev) => prev.filter((e) => e.id !== id));
  const deleteFieldTrial = (id: string) => setFieldTrials((prev) => prev.filter((e) => e.id !== id));
  const deleteObservation = (id: string) => setObservations((prev) => prev.filter((e) => e.id !== id));

  // Dynamic set of all product names
  const allProducts = useMemo(() => {
    const set = new Set<string>();
    set.add('BioShield Alpha (Bio-fungicide)');
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
