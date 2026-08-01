'use client'
import { useState, useEffect } from 'react'
import Sidebar from './Sidebar'
import Overview, { KeyCountItem } from './Overview'
import KeyDetail from './KeyDetail'
import MultiQuery from './MultiQuery'
import { toast } from '@/hooks/use-toast'
import { InitKeyModal } from './InitKeyModal'
import { fetchApi } from '@/lib/utils'
import { ArrowLeft, BarChart3 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface AdminDashboardProps {
  shouldLoadData?: boolean;
  onOpenSettings?: () => void;
}

export default function AdminDashboard({ shouldLoadData = true, onOpenSettings }: AdminDashboardProps) {
  const [keys, setKeys] = useState<KeyCountItem[]>([]);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [multiKeys, setMultiKeys] = useState<string[] | null>(null);
  const [isInitKeyModalOpen, setIsInitKeyModalOpen] = useState(false)
  const [hasLoadedData, setHasLoadedData] = useState(false)

  useEffect(() => {
    if (shouldLoadData && !hasLoadedData) {
      fetchKeys();
      setHasLoadedData(true);
    }
  }, [shouldLoadData, hasLoadedData]);

  const fetchKeys = async () => {
    const data = await fetchApi({
      body: JSON.stringify({ operation: 'idswithcount' })
    })
    if (data.success) {
      setKeys(data.data.data)
    }
  }

  const handleSelectKey = (key: string) => {
    setSelectedKey(key)
    setMultiKeys(null)
  }

  const handleOpenMultiQuery = (keys: string[]) => {
    if (keys.length === 0) return
    setMultiKeys([...keys])
    setSelectedKey(null)
  }

  const handleClearView = () => {
    setSelectedKey(null)
    setMultiKeys(null)
  }

  const handleKeyWrite = () => {
    fetchKeys()
  }

  const handleDeleteKey = async (key: string) => {
    try {
      const data = await fetchApi({
        body: JSON.stringify({ operation: 'deletekey', key })
      })
      if (data.success) {
        setKeys(prevKeys => prevKeys.filter(k => k.key !== key))
        // Clear the active view if it referenced the deleted key
        setSelectedKey(prev => (prev === key ? null : prev))
        setMultiKeys(prev => (prev?.includes(key) ? prev.filter(k => k !== key) : prev))
        toast({
          title: "Success",
          description: `Key "${key}" deleted successfully.`,
        })
      } else {
        throw new Error(data.message)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete key. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleRename = async (oldKey: string, newKey: string) => {
    try {
      const data = await fetchApi({
        body: JSON.stringify({
          operation: 'renamekey',
          key: oldKey,
          toKey: newKey
        })
      })
      if (data.success) {
        setKeys(prevKeys => prevKeys.map(k =>
          k.key === oldKey ? { ...k, key: newKey } : k
        ))
        setSelectedKey(prev => (prev === oldKey ? newKey : prev))
        setMultiKeys(prev => (prev?.includes(oldKey) ? prev.map(k => (k === oldKey ? newKey : k)) : prev))
        toast({
          title: "Success",
          description: `Key "${oldKey}" renamed to "${newKey}" successfully.`,
        })
      } else {
        throw new Error(data.message)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to rename key. Please try again.",
        variant: "destructive",
      })
    }
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
        selectedKey={selectedKey}
        onSelectKey={handleSelectKey}
        onInitKey={() => setIsInitKeyModalOpen(true)}
        onRefreshKeys={fetchKeys}
        onCompare={handleOpenMultiQuery}
        onOpenSettings={onOpenSettings}
      />
      <div className="flex-1 min-w-0">
        {selectedKey ? (
          <KeyDetail
            keyName={selectedKey}
            onBack={handleClearView}
            onDeleteKey={handleDeleteKey}
            onRename={handleRename}
            onKeyWrite={handleKeyWrite}
          />
        ) : multiKeys ? (
          <div className="h-full flex flex-col">
            <div className="flex items-center justify-between border-b px-4 py-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <BarChart3 className="h-4 w-4" />
                <span>
                  Comparing {multiKeys.length} key{multiKeys.length > 1 ? "s" : ""}
                </span>
              </div>
              <Button variant="ghost" size="sm" onClick={handleClearView}>
                <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
                Overview
              </Button>
            </div>
            <div className="flex-1 min-h-0">
              <MultiQuery keys={multiKeys} />
            </div>
          </div>
        ) : (
          <Overview
            keys={keys}
            onSelectKey={handleSelectKey}
            onAddKey={() => setIsInitKeyModalOpen(true)}
            onRefresh={fetchKeys}
          />
        )}
      </div>
      <InitKeyModal
        isOpen={isInitKeyModalOpen}
        onClose={() => setIsInitKeyModalOpen(false)}
        onInitKey={initKey}
      />
    </div>
  )
}

