/**
 * Universal Time & Duration Calculation Utility for Miklens R&D System
 * Calculates exact research hours logged based on:
 * 1. Log timeSpentMinutes (if recorded explicitly)
 * 2. Start & End Time difference (e.g. "09:00" to "17:00" = 480 mins / 8 hours)
 * 3. Default 0 if unrecorded
 */

export interface LogTimeSubject {
  timeSpentMinutes?: number;
  startTime?: string;
  endTime?: string;
}

/**
 * Calculates exact duration in minutes for a single daily research log
 */
export const calculateLogMinutes = (log?: LogTimeSubject | null): number => {
  if (!log) return 0;

  // 1. Explicit minutes check
  if (typeof log.timeSpentMinutes === 'number' && log.timeSpentMinutes > 0) {
    return log.timeSpentMinutes;
  }

  // 2. Parse startTime and endTime if available (e.g. "09:00" to "17:00")
  if (log.startTime && log.endTime) {
    const [startH, startM] = log.startTime.split(':').map(Number);
    const [endH, endM] = log.endTime.split(':').map(Number);
    if (!isNaN(startH) && !isNaN(endH)) {
      const startTotal = startH * 60 + (startM || 0);
      const endTotal = endH * 60 + (endM || 0);
      if (endTotal > startTotal) {
        return endTotal - startTotal;
      }
    }
  }

  return 0;
};

/**
 * Calculates total hours logged across an array of daily logs
 */
export const calculateTotalHours = (logs?: LogTimeSubject[] | null): number => {
  if (!logs || logs.length === 0) return 0;
  const totalMins = logs.reduce((sum, log) => sum + calculateLogMinutes(log), 0);
  return Math.round((totalMins / 60) * 10) / 10;
};

/**
 * Formats duration into clean human-readable hours string (e.g. "8.0h" or "4.5h")
 */
export const formatLogHours = (log?: LogTimeSubject | null): string => {
  const mins = calculateLogMinutes(log);
  if (mins === 0) return '0h';
  const hrs = Math.round((mins / 60) * 10) / 10;
  return `${hrs}h`;
};
