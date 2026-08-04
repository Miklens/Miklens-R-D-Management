import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, AlertCircle, Clock, Plus, X, Building2, Search } from 'lucide-react';
import { useProducts } from '../hooks/useProducts';
import { motion, AnimatePresence } from 'framer-motion';

export const Products: React.FC = () => {
  const { data: realProducts } = useProducts();
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [categoryInput, setCategoryInput] = useState('Bio-fungicide');
  const [stageInput, setStageInput] = useState('Lab Testing');
  const [productList, setProductList] = useState<Array<{id: string; name: string; category?: string; stage?: string; status?: string; progress?: number; teamSize?: number; lastUpdate?: string}>>([]);

  // Only use real products — no mock/seed data
  const products = (realProducts && realProducts.length > 0 ? realProducts : productList) ?? [];

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim()) return;

    const newProd = {
      id: `p-${Date.now()}`,
      name: nameInput.trim(),
      category: categoryInput,
      stage: stageInput,
      status: 'Active',
      progress: 10,
      teamSize: 1,
      lastUpdate: 'Just now'
    };

    setProductList([newProd, ...productList]);
    setNameInput('');
    setShowModal(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Completed': return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'Delayed': return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'Blocked': return <AlertCircle className="h-5 w-5 text-red-500" />;
      default: return <div className="h-5 w-5 rounded-full border-2 border-blue-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300';
      case 'Delayed': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300';
      case 'Blocked': return 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300';
      default: return 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              Formulation & Product Portfolio
            </span>
          </div>
          <h2 className="text-2xl font-black text-gray-900 dark:text-white">Active Product Catalog</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 font-medium">Enterprise R&D formulation pipeline & active commercialization products</p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-2xl font-bold text-xs shadow-md transition-all active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4" />
          + New Product
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Filter products by name or category..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 text-xs font-semibold bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
        />
      </div>

      {/* Products Grid */}
      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProducts.map((product: any, index: number) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
              className="group bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-xl border border-gray-100 dark:border-gray-800 hover:border-emerald-500/40 hover:-translate-y-1 transition-all space-y-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center font-black text-lg shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                  <Building2 className="w-6 h-6" />
                </div>

                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${getStatusColor(product.status || 'Active')}`}>
                  {product.status || 'Active'}
                </span>
              </div>

              <div>
                <h3 className="text-base font-black text-gray-900 dark:text-white group-hover:text-emerald-600 transition-colors">{product.name}</h3>
                <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">{product.category || 'General Formulation'}</p>
              </div>

              {/* Progress bar */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-[11px] font-bold text-gray-500 dark:text-gray-400">
                  <span>Development Stage</span>
                  <span className="font-mono text-gray-900 dark:text-white font-extrabold">{product.stage || 'Lab Testing'}</span>
                </div>
                <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-emerald-500 to-teal-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${product.progress || 45}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-gray-50 dark:border-gray-800/80 text-[11px] font-bold text-gray-400">
                <Link
                  to="/trial-sync"
                  className="font-bold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1 bg-purple-50 dark:bg-purple-950/50 px-2.5 py-1 rounded-xl border border-purple-100 dark:border-purple-900/50"
                >
                  ⚡ Synced Trials →
                </Link>
                <Link
                  to="/experiments"
                  className="text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 font-extrabold"
                >
                  View Testing →
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="p-12 text-center bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-xl space-y-3">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400 flex items-center justify-center">
            <Building2 className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-gray-900 dark:text-white">No Products Registered Yet</h3>
          <p className="text-xs text-gray-400 max-w-sm mx-auto">Click "+ New Product" above to create and manage your R&D formulation catalog.</p>
        </div>
      )}

      {/* Add Product Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg"
            >
              <div className="p-6 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">Add New Product</h3>
                  <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <form onSubmit={handleCreateProduct} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Product Name</label>
                  <input 
                    type="text" 
                    placeholder="Enter product name" 
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Category</label>
                  <select 
                    value={categoryInput}
                    onChange={(e) => setCategoryInput(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl"
                  >
                    <option value="Bio-fungicide">Bio-fungicide</option>
                    <option value="Bio-nematicide">Bio-nematicide</option>
                    <option value="Bio-insecticide">Bio-insecticide</option>
                    <option value="Bio-stimulant">Bio-stimulant</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Stage</label>
                  <select 
                    value={stageInput}
                    onChange={(e) => setStageInput(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl"
                  >
                    <option value="Research">Research</option>
                    <option value="Lab Testing">Lab Testing</option>
                    <option value="Field Trial">Field Trial</option>
                    <option value="Commercial Validation">Commercial Validation</option>
                    <option value="Commercial Launch">Commercial Launch</option>
                  </select>
                </div>
                <button
                  type="submit"
                  className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-semibold hover:from-emerald-600 hover:to-teal-600 transition-all shadow-md shadow-emerald-500/20"
                >
                  Create Product
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};