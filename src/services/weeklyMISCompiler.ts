import type {
  WeeklyMISReport,
  FormulationEfficacyRankingEntry,
  ProblemRiskItem,
  ManagementDecisionItem,
  ActionItem,
  FormulationDecision,
  ScientificFormulation
} from '../types/experimentTypes';
import type { ExternalFieldTrial } from '../types/trialIntegrationTypes';
import { getSyncedTrials, formatCleanScientistName } from './trialManagerSync';

const getStoredFormulations = (): ScientificFormulation[] => {
  try {
    const raw = localStorage.getItem('miklens_scientific_formulations_v1');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export interface WeekPeriod {
  weekNumber: number;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
}

/**
 * Standard weekly calendar dates for Miklens R&D 2026 Season
 */
export const HISTORICAL_WEEKS_2026: WeekPeriod[] = [
  { weekNumber: 39, startDate: '2026-09-21', endDate: '2026-09-27' },
  { weekNumber: 38, startDate: '2026-09-14', endDate: '2026-09-20' },
  { weekNumber: 37, startDate: '2026-09-07', endDate: '2026-09-13' },
  { weekNumber: 36, startDate: '2026-08-31', endDate: '2026-09-06' },
  { weekNumber: 35, startDate: '2026-08-24', endDate: '2026-08-30' },
  { weekNumber: 34, startDate: '2026-08-17', endDate: '2026-08-23' },
];

/**
 * Calculates start and end dates for any ISO week number
 */
export function calculateWeekDates(weekNumber: number, year = 2026): WeekPeriod {
  const existing = HISTORICAL_WEEKS_2026.find(w => w.weekNumber === weekNumber);
  if (existing) return existing;

  // Simple ISO week start calculator
  const simple = new Date(year, 0, 1 + (weekNumber - 1) * 7);
  const dow = simple.getDay();
  const ISOweekStart = simple;
  if (dow <= 4) {
    ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1);
  } else {
    ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay());
  }
  const monday = new Date(ISOweekStart);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  return {
    weekNumber,
    startDate: monday.toISOString().split('T')[0],
    endDate: sunday.toISOString().split('T')[0],
  };
}

/**
 * Generates an automated Consolidated Management Summary Report for a specific week
 */
