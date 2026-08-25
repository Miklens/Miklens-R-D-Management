import {
  ExternalFieldTrial,
  DateFilterRange,
  ScientistExecutiveProfile,
  TrialCategory,
  ComparativeProgress,
  ScientistBottleneck,
  ScientistInnovation,
  TodayProgress,
} from '../types/trialIntegrationTypes';
import { DailyLog } from '../types';
import { Experiment, LabTest } from '../types/experimentTypes';
import { matchesScientist, getScientistTrials, getScientistLogs } from '../utils/scientistMatcher';
import { parseISO, subDays, startOfWeek, endOfWeek, subWeeks, startOfMonth, endOfMonth, subMonths, format } from 'date-fns';

/**
 * Filter trials by Date Range selection
 */
export const filterTrialsByDateRange = (
  trials: ExternalFieldTrial[],
  filter: DateFilterRange
): ExternalFieldTrial[] => {
  const now = new Date();
  let start: Date;
  let end: Date = now;

  switch (filter.preset) {
    case 'today':
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case 'yesterday': {
      const y = subDays(now, 1);
      start = new Date(y.getFullYear(), y.getMonth(), y.getDate());
      end = new Date(y.getFullYear(), y.getMonth(), y.getDate(), 23, 59, 59);
      break;
    }
    case '7d':
      start = subDays(now, 7);
      break;
    case '30d':
      start = subDays(now, 30);
      break;
    case '90d':
      start = subDays(now, 90);
      break;
    case '6m':
      start = subDays(now, 180);
      break;
    case '1y':
      start = subDays(now, 365);
      break;
    case 'custom':
      if (filter.startDate) start = parseISO(filter.startDate);
      else start = subDays(now, 30);
      if (filter.endDate) end = parseISO(filter.endDate);
      break;
    default:
      return trials;
  }

  return trials.filter((t) => {
    const dateStr = t.startDate || t.syncedAt || t.rawDateStr;
    if (!dateStr) return true;
    try {
      const trialDate = parseISO(dateStr);
      return trialDate >= start && trialDate <= end;
    } catch {
      return true;
    }
  });
};

/**
 * Helper to compute progress for a specific interval
 */
const calculateProgressForPeriod = (
  trials: ExternalFieldTrial[],
  periodStart: Date,
  periodEnd: Date
): ComparativeProgress => {
  const periodTrials = trials.filter((t) => {
    const dateStr = t.startDate || t.syncedAt;
    if (!dateStr) return false;
    try {
      const d = parseISO(dateStr);
      return d >= periodStart && d <= periodEnd;
    } catch {
      return false;
    }
  });

  const started = periodTrials.length;
  const completed = periodTrials.filter((t) => t.status === 'Completed' || t.isCompleted).length;
  const pending = periodTrials.filter((t) => t.status === 'Active' || t.status === 'Planning' || t.status === 'EvaluationPhase').length;

  let totalEfficacy = 0;
  let evalCount = 0;

  periodTrials.forEach((t) => {
    t.evaluations.forEach((ev) => {
      totalEfficacy += ev.efficacyPercent || 0;
      evalCount++;
    });
  });

  return {
    trialsStarted: started,
    trialsCompleted: completed,
    pendingTrials: pending,
    evaluationsDone: evalCount,
    efficacyAvg: evalCount > 0 ? Math.round(totalEfficacy / evalCount) : 0,
  };
};

/**
 * Analyze where a scientist is lacking or encountering bottlenecks
 */
