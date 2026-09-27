import { ExternalFieldTrial, ExternalProject } from '../types/trialIntegrationTypes';
import { DailyLog } from '../types';
import { Experiment, LabTest, StabilityLog, ObservationItem, ScientificFormulation, WeeklyMISReport } from '../types/experimentTypes';
import { GlobalTask } from '../types/taskTypes';

export interface ScientistIdentity {
  id?: string | null;
  uid?: string | null;
  email?: string | null;
  name?: string | null;
  displayName?: string | null;
}

/**
 * Normalizes email or name handle to clean capitalized display name
 */
export const formatCleanScientistName = (raw?: string): string => {
  if (!raw || raw.trim() === '') return 'Scientist';
  const clean = raw.trim();

  // If email, extract prefix
  if (clean.includes('@')) {
    const handle = clean.split('@')[0];
    return handle
      .split(/[._-]/)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(' ');
  }

  // If standard name, capitalize words
  return clean
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

/**
 * Extracts a normalized matching handle from email, id, or name
 */
export const extractScientistHandle = (str?: string): string => {
  if (!str) return '';
  const clean = str.toLowerCase().trim();
  if (clean.includes('@')) {
    return clean.split('@')[0].split(/[._-]/)[0];
  }
  return clean.split(/\s+/)[0];
};

export interface MatchTarget {
  name?: string;
  email?: string;
  uid?: string;
  userId?: string;
  userEmail?: string;
  userName?: string;
  scientistName?: string;
  scientistId?: string;
  creatorEmail?: string;
  creatorUid?: string;
  createdBy?: string;
  author?: string;
  evaluatedBy?: string;
  preparedBy?: string;
  responsiblePerson?: string;
  assignedTo?: string;
  assignedToName?: string;
  leadScientistUid?: string;
  leadScientistName?: string;
}

/**
 * Robust matching between a scientist identity and any record's scientist/user fields
 */
export const matchesScientist = (
  scientist: ScientistIdentity | string,
  target: MatchTarget
): boolean => {
  const sciObj: ScientistIdentity =
    typeof scientist === 'string'
      ? {
          id: scientist,
          email: scientist.includes('@') ? scientist : undefined,
          name: !scientist.includes('@') ? scientist : undefined,
        }
      : scientist;

  const sId = (sciObj.id || sciObj.uid || '').toLowerCase().trim();
  const sEmail = (sciObj.email || '').toLowerCase().trim();
  const sName = (sciObj.name || sciObj.displayName || '').toLowerCase().trim();
  const sHandle = sEmail ? extractScientistHandle(sEmail) : (sName ? extractScientistHandle(sName) : sId);

  // Target IDs
  const tIds = [target.uid, target.userId, target.creatorUid, target.scientistId, target.leadScientistUid]
    .filter(Boolean)
    .map((x) => String(x).toLowerCase().trim());

  // Target Emails
  const tEmails = [target.email, target.userEmail, target.creatorEmail]
    .filter(Boolean)
    .map((x) => String(x).toLowerCase().trim());

  // Target Names & handles
  const tNames = [
    target.name,
    target.userName,
    target.scientistName,
    target.leadScientistName,
    target.createdBy,
    target.author,
    target.evaluatedBy,
    target.preparedBy,
    target.responsiblePerson,
    target.assignedToName,
    target.assignedTo,
  ]
    .filter(Boolean)
    .map((x) => String(x).toLowerCase().trim());

  // 1. Direct UID / ID match
  if (sId && tIds.some((t) => t === sId || t.includes(sId) || sId.includes(t))) return true;

  // 2. Direct Email match
  if (sEmail && tEmails.some((t) => t === sEmail || t.includes(sEmail) || sEmail.includes(t))) return true;

  // 3. Handle in target email (e.g. "pavan" in "pavan@miklensbio.com")
  if (sHandle && tEmails.some((t) => t.includes(sHandle))) return true;

  // 4. Handle in target IDs (e.g. "pavan" in "user-pavan-01")
  if (sHandle && tIds.some((t) => t.includes(sHandle))) return true;

  // 5. Full name direct or substring match
  if (sName && tNames.some((t) => t === sName || t.includes(sName) || sName.includes(t))) return true;

  // 6. Handle match in target names
  if (
    sHandle &&
    tNames.some((t) => {
      const tH = extractScientistHandle(t);
      return tH === sHandle || t.includes(sHandle) || sHandle.includes(tH);
    })
  ) {
    return true;
  }

  return false;
};

/**
 * Filter field trials specifically belonging to a scientist
 */
export const getScientistTrials = (
  scientist: ScientistIdentity | string,
  trials: ExternalFieldTrial[]
): ExternalFieldTrial[] => {
  return (trials || []).filter((t) =>
    matchesScientist(scientist, {
      scientistName: t.scientistName,
      creatorEmail: t.creatorEmail,
      creatorUid: t.creatorUid,
      assignedTo: (t as any).assignedTo,
      evaluatedBy: t.evaluations?.[0]?.evaluatedBy,
    })
  );
};

/**
 * Filter daily research logs specifically belonging to a scientist
 */
export const getScientistLogs = (
  scientist: ScientistIdentity | string,
  logs: DailyLog[]
): DailyLog[] => {
  return (logs || []).filter((l) =>
    matchesScientist(scientist, {
      userId: l.userId,
      userEmail: (l as any).userEmail,
      userName: (l as any).userName || (l as any).scientistName,
      scientistName: (l as any).scientistName,
    })
  );
};

/**
 * Filter experiments & lab tests for a scientist
 */
export const getScientistLabWork = (
  scientist: ScientistIdentity | string,
  experiments: Experiment[],
  labTests: LabTest[],
  stabilityLogs?: StabilityLog[]
) => {
  const checkDailyRuns = (runs?: any[]) => {
    if (!runs || !Array.isArray(runs)) return false;
    return runs.some((r) =>
      matchesScientist(scientist, {
        scientistName: r.scientistName,
        name: r.scientistName,
        userName: r.scientistName,
      })
    );
  };

  const matchedExp = (experiments || []).filter(
    (e) =>
      matchesScientist(scientist, {
        createdBy: (e as any).createdBy,
        author: (e as any).author,
        scientistName: (e as any).scientistName,
        scientistId: (e as any).scientistId,
        assignedTo: (e as any).assignedTo,
        assignedToName: (e as any).assignedToName,
      }) || checkDailyRuns(e.dailyRuns)
  );

  const matchedLab = (labTests || []).filter(
    (l) =>
      matchesScientist(scientist, {
        createdBy: (l as any).createdBy,
        author: (l as any).author,
        scientistName: (l as any).scientistName,
        scientistId: (l as any).scientistId,
        assignedTo: (l as any).assignedTo,
        assignedToName: (l as any).assignedToName,
      }) || checkDailyRuns(l.dailyRuns)
  );

  const matchedStab = (stabilityLogs || []).filter(
    (s) =>
      matchesScientist(scientist, {
        createdBy: (s as any).createdBy,
        author: (s as any).author,
        scientistName: (s as any).scientistName,
        scientistId: (s as any).scientistId,
        assignedTo: (s as any).assignedTo,
        assignedToName: (s as any).assignedToName,
      }) || checkDailyRuns(s.dailyRuns)
  );

  return {
    experiments: matchedExp,
    labTests: matchedLab,
    stabilityLogs: matchedStab,
  };
};

/**
 * Filter formulations developed or field-tested by a scientist
 */
export const getScientistFormulations = (
  scientist: ScientistIdentity | string,
  scientificFormulations: ScientificFormulation[],
  syncedTrials?: ExternalFieldTrial[]
): ScientificFormulation[] => {
  const directMatches = (scientificFormulations || []).filter((f) =>
    matchesScientist(scientist, {
      createdBy: f.createdBy,
      author: f.createdBy,
      scientistName: f.createdBy,
      userName: f.createdBy,
      name: f.createdBy,
      email: f.createdBy,
    })
  );

  const myTrials = syncedTrials ? getScientistTrials(scientist, syncedTrials) : [];
  const myTrialProducts = new Set(
    myTrials.map((t) => (t.productName || t.title || '').toLowerCase().trim())
  );

  const trialMatches = (scientificFormulations || []).filter((f) => {
    if (directMatches.some((dm) => dm.id === f.id)) return false;
    const fName = (f.name || '').toLowerCase().trim();
    const fId = (f.formulationId || '').toLowerCase().trim();
    return Array.from(myTrialProducts).some(
      (tp) => (fName && tp.includes(fName)) || (fId && tp.includes(fId))
    );
  });

  return [...directMatches, ...trialMatches];
};

/**
 * Filter weekly MIS reports prepared by or involving this scientist
 */
export const getScientistMISReports = (
  scientist: ScientistIdentity | string,
  reports: WeeklyMISReport[]
): WeeklyMISReport[] => {
  return (reports || []).filter(
    (r) =>
      matchesScientist(scientist, {
        preparedBy: r.preparedBy,
        name: r.preparedBy,
        userName: r.preparedBy,
        scientistName: r.preparedBy,
        author: r.preparedBy,
      }) ||
      r.actionsForNextWeek?.some((a) =>
        matchesScientist(scientist, {
          responsiblePerson: a.responsiblePerson,
          name: a.responsiblePerson,
        })
      )
  );
};

/**
 * Filter synced projects led by this scientist
 */
export const getScientistProjects = (
  scientist: ScientistIdentity | string,
  projects: ExternalProject[],
  _trials?: any[]
): ExternalProject[] => {
  return (projects || []).filter((p) =>
    matchesScientist(scientist, {
      uid: p.leadScientistUid,
      creatorUid: p.leadScientistUid,
      name: p.leadScientistName,
      scientistName: p.leadScientistName,
      leadScientistName: p.leadScientistName,
      leadScientistUid: p.leadScientistUid,
    })
  );
};

/**
 * Filter global tasks assigned to this scientist
 */
export const getScientistTasks = (
  scientist: ScientistIdentity | string,
  tasks: GlobalTask[]
): GlobalTask[] => {
  return (tasks || []).filter((t: any) =>
    matchesScientist(scientist, {
      userId: t.assignedToUserId || t.assignedTo,
      uid: t.assignedToUserId || t.assignedTo,
      assignedTo: t.assignedToUserId || t.assignedTo,
      name: t.assignedToName,
      userName: t.assignedToName,
      assignedToName: t.assignedToName,
      creatorUid: t.createdBy,
    })
  );
};

/**
 * Filter observations recorded by or related to a scientist's trials
 */
export const getScientistObservations = (
  scientist: ScientistIdentity | string,
  observations: ObservationItem[],
  syncedTrials?: ExternalFieldTrial[]
): ObservationItem[] => {
  const directMatches = (observations || []).filter((o) =>
    matchesScientist(scientist, {
      name: (o as any).scientistName || (o as any).recordedBy || (o as any).createdBy,
      userName: (o as any).scientistName || (o as any).recordedBy || (o as any).createdBy,
      creatorUid: (o as any).creatorUid || (o as any).userId,
    })
  );

  const myTrials = syncedTrials ? getScientistTrials(scientist, syncedTrials) : [];
  const myTrialProducts = new Set(
    myTrials.map((t) => (t.productName || t.title || '').toLowerCase().trim())
  );

  const productMatches = (observations || []).filter((o) => {
    if (directMatches.some((dm) => dm.id === o.id)) return false;
    const pName = (o.productName || '').toLowerCase().trim();
    return Array.from(myTrialProducts).some((tp) => pName && tp.includes(pName));
  });

  return [...directMatches, ...productMatches];
};
