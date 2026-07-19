// Unified Activity Service - Links Everything About Scientists
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
  limit,
  or,
  and
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { 
  UnifiedActivity, 
  ScientistDashboardStats, 
  WeeklySummary,
  LinkedEntity,
  ActivityType
} from '../types/unifiedTracking';
import { v4 as uuidv4 } from 'uuid';

const UNIFIED_ACTIVITIES_COLLECTION = 'unifiedActivities';

// Create a new unified activity
export const createUnifiedActivity = async (
  activity: Omit<UnifiedActivity, 'id' | 'createdAt' | 'updatedAt'>
): Promise<UnifiedActivity> => {
  const now = new Date().toISOString();
  const newActivity = {
    ...activity,
    id: uuidv4(),
    createdAt: now,
    updatedAt: now,
  };

  const docRef = await addDoc(collection(db, UNIFIED_ACTIVITIES_COLLECTION), newActivity);
  return { ...newActivity, id: docRef.id };
};

// Update activity
export const updateUnifiedActivity = async (
  id: string,
  updates: Partial<UnifiedActivity>
): Promise<void> => {
  const docRef = doc(db, UNIFIED_ACTIVITIES_COLLECTION, id);
  await updateDoc(docRef, {
    ...updates,
    updatedAt: new Date().toISOString(),
  });
};

// Delete activity
export const deleteUnifiedActivity = async (id: string): Promise<void> => {
  const docRef = doc(db, UNIFIED_ACTIVITIES_COLLECTION, id);
  await deleteDoc(docRef);
};

// Get activities by scientist for a date range
export const getActivitiesByScientist = async (
  scientistId: string,
  startDate: string,
  endDate: string
): Promise<UnifiedActivity[]> => {
  const q = query(
    collection(db, UNIFIED_ACTIVITIES_COLLECTION),
    where('scientistId', '==', scientistId),
    where('date', '>=', startDate),
    where('date', '<=', endDate),
    orderBy('date', 'desc'),
    orderBy('startTime', 'asc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UnifiedActivity));
};

// Get today's activities for a scientist
export const getTodayActivities = async (scientistId: string): Promise<UnifiedActivity[]> => {
  const today = new Date().toISOString().split('T')[0];
  return getActivitiesByScientist(scientistId, today, today);
};

// Get activities linked to a specific entity
export const getActivitiesByEntity = async (
  entityType: string,
  entityId: string
): Promise<UnifiedActivity[]> => {
  // Search across all linked entity arrays
  const collections = ['linkedProjects', 'linkedExperiments', 'linkedFieldTrials', 'linkedLabTests', 'linkedTasks', 'linkedProducts'];
  
  let allActivities: UnifiedActivity[] = [];
  
  for (const col of collections) {
    const q = query(
      collection(db, UNIFIED_ACTIVITIES_COLLECTION),
      where(col, 'array-contains', { type: entityType, id: entityId })
    );
    
    const snapshot = await getDocs(q);
    const activities = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UnifiedActivity));
    allActivities = [...allActivities, ...activities];
  }
  
  // Remove duplicates
  const unique = Array.from(new Map(allActivities.map(a => [a.id, a])).values());
  return unique.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

// Get dashboard stats for a scientist
export const getScientistDashboardStats = async (
  scientistId: string
): Promise<ScientistDashboardStats> => {
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - 7);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const weekStartStr = weekStart.toISOString().split('T')[0];
  const monthStartStr = monthStart.toISOString().split('T')[0];
  const todayStr = now.toISOString().split('T')[0];

  // Get all activities for the month
  const monthlyActivities = await getActivitiesByScientist(scientistId, monthStartStr, todayStr);
  const weeklyActivities = monthlyActivities.filter(a => a.date >= weekStartStr);

  // Calculate stats
  const totalMinutesMonth = monthlyActivities.reduce((sum, a) => sum + (a.durationMinutes || 0), 0);
  const totalMinutesWeek = weeklyActivities.reduce((sum, a) => sum + (a.durationMinutes || 0), 0);
  
  const workingDaysMonth = new Set(monthlyActivities.map(a => a.date)).size || 1;
  const workingDaysWeek = new Set(weeklyActivities.map(a => a.date)).size || 1;

  // Count by type
  const countByType = (activities: UnifiedActivity[], field: string): number => {
    return activities.filter(a => 
      (a.linkedProjects?.length || 0) > 0 ||
      (a.linkedExperiments?.length || 0) > 0 ||
      (a.linkedFieldTrials?.length || 0) > 0
    ).length;
  };

  const activeProjects = new Set<string>();
  const completedProjects = new Set<string>();
  const experimentsWorked = new Set<string>();
  const experimentsCompleted = new Set<string>();
  const fieldDays = new Set<string>();
  const labDays = new Set<string>();
  const tasksCompleted = new Set<string>();
  let documentsCreated = 0;
  let billableMinutes = 0;
  let tasksPending = 0;

  monthlyActivities.forEach(a => {
    // Projects
    a.linkedProjects?.forEach(p => {
      activeProjects.add(p.id);
      if (p.status === 'completed') completedProjects.add(p.id);
    });
    
    // Experiments
    a.linkedExperiments?.forEach(e => {
      experimentsWorked.add(e.id);
      if (e.status === 'completed') experimentsCompleted.add(e.id);
    });
    
    // Field/Lab days
    if (a.isFieldWork) fieldDays.add(a.date);
    if (a.isLabWork) labDays.add(a.date);
    
    // Tasks
    if (a.activityType === 'task') {
      if (a.completionStatus === 'completed') tasksCompleted.add(a.id);
      if (a.completionStatus === 'in_progress' || a.completionStatus === 'not_started') tasksPending++;
    }
    
    // Documents
    if (a.activityType === 'document' || (a.attachments?.length || 0) > 0) {
      documentsCreated += (a.attachments?.length || 0) || 1;
    }
    
    // Billable
    if (a.isBillable) billableMinutes += a.durationMinutes || 0;
  });

  return {
    scientistId,
    scientistName: monthlyActivities[0]?.scientistName || 'Unknown',
    totalHoursThisWeek: totalMinutesWeek / 60,
    totalHoursThisMonth: totalMinutesMonth / 60,
    averageDailyHours: (totalMinutesMonth / 60) / workingDaysMonth,
    totalActivitiesThisWeek: weeklyActivities.length,
    totalActivitiesThisMonth: monthlyActivities.length,
    activeProjectsCount: activeProjects.size,
    completedProjectsCount: completedProjects.size,
    experimentsWorkedOn: experimentsWorked.size,
    experimentsCompleted: experimentsCompleted.size,
    fieldDaysThisMonth: fieldDays.size,
    labDaysThisMonth: labDays.size,
    tasksCompleted: tasksCompleted.size,
    tasksPending,
    onTimeCompletionRate: 85, // Could calculate based on deadlines
    documentsCreated,
    billableHoursThisMonth: billableMinutes / 60,
    billablePercentage: totalMinutesMonth > 0 ? Math.round((billableMinutes / totalMinutesMonth) * 100) : 0
  };
};