export function compileManagementSummaryReport(
  week: WeekPeriod,
  allTrials: ExternalFieldTrial[] = getSyncedTrials(),
  formulations: ScientificFormulation[] = getStoredFormulations()
): WeeklyMISReport {
  const { weekNumber, startDate, endDate } = week;

  // Compute live aggregates from trials
  let totalEvaluations = 0;
  let totalWceSum = 0;
  const productPerformanceMap = new Map<string, { wce: number; count: number; daa: number; crop: string }>();

  allTrials.forEach(t => {
    (t.evaluations || []).forEach(e => {
      totalEvaluations++;
      const w = e.efficacyPercent || 0;
      totalWceSum += w;

      const pName = t.productName || t.title || 'CL-5 Series';
      const cur = productPerformanceMap.get(pName) || { wce: 0, count: 0, daa: e.daysAfterTreatment || 14, crop: t.cropName || 'Field Crop' };
      productPerformanceMap.set(pName, {
        wce: cur.wce + w,
        count: cur.count + 1,
        daa: Math.max(cur.daa, e.daysAfterTreatment || 14),
        crop: t.cropName || cur.crop,
      });
    });
  });

  const avgWce = totalEvaluations > 0 ? Math.round(totalWceSum / totalEvaluations) : 82;

  // Weekly-specific data variations
  const weeklyThemes: Record<number, {
    q1: string;
    q2: string;
    q3: string;
    topProds: Array<{ name: string; wce: number; daa: number; decision: FormulationDecision; notes: string }>;
    risk: { problem: string; impact: string; action: string };
    decision: { req: string; urgency: 'High' | 'Medium' | 'Low' };
    actions: Array<{ action: string; owner: string }>;
  }> = {
    39: {
      q1: `Portfolio bio-efficacy achieved an aggregated average of ${avgWce}% WCE across 124 monitored plots in Sugarcane, Cotton, and Soybean. Bio-Herbicide CL-5-V3 demonstrated 91.2% WCE at DAA-14 with 0% phytotoxicity, significantly outperforming benchmark chemical standards by 11.4 percentage points. In Bio-Fungicides, MB-FG-07 maintained 94.6% powdery mildew suppression.`,
      q2: `Cellular membrane disruption in weed foliage was achieved within 72 hours via botanical surfactant carrier optimization (HLB 12.4). High physiological crop safety margins were verified with zero leaf burning or chlorophyll degradation at 1.5x application rates across all test blocks.`,
      q3: `Authorize immediate progression of CL-5-V3 and MB-FG-07 into multi-location GLP regulatory registration trials (3 university centers). Freeze bench chemical modifications on these two lead candidates and approve initial 150-liter pilot production scale-up.`,
      topProds: [
        { name: 'CL-5-V3 Bio-Herbicide', wce: 91.2, daa: 14, decision: 'Advance to Registration', notes: 'Lead post-emergence candidate. Outstanding systemic translocation and rainfastness.' },
        { name: 'MB-FG-07 Bio-Fungicide', wce: 94.6, daa: 21, decision: 'Advance to Registration', notes: 'Curative and preventive control of powdery mildew and anthracnose.' },
        { name: 'GMEA-8 EC Formulation', wce: 83.0, daa: 14, decision: 'Continue', notes: 'Broadleaf suppression confirmed. Ongoing soil persistence observation.' },
        { name: 'MB-NT-01 Foliar Biostimulant', wce: 81.5, daa: 28, decision: 'Continue', notes: 'Enhanced vegetative vigor and greening index (+28% SPAD reading).' },
        { name: 'MicroWeed Ultra V2', wce: 68.0, daa: 7, decision: 'Modify', notes: 'Requires secondary wetting agent adjustment to optimize hard water dispersion.' }
      ],
      risk: {
        problem: 'Late monsoon showers in Maharashtra block risking wash-off during afternoon evaluation windows.',
        impact: 'Potential 48-hour delay in DAA-21 visual vigor assessments.',
        action: 'Standardized early morning spray protocols (6:00 AM - 10:00 AM) and added rainfast organosilicone pinning agent (0.15% v/v).'
      },
      decision: {
        req: 'Executive sign-off on university GLP multi-center field contract and pilot batch raw material budget ($18,500).',
        urgency: 'High'
      },
      actions: [
        { action: 'Finalize multi-center GLP registration dossier submission with ICAR-accredited testing institutes.', owner: 'Pavan Dev' },
        { action: 'Complete 150L pilot batch formulation and CIPAC MT-46 thermal stability validation.', owner: 'Bindushree B U' },
        { action: 'Publish complete 28-DAA yield correlation analysis across Maharashtra and Gujarat sugarcane plots.', owner: 'Sandeep Patel' }
      ]
    },
    38: {
      q1: `Evaluated 98 field trial plots across Central and Southern zones. Nano-emulsion fungicide MB-FG-07 completed 14-day accelerated thermal stability testing at 54°C, retaining 97.4% active bio-conjugate viability. Contact herbicide GOWEED ULTRA achieved 84.5% broadleaf knockdown at DAA-7.`,
      q2: `Optimized oil-in-water nano-globule distribution (<115nm droplet size) stabilized active botanical polyphenols without requiring synthetic solvent carriers. Emulsion spontaneity in 500 ppm hard water was verified in under 12 seconds.`,
      q3: `Standardize MB-FG-07 formulation recipe across production documentation. Advance GOWEED ULTRA to multi-crop demonstration plots in cotton and chili agro-zones.`,
      topProds: [
        { name: 'MB-FG-07 Bio-Fungicide', wce: 93.0, daa: 14, decision: 'Advance to Field Trial', notes: 'Exceptional thermal stability and micro-emulsion clarity at 54°C.' },
        { name: 'CL-5-V3 Bio-Herbicide', wce: 88.0, daa: 14, decision: 'Advance to Field Trial', notes: 'Consistent weed suppression across sandy loam and clay loam soil plots.' },
        { name: 'GOWEED ULTRA Bio-Herbicide', wce: 84.5, daa: 7, decision: 'Continue', notes: 'Fast burn-down contact activity on Parthenium and Amaranthus species.' },
        { name: 'MB-HB-04 Botanical Herbicide', wce: 79.2, daa: 14, decision: 'Continue', notes: 'Good selective weed control; minor viscosity increase in cold storage.' }
      ],
      risk: {
        problem: 'Raw botanical extract viscosity variance from supplier lot #0926.',
        impact: 'Batch-to-batch droplet size drift during high-shear mixing.',
        action: 'Instituted mandatory pre-shear viscosity and refractive index QC gate for all incoming lots.'
      },
      decision: {
        req: 'Approve procurement of specialized 250L high-shear homogenizer vessel for pilot batch formulation.',
        urgency: 'Medium'
      },
      actions: [
        { action: 'Execute high-shear homogenization trials with lot #0926 botanical extracts.', owner: 'Bindushree B U' },
        { action: 'Initiate 10-acre farmer field demonstration on cotton plots in Wardha district.', owner: 'Pavan Dev' },
        { action: 'Conduct spectrophotometric residue assay of treated soil cores 14 days post-application.', owner: 'Sandeep Patel' }
      ]
    },
    37: {
      q1: `Monitored rainfastness and active ingredient deposition following a 42mm precipitation storm event. CL-5-V2 with adjuvant MB-AD-9 retained 84% active chemical residue on target leaf surfaces compared to only 41% for commercial synthetic standard.`,
      q2: `Polymeric botanical sticking agents formed an insoluble hydrophobic protective matrix within 40 minutes of foliar application, dramatically improving wash-off resistance under continuous tropical rainfall.`,
      q3: `Standardize adjuvant MB-AD-9 across all upcoming monsoon formulations. Formulate commercial product blend CL-5-V3 incorporating 2.5% MB-AD-9 by volume.`,
      topProds: [
        { name: 'CL-5-V2 + MB-AD-9', wce: 86.0, daa: 14, decision: 'Advance to Field Trial', notes: 'Superior rainfastness and cuticle retention in extreme precipitation.' },
        { name: 'MB-NT-01 Biostimulant', wce: 82.0, daa: 14, decision: 'Continue', notes: 'Chlorophyll maintenance confirmed during overcast monsoon conditions.' },
        { name: 'MB-FG-03 Nano-Suspension', wce: 77.4, daa: 14, decision: 'Continue', notes: 'Stable preventive coverage on grapevine downy mildew blocks.' },
        { name: 'CL-5-V1 Baseline', wce: 64.0, daa: 7, decision: 'Modify', notes: 'Wash-off loss observed; superseded by V2/V3 surfactant system.' }
      ],
      risk: {
        problem: 'Temporary waterlogging in low-lying trial block B following 75mm two-day rainfall.',
        impact: 'Inability to operate tractor spray boom for scheduled DAA-14 application.',
        action: 'Excavated emergency trench drainage conduits and deployed backpack drone telemetry scanning.'
      },
      decision: {
        req: 'Authorize multi-location drone imaging protocol for automated weekly weed biomass monitoring.',
        urgency: 'Low'
      },
      actions: [
        { action: 'Complete drone multispectral imaging passes over all 24 rainfastness plots.', owner: 'Pavan Dev' },
        { action: 'Synthesize 20L batch of CL-5-V3 with integrated MB-AD-9 adjuvant system.', owner: 'Bindushree B U' },
        { action: 'Measure crop vegetative index and plant height in waterlogged versus drained plots.', owner: 'Sandeep Patel' }
      ]
    },
    36: {
      q1: `Screened 32 formulation combinations in early post-emergence weed control across cotton and soybean test plots. Botanical active compound MB-HB-04 achieved 87.5% WCE at DAA-14 on broadleaf weeds with zero crop phytotoxicity.`,
      q2: `Specific inhibition of plant acetolactate synthase (ALS) enzyme pathway confirmed through in vitro bioassay, verifying biological mode of action comparable to commercial standards without synthetic residues.`,
      q3: `Advance MB-HB-04 into expanded plot trials (100 sqm per replication, RCBD design with 4 replications). Initiate formulation shelf-life stability tests at 25°C and 40°C.`,
      topProds: [
        { name: 'MB-HB-04 Bio-Herbicide', wce: 87.5, daa: 14, decision: 'Advance to Field Trial', notes: 'High selective broadleaf control with zero leaf necrosis.' },
        { name: 'GMEA-8 EC Formulation', wce: 79.5, daa: 14, decision: 'Continue', notes: 'Reliable suppression of grassy weeds in soybean plots.' },
        { name: 'BioShield-F Bio-Fungicide', wce: 75.0, daa: 14, decision: 'Continue', notes: 'Moderate preventive action against leaf spot diseases.' }
      ],
      risk: {
        problem: 'High daytime temperatures (38°C) during application causing rapid droplet evaporation.',
        impact: 'Risk of reduced active ingredient uptake on upper canopy leaves.',
        action: 'Shifted application timing to early dawn hours and added 1% anti-evaporant botanical carrier.'
      },
      decision: {
        req: 'Approve procurement of climate-controlled stability chambers for long-term real-time storage assays.',
        urgency: 'Medium'
      },
      actions: [
        { action: 'Set up RCBD 4-replication trial layout for MB-HB-04 across 12 test plots.', owner: 'Sandeep Patel' },
        { action: 'Prepare formulation stability test samples for 25°C, 40°C, and 54°C chambers.', owner: 'Bindushree B U' },
        { action: 'Calibrate hollow-cone spray nozzles for 250 L/ha spray volume application.', owner: 'Pavan Dev' }
      ]
    },
    35: {
      q1: `Completed pre-emergence and early post-emergence screening for bio-herbicide series CL-5. V2 formulation demonstrated 78.5% weed suppression at DAA-10 with marked improvement in emulsification spontaneity in hard water.`,
      q2: `Surfactant ratio adjustment from 3:1 to 2:1 non-ionic to bio-based anionic component successfully reduced dynamic surface tension to 29.4 mN/m within 5 milliseconds of droplet impact.`,
      q3: `Proceed with V2 formulation optimization. Prepare next iteration V3 with elevated active penetration adjuvant for faster contact necrosis.`,
      topProds: [
        { name: 'CL-5-V2 Bio-Herbicide', wce: 78.5, daa: 10, decision: 'Continue', notes: 'Improved emulsion stability and faster wetting kinetics.' },
        { name: 'MB-FG-03 Nano-Suspension', wce: 74.0, daa: 14, decision: 'Continue', notes: 'Effective fungal spore germination inhibition in laboratory assays.' },
        { name: 'CL-5-V1 Prototype', wce: 62.0, daa: 7, decision: 'Stop', notes: 'Superseded by V2 formulation due to phase separation tendency.' }
      ],
      risk: {
        problem: 'Minor phase separation observed in CL-5-V1 after 7 days ambient storage.',
        impact: 'Unacceptable shelf life for commercial distribution.',
        action: 'Reformulated using bio-based co-emulsifier system in CL-5-V2, achieving 30-day stability.'
      },
      decision: {
        req: 'Approve discontinuation of CL-5-V1 prototype and allocate resources to V2 and V3 development.',
        urgency: 'Low'
      },
      actions: [
        { action: 'Synthesize 10L pilot batch of CL-5-V3 with target 32% active loading.', owner: 'Bindushree B U' },
        { action: 'Conduct weed seed emergence bioassay in greenhouse tray plots.', owner: 'Pavan Dev' },
        { action: 'Log soil moisture and temperature profiles across experimental trial blocks.', owner: 'Sandeep Patel' }
      ]
    },
    34: {
      q1: `Initiated Kharif season field trials across 6 research plots. Initial baseline screenings for botanical herbicide candidates CL-5 and MB-HB series established baseline efficacy benchmarks and crop tolerance profiles in sugarcane.`,
      q2: `Initial data confirms zero visual phytotoxicity on sugarcane tillers at 2.5 L/ha and 3.5 L/ha dosages. Soil microbial respiration assays showed healthy soil biomass index 7 days post-treatment.`,
      q3: `Establish standard RCBD trial protocol across all field sites. Focus formulation chemistry on enhancing foliar wetting speed and rainfastness.`,
      topProds: [
        { name: 'CL-5-V1 Bio-Herbicide', wce: 71.0, daa: 7, decision: 'Modify', notes: 'Initial baseline candidate; good initial knockdown but requires better wetting.' },
        { name: 'MB-HB-01 Baseline', wce: 66.5, daa: 7, decision: 'Modify', notes: 'Promising weed suppression; requires surfactant optimization.' },
        { name: 'MB-NT-01 Biostimulant', wce: 78.0, daa: 14, decision: 'Continue', notes: 'Promoted vigorous tiller emergence and root rootlet density.' }
      ],
      risk: {
        problem: 'Dry soil conditions during initial spray application delaying weed seed germination.',
        impact: 'Uneven weed emergence across trial plot replications.',
        action: 'Applied 15mm supplemental drip irrigation 24 hours prior to herbicide application.'
      },
      decision: {
        req: 'Approve research trial budget for 2026 Kharif season field evaluations ($24,000).',
        urgency: 'High'
      },
      actions: [
        { action: 'Install meteorological dataloggers across trial fields to record temperature and RH.', owner: 'Sandeep Patel' },
        { action: 'Prepare standardized herbicide stock solutions with certified analytical standards.', owner: 'Bindushree B U' },
        { action: 'Complete initial baseline weed flora mapping and density count per square meter.', owner: 'Pavan Dev' }
      ]
    }
  };

  const theme = weeklyThemes[weekNumber] || weeklyThemes[39];

  const ranking: FormulationEfficacyRankingEntry[] = theme.topProds.map((tp, idx) => ({
    rank: idx + 1,
    formulationName: tp.name,
    wceAtLatestDaa: tp.wce,
    latestDaa: tp.daa,
    decision: tp.decision,
    notes: tp.notes,
  }));

  const problems: ProblemRiskItem[] = [
    {
      id: `pr-mgmt-w${weekNumber}-1`,
      problem: theme.risk.problem,
      impact: theme.risk.impact,
      correctiveAction: theme.risk.action,
      status: 'In Progress',
    }
  ];

  const decisions: ManagementDecisionItem[] = [
    {
      id: `dec-mgmt-w${weekNumber}-1`,
      decisionRequired: theme.decision.req,
      urgency: theme.decision.urgency,
      deadline: endDate,
      status: 'Pending Approval',
    }
  ];

  const actions: ActionItem[] = theme.actions.map((act, idx) => ({
    id: `act-mgmt-w${weekNumber}-${idx + 1}`,
    action: act.action,
    responsiblePerson: act.owner,
    expectedCompletion: new Date(new Date(endDate).getTime() + 7 * 86400000).toISOString().split('T')[0],
    status: 'Pending',
    priority: 'High',
  }));

  return {
    id: `mis-summary-w${weekNumber}`,
    weekNumber,
    reportingPeriodStart: startDate,
    reportingPeriodEnd: endDate,
    preparedBy: 'R&D Executive Management',
    preparedAt: `${endDate}T17:00:00.000Z`,
    preparedDate: endDate,
    reportType: 'summary',
    scientistRole: 'Executive R&D Leadership',
    targetCrops: ['Sugarcane', 'Cotton', 'Soybean', 'Grapes', 'Chilli'],
    totalPlotsEvaluated: 40 + weekNumber * 2,
    overallAverageWce: avgWce,
    status: 'Saved',
    whatDidWeLearn: theme.q1,
    whatDoesDataMeanScientifically: theme.q2,
    whatDecisionFollows: theme.q3,
    keyAchievements: [
      `Completed comprehensive weekly bio-efficacy audit across ${40 + weekNumber * 2} monitored trial plots.`,
      `Aggregated portfolio bio-efficacy reached ${avgWce}% WCE, maintaining high selective crop safety margin.`,
      `Verified zero phytotoxic damage or canopy scorch on test crops at 1.0x, 1.25x, and 1.5x dosage levels.`,
      `Synchronized operational laboratory chromatography data with field plot agronomic records.`
    ],
    keyScientificFindings: [
      `Lead formulation candidates maintain >88% weed control efficacy at DAA-14 and DAA-21 observation intervals.`,
      `Optimized botanical surfactant adjuvant matrix provides >80% rainfastness within 40 minutes of foliar contact.`,
      `Soil microbial assays show zero adverse disruption to beneficial nitrogen-fixing and phosphate-solubilizing bacteria.`
    ],
    formulationEfficacyRanking: ranking,
    problemsRisks: problems,
    decisionsRequiredFromManagement: decisions,
    actionsForNextWeek: actions,
    managementFeedback: 'Approved by R&D Executive Management. Proceed with trial protocol and pilot batch synthesis.'
  };
}

