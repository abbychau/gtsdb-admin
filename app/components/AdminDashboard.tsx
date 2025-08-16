'use client'
import { useState, useEffect } from 'react'
import Sidebar from './Sidebar'
import { TabSystem } from './TabSystem'
import { toast } from '@/hooks/use-toast'
import { InitKeyModal } from './InitKeyModal'
import { fetchApi } from '@/lib/utils'
import { useSettings } from '@/settings-context'

interface Tab {
  id: string
  title: string
  keyName: string
}

interface AdminDashboardProps {
  shouldLoadData?: boolean;
}

export default function AdminDashboard({ shouldLoadData = true }: AdminDashboardProps) {
  const [keys, setKeys] = useState<Array<{ key: string; count: number }>>([]);
  const [tabs, setTabs] = useState<Tab[]>([])
  const [activeTabId, setActiveTabId] = useState<string | null>(null)
  const [isInitKeyModalOpen, setIsInitKeyModalOpen] = useState(false)
  const [hasLoadedData, setHasLoadedData] = useState(false)
  const { settings } = useSettings()

  useEffect(() => {
    // Only fetch keys if shouldLoadData is true and we haven't loaded data yet
    if (shouldLoadData && !hasLoadedData) {
      fetchKeys();
      setHasLoadedData(true);
    }
  }, [shouldLoadData, hasLoadedData]);

  // Listen for messages from tab iframes
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'keyDeleted') {
        const deletedKey = event.data.key
        // Remove the key from the keys list
        setKeys(prevKeys => prevKeys.filter(key => key.key !== deletedKey))
        // Close the tab for this key
        setTabs(prevTabs => {
          const newTabs = prevTabs.filter(tab => tab.keyName !== deletedKey)
          // If the active tab was closed, set active tab to the first remaining tab
          if (activeTabId && prevTabs.find(tab => tab.id === activeTabId)?.keyName === deletedKey) {
            setActiveTabId(newTabs.length > 0 ? newTabs[0].id : null)
          }
          return newTabs
        })
      } else if (event.data.type === 'keyRenamed') {
        const { oldKey, newKey } = event.data
        // Update the key in the keys list
        setKeys(prevKeys => prevKeys.map(key => 
          key.key === oldKey ? { ...key, key: newKey } : key
        ))
        // Update the tab title and keyName
        setTabs(prevTabs => prevTabs.map(tab => 
          tab.keyName === oldKey 
            ? { ...tab, title: newKey, keyName: newKey }
            : tab
        ))
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [activeTabId]);

  const fetchKeys = async () => {
    const data = await fetchApi({
      body: JSON.stringify({ operation: 'idswithcount' })
    })
    if (data.success) {
      setKeys(data.data.data)
    }
  }

  const createTab = (keyName: string) => {
    // Check if tab already exists
    const existingTab = tabs.find(tab => tab.keyName === keyName)
    if (existingTab) {
      setActiveTabId(existingTab.id)
      return
    }

    // Create new tab
    const newTab: Tab = {
      id: `tab-${Date.now()}-${Math.random()}`,
      title: keyName,
      keyName: keyName
    }

    setTabs(prevTabs => [...prevTabs, newTab])
    setActiveTabId(newTab.id)
  }

  const closeTab = (tabId: string) => {
    setTabs(prevTabs => {
      const newTabs = prevTabs.filter(tab => tab.id !== tabId)
      
      // If closing the active tab, set active to the last remaining tab
      if (activeTabId === tabId) {
        setActiveTabId(newTabs.length > 0 ? newTabs[newTabs.length - 1].id : null)
      }
      
      return newTabs
    })
  }

  const initKey = async (keyName: string) => {
    try {
      const data = await fetchApi({
        body: JSON.stringify({ operation: 'initkey', key: keyName })
      })
      if (data.success) {
        setKeys(prevKeys => [...prevKeys, { key: keyName, count: 0 }])
        toast({
          title: "Success",
          description: `Key "${keyName}" initialized successfully.`,
        })
      } else {
        throw new Error(data.message)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to initialize key. Please try again.",
        variant: "destructive",
      })
    }
  }


  return (
    <div className="flex h-full">
      <Sidebar
        keys={keys}
        selectedKey={null}
        onSelectKey={createTab}
        onInitKey={() => setIsInitKeyModalOpen(true)}
        onRefreshKeys={fetchKeys}
      />
      <div className="flex-1 flex flex-col">
        <div className="flex-1">
          <TabSystem
            tabs={tabs}
            activeTabId={activeTabId}
            onTabSelect={setActiveTabId}
            onTabClose={closeTab}
          />
        </div>
        {/* footer about message - only show when no tabs are open */}
        {tabs.length === 0 && (
          <div className="p-4 text-muted-foreground text-sm border-t">
            <p>
              GTSDB is a time-series database built with Natively no-dep in Golang.
            </p>
            <p>
              <a
                href="https://github.com/abbychau/gtsdb"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                View source code on GitHub
              </a>
            </p>
          </div>
        )}
      </div>
      <InitKeyModal
        isOpen={isInitKeyModalOpen}
        onClose={() => setIsInitKeyModalOpen(false)}
        onInitKey={(keyName) => {
          initKey(keyName)
          setIsInitKeyModalOpen(false)
        }}
      />
    </div>
  )
}