// Get weekly summary
export const getWeeklySummary = async (
  scientistId: string,
  weekStart: Date
): Promise<WeeklySummary> => {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  const startStr = weekStart.toISOString().split('T')[0];
  const endStr = weekEnd.toISOString().split('T')[0];

  const activities = await getActivitiesByScientist(scientistId, startStr, endStr);

  // Calculate breakdowns
  const hoursByCategory: Record<string, number> = {};
  const hoursByProject: Record<string, number> = {};
  const hoursByDay: Record<string, number> = {};
  const activitiesByType: Record<string, number> = {};
  
  let fieldHours = 0;
  let labHours = 0;
  let officeHours = 0;
  
  const projectsUpdated = new Set<string>();
  const projectsCompleted = new Set<string>();
  const experimentsWorked = new Set<string>();
  const experimentsCompleted = new Set<string>();
  
  let tasksCompleted = 0;
  let tasksCreated = 0;

  activities.forEach(a => {
    const mins = a.durationMinutes || 0;
    const hours = mins / 60;

    // Time by category
    const cat = a.category || 'other';
    hoursByCategory[cat] = (hoursByCategory[cat] || 0) + hours;

    // Time by day
    hoursByDay[a.date] = (hoursByDay[a.date] || 0) + hours;

    // Time by activity type
    activitiesByType[a.activityType] = (activitiesByType[a.activityType] || 0) + 1;

    // Work type
    if (a.isFieldWork) fieldHours += hours;
    else if (a.isLabWork) labHours += hours;
    else officeHours += hours;

    // Projects
    a.linkedProjects?.forEach(p => {
      hoursByProject[p.name] = (hoursByProject[p.name] || 0) + hours;
      projectsUpdated.add(p.name);
      if (p.status === 'completed') projectsCompleted.add(p.name);
    });

    // Experiments
    a.linkedExperiments?.forEach(e => {
      experimentsWorked.add(e.name);
      if (e.status === 'completed') experimentsCompleted.add(e.name);
    });

    // Tasks
    if (a.activityType === 'task') {
      if (a.completionStatus === 'completed') tasksCompleted++;
      tasksCreated++;
    }
  });

  const totalHours = activities.reduce((sum, a) => sum + (a.durationMinutes || 0), 0) / 60;

  // AI Summary (placeholder - could integrate with real AI)
  const aiWeeklySummary = `This week you worked ${totalHours.toFixed(1)} hours across ${activities.length} activities. ` +
    `Your primary focus was on ${Object.entries(hoursByCategory).sort((a, b) => b[1] - a[1])[0]?.[0] || 'various activities'}. ` +
    `You made progress on ${projectsUpdated.size} project(s) and completed ${tasksCompleted} task(s).`;

  return {
    weekStart: startStr,
    weekEnd: endStr,
    scientistId,
    totalHours,
    hoursByCategory,
    hoursByProject,
    hoursByDay,
    activitiesByType,
    fieldHours,
    labHours,
    officeHours,
    projectsUpdated: Array.from(projectsUpdated),
    projectsCompleted: Array.from(projectsCompleted),
    experimentsWorked: Array.from(experimentsWorked),
    experimentsCompleted: Array.from(experimentsCompleted),
    tasksCompleted,
    tasksCreated,
    aiWeeklySummary,
    topAchievements: [
      `Completed ${tasksCompleted} tasks`,
      `Worked on ${projectsUpdated.size} projects`,
      `${fieldHours.toFixed(1)}h in field, ${labHours.toFixed(1)}h in lab`
    ],
    areasForImprovement: [
      totalHours < 40 ? 'Consider increasing weekly hours' : null,
      tasksPending > 5 ? 'Follow up on pending tasks' : null
    ].filter(Boolean) as string[]
  };
};