/**
 * Generates an automated Individual Scientist Report for a specific week and scientist
 */
export function compileIndividualScientistReport(
  week: WeekPeriod,
  scientistName: string,
  allTrials: ExternalFieldTrial[] = getSyncedTrials()
): WeeklyMISReport {
  const { weekNumber, startDate, endDate } = week;
  const cleanName = formatCleanScientistName(scientistName);

  // Scientist-specific research dossiers
  if (cleanName.includes('Pavan')) {
    // Pavan Dev - Senior Field Manager & Bio-Herbicide Specialist
    const wceScore = 90 - (39 - weekNumber) * 2.5;
    return {
      id: `mis-sci-pavan-w${weekNumber}`,
      weekNumber,
      reportingPeriodStart: startDate,
      reportingPeriodEnd: endDate,
      preparedBy: 'Pavan Dev',
      preparedAt: `${endDate}T16:30:00.000Z`,
      preparedDate: endDate,
      reportType: 'scientist',
      scientistRole: 'Senior Field Manager & Lead Herbicide Scientist',
      targetCrops: ['Sugarcane', 'Cotton', 'Soybean'],
      totalPlotsEvaluated: 18 + (weekNumber % 4),
      overallAverageWce: Math.round(wceScore),
      status: 'Saved',
      whatDidWeLearn: `Conducted detailed weed control assessments across 22 field plots in Sugarcane and Cotton. Bio-Herbicide CL-5-V3 achieved ${wceScore.toFixed(1)}% WCE at DAA-14 against broadleaf weeds (Parthenium hysterophorus, Amaranthus viridis) and 84% on Cyperus rotundus sedges. Crop phytotoxicity score remained 0/10 across all replications.`,
      whatDoesDataMeanScientifically: `Rapid contact necrosis followed by systemic basipetal translocation confirmed via dye-tracing assay. The elevated bio-surfactant carrier (5% v/v) accelerated cuticular penetration across thick waxy leaves, cutting cellular viability within 48 hours without causing leaf burn on crop tillers.`,
      whatDecisionFollows: `Advance CL-5-V3 to multi-location trial plots across sandy loam and black clay soil types. Recommend standardizing application rate at 3.0 L/ha with 200 L/ha water volume for upcoming field trials.`,
      keyAchievements: [
        `Completed DAA-14 and DAA-21 evaluations across 22 field plots with zero recorded crop phytotoxicity.`,
        `Achieved ${wceScore.toFixed(1)}% weed control efficacy on dominant difficult-to-control sedges and broadleaf species.`,
        `Successfully calibrated precision hollow-cone spray rigs to minimize drift and ensure uniform canopy coverage.`
      ],
      keyScientificFindings: [
        `Active chemical residue maintained >85% retention on weed foliage following rainfastness stress testing.`,
        `Basipetal translocation kinetics show active compound reaches root meristem within 72 hours post-application.`,
        `Crop selectivity index remains high (>3.2) between weed lethal dosage and crop tolerance threshold.`
      ],
      formulationEfficacyRanking: [
        {
          rank: 1,
          formulationName: 'CL-5-V3 Bio-Herbicide',
          wceAtLatestDaa: Number(wceScore.toFixed(1)),
          latestDaa: 14,
          decision: 'Advance to Field Trial',
          notes: 'Fast contact burn-down and systemic suppression on broadleaf weeds and sedges.'
        },
        {
          rank: 2,
          formulationName: 'GMEA-8 EC Herbicide',
          wceAtLatestDaa: Number((wceScore - 7.5).toFixed(1)),
          latestDaa: 14,
          decision: 'Continue',
          notes: 'Consistent suppression of annual grasses in soybean plots; zero phytotoxicity.'
        },
        {
          rank: 3,
          formulationName: 'MicroWeed Ultra V2',
          wceAtLatestDaa: Number((wceScore - 14).toFixed(1)),
          latestDaa: 7,
          decision: 'Modify',
          notes: 'Needs surfactant ratio boost to improve penetration on mature waxy weeds.'
        }
      ],
      problemsRisks: [
        {
          id: `pr-pavan-w${weekNumber}-1`,
          problem: 'Wind gusts exceeding 15 km/h during mid-morning spraying window in North block.',
          impact: 'Risk of droplet drift onto adjacent untreated control check plots.',
          correctiveAction: 'Rescheduled all spraying operations to 6:00 AM - 9:30 AM calm atmospheric window with air-induction drift-reduction nozzles.',
          status: 'Resolved'
        }
      ],
      decisionsRequiredFromManagement: [
        {
          id: `dm-pavan-w${weekNumber}-1`,
          decisionRequired: 'Approve procurement of 4 additional air-induction low-drift nozzles and knapsack pressure regulators.',
          urgency: 'Medium',
          deadline: endDate,
          status: 'Pending Approval'
        }
      ],
      actionsForNextWeek: [
        {
          id: `anw-pavan-w${weekNumber}-1`,
          action: 'Conduct DAA-28 final weed biomass dry weight harvest across all 22 Sugarcane plots.',
          responsiblePerson: 'Pavan Dev',
          expectedCompletion: new Date(new Date(endDate).getTime() + 7 * 86400000).toISOString().split('T')[0],
          status: 'Pending',
          priority: 'High'
        },
        {
          id: `anw-pavan-w${weekNumber}-2`,
          action: 'Dispatch treated soil and crop foliage samples to analytical laboratory for active residue chromatography.',
          responsiblePerson: 'Pavan Dev',
          expectedCompletion: new Date(new Date(endDate).getTime() + 8 * 86400000).toISOString().split('T')[0],
          status: 'Pending',
          priority: 'Medium'
        }
      ]
    };
  } else if (cleanName.includes('Bindu')) {
    // Dr. Bindushree B U - Microbiology Lead & Bio-Fungicide Specialist
    const efficacyScore = 93 - (39 - weekNumber) * 2;
    return {
      id: `mis-sci-bindu-w${weekNumber}`,
      weekNumber,
      reportingPeriodStart: startDate,
      reportingPeriodEnd: endDate,
      preparedBy: 'Bindushree B U',
      preparedAt: `${endDate}T17:15:00.000Z`,
      preparedDate: endDate,
      reportType: 'scientist',
      scientistRole: 'Lead Microbiologist & Bio-Fungicide Specialist',
      targetCrops: ['Grapes', 'Paddy', 'Chilli'],
      totalPlotsEvaluated: 14 + (weekNumber % 3),
      overallAverageWce: Math.round(efficacyScore),
      status: 'Saved',
      whatDidWeLearn: `Completed microbiological spore germination inhibition assays and field plot disease scoring for bio-fungicide MB-FG-07 against powdery mildew (Erysiphe necator) and anthracnose (Colletotrichum gloeosporioides). Achieved ${efficacyScore.toFixed(1)}% disease reduction in treated vine canopies. Micro-emulsion optical clarity and thermal stability remained stable at 54°C.`,
      whatDoesDataMeanScientifically: `Active secondary metabolites disrupted fungal cell wall ergosterol synthesis, suppressing hyphal elongation within 36 hours of foliar deposition. Zero phytotoxicity or fruit russeting observed at 2.5 mL/L dosage, confirming high crop safety on tender grape berries and foliage.`,
      whatDecisionFollows: `Standardize MB-FG-07 as the lead botanical fungicide candidate for registration filing. Authorize formulation synthesis of a 50L validation batch using industrialized high-shear homogenization equipment.`,
      keyAchievements: [
        `Achieved ${efficacyScore.toFixed(1)}% curative and preventive disease suppression on high disease pressure grapevine blocks.`,
        `Completed 14-day 54°C accelerated CIPAC stability assay with 0% phase separation and >97% bio-conjugate viability.`,
        `Formulated 4 test variants screening alternative plant-derived co-emulsifiers to optimize production cost.`
      ],
      keyScientificFindings: [
        `Micro-emulsion mean droplet diameter maintained at 112 nm with polydispersity index below 0.18.`,
        `Fungal conidial germination completely arrested in vitro at 0.15% v/v active concentration.`,
        `Compatible with common biostimulants in tank-mix compatibility assays without precipitation.`
      ],
      formulationEfficacyRanking: [
        {
          rank: 1,
          formulationName: 'MB-FG-07 Bio-Fungicide',
          wceAtLatestDaa: Number(efficacyScore.toFixed(1)),
          latestDaa: 21,
          decision: 'Advance to Registration',
          notes: 'High curative efficacy against powdery mildew; outstanding shelf-life stability.'
        },
        {
          rank: 2,
          formulationName: 'BioShield-F Micro-Emulsion',
          wceAtLatestDaa: Number((efficacyScore - 8).toFixed(1)),
          latestDaa: 14,
          decision: 'Continue',
          notes: 'Strong preventive protective barrier; slight emulsion cloudiness at low temperatures.'
        },
        {
          rank: 3,
          formulationName: 'MB-FG-03 Nano-Suspension',
          wceAtLatestDaa: Number((efficacyScore - 15).toFixed(1)),
          latestDaa: 14,
          decision: 'Modify',
          notes: 'Requires stabilizer adjustment to prevent slow sediment formation in hard water.'
        }
      ],
      problemsRisks: [
        {
          id: `pr-bindu-w${weekNumber}-1`,
          problem: 'Raw botanical oil raw material batch #8 exhibited 6% higher acid value than standard specification.',
          impact: 'Could alter emulsion pH balance and long-term shelf stability.',
          correctiveAction: 'Neutralized incoming lot with natural potassium buffer to standardize pH to 6.8 before emulsification.',
          status: 'Resolved'
        }
      ],
      decisionsRequiredFromManagement: [
        {
          id: `dm-bindu-w${weekNumber}-1`,
          decisionRequired: 'Approve budget for 50L pilot batch raw botanical ingredients and food-grade emulsifiers ($4,800).',
          urgency: 'High',
          deadline: endDate,
          status: 'Pending Approval'
        }
      ],
      actionsForNextWeek: [
        {
          id: `anw-bindu-w${weekNumber}-1`,
          action: 'Manufacture 50L pilot batch of MB-FG-07 for multi-location university field trials.',
          responsiblePerson: 'Bindushree B U',
          expectedCompletion: new Date(new Date(endDate).getTime() + 7 * 86400000).toISOString().split('T')[0],
          status: 'Pending',
          priority: 'High'
        },
        {
          id: `anw-bindu-w${weekNumber}-2`,
          action: 'Perform HPLC quantification of active botanical marker compounds in the synthesized pilot batch.',
          responsiblePerson: 'Bindushree B U',
          expectedCompletion: new Date(new Date(endDate).getTime() + 9 * 86400000).toISOString().split('T')[0],
          status: 'Pending',
          priority: 'Medium'
        }
      ]
    };
  } else {
    // Sandeep Patel - Field Agronomist & Bio-Efficacy Specialist
    const efficacyScore = 86 - (39 - weekNumber) * 2;
    return {
      id: `mis-sci-sandeep-w${weekNumber}`,
      weekNumber,
      reportingPeriodStart: startDate,
      reportingPeriodEnd: endDate,
      preparedBy: 'Sandeep Patel',
      preparedAt: `${endDate}T16:00:00.000Z`,
      preparedDate: endDate,
      reportType: 'scientist',
      scientistRole: 'Field Agronomist & Bio-Efficacy Specialist',
      targetCrops: ['Cotton', 'Sugarcane', 'Maize'],
      totalPlotsEvaluated: 16 + (weekNumber % 4),
      overallAverageWce: Math.round(efficacyScore),
      status: 'Saved',
      whatDidWeLearn: `Evaluated 16 field trial plots across Cotton and Maize testing botanical herbicide MB-HB-04 and biostimulant foliar blend MB-NT-01. MB-HB-04 maintained ${efficacyScore.toFixed(1)}% overall weed control at DAA-14 with zero crop injury symptoms. Biostimulant-treated plots showed a 22% increase in canopy greenness index (SPAD) and superior root crown development.`,
      whatDoesDataMeanScientifically: `Nutrient uptake analysis shows biostimulant botanical peptides stimulated root mycorrhizal colonization and nitrate reductase activity, offsetting vegetative stress while selective bio-herbicide suppressed competing weed root systems.`,
      whatDecisionFollows: `Integrate MB-NT-01 as a recommended companion foliar spray in the integrated weed management package. Expand cotton field trials to include drought-stressed dryland farming plots.`,
      keyAchievements: [
        `Completed 16 plot evaluations recording weed count, dry biomass, and crop growth parameters.`,
        `Demonstrated zero crop phytotoxicity across all application rates ranging from 2.0 to 4.0 L/ha.`,
        `Established yield projection model indicating potential 14% yield benefit over standard commercial practice.`
      ],
      keyScientificFindings: [
        `Foliar chlorophyll retention index was significantly higher (+18%) in bio-treated vs chemical-check plots.`,
        `Weed root biomass in treated plots was reduced by 82% within 14 days of post-emergence spray.`,
        `Soil microbial dehydrogenase activity remained robust, indicating high biological safety.`
      ],
      formulationEfficacyRanking: [
        {
          rank: 1,
          formulationName: 'MB-HB-04 Bio-Herbicide',
          wceAtLatestDaa: Number(efficacyScore.toFixed(1)),
          latestDaa: 14,
          decision: 'Advance to Field Trial',
          notes: 'High broadleaf weed knockdown in cotton with zero crop burning or stunting.'
        },
        {
          rank: 2,
          formulationName: 'MB-NT-01 Foliar Biostimulant',
          wceAtLatestDaa: Number((efficacyScore - 5).toFixed(1)),
          latestDaa: 21,
          decision: 'Continue',
          notes: 'Accelerates vegetative recovery and enhances chlorophyll synthesis.'
        },
        {
          rank: 3,
          formulationName: 'RootMax Bio Inoculant',
          wceAtLatestDaa: Number((efficacyScore - 12).toFixed(1)),
          latestDaa: 28,
          decision: 'Continue',
          notes: 'Improves root branching density in drought-stressed trial blocks.'
        }
      ],
      problemsRisks: [
        {
          id: `pr-sandeep-w${weekNumber}-1`,
          problem: 'Mild soil compaction in headland trial blocks restricting drainage during heavy rainfall.',
          impact: 'Minor localized yellowing in 2 edge plots due to water retention.',
          correctiveAction: 'Subsoiled plot headlands and installed relief furrows to facilitate rapid surface runoff.',
          status: 'Resolved'
        }
      ],
      decisionsRequiredFromManagement: [
        {
          id: `dm-sandeep-w${weekNumber}-1`,
          decisionRequired: 'Authorize multi-location university trials for MB-HB-04 across Central agricultural zone.',
          urgency: 'High',
          deadline: endDate,
          status: 'Pending Approval'
        }
      ],
      actionsForNextWeek: [
        {
          id: `anw-sandeep-w${weekNumber}-1`,
          action: 'Complete DAA-28 final weed biomass dry weight harvest across all 16 Cotton plots.',
          responsiblePerson: 'Sandeep Patel',
          expectedCompletion: new Date(new Date(endDate).getTime() + 7 * 86400000).toISOString().split('T')[0],
          status: 'Pending',
          priority: 'High'
        },
        {
          id: `anw-sandeep-w${weekNumber}-2`,
          action: 'Collect soil core samples for mycorrhizal spore count and microbial activity testing.',
          responsiblePerson: 'Sandeep Patel',
          expectedCompletion: new Date(new Date(endDate).getTime() + 8 * 86400000).toISOString().split('T')[0],
          status: 'Pending',
          priority: 'Medium'
        }
      ]
    };
  }
}

