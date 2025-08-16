'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import DataOperations from '@/components/DataOperations'
import { fetchApi } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'

function TabContent() {
  const searchParams = useSearchParams()
  const keyName = searchParams.get('key')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Small delay to ensure the iframe is properly mounted
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 100)

    return () => clearTimeout(timer)
  }, [])

  const handleWrite = async () => {
    // We don't need to refresh keys in the tab context
    // The parent will handle key list updates
  }

  const handleDeleteKey = async (key: string) => {
    try {
      const data = await fetchApi({
        body: JSON.stringify({ operation: 'deletekey', key })
      })
      if (data.success) {
        toast({
          title: "Success",
          description: `Key "${key}" deleted successfully.`,
        })
        // Post message to parent window to handle tab closure
        window.parent.postMessage({ 
          type: 'keyDeleted', 
          key 
        }, '*')
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
          Key: oldKey,
          toKey: newKey
        })
      })
      if (data.success) {
        toast({
          title: "Success",
          description: `Key "${oldKey}" renamed to "${newKey}" successfully.`,
        })
        // Post message to parent window to handle tab title update
        window.parent.postMessage({ 
          type: 'keyRenamed', 
          oldKey, 
          newKey 
        }, '*')
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

  if (!keyName) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        No key specified
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        Loading...
      </div>
    )
  }

  return (
    <div className="h-full p-4 overflow-y-auto">
      <DataOperations 
        selectedKey={keyName}
        onWrite={handleWrite}
        onDeleteKey={handleDeleteKey}
        onRename={handleRename}
      />
    </div>
  )
}

export default function TabPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-full text-muted-foreground">
        Loading...
      </div>
    }>
      <TabContent />
    </Suspense>
  )
}