import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { logger } from '../utils/logger';

interface Props {
  children: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * ERROR BOUNDARY COMPONENT
 * Catches React errors and displays professional fallback UI
 * Features auto-recovery for dynamic module import errors on redeployment
 */
export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });

    // Check if error is due to Vercel redeployment chunk hash mismatch
    const isChunkError =
      error?.message?.includes('Failed to fetch dynamically imported module') ||
      error?.message?.includes('Importing a module script failed') ||
      error?.toString().includes('dynamically imported module');

    if (isChunkError) {
      const pageHasBeenRefreshed = sessionStorage.getItem('chunk_reload_attempted') === 'true';
      if (!pageHasBeenRefreshed) {
        sessionStorage.setItem('chunk_reload_attempted', 'true');
        console.warn('Chunk load error caught in ErrorBoundary — auto-refreshing for new build assets...');
        window.location.reload();
        return;
      }
    }

    // Log error for debugging
    logger.error('React Error Boundary caught error', error, {
      module: 'ErrorBoundary',
      action: 'componentDidCatch',
    });

    // Call optional custom error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleReset = (): void => {
    sessionStorage.removeItem('chunk_reload_attempted');
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      const isChunkError =
        this.state.error?.message?.includes('Failed to fetch dynamically imported module') ||
        this.state.error?.message?.includes('Importing a module script failed') ||
        this.state.error?.toString().includes('dynamically imported module');

      return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-gray-900 dark:to-gray-800 p-4">
          <div className="mx-auto w-full max-w-md">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-2xl border border-gray-200 dark:border-gray-700 text-center space-y-4">
              {/* Error Icon */}
              <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full">
                <AlertTriangle className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
              </div>

              {/* Error Message */}
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {isChunkError ? 'New App Update Available!' : 'Oops! Something went wrong'}
              </h2>

              <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                {isChunkError
                  ? 'A new version of Miklens R&D Management platform has been deployed. Click below to load the latest features!'
                  : 'We encountered an unexpected error. Click below to reload the app.'}
              </p>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                <button
                  onClick={this.handleReset}
                  className="w-full py-3 px-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4" />
                  {isChunkError ? 'Update & Reload App' : 'Reload Application'}
                </button>

                <button
                  onClick={() => (window.location.href = '/')}
                  className="w-full py-2.5 px-4 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Home className="w-3.5 h-3.5" />
                  Go to Dashboard
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
