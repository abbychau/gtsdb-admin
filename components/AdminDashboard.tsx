'use client'

import { useState, useEffect } from 'react'
import DataOperations from './DataOperations'
import Sidebar from './Sidebar'
import { toast } from '@/hooks/use-toast'
import { InitKeyModal } from './InitKeyModal'
import { fetchApi } from '@/lib/utils'
import { useSettings } from '@/app/settings-context'


export default function AdminDashboard() {
  const [keys, setKeys] = useState<Array<{ key: string; count: number }>>([]);
  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  const [isInitKeyModalOpen, setIsInitKeyModalOpen] = useState(false)
  const { settings } = useSettings()
  useEffect(() => {
    fetchKeys()
  }, [])

  const fetchKeys = async () => {
    const data = await fetchApi({
      
      body: JSON.stringify({ operation: 'idswithcount' })
    })
    if (data.success) {
      setKeys(data.data.data)
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

  const deleteKey = async (keyName: string) => {
    try {
      const data = await fetchApi({
        body: JSON.stringify({ operation: 'deletekey', key: keyName })
      })
      if (data.success) {
        setKeys(prevKeys => prevKeys.filter(key => key.key !== keyName))
        toast({
          title: "Success",
          description: `Key "${keyName}" deleted successfully.`,
        })
        if (selectedKey === keyName) {
          setSelectedKey(null)
        }
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

  const renameKey = async (oldKey: string, newKey: string) => {
    try {
      const data = await fetchApi( 
        {
          
          body: JSON.stringify({
            operation: 'renamekey',
            Key: oldKey,
            toKey: newKey
          })
        }
      )
      if (data.success) {
        setKeys(prevKeys => prevKeys.map(key => 
          key.key === oldKey ? { ...key, id: newKey } : key
        ))
        setSelectedKey(newKey)
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

  return (
    <div className="flex h-full">
      <Sidebar
        keys={keys}
        selectedKey={selectedKey}
        onSelectKey={setSelectedKey}
        onInitKey={() => setIsInitKeyModalOpen(true)}
        onRefreshKeys={fetchKeys}  // Add this prop
      />
      <div className="flex-1 p-4 overflow-y-auto">
        {selectedKey ? (
          <DataOperations 
            selectedKey={selectedKey} 
            onWrite={fetchKeys} 
            onDeleteKey={deleteKey}
            onRename={renameKey}
          />
        ) : (
          <p className="text-muted-foreground">Select a key from the sidebar to perform operations.</p>
        )}

        {// footer about message
        }
        <div className="mt-4 text-muted-foreground text-sm">
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

