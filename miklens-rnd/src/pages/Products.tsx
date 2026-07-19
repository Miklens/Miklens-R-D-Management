import React from 'react';
import { CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { useProducts } from '../hooks/useProducts';

const mockProducts = [
  {
    id: 'p1',
    name: 'BioShield Alpha',
    category: 'Bio-fungicide',
    stage: 'Lab Testing',
    status: 'Active',
    progress: 45,
    teamSize: 4,
    lastUpdate: '2 hours ago'
  },
  {
    id: 'p2',
    name: 'NemaKill Pro',
    category: 'Bio-nematicide',
    stage: 'Field Trial',
    status: 'Delayed',
    progress: 75,
    teamSize: 6,
    lastUpdate: '1 day ago'
  },
  {
    id: 'p3',
    name: 'RootBoost X',
    category: 'Bio-stimulant',
    stage: 'Commercial Validation',
    status: 'Blocked',
    progress: 90,
    teamSize: 3,
    lastUpdate: '5 mins ago'
  },
  {
    id: 'p4',
    name: 'AeroSpore V2',
    category: 'Bio-insecticide',
    stage: 'Commercial Launch',
    status: 'Completed',
    progress: 100,
    teamSize: 8,
    lastUpdate: '1 week ago'
  }
];

export const Products: React.FC = () => {
  const { data: realProducts, isLoading } = useProducts();

  // Fallback to mock data if Firestore connection is missing or empty
  const products = realProducts && realProducts.length > 0 ? realProducts : mockProducts;

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
      case 'Completed': return 'bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-900/50 dark:text-green-200';
      case 'Delayed': return 'bg-yellow-50 text-yellow-800 ring-yellow-600/20 dark:bg-yellow-900/50 dark:text-yellow-200';
      case 'Blocked': return 'bg-red-50 text-red-700 ring-red-600/10 dark:bg-red-900/50 dark:text-red-200';
      default: return 'bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-900/50 dark:text-blue-200';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold leading-7 text-gray-900 dark:text-white sm:truncate sm:text-3xl sm:tracking-tight">
          Products
        </h2>
        <button className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">
          New Product
        </button>
      </div>

      {isLoading ? (
        <div className="p-8 text-center text-gray-500">Loading products...</div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => (
            <div key={product.id} className="relative flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all hover:shadow-md dark:border-gray-800 dark:bg-gray-900">
              <div className="p-6">
                <div className="flex items-center justify-between">
                  {getStatusIcon(product.status)}
                  <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${getStatusColor(product.status)}`}>
                    {product.status}
                  </span>
                </div>

                <div className="mt-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{product.name}</h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{product.category}</p>
                </div>

                <div className="mt-6">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Stage:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{product.stage}</span>
                  </div>

                  <div className="mt-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500 dark:text-gray-400">Progress</span>
                      <span className="font-medium text-gray-900 dark:text-white">{product.progress}%</span>
                    </div>
                    <div className="mt-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800">
                      <div
                        className={`h-2 rounded-full ${
                          product.status === 'Blocked' ? 'bg-red-500' :
                          product.status === 'Completed' ? 'bg-green-500' :
                          'bg-blue-600'
                        }`}
                        style={{ width: `${product.progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-auto border-t border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900/50">
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span>{product.teamSize} team members</span>
                  <span>Updated {product.lastUpdate}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
