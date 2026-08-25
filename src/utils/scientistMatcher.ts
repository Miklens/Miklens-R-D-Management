import { ExternalFieldTrial } from '../types/trialIntegrationTypes';
import { DailyLog } from '../types';
import { Experiment, LabTest, StabilityLog } from '../types/experimentTypes';

export interface ScientistIdentity {
  id?: string;
  uid?: string;
  email?: string;
  name?: string;
  displayName?: string;
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

/**
 * Robust matching between a scientist identity and any record's scientist/user fields
 */
export const matchesScientist = (
  scientist: ScientistIdentity | string,
  target: {
    name?: string;
    email?: string;
    uid?: string;
    userId?: string;
    userEmail?: string;
    userName?: string;
    scientistName?: string;
    creatorEmail?: string;
    creatorUid?: string;
    assignedTo?: string;
  }
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

  // Target fields
  const tId = (target.uid || target.userId || target.creatorUid || '').toLowerCase().trim();
  const tEmail = (target.email || target.userEmail || target.creatorEmail || target.assignedTo || '').toLowerCase().trim();
  const tName = (target.name || target.userName || target.scientistName || '').toLowerCase().trim();
  const tHandle = tEmail ? extractScientistHandle(tEmail) : (tName ? extractScientistHandle(tName) : tId);

  // Direct UID / ID match
  if (sId && tId && (sId === tId || tId.includes(sId) || sId.includes(tId))) return true;

  // Direct Email match
  if (sEmail && tEmail && (sEmail === tEmail || tEmail.includes(sEmail) || sEmail.includes(tEmail))) return true;

  // Handle match (e.g. "pavan" matches "pavan@miklens.com" or "Pavan Dev")
  if (sHandle && (tEmail.includes(sHandle) || tName.includes(sHandle) || tId.includes(sHandle))) return true;
  if (tHandle && (sEmail.includes(tHandle) || sName.includes(tHandle) || sId.includes(tHandle))) return true;

  // Full name fuzzy match
  if (sName && tName && (sName.includes(tName) || tName.includes(sName))) return true;

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
  const matchedExp = (experiments || []).filter((e) =>
    matchesScientist(scientist, {
      name: e.name,
      assignedTo: (e as any).assignedTo,
      userName: (e as any).author,
    })
  );

  const matchedLab = (labTests || []).filter((l) =>
    matchesScientist(scientist, {
      name: l.name,
      assignedTo: (l as any).assignedTo,
      userName: (l as any).author,
    })
  );

  const matchedStab = (stabilityLogs || []).filter((s) =>
    matchesScientist(scientist, {
      name: s.productName,
      assignedTo: (s as any).assignedTo,
      userName: (s as any).author,
    })
  );

  return {
    experiments: matchedExp,
    labTests: matchedLab,
    stabilityLogs: matchedStab,
  };
};
