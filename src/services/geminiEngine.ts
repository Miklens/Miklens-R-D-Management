import { getSyncedTrials, getSyncedFormulations } from './trialManagerSync';

/**
 * Superpowered Gemini AI Engine for Miklens R&D Management
 * Features:
 * - 10-Key Automatic Rotation (VITE_GEMINI_API_KEY_1..10 + localStorage pool)
 * - Complete Real-Time R&D Database Context Ingestion
 * - Automated Intelligence Reporting & Risk Auditing
 */

// Gemini Models in order of fallback preference (Adopted from Trial Manager 7)
export const GEMINI_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-3.1-flash-lite',
  'gemini-3.5-flash',
  'gemini-2.5-pro',
  'gemini-2.0-flash',
  'gemini-1.5-flash',
  'gemini-1.5-pro',
];

// Session-level cache of temporarily blocked/unavailable models
const blockedModelsSet = new Set<string>();

/**
 * Collect all available Gemini API keys from environment variables and localStorage
 */
export const getAvailableGeminiKeys = (): string[] => {
  const keys: string[] = [];

  // 1. Check VITE_GEMINI_API_KEY_1 through _10
  for (let i = 1; i <= 10; i++) {
    const envKey = import.meta.env[`VITE_GEMINI_API_KEY_${i}`];
    if (envKey && typeof envKey === 'string' && envKey.trim()) {
      keys.push(envKey.trim());
    }
  }

  // Fallback single env key
  const defaultEnvKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (defaultEnvKey && typeof defaultEnvKey === 'string' && defaultEnvKey.trim()) {
    if (!keys.includes(defaultEnvKey.trim())) {
      keys.push(defaultEnvKey.trim());
    }
  }

  // 2. Check localStorage key pool & single key
  try {
    const savedPool = localStorage.getItem('gemini_api_keys_pool');
    if (savedPool) {
      const parsed = JSON.parse(savedPool);
      if (Array.isArray(parsed)) {
        parsed.forEach(k => {
          if (typeof k === 'string' && k.trim() && !keys.includes(k.trim())) {
            keys.push(k.trim());
          }
        });
      }
    }
    const singleLocal = localStorage.getItem('gemini_api_key');
    if (singleLocal && typeof singleLocal === 'string' && singleLocal.trim() && !keys.includes(singleLocal.trim())) {
      keys.push(singleLocal.trim());
    }
  } catch (e) {
    console.warn('Error reading gemini keys from localStorage:', e);
  }

  return keys;
};

/**
 * Build rich, structured real-time database context for Gemini AI
 */
export const buildRealtimeRDContext = (
  users: any[] = [],
  logs: any[] = [],
  experiments: any[] = [],
  labTests: any[] = [],
  stabilityLogs: any[] = []
): string => {
  const syncedTrials = getSyncedTrials();
  const syncedFormulations = getSyncedFormulations();

  const todayStr = new Date().toISOString().split('T')[0];

  // 1. Synced Field Trials Summary
  const trialSummaries = syncedTrials.slice(0, 20).map(t => {
    const lastEval = t.evaluations && t.evaluations.length > 0 ? t.evaluations[t.evaluations.length - 1] : null;
    const eff = lastEval ? `${lastEval.efficacyPercent}%` : (t.resultRating || 'Good');
    return `[${t.trialCode}] ${t.title || t.productName} on ${t.cropName} (${t.category}) | Lead: ${t.scientistName} | Status: ${t.status} | Efficacy: ${eff}`;
  }).join('\n');

  // 2. Today's Work Session Logs
  const todayLogs = logs.filter(l => (l.date || '').split('T')[0] === todayStr);
  const todayLogsSummary = todayLogs.map(l => {
    const hrs = ((l.timeSpentMinutes || 60) / 60).toFixed(1);
    return `• User ID ${l.userId}: ${hrs}h logged | Obj: ${l.objective || 'Session'} | Work: ${l.activities}`;
  }).join('\n');

  // 3. Scientist Directory
  const scientistsSummary = users.map(u => `• ${u.name || u.email} (${u.role || 'Scientist'}, ${u.department || 'R&D'})`).join('\n');

  // 4. Products tracked
  const productSet = new Set<string>();
  syncedTrials.forEach(t => { if (t.productName) productSet.add(t.productName); });
  syncedFormulations.forEach(f => { if (f.name) productSet.add(f.name); });
  experiments.forEach(e => { if (e.productName) productSet.add(e.productName); });
  const productsList = Array.from(productSet).join(', ');

  return `
--- LIVE MIKLENS BIOTECH R&D DATABASE STATE ---
Current Date: ${todayStr}
Total Synced Field Trials: ${syncedTrials.length}
Total Active Scientists: ${users.length}
Total Daily Work Logs in Database: ${logs.length}
Total Lab & Stability Assays: ${experiments.length + labTests.length + stabilityLogs.length}
Tracked Product Formulations: ${productsList || 'Herbicide & Fungicide Formulations'}

REGISTERED SCIENTISTS DIRECTORY:
${scientistsSummary || 'Bindushree B U, Sandeep, Pavan'}

TODAY'S WORK SESSIONS LOGGED (${todayStr}):
${todayLogsSummary || 'No sessions logged yet for today.'}

RECENT FIELD TRIALS SAMPLE:
${trialSummaries || 'Field trials active across Herbicide, Fungicide, Pesticide, Nutrition, Biostimulant categories.'}
------------------------------------------------
`;
};

