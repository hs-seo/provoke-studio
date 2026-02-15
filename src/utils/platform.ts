// Detect if running in Tauri
export const isTauri = (): boolean => {
  return typeof window !== 'undefined' && '__TAURI__' in window;
};

// Detect if running in development mode
export const isDevelopment = (): boolean => {
  return import.meta.env.DEV;
};
