import React from 'react';
import { File, FileImage, FileText, Download } from 'lucide-react';
import { motion } from 'framer-motion';

const mockDocs = [
  { id: 1, name: 'Toxicity Report v2.pdf', type: 'PDF', size: '2.4 MB', date: 'Oct 24, 2023' },
  { id: 2, 단어: 'Fungal_Culture_Day5.jpg', type: 'Image', size: '4.1 MB', date: 'Oct 23, 2023' },
  { id: 3, name: 'SOP_Greenhouse_Setup.docx', type: 'Doc', size: '1.2 MB', date: 'Oct 20, 2023' },
];

export const Documents: React.FC = () => {
  const getIcon = (type: string) => {
    switch (type) {
      case 'Image': return <FileImage className="h-8 w-8 text-blue-500" />;
      case 'PDF': return <FileText className="h-8 w-8 text-red-500" />;
      default: return <File className="h-8 w-8 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold leading-7 text-gray-900 dark:text-white sm:truncate sm:text-3xl sm:tracking-tight">
            Documents Hub
          </h2>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Securely access research papers, protocols, and media files.
          </p>
        </div>
        <button className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500">
          Upload File
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {mockDocs.map((doc, index) => (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            key={doc.id}
            className="group flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md dark:border-gray-800 dark:bg-gray-900"
          >
            <div className="flex items-center space-x-4 overflow-hidden">
              <div className="flex-shrink-0">
                {getIcon(doc.type)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                  {doc.name || doc.단어}
                </p>
                <p className="truncate text-sm text-gray-500 dark:text-gray-400">
                  {doc.size} • {doc.date}
                </p>
              </div>
            </div>
            <button className="flex-shrink-0 text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 opacity-0 transition-opacity group-hover:opacity-100">
              <Download className="h-5 w-5" />
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
