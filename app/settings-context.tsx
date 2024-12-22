"use client"
import { createContext, useContext, useState, useEffect } from 'react';

interface Settings {
  showVisualization: boolean;
  showRequest: boolean;
  hostname: string;
  port: string;
}

const SettingsContext = createContext<{
  settings: Settings;
  updateSettings: (newSettings: Partial<Settings>) => void;
}>({
  settings: {
    showVisualization: true,
    showRequest: true,
    hostname: '',
    port: ''
  },
  updateSettings: () => {}
});

export function SettingsProvider({ children }: { children: React.ReactNode }) {
    const [settings, setSettings] = useState<Settings>({
      showVisualization: true,
      showRequest: true,
      hostname: '',
      port: ''
    });
  
    useEffect(() => {
      const saved = localStorage.getItem('gtsdb-settings');
      if (saved) {
        setSettings(JSON.parse(saved));
      }
    }, []);
  
    const updateSettings = (newSettings: Partial<Settings>) => {
      const updated = { ...settings, ...newSettings };
      setSettings(updated);
      localStorage.setItem('gtsdb-settings', JSON.stringify(updated));
      console.log(updated)
    };
  
    return (
      <SettingsContext.Provider value={{ settings, updateSettings }}>
        {children}
      </SettingsContext.Provider>
    );
  }

export const useSettings = () => useContext(SettingsContext);