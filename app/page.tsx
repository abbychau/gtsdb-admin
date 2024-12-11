import AdminDashboard from '../components/AdminDashboard'
import { Toaster } from '@/components/ui/toaster'
import { Github } from 'lucide-react'

export default function Home() {
  return (
    <main className="h-screen flex flex-col">
      <header className="bg-primary text-primary-foreground p-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold">🐹 GTSDB Admin</h1>
        <a href="https://github.com/abbychau/gtsdb" target="_blank" rel="noopener noreferrer">
          <Github className="h-6 w-6" />
        </a>
      </header>
      <div className="flex-1 overflow-hidden">
        <AdminDashboard />
      </div>
      <Toaster />
    </main>
  )
}

