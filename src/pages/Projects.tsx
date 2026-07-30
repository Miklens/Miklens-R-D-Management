import React, { useState } from 'react';
import { FolderGit2, Plus, X, Search, Users, Trash2, Package } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const INITIAL_PROJECTS = [
  { 
    id: 1, 
    name: 'BioShield Alpha Commercialization Project', 
    product: 'BioShield Alpha (Bio-fungicide)', 
    stage: 'Lab Testing & CIPAC Stability', 
    progress: 75, 
    team: 4, 
    status: 'active' 
  },
  { 
    id: 2, 
    name: 'BioShield Alpha Wheat Field Efficacy Trial', 
    product: 'BioShield Alpha (Bio-fungicide)', 
    stage: 'Field Trial Phase 1', 
    progress: 50, 
    team: 3, 
    status: 'active' 
  },
];

export const Projects: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [nameInput, setNameInput] = useState('');
  const [productInput, setProductInput] = useState('BioShield Alpha (Bio-fungicide)');
  const [isCustomProduct, setIsCustomProduct] = useState(false);
  const [customProductInput, setCustomProductInput] = useState('');
  const [stageInput, setStageInput] = useState('Lab Testing');
  const [projectList, setProjectList] = useState(INITIAL_PROJECTS);

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim()) return;

    const finalProduct = isCustomProduct ? customProductInput.trim() || 'Custom Product' : productInput;

    const newProject = {
      id: Date.now(),
      name: nameInput.trim(),
      product: finalProduct,
      stage: stageInput,
      progress: 5,
      team: 2,
      status: 'active',
    };

    setProjectList([newProject, ...projectList]);
    setNameInput('');
    setCustomProductInput('');
    setShowModal(false);
  };

  const handleDeleteProject = (id: number) => {
    setProjectList(projectList.filter((p) => p.id !== id));
  };

  // Group Projects Product-Wise
  const projectsByProduct = projectList
    .filter(
      (p) =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.product.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .reduce((acc, proj) => {
      const pName = proj.product || 'Unassigned Product';
      if (!acc[pName]) acc[pName] = [];
      acc[pName].push(proj);
      return acc;
    }, {} as Record<string, typeof projectList>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white shadow-md">
              <FolderGit2 className="w-5 h-5" />
            </div>
            Projects & Milestones
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">
            Product-wise structured R&D projects, stage milestones, and scientist team assignments
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-semibold hover:from-emerald-600 hover:to-teal-600 transition-all shadow-lg shadow-emerald-500/20 text-xs"
        >
          <Plus className="w-4 h-4" />
          New Project
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search projects or products..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500/30"
        />
      </div>

      {/* Product-Wise Grouped Projects */}
      {Object.keys(projectsByProduct).length === 0 ? (
        <div className="p-10 text-center border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-2xl">
          <FolderGit2 className="w-10 h-10 text-gray-300 dark:text-gray-700 mx-auto mb-2" />
          <p className="text-xs font-semibold text-gray-500">No R&D projects found.</p>
        </div>
      ) : (
        Object.entries(projectsByProduct).map(([pName, pList]) => (
          <div
            key={pName}
            className="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-md space-y-4"
          >
            {/* Product Section Header */}
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                  <Package className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-sm">{pName}</h3>
                  <p className="text-[11px] text-gray-400">{pList.length} Active R&D Projects</p>
                </div>
              </div>
            </div>

            {/* Project List Items */}
            <div className="space-y-3">
              {pList.map((project) => (
                <div
                  key={project.id}
                  className="bg-gray-50/50 dark:bg-gray-800/30 rounded-xl p-4 border border-gray-200 dark:border-gray-800 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white shrink-0">
                      <FolderGit2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 dark:text-white text-sm">{project.name}</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Stage: <span className="font-medium text-gray-700 dark:text-gray-300">{project.stage}</span></p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="w-32">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-gray-400 text-[10px]">Overall Progress</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400 text-[11px]">{project.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="h-1.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500"
                          style={{ width: `${project.progress}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Users className="w-4 h-4 text-emerald-500" />
                      <span>{project.team} Scientists</span>
                    </div>

                    <button
                      onClick={() => handleDeleteProject(project.id)}
                      className="p-1.5 text-gray-400 hover:text-red-500 rounded transition-colors"
                      title="Delete Project"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}

      {/* Creation Modal */}
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
              className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
                <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <FolderGit2 className="w-4 h-4 text-emerald-500" />
                  Create New R&D Project
                </h3>
                <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>

              <form onSubmit={handleCreateProject} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Project Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. BioShield Alpha Scaled Production Project"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    required
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Target Product *
                  </label>
                  <select
                    value={isCustomProduct ? 'custom' : productInput}
                    onChange={(e) => {
                      if (e.target.value === 'custom') {
                        setIsCustomProduct(true);
                      } else {
                        setIsCustomProduct(false);
                        setProductInput(e.target.value);
                      }
                    }}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm"
                  >
                    <option value="BioShield Alpha (Bio-fungicide)">BioShield Alpha (Bio-fungicide)</option>
                    <option value="custom">+ Add Custom Product...</option>
                  </select>

                  {isCustomProduct && (
                    <input
                      type="text"
                      placeholder="Type custom product name..."
                      value={customProductInput}
                      onChange={(e) => setCustomProductInput(e.target.value)}
                      className="mt-2 w-full px-4 py-2 bg-white dark:bg-gray-800 border border-emerald-400 rounded-xl text-sm"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Initial Stage
                  </label>
                  <select
                    value={stageInput}
                    onChange={(e) => setStageInput(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm"
                  >
                    <option value="Lab Testing">Lab Testing</option>
                    <option value="CIPAC Stability">CIPAC Stability</option>
                    <option value="Field Trial Phase 1">Field Trial Phase 1</option>
                    <option value="Commercial Validation">Commercial Validation</option>
                  </select>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 text-xs font-semibold text-gray-500 hover:bg-gray-100 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-xs rounded-xl shadow-md"
                  >
                    Create Project
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};