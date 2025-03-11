"use client"
import { useEffect, useState, useRef } from 'react'
import AdminDashboard from '@/components/AdminDashboard'
import { Toaster } from '@/components/ui/toaster'
import { Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SettingsModal } from './settings-modal'
import { useSettings } from './settings-context'

export default function Home() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { settings, initializeFromURL } = useSettings();
  const initialized = useRef(false);
  const [shouldLoadData, setShouldLoadData] = useState(false);

  useEffect(() => {
    if (initialized.current) return;
    
    const url = new URL(window.location.href);
    const apiUrl = url.searchParams.get('apiurl');
    
    if (apiUrl) {
      initializeFromURL(apiUrl);
    }
    
    // Show settings modal on startup if API URL is empty
    if (!settings.apiUrl) {
      setIsSettingsOpen(true);
      // Don't load data initially
      setShouldLoadData(false);
    } else {
      // If API URL is set, load data immediately
      setShouldLoadData(true);
    }
    
    initialized.current = true;
  }, [initializeFromURL, settings.apiUrl]);

  const handleSettingsClose = () => {
    setIsSettingsOpen(false);
    // Allow data loading after modal is closed
    setShouldLoadData(true);
  };

  return (
    <main className="h-screen flex flex-col">
      <header className="bg-primary text-primary-foreground p-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold">🐹 GTSDB Admin</h1>
        <div className="flex items-center gap-4">
          <Button
            onClick={() => setIsSettingsOpen(true)}
            className="flex items-center"
          >
            <Settings className="h-5 w-5" />
          </Button>
        </div>
      </header>
      <div className="flex-1 overflow-hidden">
        <AdminDashboard shouldLoadData={shouldLoadData} />
      </div>
      <SettingsModal 
        isOpen={isSettingsOpen}
        onClose={handleSettingsClose}
      />
      <Toaster />
    </main>
  )
}