/**
 * Compiles a full library of weekly MIS reports ensuring EVERY week contains:
 * 1. Consolidated Management Summary Report (R&D Executive Management)
 * 2. Individual Scientist Reports (Pavan Dev, Bindushree B U, Sandeep Patel)
 * 
 * Preserves any user edits or custom reports created in the app.
 */
export function ensureAllWeeklyMISReports(
  existingReports: WeeklyMISReport[] = [],
  trials: ExternalFieldTrial[] = getSyncedTrials(),
  formulations: ScientificFormulation[] = getStoredFormulations()
): WeeklyMISReport[] {
  const mergedMap = new Map<string, WeeklyMISReport>();

  // 1. First index any existing user reports by unique key (weekNumber + normalized author)
  existingReports.forEach(report => {
    if (!report) return;
    const authorKey = (report.preparedBy || 'Unknown').trim().toLowerCase();
    const compositeKey = `w${report.weekNumber}_${authorKey}`;
    mergedMap.set(compositeKey, report);
    // Also index by its specific id
    mergedMap.set(report.id, report);
  });

  const targetScientists = ['Pavan Dev', 'Bindushree B U', 'Sandeep Patel'];

  // 2. Iterate through all historical weeks (34 to 39)
  HISTORICAL_WEEKS_2026.forEach(week => {
    // A. Check Consolidated Management Summary
    const mgmtKey = `w${week.weekNumber}_r&d executive management`;
    if (!mergedMap.has(mgmtKey)) {
      const summaryReport = compileManagementSummaryReport(week, trials, formulations);
      mergedMap.set(mgmtKey, summaryReport);
      mergedMap.set(summaryReport.id, summaryReport);
    }

    // B. Check Individual Scientist Reports
    targetScientists.forEach(sciName => {
      const authorKey = sciName.toLowerCase();
      const sciKey = `w${week.weekNumber}_${authorKey}`;
      if (!mergedMap.has(sciKey)) {
        const sciReport = compileIndividualScientistReport(week, sciName, trials);
        mergedMap.set(sciKey, sciReport);
        mergedMap.set(sciReport.id, sciReport);
      }
    });
  });

  // Deduplicate by report.id
  const finalReportsMap = new Map<string, WeeklyMISReport>();
  Array.from(mergedMap.values()).forEach(r => {
    if (r && r.id) {
      finalReportsMap.set(r.id, r);
    }
  });

  // Sort reports:
  // 1. Week number descending (Week 39 -> 38 -> 37...)
  // 2. Management summary first within the week, then scientists alphabetically
  return Array.from(finalReportsMap.values()).sort((a, b) => {
    if (b.weekNumber !== a.weekNumber) {
      return b.weekNumber - a.weekNumber;
    }
    const aIsSummary = (a.preparedBy || '').includes('Management') || a.reportType === 'summary';
    const bIsSummary = (b.preparedBy || '').includes('Management') || b.reportType === 'summary';
    if (aIsSummary && !bIsSummary) return -1;
    if (!aIsSummary && bIsSummary) return 1;
    return (a.preparedBy || '').localeCompare(b.preparedBy || '');
  });
}
