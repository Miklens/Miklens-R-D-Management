// Time Motion Tracking Service - Firebase Operations
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  getDocs,
  getDoc,
  Timestamp,
  limit,
  startAfter,
  endBefore,
  or,
  and
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { 
  TimeMotionEntry, 
  ActivityCategory, 
  DailyTimeSummary, 
  ProjectProgress,
  AttachedDocument
} from '../types/timeTracking';
import { v4 as uuidv4 } from 'uuid';

const TIME_ENTRIES_COLLECTION = 'timeMotionEntries';

// Helper to convert Firestore doc to TimeMotionEntry
const convertToTimeMotionEntry = (doc: any): TimeMotionEntry => {
  const data = doc.data();
  return {
    id: doc.id,
    ...data,
    attachments: data.attachments || [],
    createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
    updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
  };
};

// Create a new time motion entry
export const createTimeMotionEntry = async (
  entry: Omit<TimeMotionEntry, 'id' | 'createdAt' | 'updatedAt'>
): Promise<TimeMotionEntry> => {
  const now = new Date().toISOString();
  const newEntry = {
    ...entry,
    id: uuidv4(),
    createdAt: now,
    updatedAt: now,
  };

  const docRef = await addDoc(collection(db, TIME_ENTRIES_COLLECTION), newEntry);
  return { ...newEntry, id: docRef.id };
};

// Update an existing time motion entry
export const updateTimeMotionEntry = async (
  id: string,
  updates: Partial<TimeMotionEntry>
): Promise<void> => {
  const docRef = doc(db, TIME_ENTRIES_COLLECTION, id);
  await updateDoc(docRef, {
    ...updates,
    updatedAt: new Date().toISOString(),
  });
};

// Delete a time motion entry
export const deleteTimeMotionEntry = async (id: string): Promise<void> => {
  const docRef = doc(db, TIME_ENTRIES_COLLECTION, id);
  await deleteDoc(docRef);
};

// Get a single time motion entry by ID
export const getTimeMotionEntry = async (id: string): Promise<TimeMotionEntry | null> => {
  const docRef = doc(db, TIME_ENTRIES_COLLECTION, id);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    return convertToTimeMotionEntry(docSnap);
  }
  return null;
};

