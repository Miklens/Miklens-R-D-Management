import React, { useState } from 'react';
import { FolderGit2, Plus, X, Search, Clock, Users, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const mockProjects = [
  { id: 1, name: 'BioShield Development', product: 'BioShield Alpha', stage: 'Lab Testing', progress: 45, team: 4, status: 'active' },
  { id: 2, name: 'NemaKill Field Trials', product: 'NemaKill Pro', stage: 'Field Trial', progress: 75, team: 6, status: 'active' },
  { id: 3, name: 'RootBoost Validation', product: 'RootBoost X', stage: 'Commercial Validation', progress: 90, team: 3, status: 'delayed' },
  { id: 4, name: 'AeroSpore Launch', product: 'AeroSpore V2', stage: 'Commercial Launch', progress: 100, team: 8, status: 'completed' },
];

export const Projects: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredProjects = mockProjects.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.product.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Projects</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Track and manage ongoing research projects</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-medium hover:from-emerald-600 hover:to-teal-600 transition-all shadow-lg shadow-emerald-500/20"
        >
          <Plus className="w-5 h-5" />
          New Project
        </button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search projects..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
        />
      </div>

      <div className="space-y-4">
        {filteredProjects.map((project, index) => (
          <motion.div
            key={project.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-lg border border-gray-100 dark:border-gray-800 hover:shadow-xl transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
                  <FolderGit2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-lg">{project.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{project.product} • {project.stage}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right hidden md:block">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{project.progress}%</p>
                  <p className="text-xs text-gray-500">Complete</p>
                </div>
                <div className="flex items-center gap-2 text-gray-400 group-hover:text-emerald-500 transition-colors">
                  <span className="flex items-center gap-1 text-sm">
                    <Users className="w-4 h-4" />
                    {project.team}
                  </span>
                  <ChevronRight className="w-5 h-5" />
                </div>
              </div>
            </div>
            <div className="mt-4 w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2">
              <div 
                className="h-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500"
                style={{ width: `${project.progress}%` }}
              />
            </div>
          </motion.div>
        ))}
      </div>

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
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">Create New Project</h3>
                  <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <form className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Project Name</label>
                  <input type="text" placeholder="Enter project name" className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Related Product</label>
                  <select className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl">
                    <option>BioShield Alpha</option>
                    <option>NemaKill Pro</option>
                    <option>RootBoost X</option>
                    <option>AeroSpore V2</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Stage</label>
                  <select className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl">
                    <option>Research</option>
                    <option>Lab Testing</option>
                    <option>Field Trial</option>
                    <option>Commercial Validation</option>
                  </select>
                </div>
                <button type="button" onClick={() => setShowModal(false)} className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-semibold">
                  Create Project
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};