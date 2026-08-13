export interface ElectronAPI {
  readLocalJson: (filename: string) => Promise<{ success: boolean; data: any; error?: string; path?: string }>;
  writeLocalJson: (filename: string, data: any) => Promise<{ success: boolean; error?: string }>;
  // добавьте сюда остальные методы из preload.js
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export {};