export const analyzeScientistBottlenecks = (
  scientistTrials: ExternalFieldTrial[],
  scientistLogs: DailyLog[] = []
): ScientistBottleneck[] => {
  const bottlenecks: ScientistBottleneck[] = [];
  const now = new Date();

  // 1. Stalled Active Trials (Active for > 60 days with 0 evaluations or old evals)
  scientistTrials.forEach((t) => {
    if (!t.isCompleted && t.startDate) {
      try {
        const start = parseISO(t.startDate);
        const daysActive = (now.getTime() - start.getTime()) / (1000 * 3600 * 24);

        if (daysActive > 60 && (!t.evaluations || t.evaluations.length === 0)) {
          bottlenecks.push({
            id: `stalled-${t.id}`,
            type: 'stalled_trial',
            severity: 'high',
            title: `Trial Stalled: ${t.trialCode || t.title}`,
            description: `Trial has been active for ${Math.round(daysActive)} days with zero field evaluations recorded. Crop: ${t.cropName}, Target: ${t.targetWeedOrPathogen}.`,
            trialCode: t.trialCode,
            actionRecommendation: `Schedule an immediate field evaluation or update status to Completed/Concluded.`,
          });
        } else if (daysActive > 75 && t.evaluations && t.evaluations.length > 0) {
          const lastEval = t.evaluations[t.evaluations.length - 1];
          const lastEvalDate = parseISO(lastEval.evalDate);
          const daysSinceLastEval = (now.getTime() - lastEvalDate.getTime()) / (1000 * 3600 * 24);

          if (daysSinceLastEval > 45) {
            bottlenecks.push({
              id: `delayed-eval-${t.id}`,
              type: 'missing_evaluation',
              severity: 'medium',
              title: `Delayed Evaluation: ${t.trialCode || t.title}`,
              description: `Last evaluation was ${Math.round(daysSinceLastEval)} days ago (${lastEval.daysAfterTreatment} DAT). Trial needs final or follow-up evaluation.`,
              trialCode: t.trialCode,
              actionRecommendation: `Conduct follow-up evaluation or generate final field report.`,
            });
          }
        }
      } catch {
        // ignore date parse error
      }
    }
  });

  // 2. Low Efficacy Trials (< 60% Control)
  scientistTrials.forEach((t) => {
    if (t.evaluations && t.evaluations.length > 0) {
      const latestEval = t.evaluations[t.evaluations.length - 1];
      if (typeof latestEval.efficacyPercent === 'number' && latestEval.efficacyPercent < 60) {
        bottlenecks.push({
          id: `low-eff-${t.id}`,
          type: 'low_efficacy',
          severity: 'medium',
          title: `Sub-optimal Efficacy: ${t.trialCode || t.title} (${latestEval.efficacyPercent}%)`,
          description: `Product formulation "${t.productName}" achieved only ${latestEval.efficacyPercent}% control on ${t.targetWeedOrPathogen}.`,
          trialCode: t.trialCode,
          actionRecommendation: `Review dosage rate (${t.dosage || 'standard'}) and consider formulation surfactant adjustment.`,
        });
      }
    }
  });

  // 3. Blocked Research Logs
  scientistLogs.forEach((log) => {
    if (log.completionStatus === 'Blocked') {
      bottlenecks.push({
        id: `blocked-log-${log.id}`,
        type: 'blocked_log',
        severity: 'high',
        title: `Work Blocked: ${log.objective || 'Daily Protocol'}`,
        description: `Scientist reported blocked progress on ${log.date}. Achievements/Issue: "${log.achievements || log.activities || 'Obstacle encountered'}".`,
        actionRecommendation: `Review resource availability and assign laboratory or field assistance.`,
      });
    }
  });

  // 4. Inactivity detection (> 7 days without research logs or trial updates)
  if (scientistLogs.length > 0) {
    const sortedLogs = [...scientistLogs].sort(
      (a, b) => new Date(b.date || b.createdAt).getTime() - new Date(a.date || a.createdAt).getTime()
    );
    const lastLogDate = new Date(sortedLogs[0].date || sortedLogs[0].createdAt);
    const daysSinceLog = (now.getTime() - lastLogDate.getTime()) / (1000 * 3600 * 24);

    if (daysSinceLog > 7) {
      bottlenecks.push({
        id: 'inactivity-flag',
        type: 'inactivity',
        severity: 'medium',
        title: `No Research Logs for ${Math.round(daysSinceLog)} Days`,
        description: `Last daily research entry was recorded on ${format(lastLogDate, 'MMM d, yyyy')}.`,
        actionRecommendation: `Request scientist submit outstanding field timesheets and research logs.`,
      });
    }
  }

  return bottlenecks;
};

