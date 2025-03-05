"use client"
import { createContext, useContext, useState, useEffect } from 'react';

export const DEFAULT_API_URL = 'http://gtsdb-web.abby.md';

interface Settings {
  showVisualization: boolean;
  showRequest: boolean;
  hostname: string;
  port: string;
  apiUrl: string;
}

const defaultSettings: Settings = {
  showVisualization: true,
  showRequest: true,
  hostname: '',
  port: '',
  apiUrl: DEFAULT_API_URL
};

const SettingsContext = createContext<{
  settings: Settings;
  updateSettings: (newSettings: Partial<Settings>) => void;
  initializeFromURL: (apiUrl: string) => void;
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
        // Ensure apiUrl is never empty
        setSettings({
          ...parsedSettings,
          apiUrl: parsedSettings.apiUrl || DEFAULT_API_URL
        });
      }
    }, []);

    const initializeFromURL = (apiUrl: string) => {
      const updated = { ...settings, apiUrl };
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