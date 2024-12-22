"use client"
import AdminDashboard from '../components/AdminDashboard'
import { Toaster } from '@/components/ui/toaster'
import { Github, Globe, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { SettingsModal } from './settings-modal'

export default function Home() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

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
          <a 
            href="https://gtsdb-homepage.vercel.app/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center"
          >
            <Globe className="h-6 w-6 mr-2" />
          </a>
        </div>
      </header>
      <div className="flex-1 overflow-hidden">
        <AdminDashboard />
      </div>
      <SettingsModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
      <Toaster />
    </main>
  )
}