// Get time entries for a scientist on a specific date
export const getEntriesByScientistAndDate = async (
  scientistId: string,
  date: string
): Promise<TimeMotionEntry[]> => {
  const q = query(
    collection(db, TIME_ENTRIES_COLLECTION),
    where('scientistId', '==', scientistId),
    where('date', '==', date),
    orderBy('startTime', 'asc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(convertToTimeMotionEntry);
};

// Get time entries for a scientist in a date range
export const getEntriesByScientistAndDateRange = async (
  scientistId: string,
  startDate: string,
  endDate: string
): Promise<TimeMotionEntry[]> => {
  const q = query(
    collection(db, TIME_ENTRIES_COLLECTION),
    where('scientistId', '==', scientistId),
    where('date', '>=', startDate),
    where('date', '<=', endDate),
    orderBy('date', 'asc'),
    orderBy('startTime', 'asc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(convertToTimeMotionEntry);
};

// Get all time entries for a scientist
export const getEntriesByScientist = async (
  scientistId: string,
  limitCount: number = 100
): Promise<TimeMotionEntry[]> => {
  const q = query(
    collection(db, TIME_ENTRIES_COLLECTION),
    where('scientistId', '==', scientistId),
    orderBy('date', 'desc'),
    orderBy('startTime', 'asc'),
    limit(limitCount)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(convertToTimeMotionEntry);
};

// Get time entries by category
export const getEntriesByCategory = async (
  category: ActivityCategory,
  startDate?: string,
  endDate?: string
): Promise<TimeMotionEntry[]> => {
  let constraints: any[] = [where('category', '==', category)];
  
  if (startDate) {
    constraints.push(where('date', '>=', startDate));
  }
  if (endDate) {
    constraints.push(where('date', '<=', endDate));
  }
  
  constraints.push(orderBy('date', 'desc'));

  const q = query(collection(db, TIME_ENTRIES_COLLECTION), ...constraints);
  const snapshot = await getDocs(q);
  return snapshot.docs.map(convertToTimeMotionEntry);
};

// Get time entries linked to a specific project
export const getEntriesByProject = async (
  projectId: string
): Promise<TimeMotionEntry[]> => {
  const q = query(
    collection(db, TIME_ENTRIES_COLLECTION),
    where('projectId', '==', projectId),
    orderBy('date', 'desc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(convertToTimeMotionEntry);
};

// Get all entries for a specific date (for daily overview)
export const getEntriesByDate = async (date: string): Promise<TimeMotionEntry[]> => {
  const q = query(
    collection(db, TIME_ENTRIES_COLLECTION),
    where('date', '==', date),
    orderBy('startTime', 'asc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(convertToTimeMotionEntry);
};

// Get recent entries across all scientists
export const getRecentEntries = async (
  limitCount: number = 50
): Promise<TimeMotionEntry[]> => {
  const q = query(
    collection(db, TIME_ENTRIES_COLLECTION),
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(convertToTimeMotionEntry);
};

// Calculate daily time summary for a scientist
export const getDailyTimeSummary = async (
  scientistId: string,
  date: string
): Promise<DailyTimeSummary> => {
  const entries = await getEntriesByScientistAndDate(scientistId, date);
  
  const byCategory: Record<ActivityCategory, number> = {
    research: 0,
    document: 0,
    trials: 0,
    experiments: 0,
    lab: 0,
    meetings: 0,
    discussions: 0,
    field_visits: 0,
    other: 0,
  };

  const projectsWorked: string[] = [];
  let totalMinutes = 0;

  entries.forEach(entry => {
    totalMinutes += entry.durationMinutes;
    byCategory[entry.category] += entry.durationMinutes;
    
    if (entry.projectId && !projectsWorked.includes(entry.projectId)) {
      projectsWorked.push(entry.projectId);
    }
  });

  // Get scientist name from the first entry
  const scientistName = entries[0]?.scientistName || '';

  return {
    date,
    scientistId,
    scientistName,
    totalMinutes,
    byCategory,
    projectsWorked,
    entriesCount: entries.length,
  };
};

// Calculate project progress for a scientist
export const getProjectProgressForScientist = async (
  scientistId: string
): Promise<ProjectProgress[]> => {
  const entries = await getEntriesByScientist(scientistId, 500);
  
  const projectMap = new Map<string, ProjectProgress>();

  entries.forEach(entry => {
    if (entry.projectId) {
      const existing = projectMap.get(entry.projectId);
      if (existing) {
        existing.hoursSpent += entry.durationMinutes / 60;
        if (entry.projectStage) {
          existing.progressPercent = getStageProgress(entry.projectStage);
          existing.stage = entry.projectStage;
        }
        if (new Date(entry.date) > new Date(existing.lastActivityDate)) {
          existing.lastActivityDate = entry.date;
        }
      } else {
        projectMap.set(entry.projectId, {
          projectId: entry.projectId,
          projectName: entry.projectName || 'Unknown Project',
          stage: (entry.projectStage as any) || 'concept',
          progressPercent: getStageProgress(entry.projectStage || 'concept'),
          hoursSpent: entry.durationMinutes / 60,
          lastActivityDate: entry.date,
          status: 'active',
        });
      }
    }
  });

  return Array.from(projectMap.values()).sort((a, b) => 
    new Date(b.lastActivityDate).getTime() - new Date(a.lastActivityDate).getTime()
  );
};

// Helper function to get progress percentage from stage
const getStageProgress = (stage: string): number => {
  const stageProgress: Record<string, number> = {
    concept: 10,
    mis: 25,
    design: 40,
    development: 60,
    testing: 75,
    pilot: 90,
    production: 95,
    completed: 100,
  };
  return stageProgress[stage] || 0;
};

// Add attachments to an entry
export const addAttachmentsToEntry = async (
  entryId: string,
  attachments: AttachedDocument[]
): Promise<void> => {
  const docRef = doc(db, TIME_ENTRIES_COLLECTION, entryId);
  const entry = await getTimeMotionEntry(entryId);
  
  if (entry) {
    const updatedAttachments = [...entry.attachments, ...attachments];
    await updateDoc(docRef, {
      attachments: updatedAttachments,
      updatedAt: new Date().toISOString(),
    });
  }
};

// Remove attachment from an entry
export const removeAttachmentFromEntry = async (
  entryId: string,
  attachmentId: string
): Promise<void> => {
  const docRef = doc(db, TIME_ENTRIES_COLLECTION, entryId);
  const entry = await getTimeMotionEntry(entryId);
  
  if (entry) {
    const updatedAttachments = entry.attachments.filter(a => a.id !== attachmentId);
    await updateDoc(docRef, {
      attachments: updatedAttachments,
      updatedAt: new Date().toISOString(),
    });
  }
};

// Get all scientists who have entries
export const getActiveScientists = async (): Promise<{ id: string; name: string }[]> => {
  const q = query(
    collection(db, TIME_ENTRIES_COLLECTION),
    orderBy('scientistName', 'asc')
  );

  const snapshot = await getDocs(q);
  const scientistMap = new Map<string, string>();
  
  snapshot.docs.forEach(doc => {
    const data = doc.data();
    if (data.scientistId && data.scientistName) {
      scientistMap.set(data.scientistId, data.scientistName);
    }
  });

  return Array.from(scientistMap.entries()).map(([id, name]) => ({ id, name }));
};

// Get total hours worked by a scientist in a date range
export const getTotalHoursWorked = async (
  scientistId: string,
  startDate: string,
  endDate: string
): Promise<number> => {
  const entries = await getEntriesByScientistAndDateRange(scientistId, startDate, endDate);
  return entries.reduce((total, entry) => total + entry.durationMinutes, 0) / 60;
};