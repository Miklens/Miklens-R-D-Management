/**
 * APPLICATION CONFIGURATION
 * Centralized configuration loading and validation
 */

export interface AppConfigType {
  app: {
    name: string;
    version: string;
    description: string;
    themeColor: string;
  };
  api: {
    baseUrl: string;
    timeout: number;
  };
  features: {
    aiChatbot: boolean;
    analytics: boolean;
    auditLogs: boolean;
    googleDrive: boolean;
  };
  security: {
    sessionTimeout: number; // ms
    passwordMinLength: number;
    enableOfflineMode: boolean;
  };
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error';
    enableConsole: boolean;
  };
}

/**
 * Load and validate app configuration
 */
export const loadAppConfig = (): AppConfigType => {
  // Validate required environment variables in production
  const isDev = import.meta.env.DEV;
  
  return {
    app: {
      name: import.meta.env.VITE_APP_NAME || 'Miklens Bio R&D Platform',
      version: import.meta.env.VITE_APP_VERSION || '1.0.0',
      description: import.meta.env.VITE_APP_DESCRIPTION || 
        'Enterprise AI Powered Research & Development Management Platform',
      themeColor: import.meta.env.VITE_APP_THEME_COLOR || '#059669',
    },
    api: {
      baseUrl: import.meta.env.VITE_API_BASE_URL || '',
      timeout: 30000, // 30 seconds
    },
    features: {
      aiChatbot: import.meta.env.VITE_ENABLE_AI_CHATBOT !== 'false',
      analytics: import.meta.env.VITE_ENABLE_ANALYTICS !== 'false',
      auditLogs: import.meta.env.VITE_ENABLE_AUDIT_LOGS !== 'false',
      googleDrive: import.meta.env.VITE_ENABLE_GOOGLE_DRIVE === 'true',
    },
    security: {
      sessionTimeout: 30 * 60 * 1000, // 30 minutes
      passwordMinLength: 6,
      enableOfflineMode: true,
    },
    logging: {
      level: isDev ? 'debug' : 'warn',
      enableConsole: isDev,
    },
  };
};

export const appConfig = loadAppConfig();
