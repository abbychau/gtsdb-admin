"use client"
import { useEffect, useState, useRef } from 'react'
import AdminDashboard from '@/components/AdminDashboard'
import { Toaster } from '@/components/ui/toaster'
import { SettingsModal } from './settings-modal'
import { useSettings } from './settings-context'

export default function Home() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { initializeFromURL } = useSettings();
  const initialized = useRef(false);
  const [shouldLoadData, setShouldLoadData] = useState(false);

  useEffect(() => {
    if (initialized.current) return;

    const url = new URL(window.location.href);
    const apiUrl = url.searchParams.get('apiurl');

    if (apiUrl) {
      initializeFromURL(apiUrl);
      setIsSettingsOpen(false);
      setShouldLoadData(true);
      initialized.current = true;
      return;
    }

    // Read saved settings synchronously so the modal only appears when the
    // user genuinely has no API URL configured yet.
    let savedApiUrl = '';
    try {
      const ls = localStorage.getItem('gtsdb-settings');
      if (ls) savedApiUrl = JSON.parse(ls).apiUrl || '';
    } catch {
      savedApiUrl = '';
    }

    if (!savedApiUrl) {
      setIsSettingsOpen(true);
      setShouldLoadData(false);
    } else {
      setIsSettingsOpen(false);
      setShouldLoadData(true);
    }
    initialized.current = true;
  }, [initializeFromURL]);

  const handleSettingsClose = () => {
    setIsSettingsOpen(false);
    // Allow data loading after modal is closed
    setShouldLoadData(true);
  };

  return (
    <main className="h-screen overflow-hidden bg-background">
      <AdminDashboard
        shouldLoadData={shouldLoadData}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />
      <SettingsModal 
        isOpen={isSettingsOpen}
        onClose={handleSettingsClose}
      />
      <Toaster />
    </main>
  )
}