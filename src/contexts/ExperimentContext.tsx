import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import type { 
  ExperimentItem, 
  LabTestItem, 
  StabilityLogItem, 
  FieldTrialItem, 
  ObservationItem,
  ScientificOutcomeStatus,
  DataReading,
  ExperimentStatus
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

  toggleProtocolStep: (category: 'exp' | 'lab' | 'stability' | 'field', itemId: string, stepId: string) => void;
  addDataReading: (category: 'exp' | 'lab' | 'stability' | 'field', itemId: string, reading: Omit<DataReading, 'id' | 'timestamp'>) => void;
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
    const steps = item.protocolSteps || [
      { id: 's1', title: 'Preparation & Calibration', completed: false },
      { id: 's2', title: 'Execution & Treatment Assay', completed: false },
      { id: 's3', title: 'Data Measurement & Recording', completed: false },
      { id: 's4', title: 'Final Analysis & Conclusion', completed: false },
    ];
    const newItem: ExperimentItem = {
      ...item,
      id: `exp-${Date.now()}`,
      protocolSteps: steps,
      dataReadings: item.dataReadings || [],
      outcomeStatus: item.outcomeStatus || 'Pending',
      createdAt: new Date().toISOString(),
    };
    setExperiments((prev) => [newItem, ...prev]);
    return newItem;
  };

  const addLabTest = (item: Omit<LabTestItem, 'id' | 'createdAt'>): LabTestItem => {
    const steps = item.protocolSteps || [
      { id: 's1', title: 'Sample Preparation & Dilution', completed: false },
      { id: 's2', title: 'Incubation & Reagent Reaction', completed: false },
      { id: 's3', title: 'Assay Quantification', completed: false },
    ];
    const newItem: LabTestItem = {
      ...item,
      id: `lab-${Date.now()}`,
      protocolSteps: steps,
      dataReadings: item.dataReadings || [],
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
      protocolSteps: item.protocolSteps || [
        { id: 's1', title: 'Thermal Oven Setup', completed: true },
        { id: 's2', title: 'Interval Inspection', completed: false },
      ],
      dataReadings: item.dataReadings || [],
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
      protocolSteps: item.protocolSteps || [
        { id: 's1', title: 'Plot Delineation', completed: true },
        { id: 's2', title: 'Foliar Spray Application', completed: false },
        { id: 's3', title: 'Yield & Efficacy Logging', completed: false },
      ],
      dataReadings: item.dataReadings || [],
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

  // Toggle protocol step and auto-calculate progress %
  const toggleProtocolStep = (category: 'exp' | 'lab' | 'stability' | 'field', itemId: string, stepId: string) => {
    const updateItem = (item: any) => {
      const steps = (item.protocolSteps || []).map((s: any) =>
        s.id === stepId ? { ...s, completed: !s.completed } : s
      );
      const completedCount = steps.filter((s: any) => s.completed).length;
      const progress = steps.length > 0 ? Math.round((completedCount / steps.length) * 100) : item.progress;
      const status: ExperimentStatus = progress === 100 ? 'Completed' : progress > 0 ? 'InProgress' : 'Queued';

      return {
        ...item,
        protocolSteps: steps,
        progress,
        status,
      };
    };

    if (category === 'exp') setExperiments((prev) => prev.map((e) => (e.id === itemId ? updateItem(e) : e)));
    if (category === 'lab') setLabTests((prev) => prev.map((e) => (e.id === itemId ? updateItem(e) : e)));
    if (category === 'stability') setStabilityLogs((prev) => prev.map((e) => (e.id === itemId ? updateItem(e) : e)));
    if (category === 'field') setFieldTrials((prev) => prev.map((e) => (e.id === itemId ? updateItem(e) : e)));
  };

  // Add Data Reading
  const addDataReading = (
    category: 'exp' | 'lab' | 'stability' | 'field',
    itemId: string,
    reading: Omit<DataReading, 'id' | 'timestamp'>
  ) => {
    const newReading: DataReading = {
      ...reading,
      id: `rd-${Date.now()}`,
      timestamp: new Date().toLocaleString(),
    };

    const updateItem = (item: any) => ({
      ...item,
      dataReadings: [...(item.dataReadings || []), newReading],
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
      progress: outcomeStatus === 'Passed' ? 100 : item.progress,
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
        toggleProtocolStep,
        addDataReading,
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
