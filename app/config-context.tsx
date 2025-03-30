'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useSettings } from './settings-context'

interface ConfigData {
  multipliers: { [key: string]: number };
  units: { [key: string]: string };
  offsets: { [key: string]: number };
  hints: { [key: string]: string };
}

interface ConfigContextType {
  config: ConfigData;
  updateConfig: (newConfig: ConfigData) => void;
  getMultiplier: (key: string) => number;
  getUnit: (key: string) => string;
  getOffset: (key: string) => number;
  getHint: (key: string) => string;
}

const defaultConfig: ConfigData = {
  multipliers: {},
  units: {},
  offsets: {},
  hints: {}
};

const ConfigContext = createContext<ConfigContextType>({
  config: defaultConfig,
  updateConfig: () => {},
  getMultiplier: () => 1,
  getUnit: () => '',
  getOffset: () => 0,
  getHint: () => '',
});

export function ConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<ConfigData>(defaultConfig);
  const { settings } = useSettings();

  // Load config from API when apiUrl changes
  useEffect(() => {
    if (!settings.apiUrl) return;
    
    const fetchConfig = async () => {
      try {
        const response = await fetch(`/api/tsdb?apiUrl=${encodeURIComponent(settings.apiUrl)}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ operation: 'getapiurlconfig' })
        });
        
        const result = await response.json();
        if (result.success && result.data) {
          setConfig(result.data);
        }
      } catch (error) {
        console.error('Error fetching configuration:', error);
      }
    };

    fetchConfig();
  }, [settings.apiUrl]);

  const updateConfig = (newConfig: ConfigData) => {
    setConfig(newConfig);
  };

  const getMultiplier = (key: string): number => {
    
    console.log(config.multipliers, key)
    // First check if there's an exact match
    if (config.multipliers[key] !== undefined) {
      return config.multipliers[key];
    }

    // Check if there's a match with a wildcard (e.g., "*name*" or "name*" or "*name")
    const wildcardMatch = Object.keys(config.multipliers).find((k) => {
      const regex = new RegExp(k.replace(/\*/g, '.*'));
      return regex.test(key);
    });
    if (wildcardMatch) {
      return config.multipliers[wildcardMatch];
    }
    // Otherwise return 1 (no multiplier)
    return 1;
  };

  const getUnit = (key: string): string => {
    // First check if there's an exact match
    if (config.units[key] !== undefined) {
      return config.units[key];
    }

    // Check if there's a match with a wildcard (e.g., "*name*" or "name*" or "*name")
    const wildcardMatch = Object.keys(config.units).find((k) => {
      const regex = new RegExp(k.replace(/\*/g, '.*'));
      return regex.test(key);
    });
    if (wildcardMatch) {
      return config.units[wildcardMatch];
    }
    
    // Otherwise return empty string (no unit)
    return '';
  };

  const getOffset = (key: string): number => {
    // First check if there's an exact match
    if (config.offsets && config.offsets[key] !== undefined) {
      return config.offsets[key];
    }

    // Check if there's a match with a wildcard (e.g., "*name*" or "name*" or "*name")
    if (config.offsets) {
      const wildcardMatch = Object.keys(config.offsets).find((k) => {
        const regex = new RegExp(k.replace(/\*/g, '.*'));
        return regex.test(key);
      });
      if (wildcardMatch) {
        return config.offsets[wildcardMatch];
      }
    }
    
    // Otherwise return 0 (no offset)
    return 0;
  };

  const getHint = (key: string): string => {
    // First check if there's an exact match
    if (config.hints && config.hints[key] !== undefined) {
      return config.hints[key];
    }

    // Check if there's a match with a wildcard (e.g., "*name*" or "name*" or "*name")
    if (config.hints) {
      const wildcardMatch = Object.keys(config.hints).find((k) => {
        const regex = new RegExp(k.replace(/\*/g, '.*'));
        return regex.test(key);
      });
      if (wildcardMatch) {
        return config.hints[wildcardMatch];
      }
    }
    
    // Otherwise return empty string (no hint)
    return '';
  };

  return (
    <ConfigContext.Provider value={{ config, updateConfig, getMultiplier, getUnit, getOffset, getHint }}>
      {children}
    </ConfigContext.Provider>
  );
}

export const useConfig = () => useContext(ConfigContext);
