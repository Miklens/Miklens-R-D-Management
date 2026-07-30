import React from 'react';
import { Outlet } from 'react-router-dom';

export const AuthLayout: React.FC = () => {
  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex flex-1 flex-col justify-center py-12 px-4 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <div>
            <h2 className="mt-6 text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
              Miklens Bio R&D
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Enterprise AI Intelligence Platform
            </p>
          </div>
          <div className="mt-8">
            <Outlet />
          </div>
        </div>
      </div>
      <div className="relative hidden w-0 flex-1 lg:block">
        <div className="absolute inset-0 bg-blue-600">
           {/* Abstract pattern or image here */}
           <div className="flex h-full items-center justify-center text-white/20">
             <span className="text-9xl font-bold">INNOVATE</span>
           </div>
        </div>
      </div>
    </div>
  );
};
