'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export interface ChartData {
  id: string
  keyName: string
  title: string
  data: any
  requestParams: {
    start_timestamp?: number
    end_timestamp?: number
    downsampling?: number
    lastx?: number
    aggregation?: string
  }
  timestamp: number
}

interface ComparisonContextType {
  charts: ChartData[]
  addChart: (chart: Omit<ChartData, 'id' | 'timestamp'>) => void
  removeChart: (id: string) => void
  clearCharts: () => void
}

const ComparisonContext = createContext<ComparisonContextType | undefined>(undefined)

const STORAGE_KEY = 'gtsdb-comparison-charts'

export function ComparisonProvider({ children }: { children: ReactNode }) {
  const [charts, setCharts] = useState<ChartData[]>([])
  const [isClient, setIsClient] = useState(false)

  // Load from localStorage on mount
  useEffect(() => {
    setIsClient(true)
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        setCharts(JSON.parse(stored))
      }
    } catch (error) {
      console.error('Error loading comparison charts from storage:', error)
    }
  }, [])

  // Save to localStorage whenever charts change
  useEffect(() => {
    if (isClient) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(charts))
      } catch (error) {
        console.error('Error saving comparison charts to storage:', error)
      }
    }
  }, [charts, isClient])

  // Listen for storage changes from other windows/iframes
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          setCharts(JSON.parse(e.newValue))
        } catch (error) {
          console.error('Error parsing storage event:', error)
        }
      }
    }

    window.addEventListener('storage', handleStorageChange)
    
    // For same-window updates (like iframe communication), use a custom event
    const handleCustomUpdate = (e: CustomEvent) => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) {
          setCharts(JSON.parse(stored))
        }
      } catch (error) {
        console.error('Error loading charts on custom event:', error)
      }
    }
    
    // Listen for postMessage from parent/iframes
    const handleMessage = (e: MessageEvent) => {
      if (e.data.type === 'comparison-charts-updated') {
        try {
          const stored = localStorage.getItem(STORAGE_KEY)
          if (stored) {
            setCharts(JSON.parse(stored))
          }
        } catch (error) {
          console.error('Error loading charts on message:', error)
        }
      }
    }
    
    window.addEventListener('comparison-charts-updated' as any, handleCustomUpdate as any)
    window.addEventListener('message', handleMessage)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('comparison-charts-updated' as any, handleCustomUpdate as any)
      window.removeEventListener('message', handleMessage)
    }
  }, [])

  const addChart = (chart: Omit<ChartData, 'id' | 'timestamp'>) => {
    const newChart: ChartData = {
      ...chart,
      id: `chart-${Date.now()}-${Math.random()}`,
      timestamp: Date.now()
    }
    setCharts(prev => {
      const updated = [...prev, newChart]
      // Notify iframes about the change
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('comparison-charts-updated'))
        // Also notify parent and all iframes
        if (window.parent !== window) {
          window.parent.postMessage({ type: 'comparison-charts-updated' }, '*')
        }
        document.querySelectorAll('iframe').forEach(iframe => {
          iframe.contentWindow?.postMessage({ type: 'comparison-charts-updated' }, '*')
        })
      }, 0)
      return updated
    })
  }

  const removeChart = (id: string) => {
    setCharts(prev => {
      const updated = prev.filter(chart => chart.id !== id)
      // Notify iframes about the change
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('comparison-charts-updated'))
        if (window.parent !== window) {
          window.parent.postMessage({ type: 'comparison-charts-updated' }, '*')
        }
        document.querySelectorAll('iframe').forEach(iframe => {
          iframe.contentWindow?.postMessage({ type: 'comparison-charts-updated' }, '*')
        })
      }, 0)
      return updated
    })
  }

  const clearCharts = () => {
    setCharts([])
    // Notify iframes about the change
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('comparison-charts-updated'))
      if (window.parent !== window) {
        window.parent.postMessage({ type: 'comparison-charts-updated' }, '*')
      }
      document.querySelectorAll('iframe').forEach(iframe => {
        iframe.contentWindow?.postMessage({ type: 'comparison-charts-updated' }, '*')
      })
    }, 0)
  }

  return (
    <ComparisonContext.Provider value={{ charts, addChart, removeChart, clearCharts }}>
      {children}
    </ComparisonContext.Provider>
  )
}

export function useComparison() {
  const context = useContext(ComparisonContext)
  if (context === undefined) {
    throw new Error('useComparison must be used within a ComparisonProvider')
  }
  return context
}
