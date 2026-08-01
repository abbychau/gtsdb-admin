"use client"
import { createContext, useContext, useState, useEffect } from 'react';

export const DEFAULT_API_URL = '';

interface Settings {
  showVisualization: boolean;
  showRequest: boolean;
  hostname: string;
  port: string;
  apiUrl: string;
  token: string;
}

const defaultSettings: Settings = {
  showVisualization: true,
  showRequest: true,
  hostname: '',
  port: '',
  apiUrl: DEFAULT_API_URL,
  token: ''
};

const SettingsContext = createContext<{
  settings: Settings;
  updateSettings: (newSettings: Partial<Settings>) => void;
  initializeFromURL: (apiUrl: string, token?: string) => void;
}>({
  settings: defaultSettings,
  updateSettings: () => {},
  initializeFromURL: () => {}
});

export function SettingsProvider({ children }: { children: React.ReactNode }) {
    const [settings, setSettings] = useState<Settings>(defaultSettings);
  
    useEffect(() => {
      const saved = localStorage.getItem('gtsdb-settings');
      if (saved) {
        const parsedSettings = JSON.parse(saved);
        // Merge over defaults so missing keys (showVisualization etc.)
        // keep their default values instead of becoming undefined.
        setSettings({
          ...defaultSettings,
          ...parsedSettings,
          apiUrl: parsedSettings.apiUrl || DEFAULT_API_URL
        });
      }
    }, []);

    const initializeFromURL = (apiUrl: string, token?: string) => {
      const updated = { ...settings, apiUrl, ...(token ? { token } : {}) };
      setSettings(updated);
      localStorage.setItem('gtsdb-settings', JSON.stringify(updated));
      console.log('Settings initialized from URL:', updated);
    };
  
    const updateSettings = (newSettings: Partial<Settings>) => {
      const updated = { ...settings, ...newSettings };
      setSettings(updated);
      localStorage.setItem('gtsdb-settings', JSON.stringify(updated));
      console.log('Settings updated:', updated);
    };
  
    return (
      <SettingsContext.Provider value={{ settings, updateSettings, initializeFromURL }}>
        {children}
      </SettingsContext.Provider>
    );
  }

export const useSettings = () => useContext(SettingsContext);