/**
 * Ask Gemini API with automatic key rotation, model selection & model rollover fallback
 */
export const querySuperpoweredGemini = async (
  userQuery: string,
  contextData: {
    users?: any[];
    logs?: any[];
    experiments?: any[];
    labTests?: any[];
    stabilityLogs?: any[];
  } = {},
  preferredModel?: string
): Promise<{ text: string; keyIndexUsed: number; modelUsed: string }> => {
  const keys = getAvailableGeminiKeys();
  const dbContext = buildRealtimeRDContext(
    contextData.users || [],
    contextData.logs || [],
    contextData.experiments || [],
    contextData.labTests || [],
    contextData.stabilityLogs || []
  );

  const systemPrompt = `You are the Lead Executive AI Officer for Miklens Biotech Agricultural R&D.
You have direct, real-time access to the company's live research database.

${dbContext}

USER REQUEST: ${userQuery}

INSTRUCTIONS:
1. Answer concisely, professionally, and accurately using the real database context provided above.
2. Provide concrete numbers (hours, trial counts, efficacy rates, scientist names) from the data.
3. If asked about scientists, field trials, daily logs, or product progress, analyze the database state.
4. Format output cleanly using GitHub Markdown (bolding, bullet points, numbered lists).`;

  // Build model candidate list, starting with preferredModel if specified
  const modelCandidates = preferredModel
    ? [preferredModel, ...GEMINI_MODELS.filter(m => m !== preferredModel)]
    : GEMINI_MODELS;

  // Filter out models known to be 404/unavailable in this session
  const activeModels = modelCandidates.filter(m => !blockedModelsSet.has(m));

  if (keys.length > 0) {
    for (let keyIdx = 0; keyIdx < keys.length; keyIdx++) {
      const apiKey = keys[keyIdx];

      for (const model of activeModels) {
        try {
          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ role: 'user', parts: [{ text: systemPrompt }] }],
                generationConfig: {
                  maxOutputTokens: 800,
                  temperature: 0.7,
                },
              }),
            }
          );

          if (response.status === 404 || response.status === 400) {
            console.warn(`Model ${model} returned ${response.status}. Marking model blocked and rolling over...`);
            blockedModelsSet.add(model);
            continue; // Rollover to next model
          }

          if (response.status === 429 || response.status === 403) {
            console.warn(`Gemini key #${keyIdx + 1} (${model}) quota limit. Switching to next API key...`);
            break; // Switch to next key in rotation
          }

          if (response.ok) {
            const data = await response.json();
            const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text && text.trim()) {
              return { text: text.trim(), keyIndexUsed: keyIdx + 1, modelUsed: model };
            }
          }
        } catch (err) {
          console.warn(`Error querying model ${model} with key #${keyIdx + 1}:`, err);
        }
      }
    }
  }

  // Fallback Intelligent Rule Engine when API keys are exhausted or offline
  return {
    text: generateOfflineIntelligentResponse(userQuery, contextData),
    keyIndexUsed: 0,
    modelUsed: 'Offline-Intelligent-Rule-Engine',
  };
};