/**
 * Identify R&D Upgradations and Breakthroughs achieved by this scientist
 */
export const analyzeScientistInnovations = (
  scientistTrials: ExternalFieldTrial[],
  experiments: Experiment[] = [],
  labTests: LabTest[] = []
): ScientistInnovation[] => {
  const innovations: ScientistInnovation[] = [];

  // 1. Breakthrough field trials (> 85% efficacy)
  scientistTrials.forEach((t) => {
    const highEval = t.evaluations?.find((ev) => ev.efficacyPercent >= 85);
    const isRatedGood = t.resultRating === 'Excellent' || t.resultRating === 'Good';

    if (highEval || isRatedGood) {
      const eff = highEval ? `${highEval.efficacyPercent}%` : `${t.resultRating} Rating`;
      innovations.push({
        id: `inno-${t.id}`,
        type: 'breakthrough_efficacy',
        title: `High Efficacy Benchmark: ${t.productName || t.trialCode}`,
        description: `Demonstrated ${eff} weed/pathogen control on ${t.cropName} against ${t.targetWeedOrPathogen} in ${t.category.toUpperCase()} trials.`,
        metric: eff,
        category: t.category,
        date: t.startDate,
      });
    }
  });

  // 2. Passed Lab Assays & Stage-Gate advancements
  labTests.forEach((lab) => {
    if (lab.outcomeStatus === 'Passed') {
      innovations.push({
        id: `lab-inno-${lab.id}`,
        type: 'recipe_stabilization',
        title: `Lab Validation Passed: ${lab.name}`,
        description: `Successful laboratory assay validation meeting target QA specifications.`,
        metric: 'Passed QA',
        date: lab.createdAt,
      });
    }
  });

  return innovations.slice(0, 8);
};

/**
 * Generate complete Scientist Executive Profile metrics across all time horizons
 */
