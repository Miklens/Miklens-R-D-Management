import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

export interface DailyLogData {
  productId: string;
  experimentId: string;
  todaysObjective: string;
  activitiesPerformed: string;
  observations: string;
  problems: string;
  achievements: string;
  nextSteps: string;
  timeSpentMinutes: number;
  completionStatus: string;
  estimatedProductStage: string;
  confidenceLevel: number;
}

export const createDailyLog = async (userId: string, data: DailyLogData) => {
  const logsRef = collection(db, 'daily_logs');

  // The Firebase trigger in Phase 9 will pick up this document creation
  // and append `aiNotes` automatically.
  return await addDoc(logsRef, {
    ...data,
    userId,
    date: serverTimestamp(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
};