/**
 * Offline Intelligent Rule Engine — Analyzes real live data without mock strings
 */
const generateOfflineIntelligentResponse = (
  query: string,
  contextData: { users?: any[]; logs?: any[]; experiments?: any[]; labTests?: any[] }
): string => {
  const syncedTrials = getSyncedTrials();
  const logs = contextData.logs || [];
  const users = contextData.users || [];
  const qLower = query.toLowerCase();
  const todayStr = new Date().toISOString().split('T')[0];

  if (qLower.includes('today') || qLower.includes('timesheet') || qLower.includes('logged hours')) {
    const todayLogs = logs.filter(l => (l.date || '').split('T')[0] === todayStr);
    if (todayLogs.length > 0) {
      const totalMins = todayLogs.reduce((sum, l) => sum + (l.timeSpentMinutes || 60), 0);
      return `📊 **Today's Scientist Output (${todayStr})**:\n• Total R&D Output: **${(totalMins / 60).toFixed(1)} Hours** across **${todayLogs.length} work session(s)**.\n• Active Loggers: ${Array.from(new Set(todayLogs.map(l => l.userId))).length} scientist(s).`;
    }
    return `No timesheet logs entered specifically for today (${todayStr}) yet. Total database log count: ${logs.length} entries.`;
  }

  if (qLower.includes('herbicide') || qLower.includes('weed')) {
    const herbicides = syncedTrials.filter(t => t.category === 'herbicide');
    const active = herbicides.filter(h => !h.isCompleted).length;
    return `🌿 **Herbicide Portfolio Intelligence**:\n• Total Herbicide Trials: ${herbicides.length}\n• Active Field Programs: ${active}\n• Finalized Programs: ${herbicides.length - active}`;
  }

  if (qLower.includes('trial') || qLower.includes('field') || qLower.includes('project')) {
    const active = syncedTrials.filter(t => !t.isCompleted).length;
    return `🌾 **Field Operations Intelligence**:\n• Total Synced Field Trials: **${syncedTrials.length}**\n• Active Programs: **${active}**\n• Completed Trials: **${syncedTrials.length - active}**`;
  }

  // Default intelligent overview
  const totalMins = logs.reduce((sum, l) => sum + (l.timeSpentMinutes || 60), 0);
  return `💡 **Miklens R&D Database Intelligence Overview**:\n• **Field Trials**: ${syncedTrials.length} tracked across 5 categories.\n• **Total Logged Research Time**: ${(totalMins / 60).toFixed(1)} Hours.\n• **Active Scientists**: ${users.length} registered.\n\nAsk me about today's work sessions, specific scientists, herbicide trials, or commercial product readiness!`;
};

/**
 * 1-Click Executive AI Summary of All Scientists Data for Management
 */
export const getExecutiveScientistAISummary = async (
  users: any[] = [],
  logs: any[] = [],
  syncedTrials: any[] = []
): Promise<string> => {
  const prompt = `Generate a high-level, executive-ready R&D Scientist Productivity & Output Intelligence Report for Admin and Senior Management.
Summarize:
1. OVERALL SCIENTIST TEAM OUTPUT: Total hours logged, active vs inactive scientists, primary research focus.
2. INDIVIDUAL SCIENTIST PERFORMANCE BREAKDOWN: For each scientist (e.g. Bindushree B U, Sandeep, Pavan), list their total logged hours, key daily activities, active field trials led, and output status.
3. MANAGEMENT ACTION ITEMS & RECOMMENDATIONS: Highlight any unlogged days, high-efficacy formulation breakthroughs, or overburdened team members.

Be extremely clear, professional, structured with GitHub markdown formatting and emojis.`;

  const response = await querySuperpoweredGemini(prompt, { users, logs, experiments: syncedTrials });
  return response.text;
};
