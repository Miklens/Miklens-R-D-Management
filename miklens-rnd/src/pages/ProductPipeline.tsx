import React, { useState, useMemo } from 'react';
import { Workflow, Plus, Sparkles, AlertTriangle, CheckCircle, Info, ChevronRight, Activity, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ProductStage {
  id: string;
  name: string;
  gateCriteria: string;
}

const STAGES: ProductStage[] = [
  { id: 'idea', name: 'Idea', gateCriteria: 'Concept validation' },
  { id: 'lit-review', name: 'Lit Review', gateCriteria: 'Literature & patent check' },
  { id: 'formulation', name: 'Formulation', gateCriteria: 'Acc stability & pH pass' },
  { id: 'greenhouse', name: 'Greenhouse', gateCriteria: 'Efficacy > 70% in vitro' },
  { id: 'field-trials', name: 'Field Trials', gateCriteria: 'Multi-location bio-safety' },
  { id: 'registration', name: 'Registration', gateCriteria: 'CIBRC dossier validation' },
  { id: 'launch', name: 'Launch', gateCriteria: 'Commercial scale scaling' }
];

interface PipelineProduct {
  id: string;
  name: string;
  category: 'Bio-Pesticide' | 'Bio-Fertilizer' | 'Growth Promoter' | 'Botanical';
  stage: string;
  maturityScore: number; // 0-100%
  gateStatus: 'pass' | 'warning' | 'pending';
  owner: string;
  bottleneckReason?: string;
}

const INITIAL_PRODUCTS: PipelineProduct[] = [
  {
    id: 'p1',
    name: 'Pseudomonas fluorescens SC',
    category: 'Bio-Pesticide',
    stage: 'formulation',
    maturityScore: 35,
    gateStatus: 'warning',
    owner: 'Dr. Anita Roy',
    bottleneckReason: 'Suspensibility drops below 65% in hard water. Accelerated stability failing.'
  },
  {
    id: 'p2',
    name: 'Bacillus subtilis Bio-Stimulant',
    category: 'Bio-Fertilizer',
    stage: 'greenhouse',
    maturityScore: 55,
    gateStatus: 'pass',
    owner: 'Dr. Anita Roy'
  },
  {
    id: 'p3',
    name: 'Trichoderma Granular inoculant',
    category: 'Bio-Fertilizer',
    stage: 'field-trials',
    maturityScore: 70,
    gateStatus: 'pending',
    owner: 'Amit Sharma',
    bottleneckReason: 'Waiting for soil safety reports from Indore trial plot.'
  },
  {
    id: 'p4',
    name: 'Neem-Azadirachtin EC 1%',
    category: 'Botanical',
    stage: 'registration',
    maturityScore: 85,
    gateStatus: 'pass',
    owner: 'Dr. Anita Roy'
  },
  {
    id: 'p5',
    name: 'Chitosan-based Growth Promoter',
    category: 'Growth Promoter',
    stage: 'idea',
    maturityScore: 10,
    gateStatus: 'pass',
    owner: 'Sanjay Dutt'
  }
];

export const ProductPipeline: React.FC = () => {
  const [products, setProducts] = useState<PipelineProduct[]>(INITIAL_PRODUCTS);
  const [activeAnalysis, setActiveAnalysis] = useState(false);
  const [aiReport, setAiReport] = useState<string | null>(null);

  const calculateMaturity = (stage: string): number => {
    switch (stage) {
      case 'idea': return 10;
      case 'lit-review': return 25;
      case 'formulation': return 40;
      case 'greenhouse': return 60;
      case 'field-trials': return 75;
      case 'registration': return 90;
      case 'launch': return 100;
      default: return 0;
    }
  };

  const handleMoveProduct = (id: string, direction: 'forward' | 'backward') => {
    setProducts(prev => prev.map(p => {
      if (p.id === id) {
        const currentIndex = STAGES.findIndex(s => s.id === p.stage);
        let nextIndex = currentIndex;
        if (direction === 'forward' && currentIndex < STAGES.length - 1) {
          nextIndex = currentIndex + 1;
        } else if (direction === 'backward' && currentIndex > 0) {
          nextIndex = currentIndex - 1;
        }
        
        const nextStage = STAGES[nextIndex].id;
        const newMaturity = calculateMaturity(nextStage);
        
        // Remove bottleneck warning if moving backward to reformulate, or keep it depending on stage
        let status: PipelineProduct['gateStatus'] = 'pass';
        let reason = p.bottleneckReason;
        if (nextStage === 'formulation' && p.stage !== 'formulation') {
          status = 'warning';
          reason = 'Reformulation active. Checking pH curves.';
        } else if (nextStage !== 'formulation' && nextStage !== 'field-trials') {
          reason = undefined;
          status = 'pass';
        }

        return {
          ...p,
          stage: nextStage,
          maturityScore: newMaturity,
          gateStatus: status,
          bottleneckReason: reason
        };
      }
      return p;
    }));
  };

  const triggerPortfolioAnalysis = () => {
    setActiveAnalysis(true);
    setAiReport(null);

    setTimeout(() => {
      const warningsCount = products.filter(p => p.gateStatus === 'warning').length;
      const stuckInFormulation = products.filter(p => p.stage === 'formulation').length;
      
      const report = `📋 R&D Portfolio Executive Health Report:\n\n` +
        `• Total Products in Pipeline: ${products.length}\n` +
        `• Critical Gate Bottlenecks: ${warningsCount} product(s) flagged.\n` +
        `• Pipeline Speed: STABLE, but showing congestion at the Formulation Gate.\n\n` +
        `🔍 Detailed Product Analysis:\n` +
        `1. ${products[0].name} (Formulation): Flagged for poor suspensibility. Action: Increase Xanthan thickener by 0.12% and check compatibility with bio-surfactants to clear the formulation block.\n` +
        `2. ${products[2].name} (Field Trials): Indore trial reports pending. Action: Accelerate dispatch of soil-core chemical assay results to fast-track Dossier submission.\n\n` +
        `💡 Strategic Recommendations:\n` +
        `• Allocate formulation testing resources from the Chitosan project to resolving the Pseudomonas SC stability curves. Pseudomonas is closer to registration (Estimated launch revenue contribution: High).`;

      setAiReport(report);
      setActiveAnalysis(false);
    }, 1500);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-100 dark:border-gray-800 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Workflow className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Stage-Gate Product Pipeline</h1>
              <p className="text-sm text-gray-500">Track agricultural products from molecular conceptualization to market launch.</p>
            </div>
          </div>
        </div>
        <button
          onClick={triggerPortfolioAnalysis}
          disabled={activeAnalysis}
          className="px-4 py-2.5 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/20 flex items-center gap-2 text-sm transition-all"
        >
          <Sparkles className="w-4 h-4 text-purple-200" />
          Audit Pipeline Health
        </button>
      </div>

      {/* Main Board Layout & Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Kanban Columns Area (Takes 3 columns) */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* Stage Gate Board */}
          <div className="overflow-x-auto pb-4">
            <div className="flex gap-4 min-w-[1000px]">
              {STAGES.map((stage) => {
                const stageProducts = products.filter(p => p.stage === stage.id);
                return (
                  <div
                    key={stage.id}
                    className="flex-1 min-w-[220px] bg-gray-50/50 dark:bg-gray-900/40 rounded-2xl p-4 border border-gray-100 dark:border-gray-800/80 space-y-4"
                  >
                    {/* Column Header */}
                    <div className="border-b border-gray-100 dark:border-gray-800 pb-2">
                      <div className="flex justify-between items-center">
                        <h4 className="font-bold text-sm text-gray-800 dark:text-white truncate">{stage.name}</h4>
                        <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 font-bold rounded-full">
                          {stageProducts.length}
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1 truncate">{stage.gateCriteria}</p>
                    </div>

                    {/* Stage Cards */}
                    <div className="space-y-3 min-h-[350px]">
                      <AnimatePresence>
                        {stageProducts.map((product) => (
                          <motion.div
                            key={product.id}
                            layoutId={product.id}
                            className={`p-3.5 rounded-xl border bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-all space-y-2 border-l-4 ${
                              product.gateStatus === 'warning' ? 'border-l-red-500 border-gray-100 dark:border-gray-700/50' :
                              product.gateStatus === 'pending' ? 'border-l-amber-500 border-gray-100 dark:border-gray-700/50' :
                              'border-l-emerald-500 border-gray-100 dark:border-gray-700/50'
                            }`}
                          >
                            <div className="flex justify-between items-start gap-2">
                              <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/20 px-2 py-0.5 rounded">
                                {product.category}
                              </span>
                              <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 font-mono">
                                {product.maturityScore}%
                              </span>
                            </div>
                            
                            <h5 className="text-xs font-bold text-gray-800 dark:text-white leading-snug">
                              {product.name}
                            </h5>

                            {product.bottleneckReason && (
                              <div className="p-2 rounded bg-red-50 dark:bg-red-950/20 border border-red-100/30 text-[10px] text-red-600 dark:text-red-400 leading-tight">
                                ⚠️ {product.bottleneckReason}
                              </div>
                            )}

                            <div className="flex justify-between items-center pt-2 text-[10px] text-gray-400 border-t border-gray-50 dark:border-gray-700/50">
                              <span className="truncate max-w-[80px]">👤 {product.owner}</span>
                              <div className="flex gap-1">
                                <button
                                  onClick={() => handleMoveProduct(product.id, 'backward')}
                                  className="w-5 h-5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center font-bold text-gray-600 dark:text-gray-300"
                                  title="Move Backward"
                                >
                                  ←
                                </button>
                                <button
                                  onClick={() => handleMoveProduct(product.id, 'forward')}
                                  className="w-5 h-5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center font-bold text-gray-600 dark:text-gray-300"
                                  title="Move Forward"
                                >
                                  →
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Sidebar: AI Portfolio Auditor (Takes 1 column) */}
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl shadow-xl p-6 min-h-[350px] flex flex-col justify-between border border-indigo-950">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-indigo-300">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-sm">Portfolio Health Auditor</h3>
              </div>
              <p className="text-xs text-indigo-200/70 leading-relaxed">
                Analyze resource allocation, timeline delay risks, and dossier submission schedules across active bio-formulations.
              </p>

              <AnimatePresence mode="wait">
                {activeAnalysis ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center py-10 space-y-3"
                  >
                    <div className="w-8 h-8 rounded-full border-4 border-t-indigo-400 border-r-indigo-300 border-b-transparent border-l-transparent animate-spin"></div>
                    <span className="text-xs text-indigo-300">Auditing pipeline throughput...</span>
                  </motion.div>
                ) : aiReport ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="p-4 rounded-xl border border-indigo-500/20 bg-indigo-950/30 text-xs font-mono whitespace-pre-line leading-relaxed text-indigo-100 max-h-[300px] overflow-y-auto"
                  >
                    {aiReport}
                  </motion.div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 text-center text-indigo-400 border border-dashed border-indigo-900/50 rounded-xl p-4">
                    <Activity className="w-8 h-8 mb-2 opacity-30" />
                    <span className="text-xs">No active portfolio audit logs parsed.</span>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700/50 shadow-sm space-y-3 text-xs text-gray-500 dark:text-gray-400">
            <h4 className="font-bold text-gray-800 dark:text-white flex items-center gap-1">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              Maturity Calculations
            </h4>
            <p className="leading-relaxed">
              Maturity score represents the cumulative validation status. Moving a product to later stages automatically triggers compliance gates. Registration (Stage 6) requires verified shelf-life test records.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
