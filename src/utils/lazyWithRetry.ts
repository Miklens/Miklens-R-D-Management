import { lazy, ComponentType } from 'react';

/**
 * Utility to wrap React.lazy dynamic imports with automatic retry & reload logic
 * Catches Vercel redeployment chunk mismatch errors ("Failed to fetch dynamically imported module")
 */
export function lazyWithRetry<T extends ComponentType<any>>(
  componentImport: () => Promise<{ default: T }>
) {
  return lazy(async () => {
    const pageHasBeenRefreshed = sessionStorage.getItem('chunk_reload_attempted') === 'true';

    try {
      const component = await componentImport();
      // On clean load, clear the reload flag
      sessionStorage.removeItem('chunk_reload_attempted');
      return component;
    } catch (error: any) {
      console.warn('Dynamic import chunk load failed:', error);

      const isChunkError =
        error?.message?.includes('Failed to fetch dynamically imported module') ||
        error?.message?.includes('Importing a module script failed') ||
        error?.name === 'TypeError' ||
        error?.toString().includes('dynamically imported module');

      if (isChunkError && !pageHasBeenRefreshed) {
        console.warn('New deployment detected — auto-refreshing browser to fetch latest assets...');
        sessionStorage.setItem('chunk_reload_attempted', 'true');
        window.location.reload();
        // Return blank placeholder while reloading
        return { default: (() => null) as unknown as T };
      }

      // If already reloaded once and still failing, throw error to ErrorBoundary
      throw error;
    }
  });
}