// Search activities
export const searchActivities = async (
  scientistId: string,
  searchTerm: string
): Promise<UnifiedActivity[]> => {
  // Get recent activities and filter locally (full-text search would need Algolia/Elasticsearch)
  const q = query(
    collection(db, UNIFIED_ACTIVITIES_COLLECTION),
    where('scientistId', '==', scientistId),
    orderBy('date', 'desc'),
    limit(100)
  );

  const snapshot = await getDocs(q);
  const searchLower = searchTerm.toLowerCase();
  
  return snapshot.docs
    .map(doc => ({ id: doc.id, ...doc.data() } as UnifiedActivity))
    .filter(a => 
      a.title.toLowerCase().includes(searchLower) ||
      a.description.toLowerCase().includes(searchLower) ||
      a.notes?.toLowerCase().includes(searchLower) ||
      a.linkedProjects?.some(p => p.name.toLowerCase().includes(searchLower)) ||
      a.linkedExperiments?.some(e => e.name.toLowerCase().includes(searchLower))
    );
};

// Link existing time entry to entities
export const linkTimeEntryToEntities = async (
  timeEntryId: string,
  entities: {
    projects?: LinkedEntity[];
    experiments?: LinkedEntity[];
    fieldTrials?: LinkedEntity[];
    labTests?: LinkedEntity[];
    tasks?: LinkedEntity[];
    products?: LinkedEntity[];
  }
): Promise<void> => {
  const updates: Partial<UnifiedActivity> = {};
  
  if (entities.projects) updates.linkedProjects = entities.projects;
  if (entities.experiments) updates.linkedExperiments = entities.experiments;
  if (entities.fieldTrials) updates.linkedFieldTrials = entities.fieldTrials;
  if (entities.labTests) updates.linkedLabTests = entities.labTests;
  if (entities.tasks) updates.linkedTasks = entities.tasks;
  if (entities.products) updates.linkedProducts = entities.products;

  await updateUnifiedActivity(timeEntryId, updates);
};

// Get all unique projects a scientist has worked on
export const getScientistProjects = async (scientistId: string): Promise<LinkedEntity[]> => {
  const q = query(
    collection(db, UNIFIED_ACTIVITIES_COLLECTION),
    where('scientistId', '==', scientistId),
    orderBy('date', 'desc'),
    limit(200)
  );

  const snapshot = await getDocs(q);
  const projectMap = new Map<string, LinkedEntity>();
  
  snapshot.docs.forEach(doc => {
    const data = doc.data() as UnifiedActivity;
    data.linkedProjects?.forEach(p => {
      if (!projectMap.has(p.id)) {
        projectMap.set(p.id, p);
      }
    });
  });

  return Array.from(projectMap.values());
};

// Get all experiments a scientist has worked on
export const getScientistExperiments = async (scientistId: string): Promise<LinkedEntity[]> => {
  const q = query(
    collection(db, UNIFIED_ACTIVITIES_COLLECTION),
    where('scientistId', '==', scientistId),
    orderBy('date', 'desc'),
    limit(200)
  );

  const snapshot = await getDocs(q);
  const experimentMap = new Map<string, LinkedEntity>();
  
  snapshot.docs.forEach(doc => {
    const data = doc.data() as UnifiedActivity;
    data.linkedExperiments?.forEach(e => {
      if (!experimentMap.has(e.id)) {
        experimentMap.set(e.id, e);
      }
    });
  });

  return Array.from(experimentMap.values());
};