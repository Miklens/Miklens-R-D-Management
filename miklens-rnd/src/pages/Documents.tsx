import React, { useState } from 'react';
import { FileStack, Plus, X, Search, File, Folder, Upload, FileText, Image, Download, Trash2, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const mockDocuments = [
  { id: 1, name: 'BioShield Alpha - Trial Report Q1.pdf', type: 'PDF', size: '2.4 MB', category: 'Reports', uploadedAt: '2024-03-15' },
  { id: 2, name: 'Field Trial Data - Batch A.xlsx', type: 'Excel', size: '1.8 MB', category: 'Data', uploadedAt: '2024-03-14' },
  { id: 3, name: 'Product Specification v2.docx', type: 'Document', size: '450 KB', category: 'Specifications', uploadedAt: '2024-03-12' },
  { id: 4, name: 'Lab Images - Batch 12.zip', type: 'Archive', size: '156 MB', category: 'Images', uploadedAt: '2024-03-10' },
  { id: 5, name: 'Meeting Notes - R&D Sync.pptx', type: 'Presentation', size: '5.2 MB', category: 'Presentations', uploadedAt: '2024-03-08' },
];

export const Documents: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredDocs = mockDocuments.filter(d => 
    d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'PDF': return <FileText className="w-6 h-6 text-red-500" />;
      case 'Excel': return <FileText className="w-6 h-6 text-green-500" />;
      case 'Document': return <FileText className="w-6 h-6 text-blue-500" />;
      case 'Presentation': return <FileText className="w-6 h-6 text-orange-500" />;
      case 'Archive': return <Folder className="w-6 h-6 text-yellow-500" />;
      default: return <File className="w-6 h-6 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Documents Hub</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Manage and organize your research documents</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-medium hover:from-emerald-600 hover:to-teal-600 transition-all shadow-lg shadow-emerald-500/20"
        >
          <Upload className="w-5 h-5" />
          Upload File
        </button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search documents..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
        />
      </div>

      {/* Category Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {['Reports', 'Data', 'Specifications', 'Images', 'Presentations'].map((cat) => {
          const count = mockDocuments.filter(d => d.category === cat).length;
          return (
            <div key={cat} className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow border border-gray-100 dark:border-gray-800">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{count}</p>
              <p className="text-xs text-gray-500">{cat}</p>
            </div>
          );
        })}
      </div>

      {/* Documents List */}
      <div className="space-y-3">
        {filteredDocs.map((doc, index) => (
          <motion.div
            key={doc.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03 }}
            className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow border border-gray-100 dark:border-gray-800 flex items-center justify-between hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                {getFileIcon(doc.type)}
              </div>
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">{doc.name}</h3>
                <div className="flex items-center gap-3 text-sm text-gray-500">
                  <span>{doc.size}</span>
                  <span>•</span>
                  <span>{doc.category}</span>
                  <span>•</span>
                  <span>{doc.uploadedAt}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-500">
                <Eye className="w-5 h-5" />
              </button>
              <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-500">
                <Download className="w-5 h-5" />
              </button>
              <button className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-red-500">
                <Trash2 className="w-5 h-5" />
              </button>
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
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">Upload Documents</h3>
                  <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <form className="p-6 space-y-4">
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-8 text-center">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 dark:text-gray-400">Drag and drop files here</p>
                  <p className="text-sm text-gray-500 mt-1">or click to browse</p>
                  <input type="file" multiple className="hidden" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Category</label>
                  <select className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl">
                    <option>Reports</option>
                    <option>Data</option>
                    <option>Specifications</option>
                    <option>Images</option>
                    <option>Presentations</option>
                  </select>
                </div>
                <button type="button" onClick={() => setShowModal(false)} className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-semibold">
                  Upload Files
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};