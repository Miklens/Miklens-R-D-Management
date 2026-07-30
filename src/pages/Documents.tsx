import React, { useState } from 'react';
import { FileStack, Plus, X, Search, File, Folder, Upload, FileText, Download, Trash2, Package } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const INITIAL_DOCUMENTS = [
  { 
    id: 1, 
    name: 'BioShield Alpha - Efficacy Trial Summary Q3.pdf', 
    product: 'BioShield Alpha (Bio-fungicide)', 
    type: 'PDF', 
    size: '2.4 MB', 
    category: 'Reports', 
    uploadedAt: '2026-07-28' 
  },
  { 
    id: 2, 
    name: 'BioShield Alpha - CIPAC MT 161 Stability Log.xlsx', 
    product: 'BioShield Alpha (Bio-fungicide)', 
    type: 'Excel', 
    size: '1.8 MB', 
    category: 'Data', 
    uploadedAt: '2026-07-25' 
  },
  { 
    id: 3, 
    name: 'BioShield Alpha - Active Ingredient Technical Spec v2.docx', 
    product: 'BioShield Alpha (Bio-fungicide)', 
    type: 'Document', 
    size: '450 KB', 
    category: 'Specifications', 
    uploadedAt: '2026-07-20' 
  },
];

export const Documents: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [fileNameInput, setFileNameInput] = useState('');
  const [productInput, setProductInput] = useState('BioShield Alpha (Bio-fungicide)');
  const [isCustomProduct, setIsCustomProduct] = useState(false);
  const [customProductInput, setCustomProductInput] = useState('');
  const [categoryInput, setCategoryInput] = useState('Reports');
  const [docList, setDocList] = useState(INITIAL_DOCUMENTS);

  const handleUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileNameInput.trim()) return;

    const finalProduct = isCustomProduct ? customProductInput.trim() || 'Custom Product' : productInput;

    const newDoc = {
      id: Date.now(),
      name: fileNameInput.trim(),
      product: finalProduct,
      type: categoryInput === 'Reports' ? 'PDF' : categoryInput === 'Data' ? 'Excel' : 'Document',
      size: '1.4 MB',
      category: categoryInput,
      uploadedAt: new Date().toISOString().split('T')[0],
    };

    setDocList([newDoc, ...docList]);
    setFileNameInput('');
    setCustomProductInput('');
    setShowModal(false);
  };

  const handleDeleteDoc = (id: number) => {
    setDocList(docList.filter((d) => d.id !== id));
  };

  // Group Documents Product-Wise
  const docsByProduct = docList
    .filter(
      (d) =>
        d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.category.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .reduce((acc, doc) => {
      const pName = doc.product || 'Unassigned Product';
      if (!acc[pName]) acc[pName] = [];
      acc[pName].push(doc);
      return acc;
    }, {} as Record<string, typeof docList>);

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'PDF':
        return <FileText className="w-5 h-5 text-red-500" />;
      case 'Excel':
        return <FileText className="w-5 h-5 text-emerald-500" />;
      default:
        return <File className="w-5 h-5 text-blue-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white shadow-md">
              <FileStack className="w-5 h-5" />
            </div>
            Documents Library & R&D Dossiers
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">
            Product-wise organized assay reports, CIPAC data sheets, and regulatory dossiers
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-semibold hover:from-emerald-600 hover:to-teal-600 transition-all shadow-lg shadow-emerald-500/20 text-xs"
        >
          <Upload className="w-4 h-4" />
          Upload Document
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search documents or products..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500/30"
        />
      </div>

      {/* Product-Wise Grouped Documents */}
      {Object.keys(docsByProduct).length === 0 ? (
        <div className="p-10 text-center border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-2xl">
          <FileStack className="w-10 h-10 text-gray-300 dark:text-gray-700 mx-auto mb-2" />
          <p className="text-xs font-semibold text-gray-500">No R&D documents found.</p>
        </div>
      ) : (
        Object.entries(docsByProduct).map(([pName, dList]) => (
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
                  <p className="text-[11px] text-gray-400">{dList.length} Uploaded Files & Reports</p>
                </div>
              </div>
            </div>

            {/* Document Cards */}
            <div className="space-y-2.5">
              {dList.map((doc) => (
                <div
                  key={doc.id}
                  className="p-3.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center shrink-0">
                      {getFileIcon(doc.type)}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-gray-900 dark:text-white text-xs truncate">{doc.name}</h4>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        {doc.size} • Category: <span className="font-semibold text-gray-700 dark:text-gray-300">{doc.category}</span> • Uploaded: {doc.uploadedAt}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => alert(`Downloading ${doc.name}...`)}
                      className="p-1.5 text-gray-400 hover:text-emerald-500 rounded transition-colors"
                      title="Download"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteDoc(doc.id)}
                      className="p-1.5 text-gray-400 hover:text-red-500 rounded transition-colors"
                      title="Delete"
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

      {/* Upload Modal */}
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
                  <Upload className="w-4 h-4 text-emerald-500" />
                  Upload R&D Document / Report
                </h3>
                <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>

              <form onSubmit={handleUpload} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Document Title *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. BioShield Alpha - CIPAC Accelerated Heat Stability Log.pdf"
                    value={fileNameInput}
                    onChange={(e) => setFileNameInput(e.target.value)}
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
                    Category
                  </label>
                  <select
                    value={categoryInput}
                    onChange={(e) => setCategoryInput(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm"
                  >
                    <option value="Reports">Reports</option>
                    <option value="Data">Data Sheets</option>
                    <option value="Specifications">Technical Specs</option>
                    <option value="Presentations">Presentations</option>
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
                    Upload File
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