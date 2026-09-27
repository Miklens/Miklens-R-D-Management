import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Building2, 
  Search, 
  Plus, 
  GitBranch, 
  FlaskConical, 
  Layers, 
  Sparkles, 
  CheckCircle2, 
  ChevronRight, 
  X, 
  Filter, 
  ShieldCheck, 
  Tag, 
  TrendingUp,
  Download,
  AlertCircle,
  Clock,
  ArrowRight,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { 
  MainProduct, 
  ProductVersion, 
  ProductCategory, 
  ProductVariantType, 
  CATEGORY_VARIANTS_MAP 
} from '../types/productVersionTypes';
import { 
  getMainProducts, 
  getProductVersions, 
  getVersionsForProduct, 
  getActiveVersion, 
  addMainProduct,
  deleteMainProduct,
  subscribeToProductChanges 
} from '../services/productVersionStore';
import { getSyncedFormulations, getSyncedTrials } from '../services/trialManagerSync';
import { LinkVersionModal } from '../components/LinkVersionModal';

export const Products: React.FC = () => {
  const { userRole } = useAuth();
  const navigate = useNavigate();

  // Data state
  const [products, setProducts] = useState<MainProduct[]>([]);
  const [versions, setVersions] = useState<ProductVersion[]>([]);
  
  // Filtering & search
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | 'all'>('all');
  const [selectedVariant, setSelectedVariant] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkingProductId, setLinkingProductId] = useState<string | null>(null);

  // New product form
  const [newProdName, setNewProdName] = useState('');
  const [newProdCode, setNewProdCode] = useState('');
  const [newProdCategory, setNewProdCategory] = useState<ProductCategory>('herbicide');
  const [newProdVariant, setNewProdVariant] = useState<ProductVariantType>('IPM Herbicide');
  const [newProdDescription, setNewProdDescription] = useState('');
  const [newProdCrops, setNewProdCrops] = useState('');
  const [newProdTargets, setNewProdTargets] = useState('');
  const [newProdStatus, setNewProdStatus] = useState<'In Development' | 'Pilot / Field Testing' | 'Under Registration' | 'Active Commercial'>('In Development');

  // Load products & versions and subscribe
  useEffect(() => {
    const refreshData = () => {
      setProducts(getMainProducts());
      setVersions(getProductVersions());
    };

    refreshData();
    const unsubscribe = subscribeToProductChanges(refreshData);
    return () => unsubscribe();
  }, []);

  // Sync category variants dropdown when category changes in modal
  useEffect(() => {
    const defaultVariants = CATEGORY_VARIANTS_MAP[newProdCategory];
    if (defaultVariants && defaultVariants.length > 0) {
      setNewProdVariant(defaultVariants[0]);
    }
  }, [newProdCategory]);

  // Available variant filter options based on selectedCategory
  const availableVariantFilters = useMemo(() => {
    if (selectedCategory === 'all') {
      const allVars = new Set<string>();
      Object.values(CATEGORY_VARIANTS_MAP).forEach(list => list.forEach(v => allVars.add(v)));
      return Array.from(allVars);
    }
    return CATEGORY_VARIANTS_MAP[selectedCategory] || [];
  }, [selectedCategory]);

  // Reset variant filter when category changes
  const handleCategorySelect = (cat: ProductCategory | 'all') => {
    setSelectedCategory(cat);
    setSelectedVariant('all');
  };

  // Filtered products list
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      // Category match
      if (selectedCategory !== 'all' && p.category.toLowerCase() !== selectedCategory.toLowerCase()) {
        return false;
      }
      // Variant match
      if (selectedVariant !== 'all' && p.variantType !== selectedVariant) {
        return false;
      }
      // Search term
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesName = p.name.toLowerCase().includes(query);
        const matchesCode = p.code.toLowerCase().includes(query);
        const matchesVariant = p.variantType.toLowerCase().includes(query);
        const matchesDesc = (p.description || '').toLowerCase().includes(query);
        const matchesActive = (p.activeVersionTag || '').toLowerCase().includes(query);
        const matchesWeeds = (p.targetWeedsOrPests || []).some(w => w.toLowerCase().includes(query));
        const matchesCrops = (p.targetCrops || []).some(c => c.toLowerCase().includes(query));

        if (!matchesName && !matchesCode && !matchesVariant && !matchesDesc && !matchesActive && !matchesWeeds && !matchesCrops) {
          return false;
        }
      }
      return true;
    });
  }, [products, selectedCategory, selectedVariant, searchTerm]);

  // Overall statistics
  const totalFormulations = getSyncedFormulations().length;
  const totalCommercialProds = products.filter(p => p.commercialStatus === 'Active Commercial').length;

  const handleCreateProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName.trim()) return;

    const code = newProdCode.trim() || `PRD-${newProdName.trim().slice(0, 3).toUpperCase()}`;
    const crops = newProdCrops.split(',').map(s => s.trim()).filter(Boolean);
    const targets = newProdTargets.split(',').map(s => s.trim()).filter(Boolean);

    addMainProduct({
      name: newProdName.trim(),
      code,
      category: newProdCategory,
      variantType: newProdVariant,
      description: newProdDescription.trim(),
      targetCrops: crops,
      targetWeedsOrPests: targets,
      commercialStatus: newProdStatus,
      activeVersionTag: 'V1.0'
    });

    // Reset form
    setNewProdName('');
    setNewProdCode('');
    setNewProdDescription('');
    setNewProdCrops('');
    setNewProdTargets('');
    setShowCreateModal(false);
  };

  const getCategoryColor = (cat: string) => {
    switch (cat.toLowerCase()) {
      case 'herbicide': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
      case 'fungicide': return 'bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 border-blue-200 dark:border-blue-800';
      case 'pesticide': return 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border-amber-200 dark:border-amber-800';
      case 'nutrition': return 'bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300 border-purple-200 dark:border-purple-800';
      case 'biostimulant': return 'bg-teal-100 text-teal-800 dark:bg-teal-950/80 dark:text-teal-300 border-teal-200 dark:border-teal-800';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'Active Commercial':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30';
      case 'Pilot / Field Testing':
        return 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30';
      case 'Under Registration':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30';
      default:
        return 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/30';
    }
  };

  const handleExportCSV = () => {
    const headers = [
      'Product Name', 
      'Product Code', 
      'Category', 
      'Variant Classification', 
      'Commercial Status', 
      'Active Version', 
      'Total Versions', 
      'Avg Efficacy (%)', 
      'Target Weeds/Pests',
      'Target Crops'
    ];
    
    const rows = filteredProducts.map(p => {
      const prodVersions = getVersionsForProduct(p.id);
      const activeVer = getActiveVersion(p.id);
      return [
        `"${p.name || ''}"`,
        `"${p.code || ''}"`,
        `"${p.category || ''}"`,
        `"${p.variantType || ''}"`,
        `"${p.commercialStatus || ''}"`,
        `"${activeVer?.versionTag || p.activeVersionTag || ''}"`,
        `"${prodVersions.length || p.totalVersionsCount || 0}"`,
        `"${p.averageEfficacy || 0}"`,
        `"${(p.targetWeedsOrPests || []).join('; ')}"`,
        `"${(p.targetCrops || []).join('; ')}"`
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Miklens_Products_and_Version_Lineage.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-4 border border-indigo-500/20">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
              <FlaskConical className="w-3 h-3 text-emerald-400" /> R&D Portfolio & Version Control
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
              Multi-Variant Formulation System
            </span>
          </div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2.5">
            <Building2 className="w-7 h-7 text-emerald-400" />
            Main Products & Formulation Lineage
          </h1>
          <p className="text-xs text-gray-300 max-w-2xl leading-relaxed">
            Formulation upgradation hub across Herbicide (Organic, Inorganic, IPM, Microweed), Fungicide, Pesticide, Nutrition, and Biostimulant. Track ongoing formula iterations (e.g. V1.0 → V1.1 → V2.0) linked to parent commercial products.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={() => {
              setLinkingProductId(null);
              setShowLinkModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-2xl font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <GitBranch className="w-4 h-4" />
            🔗 Link Formula / Trial as Version
          </button>

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-2xl font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            + New Main Product
          </button>
        </div>
      </div>

      {/* KPI Stats Overview Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-200 dark:border-emerald-800">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Main Products</div>
            <div className="text-xl font-black text-gray-900 dark:text-white">{products.length}</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 border border-purple-200 dark:border-purple-800">
            <GitBranch className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Total Versions</div>
            <div className="text-xl font-black text-purple-600 dark:text-purple-400">{versions.length}</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-200 dark:border-blue-800">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Commercial Ready</div>
            <div className="text-xl font-black text-blue-600 dark:text-blue-400">{totalCommercialProds}</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-200 dark:border-amber-800">
            <FlaskConical className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Trial Mgr Formulas</div>
            <div className="text-xl font-black text-amber-600 dark:text-amber-400">{totalFormulations}</div>
          </div>
        </div>
      </div>

      {/* Category Pills & Variant Sub-Filter */}
      <div className="space-y-3 bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
        {/* Category Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-extrabold uppercase text-gray-400 dark:text-gray-500 mr-2 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Category:
          </span>
          <button
            onClick={() => handleCategorySelect('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-gray-900 shadow-sm'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200'
            }`}
          >
            All Categories ({products.length})
          </button>
          <button
            onClick={() => handleCategorySelect('herbicide')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedCategory === 'herbicide'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100'
            }`}
          >
            🌱 Herbicide ({products.filter(p => p.category.toLowerCase() === 'herbicide').length})
          </button>
          <button
            onClick={() => handleCategorySelect('fungicide')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedCategory === 'fungicide'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 hover:bg-blue-100'
            }`}
          >
            🛡️ Fungicide ({products.filter(p => p.category.toLowerCase() === 'fungicide').length})
          </button>
          <button
            onClick={() => handleCategorySelect('pesticide')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedCategory === 'pesticide'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100'
            }`}
          >
            🐛 Pesticide ({products.filter(p => p.category.toLowerCase() === 'pesticide').length})
          </button>
          <button
            onClick={() => handleCategorySelect('nutrition')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedCategory === 'nutrition'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 hover:bg-purple-100'
            }`}
          >
            🧪 Nutrition ({products.filter(p => p.category.toLowerCase() === 'nutrition').length})
          </button>
          <button
            onClick={() => handleCategorySelect('biostimulant')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedCategory === 'biostimulant'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 hover:bg-teal-100'
            }`}
          >
            ⚡ Biostimulant ({products.filter(p => p.category.toLowerCase() === 'biostimulant').length})
          </button>
        </div>

        {/* Variant Sub-filter Pills (e.g. Organic, Inorganic, IPM, Microweed) */}
        {availableVariantFilters.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-gray-100 dark:border-gray-800">
            <span className="text-[10px] font-extrabold uppercase text-gray-400 dark:text-gray-500 mr-2 flex items-center gap-1">
              <Tag className="w-3 h-3" /> Variant Line:
            </span>
            <button
              onClick={() => setSelectedVariant('all')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                selectedVariant === 'all'
                  ? 'bg-emerald-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200'
              }`}
            >
              All Variants
            </button>
            {availableVariantFilters.map(v => (
              <button
                key={v}
                onClick={() => setSelectedVariant(v)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  selectedVariant === v
                    ? 'bg-emerald-500 text-white shadow-sm'
                    : 'bg-gray-50 dark:bg-gray-800/60 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-emerald-400'
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Search & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative max-w-md w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by product, variant, crop, weed, or version tag..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-xs font-semibold bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
          />
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/formulation-tracker"
            className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-xl text-xs font-bold hover:bg-indigo-100 transition-all cursor-pointer"
          >
            <GitBranch className="w-3.5 h-3.5" />
            🧬 Open Version Lineage Tracker →
          </Link>
          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-bold hover:bg-emerald-100 transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Export Portfolio CSV
          </button>
        </div>
      </div>

      {/* Main Products Grid */}
      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProducts.map((product, index) => {
            const productVersions = getVersionsForProduct(product.id);
            const activeVer = getActiveVersion(product.id);
            const totalVersions = productVersions.length || product.totalVersionsCount || 1;

            return (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
                className="group bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-xl border border-gray-100 dark:border-gray-800 hover:border-emerald-500/40 hover:-translate-y-1 transition-all flex flex-col justify-between space-y-4"
              >
                <div>
                  {/* Category & Variant Header */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${getCategoryColor(product.category)}`}>
                        {product.category}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {product.variantType}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${getStatusBadgeColor(product.commercialStatus)}`}>
                        {product.commercialStatus}
                      </span>
                      <button
                        type="button"
                        title="Delete Main Product Line from R&D"
                        onClick={() => {
                          if (window.confirm(`Are you sure you want to delete "${product.name}" from R&D Management?\n\nDATA SAFETY GUARANTEE: This will only remove this product and its version records from the R&D Management App. Your raw field trials and formulation recipes in the Trial Manager database will NOT be deleted or modified.`)) {
                            deleteMainProduct(product.id);
                          }
                        }}
                        className="p-1 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Title & Code */}
                  <div className="space-y-0.5">
                    <div className="flex items-baseline justify-between gap-2">
                      <h3 className="text-lg font-black text-gray-900 dark:text-white group-hover:text-emerald-600 transition-colors">
                        {product.name}
                      </h3>
                      <span className="text-[11px] font-mono text-gray-400 font-bold">
                        {product.code}
                      </span>
                    </div>
                    {product.description && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
                        {product.description}
                      </p>
                    )}
                  </div>

                  {/* Active Version Showcase Box */}
                  <div className="mt-4 p-3.5 rounded-2xl bg-gradient-to-br from-emerald-50/70 via-teal-50/40 to-white dark:from-emerald-950/20 dark:via-gray-800/40 dark:to-gray-900 border border-emerald-200/70 dark:border-emerald-800/40 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-black text-emerald-800 dark:text-emerald-300">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Active Commercial Version:</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-mono font-black bg-emerald-600 text-white shadow-xs">
                        {activeVer?.versionTag || product.activeVersionTag || 'V1.0'}
                      </span>
                    </div>

                    <div className="text-xs font-bold text-gray-800 dark:text-gray-200 flex items-center justify-between">
                      <span>Formula: {activeVer?.versionName || product.name}</span>
                      {activeVer?.dosage && (
                        <span className="text-[11px] font-semibold text-gray-500">
                          {activeVer.dosage}
                        </span>
                      )}
                    </div>

                    {activeVer?.upgradeReason && (
                      <p className="text-[11px] text-gray-600 dark:text-gray-400 line-clamp-2 italic border-l-2 border-emerald-500 pl-2">
                        "{activeVer.upgradeReason}"
                      </p>
                    )}
                  </div>

                  {/* Metrics Bar: Iterations & Efficacy */}
                  <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 text-center">
                    <div className="p-2 rounded-xl bg-gray-50 dark:bg-gray-800/60">
                      <div className="text-[10px] font-bold text-gray-400 uppercase">Version Iterations</div>
                      <div className="text-sm font-black text-indigo-600 dark:text-indigo-400 flex items-center justify-center gap-1 mt-0.5">
                        <GitBranch className="w-3.5 h-3.5" />
                        {totalVersions} Upgrades
                      </div>
                    </div>

                    <div className="p-2 rounded-xl bg-gray-50 dark:bg-gray-800/60">
                      <div className="text-[10px] font-bold text-gray-400 uppercase">Target Efficacy</div>
                      <div className="text-sm font-black text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1 mt-0.5">
                        <TrendingUp className="w-3.5 h-3.5" />
                        {activeVer?.killRateOrEfficacy || product.averageEfficacy || 80}% WCE
                      </div>
                    </div>
                  </div>

                  {/* Target Spectrum Tags */}
                  {(product.targetWeedsOrPests && product.targetWeedsOrPests.length > 0) && (
                    <div className="mt-3">
                      <div className="text-[10px] font-bold text-gray-400 uppercase mb-1">Target Spectrum:</div>
                      <div className="flex flex-wrap gap-1">
                        {product.targetWeedsOrPests.slice(0, 3).map((w, i) => (
                          <span key={i} className="text-[10px] px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-md font-semibold truncate max-w-[200px]">
                            {w}
                          </span>
                        ))}
                        {product.targetWeedsOrPests.length > 3 && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-400 rounded-md font-bold">
                            +{product.targetWeedsOrPests.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer Action Bar */}
                <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between gap-2">
                  <button
                    onClick={() => {
                      setLinkingProductId(product.id);
                      setShowLinkModal(true);
                    }}
                    className="flex items-center gap-1 text-[11px] font-bold px-3 py-1.5 bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 rounded-xl transition-all cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    + Add Version
                  </button>

                  <div className="flex items-center gap-1.5">
                    <Link
                      to="/trial-sync"
                      className="text-[11px] font-bold text-gray-500 hover:text-gray-800 dark:hover:text-white px-2.5 py-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
                    >
                      ⚡ Trials
                    </Link>
                    <Link
                      to="/formulation-tracker"
                      className="flex items-center gap-0.5 text-[11px] font-extrabold text-emerald-600 dark:text-emerald-400 hover:underline px-2.5 py-1.5 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-all"
                    >
                      Lineage <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="p-12 text-center bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-xl space-y-3">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400 flex items-center justify-center">
            <Building2 className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-gray-900 dark:text-white">No Matching Products Found</h3>
          <p className="text-xs text-gray-400 max-w-sm mx-auto">
            Try adjusting your category filter, variant selection, or search query. Or click "+ New Main Product" to add a new formulation line.
          </p>
        </div>
      )}

      {/* Create New Main Product Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto"
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-lg border border-gray-100 dark:border-gray-800 my-8 overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-gray-900 dark:text-white">Create New Main Product</h3>
                      <p className="text-xs text-gray-500">Register parent product line for formulation versions</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowCreateModal(false)} 
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <form onSubmit={handleCreateProductSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                      Product Name *
                    </label>
                    <input 
                      type="text" 
                      placeholder="e.g. Goweed Ultra, WeeDrop" 
                      value={newProdName}
                      onChange={(e) => setNewProdName(e.target.value)}
                      required
                      className="w-full px-3.5 py-2.5 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-semibold" 
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                      Product Code
                    </label>
                    <input 
                      type="text" 
                      placeholder="e.g. PRD-GWU" 
                      value={newProdCode}
                      onChange={(e) => setNewProdCode(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono font-bold" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                      Category *
                    </label>
                    <select 
                      value={newProdCategory}
                      onChange={(e) => setNewProdCategory(e.target.value as ProductCategory)}
                      className="w-full px-3.5 py-2.5 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-bold"
                    >
                      <option value="herbicide">🌱 Herbicide</option>
                      <option value="fungicide">🛡️ Fungicide</option>
                      <option value="pesticide">🐛 Pesticide</option>
                      <option value="nutrition">🧪 Nutrition</option>
                      <option value="biostimulant">⚡ Biostimulant</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                      Variant Type *
                    </label>
                    <select 
                      value={newProdVariant}
                      onChange={(e) => setNewProdVariant(e.target.value as ProductVariantType)}
                      className="w-full px-3.5 py-2.5 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-bold"
                    >
                      {(CATEGORY_VARIANTS_MAP[newProdCategory] || []).map((v) => (
                        <option key={v} value={v}>{v}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Description & Formulation Profile
                  </label>
                  <textarea 
                    rows={2}
                    placeholder="Brief description of the product line, target efficacy, and scientific mechanism..."
                    value={newProdDescription}
                    onChange={(e) => setNewProdDescription(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" 
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                      Target Crops (comma separated)
                    </label>
                    <input 
                      type="text" 
                      placeholder="Cotton, Sugarcane, Tea" 
                      value={newProdCrops}
                      onChange={(e) => setNewProdCrops(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl" 
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                      Target Weeds / Pests / Stress
                    </label>
                    <input 
                      type="text" 
                      placeholder="Bermuda Grass, Goatweed" 
                      value={newProdTargets}
                      onChange={(e) => setNewProdTargets(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl" 
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Commercial Stage
                  </label>
                  <select 
                    value={newProdStatus}
                    onChange={(e) => setNewProdStatus(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl font-bold"
                  >
                    <option value="In Development">In Development (Phase 1/2)</option>
                    <option value="Pilot / Field Testing">Pilot / Field Testing (Phase 3)</option>
                    <option value="Under Registration">Under Registration (Phase 4)</option>
                    <option value="Active Commercial">Active Commercial (Phase 5)</option>
                  </select>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer"
                  >
                    Create Product & Initialize Version Control
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Link Version Modal */}
      <LinkVersionModal
        isOpen={showLinkModal}
        onClose={() => {
          setShowLinkModal(false);
          setLinkingProductId(null);
        }}
        initialProductId={linkingProductId}
        onSuccess={(version, product) => {
          setProducts(getMainProducts());
          setVersions(getProductVersions());
        }}
      />
    </div>
  );
};