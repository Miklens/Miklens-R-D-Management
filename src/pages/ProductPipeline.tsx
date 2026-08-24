import React, { useState, useMemo, useEffect } from 'react';
import { 
  Workflow, 
  Plus, 
  Sparkles, 
  AlertTriangle, 
  CheckCircle2, 
  Info, 
  ChevronRight, 
  Activity, 
  TrendingUp,
  Layers,
  ArrowRight,
  ShieldCheck,
  Building,
  Target,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getSyncedProjects, getSyncedTrials } from '../services/trialManagerSync';

interface ProductStage {
  id: string;
  name: string;
  gateCriteria: string;
  badgeColor: string;
}

const STAGES: ProductStage[] = [
  { id: 'idea', name: 'Stage 0: Discovery', gateCriteria: 'Patents & Concept Check', badgeColor: 'bg-slate-100 text-slate-800 dark:bg-gray-800 dark:text-gray-200' },
  { id: 'formulation', name: 'Stage 1: CIPAC Lab Assay', gateCriteria: 'Acc Heat Storage 54°C', badgeColor: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' },
  { id: 'greenhouse', name: 'Stage 2: Plot Trial (<5ha)', gateCriteria: 'Efficacy > 75% WCE', badgeColor: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300' },
  { id: 'field-trials', name: 'Stage 3: Multi-Location (>50ha)', gateCriteria: 'Multi-state Bio-Safety', badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' },
  { id: 'registration', name: 'Stage 4: CIBRC Dossier', gateCriteria: 'Regulatory Submission', badgeColor: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300' },
  { id: 'launch', name: 'Stage 5: Commercial Launch', gateCriteria: 'Market Distribution', badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' }
];

interface PipelineProduct {
  id: string;
  name: string;
  category: string;
  stage: string;
  maturityScore: number;
  gateStatus: 'pass' | 'warning' | 'pending';
  owner: string;
  trialsCount?: number;
  bottleneckReason?: string;
}

const INITIAL_PRODUCTS: PipelineProduct[] = [
  {
    id: 'p1',
    name: 'GOWEED ULTRA BASE (Liquid EC)',
    category: 'Herbicide',
    stage: 'field-trials',
    maturityScore: 78,
    gateStatus: 'pass',
    owner: 'Pavan Dev',
    trialsCount: 142
  },
  {
    id: 'p2',
    name: '3Tech 1 QEOP (Emulsifiable)',
    category: 'Herbicide',
    stage: 'greenhouse',
    maturityScore: 62,
    gateStatus: 'pass',
    owner: 'Sandeep',
    trialsCount: 12
  },
  {
    id: 'p3',
    name: 'QE ALONE 5% Technical',
    category: 'Herbicide',
    stage: 'formulation',
    maturityScore: 45,
    gateStatus: 'warning',
    owner: 'Sandeep',
    bottleneckReason: 'CIPAC MT 46.3 heat storage shows 4% active degradation at 54°C. Buffer optimization underway.'
  },
  {
    id: 'p4',
    name: 'Trichoderma Harzianum Bio-Fungicide',
    category: 'Fungicide',
    stage: 'registration',
    maturityScore: 90,
    gateStatus: 'pass',
    owner: 'Bindushree B U',
    trialsCount: 28
  },
  {
    id: 'p5',
    name: 'Amino Acid Foliar Booster 50%',
    category: 'Biostimulant',
    stage: 'idea',
    maturityScore: 15,
    gateStatus: 'pending',
    owner: 'R&D Team'
  }
];

export const ProductPipeline: React.FC = () => {
  const [products, setProducts] = useState<PipelineProduct[]>(INITIAL_PRODUCTS);
  const [selectedProduct, setSelectedProduct] = useState<PipelineProduct | null>(null);

  useEffect(() => {
    const synced = getSyncedProjects();
    const syncedTrials = getSyncedTrials();
    if (synced && synced.length > 0) {
      const mapped = synced.map(p => {
        const pTrials = syncedTrials.filter(t => t.projectId === p.id);
        const hasDelays = pTrials.some(t => {
          if (t.isCompleted) return false;
          const start = new Date(t.startDate);
          const diffDays = (new Date().getTime() - start.getTime()) / (1000 * 3600 * 24);
          return diffDays > 90;
        });

        let stage = 'field-trials';
        let score = 70;
        if (pTrials.length === 0) {
          stage = 'idea';
          score = 15;
        } else if (pTrials.every(t => t.isCompleted)) {
          stage = 'registration';
          score = 88;
        }

        return {
          id: p.id,
          name: p.name || 'R&D Candidate',
          category: p.category ? p.category.charAt(0).toUpperCase() + p.category.slice(1) : 'Bio-Agent',
          stage: stage,
          maturityScore: score,
          gateStatus: hasDelays ? 'warning' : 'pass',
          owner: p.leadScientistName || 'R&D Lead',
          trialsCount: pTrials.length,
          bottleneckReason: hasDelays ? 'Active trials flagged with progress delay >90 days.' : undefined
        } as PipelineProduct;
      });

      setProducts(mapped);
    }
  }, []);

  const advanceStage = (prodId: string) => {
    setProducts(prev => prev.map(p => {
      if (p.id !== prodId) return p;
      const currentIdx = STAGES.findIndex(s => s.id === p.stage);
      if (currentIdx === -1 || currentIdx >= STAGES.length - 1) return p;

      const nextStage = STAGES[currentIdx + 1].id;
      const nextScore = Math.min(100, p.maturityScore + 18);
      return {
        ...p,
        stage: nextStage,
        maturityScore: nextScore,
        gateStatus: 'pass',
        bottleneckReason: undefined
      };
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-4 border border-indigo-500/20">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
              <Workflow className="w-3 h-3 text-emerald-400" /> STAGE-GATE COMMERCIALIZATION PIPELINE
            </span>
          </div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            <Target className="w-6 h-6 text-emerald-400" />
            Agricultural R&D Product Pipeline & Stage Gates
          </h2>
          <p className="text-xs text-gray-300 max-w-2xl">
            Track product candidates from Stage 0 (Discovery Concept) to Stage 5 (Commercial Launch). Validate CIPAC gates, field trial trials, and CIBRC registration.
          </p>
        </div>
      </div>

      {/* Stage Gate Overview Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-200 dark:border-indigo-800">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Active Pipeline Products</p>
            <p className="text-2xl font-black text-gray-900 dark:text-white mt-0.5">{products.length}</p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-200 dark:border-emerald-800">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Gate Passing Candidates</p>
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
              {products.filter(p => p.gateStatus === 'pass').length}
            </p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-200 dark:border-amber-800">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Flagged Gate Bottlenecks</p>
            <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-0.5">
              {products.filter(p => p.gateStatus === 'warning').length}
            </p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 border border-purple-200 dark:border-purple-800">
            <Building className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Commercial Ready Index</p>
            <p className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-0.5">
              {Math.round(products.reduce((acc, p) => acc + p.maturityScore, 0) / (products.length || 1))}%
            </p>
          </div>
        </div>
      </div>

      {/* Stage-Gate Kanban Columns Workspace */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 overflow-x-auto">
        {STAGES.map(stage => {
          const stageProds = products.filter(p => p.stage === stage.id);

          return (
            <div key={stage.id} className="p-4 rounded-3xl bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 space-y-3 shrink-0 min-w-[220px]">
              <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-2">
                <div>
                  <h4 className="font-extrabold text-xs text-gray-900 dark:text-white">{stage.name}</h4>
                  <p className="text-[10px] text-gray-400 font-medium truncate">{stage.gateCriteria}</p>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                  {stageProds.length}
                </span>
              </div>

              <div className="space-y-3 min-h-[300px]">
                {stageProds.map(prod => (
                  <motion.div
                    key={prod.id}
                    whileHover={{ scale: 1.02 }}
                    className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm space-y-2.5 relative overflow-hidden cursor-pointer"
                    onClick={() => setSelectedProduct(prod)}
                  >
                    {/* Status bar */}
                    <div className={`absolute top-0 left-0 right-0 h-1.5 ${
                      prod.gateStatus === 'pass' ? 'bg-emerald-500' : prod.gateStatus === 'warning' ? 'bg-amber-500' : 'bg-blue-400'
                    }`} />

                    <div className="flex items-start justify-between gap-1 pt-1">
                      <span className="font-black text-xs text-gray-900 dark:text-white leading-tight">{prod.name}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-900">
                        {prod.category}
                      </span>
                      {prod.trialsCount !== undefined && (
                        <span className="text-[9px] font-bold text-gray-400">
                          {prod.trialsCount} Trials
                        </span>
                      )}
                    </div>

                    {/* Progress Maturity Bar */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[9px] font-extrabold text-gray-500">
                        <span>Commercial Readiness</span>
                        <span>{prod.maturityScore}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full" style={{ width: `${prod.maturityScore}%` }} />
                      </div>
                    </div>

                    {prod.bottleneckReason && (
                      <p className="text-[10px] text-amber-600 dark:text-amber-400 font-bold bg-amber-50 dark:bg-amber-950/40 p-2 rounded-xl line-clamp-2">
                        🚨 {prod.bottleneckReason}
                      </p>
                    )}

                    <div className="pt-2 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                      <span className="text-[10px] text-gray-400 font-bold">👤 {prod.owner}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          advanceStage(prod.id);
                        }}
                        className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-0.5"
                      >
                        Gate Pass <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </motion.div>
                ))}

                {stageProds.length === 0 && (
                  <div className="p-6 border border-dashed border-gray-200 dark:border-gray-800 rounded-2xl text-center text-xs text-gray-400 font-medium">
                    No products at this stage
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
