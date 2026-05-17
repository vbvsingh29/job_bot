import { create } from 'zustand';

export const useAutomationStore = create((set) => ({
  config: null,
  isRunning: false,
  lastResult: null,
  setConfig: (config) => set({ config }),
  setRunning: (isRunning) => set({ isRunning }),
  setLastResult: (lastResult) => set({ lastResult }),
}));