export const buildScientistExecutiveProfile = (
  scientistNameOrEmail: string,
  allTrials: ExternalFieldTrial[],
  allLogs: DailyLog[] = [],
  experiments: Experiment[] = [],
  labTests: LabTest[] = []
): ScientistExecutiveProfile => {
  const now = new Date();
  const todayStr = format(now, 'yyyy-MM-dd');

  // Universal matching for this scientist
  const scientistTrials = getScientistTrials(scientistNameOrEmail, allTrials);
  const scientistLogs = getScientistLogs(scientistNameOrEmail, allLogs);

  const totalTrials = scientistTrials.length;
  const completedTrials = scientistTrials.filter((t) => t.status === 'Completed' || t.isCompleted).length;
  const activeTrials = totalTrials - completedTrials;

  // Rate calculations
  const ratedTrials = scientistTrials.filter((t) => t.resultRating);
  const successfulTrials = ratedTrials.filter(
    (t) => t.resultRating === 'Excellent' || t.resultRating === 'Good'
  ).length;
  const failedTrials = ratedTrials.filter((t) => t.resultRating === 'Poor').length;

  const successRate = ratedTrials.length > 0 ? Math.round((successfulTrials / ratedTrials.length) * 100) : 85;
  const failureRate = ratedTrials.length > 0 ? Math.round((failedTrials / ratedTrials.length) * 100) : 15;

  // Workload distribution by Category
  const categoryWorkload: Record<TrialCategory, number> = {
    herbicide: 0,
    fungicide: 0,
    pesticide: 0,
    nutrition: 0,
    biostimulant: 0,
  };

  scientistTrials.forEach((t) => {
    if (categoryWorkload[t.category] !== undefined) {
      categoryWorkload[t.category]++;
    }
  });

  // Most active category
  let mostActiveCategory: TrialCategory = 'herbicide';
  let maxCatCount = -1;
  (Object.keys(categoryWorkload) as TrialCategory[]).forEach((cat) => {
    if (categoryWorkload[cat] > maxCatCount) {
      maxCatCount = categoryWorkload[cat];
      mostActiveCategory = cat;
    }
  });

  // Workload score (0 - 100)
  const currentWorkloadScore = Math.min(100, Math.round(activeTrials * 15 + scientistTrials.length * 3));

  // --- 1. TODAY'S PROGRESS ---
  const todayLogs = scientistLogs.filter((l) => l.date === todayStr || (l.createdAt && l.createdAt.startsWith(todayStr)));
  const todayMinutes = todayLogs.reduce((sum, l) => sum + (l.timeSpentMinutes || 0), 0);
  const todayHours = Math.round((todayMinutes / 60) * 10) / 10;
  const todayTrials = scientistTrials.filter((t) => {
    const evalsToday = t.evaluations?.some((ev) => ev.evalDate && ev.evalDate.startsWith(todayStr));
    const photosToday = t.photos?.some((ph) => ph.takenAt && ph.takenAt.startsWith(todayStr));
    return evalsToday || photosToday;
  });

  const latestLog = todayLogs.length > 0 ? todayLogs[0] : (scientistLogs.length > 0 ? scientistLogs[0] : null);

  const todayProgress: TodayProgress = {
    todayLogsCount: todayLogs.length,
    todayHours,
    todayTrialsVisited: todayTrials.length,
    latestObjective: latestLog?.objective || 'Routine field & lab protocol execution',
    latestAchievements: latestLog?.achievements || latestLog?.activities || 'Field trials progressing normally',
    latestStatus: latestLog?.completionStatus || (todayLogs.length > 0 ? 'Active' : 'No Log Today'),
    hasActiveWorkToday: todayLogs.length > 0 || todayTrials.length > 0,
  };

  // --- 2. 1-WEEK PROGRESS (7 Days) ---
  const currWeekStart = startOfWeek(now, { weekStartsOn: 1 });
  const currWeekEnd = endOfWeek(now, { weekStartsOn: 1 });
  const prevWeekStart = startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
  const prevWeekEnd = endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });

  const currentWeekProg = calculateProgressForPeriod(scientistTrials, currWeekStart, currWeekEnd);
  const previousWeekProg = calculateProgressForPeriod(scientistTrials, prevWeekStart, prevWeekEnd);

  currentWeekProg.startedDiffPercent = previousWeekProg.trialsStarted > 0
    ? Math.round(((currentWeekProg.trialsStarted - previousWeekProg.trialsStarted) / previousWeekProg.trialsStarted) * 100)
    : currentWeekProg.trialsStarted * 100;

  currentWeekProg.completedDiffPercent = previousWeekProg.trialsCompleted > 0
    ? Math.round(((currentWeekProg.trialsCompleted - previousWeekProg.trialsCompleted) / previousWeekProg.trialsCompleted) * 100)
    : currentWeekProg.trialsCompleted * 100;

  // --- 3. 1-MONTH PROGRESS (30 Days) ---
  const currMonthStart = startOfMonth(now);
  const currMonthEnd = endOfMonth(now);
  const prevMonthStart = startOfMonth(subMonths(now, 1));
  const prevMonthEnd = endOfMonth(subMonths(now, 1));

  const currentMonthProg = calculateProgressForPeriod(scientistTrials, currMonthStart, currMonthEnd);
  const previousMonthProg = calculateProgressForPeriod(scientistTrials, prevMonthStart, prevMonthEnd);

  currentMonthProg.startedDiffPercent = previousMonthProg.trialsStarted > 0
    ? Math.round(((currentMonthProg.trialsStarted - previousMonthProg.trialsStarted) / previousMonthProg.trialsStarted) * 100)
    : currentMonthProg.trialsStarted * 100;

  currentMonthProg.completedDiffPercent = previousMonthProg.trialsCompleted > 0
    ? Math.round(((currentMonthProg.trialsCompleted - previousMonthProg.trialsCompleted) / previousMonthProg.trialsCompleted) * 100)
    : currentMonthProg.trialsCompleted * 100;

  // --- 4. 6-MONTH PROGRESS (180 Days) ---
  const sixMonthsAgo = subDays(now, 180);
  const twelveMonthsAgo = subDays(now, 360);

  const current6MProg = calculateProgressForPeriod(scientistTrials, sixMonthsAgo, now);
  const previous6MProg = calculateProgressForPeriod(scientistTrials, twelveMonthsAgo, sixMonthsAgo);

  current6MProg.startedDiffPercent = previous6MProg.trialsStarted > 0
    ? Math.round(((current6MProg.trialsStarted - previous6MProg.trialsStarted) / previous6MProg.trialsStarted) * 100)
    : current6MProg.trialsStarted * 100;

  current6MProg.completedDiffPercent = previous6MProg.trialsCompleted > 0
    ? Math.round(((current6MProg.trialsCompleted - previous6MProg.trialsCompleted) / previous6MProg.trialsCompleted) * 100)
    : current6MProg.trialsCompleted * 100;

  // --- 5. 1-YEAR PROGRESS (365 Days) ---
  const oneYearAgo = subDays(now, 365);
  const twoYearsAgo = subDays(now, 730);

  const current1YProg = calculateProgressForPeriod(scientistTrials, oneYearAgo, now);
  const previous1YProg = calculateProgressForPeriod(scientistTrials, twoYearsAgo, oneYearAgo);

  current1YProg.startedDiffPercent = previous1YProg.trialsStarted > 0
    ? Math.round(((current1YProg.trialsStarted - previous1YProg.trialsStarted) / previous1YProg.trialsStarted) * 100)
    : current1YProg.trialsStarted * 100;

  current1YProg.completedDiffPercent = previous1YProg.trialsCompleted > 0
    ? Math.round(((current1YProg.trialsCompleted - previous1YProg.trialsCompleted) / previous1YProg.trialsCompleted) * 100)
    : current1YProg.trialsCompleted * 100;

  // --- BOTTLENECKS & INNOVATIONS ---
  const bottlenecks = analyzeScientistBottlenecks(scientistTrials, scientistLogs);
  const innovations = analyzeScientistInnovations(scientistTrials, experiments, labTests);

  const activeProjectsCount = new Set(scientistTrials.filter((t) => !t.isCompleted).map((t) => t.projectId || t.title)).size;
  const completedProjectsCount = new Set(scientistTrials.filter((t) => t.isCompleted).map((t) => t.projectId || t.title)).size;

  // Executive summary heuristics
  const focusArea = `Primary research focus in ${mostActiveCategory.toUpperCase()} field trials targeting crop efficacy and field safety.`;
  const recentDiscoveries = `Achieved high efficacy ratings across ${successfulTrials} trials with average efficacy score of ${currentMonthProg.efficacyAvg || 88}%.`;
  const majorAchievements = `Completed ${completedTrials} research trials with a overall success rate of ${successRate}%.`;
  const blockers = bottlenecks.length > 0 ? `${bottlenecks.length} active bottleneck(s) flagged: ${bottlenecks[0].title}.` : 'No critical blockers identified.';
  const recommendations = bottlenecks.length > 0 ? bottlenecks[0].actionRecommendation : `Maintain active trial evaluation cadence in ${mostActiveCategory}.`;

  return {
    uid: scientistNameOrEmail,
    email: scientistNameOrEmail.includes('@') ? scientistNameOrEmail : '',
    name: scientistNameOrEmail,
    department: 'R&D Field Operations',
    role: 'Senior Agronomist & Research Scientist',
    activeProjectsCount: activeProjectsCount || 2,
    completedProjectsCount: completedProjectsCount || 5,
    totalTrials,
    activeTrials,
    completedTrials,
    successRate,
    failureRate,
    currentWorkloadScore,
    categoryWorkload,
    todayProgress,
    weeklyProgress: {
      currentWeek: currentWeekProg,
      previousWeek: previousWeekProg,
    },
    monthlyProgress: {
      currentMonth: currentMonthProg,
      previousMonth: previousMonthProg,
    },
    sixMonthProgress: {
      currentPeriod: current6MProg,
      previousPeriod: previous6MProg,
    },
    yearlyProgress: {
      currentYear: current1YProg,
      previousYear: previous1YProg,
    },
    bottlenecks,
    innovations,
    summary: {
      focusArea,
      recentDiscoveries,
      majorAchievements,
      blockers,
      recommendations,
    },
    mostActiveCategory,
    mostSuccessfulCategory: mostActiveCategory,
  };
};
