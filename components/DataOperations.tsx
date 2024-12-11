'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Loader2, Database } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { DeleteKeyModal } from './DeleteKeyModal'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"

interface DataOperationsProps {
  selectedKey: string
  onWrite: () => void
  onDeleteKey: (key: string) => void
  onRename: (oldKey: string, newKey: string) => void
}

export default function DataOperations({ selectedKey, onWrite, onDeleteKey, onRename }: DataOperationsProps) {
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [downsampling, setDownsampling] = useState('')
  const [lastX, setLastX] = useState('')
  const [result, setResult] = useState<any>(null)
  const [writeValue, setWriteValue] = useState('')
  const [isReading, setIsReading] = useState(false)
  const [isWriting, setIsWriting] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false)
  const [newKeyName, setNewKeyName] = useState('')

  const handleRead = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsReading(true)
    try {
      const response = await fetch('/api/tsdb', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operation: 'read',
          Read: {
            id: selectedKey,
            start_timestamp: startTime ? parseInt(startTime) : undefined,
            end_timestamp: endTime ? parseInt(endTime) : undefined,
            downsampling: downsampling ? parseInt(downsampling) : undefined,
            lastx: lastX ? parseInt(lastX) : undefined
          }
        })
      })
      const data = await response.json()
      if (data.success) {
        setResult(data.data)
      } else {
        toast({
          title: "Error",
          description: "Failed to read data. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsReading(false)
    }
  }

  const handleWrite = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsWriting(true)
    try {
      const response = await fetch('/api/tsdb', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operation: 'write',
          Write: { id: selectedKey, Value: parseFloat(writeValue) }
        })
      })
      const data = await response.json()
      if (data.success) {
        setWriteValue('')
        onWrite()
        toast({
          title: "Success",
          description: "Data written successfully.",
        })
      } else {
        toast({
          title: "Error",
          description: "Failed to write data. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsWriting(false)
    }
  }

  const setTimeOption = (field: 'start' | 'end', option: string) => {
    const now = Math.floor(Date.now() / 1000)
    switch (option) {
      case 'now':
        field === 'start' ? setStartTime(now.toString()) : setEndTime(now.toString())
        break
      case '-1hr':
        field === 'start' ? setStartTime((now - 3600).toString()) : setEndTime((now - 3600).toString())
        break
      case '-1day':
        field === 'start' ? setStartTime((now - 86400).toString()) : setEndTime((now - 86400).toString())
        break
      case '-1week':
        field === 'start' ? setStartTime((now - 604800).toString()) : setEndTime((now - 604800).toString())
        break
      case 'clear':
        field === 'start' ? setStartTime('') : setEndTime('')
        break
    }
  }

  const setDownsamplingOption = (option: string) => {
    switch (option) {
      case '5min':
        setDownsampling('300')
        break
      case '1hr':
        setDownsampling('3600')
        break
      case '1day':
        setDownsampling('86400')
        break
      case 'clear':
        setDownsampling('')
        break
    }
  }

  const setLastXOption = (option: string) => {
    switch (option) {
      case '5':
      case '20':
      case '100':
        setLastX(option)
        break
      case 'clear':
        setLastX('')
        break
    }
  }

  const [isSubscribed, setIsSubscribed] = useState(false)

  useEffect(() => {
    return () => {
      if (isSubscribed) {
        handleUnsubscribe()
      }
    }
  }, [isSubscribed])

  const handleSubscribe = async () => {
    try {
      const response = await fetch('/api/tsdb', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operation: 'subscribe',
          key: selectedKey
        })
      })
      const data = await response.json()
      if (data.success) {
        setIsSubscribed(true)
        toast({
          title: "Subscribed",
          description: `Successfully subscribed to ${selectedKey}`,
        })
      } else {
        throw new Error(data.message)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to subscribe. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleUnsubscribe = async () => {
    try {
      const response = await fetch('/api/tsdb', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operation: 'unsubscribe',
          key: selectedKey
        })
      })
      const data = await response.json()
      if (data.success) {
        setIsSubscribed(false)
        toast({
          title: "Unsubscribed",
          description: `Successfully unsubscribed from ${selectedKey}`,
        })
      } else {
        throw new Error(data.message)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to unsubscribe. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleRename = async () => {
    try {
      const response = await fetch('/api/tsdb', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operation: 'rename',
          oldKey: selectedKey,
          newKey: newKeyName
        })
      })
      const data = await response.json()
      if (data.success) {
        onRename(selectedKey, newKeyName)
        toast({
          title: "Success",
          description: `Key "${selectedKey}" renamed to "${newKeyName}" successfully.`,
        })
        setIsRenameModalOpen(false)
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
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Database className="h-6 w-6" />
            <CardTitle className="text-2xl font-bold">{selectedKey}</CardTitle>
          </div>
          <div className="space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsRenameModalOpen(true)}
            >
              Rename Key
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setIsDeleteModalOpen(true)}
            >
              Delete Key
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleRead} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Start Timestamp</label>
            <div className="flex items-center space-x-2">
              <Input
                type="number"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                placeholder="Start Timestamp"
              />
              <Button type="button" size="sm" onClick={() => setTimeOption('start', 'now')}>Now</Button>
              <Button type="button" size="sm" onClick={() => setTimeOption('start', '-1hr')}>-1 hr</Button>
              <Button type="button" size="sm" onClick={() => setTimeOption('start', '-1day')}>-1 day</Button>
              <Button type="button" size="sm" onClick={() => setTimeOption('start', '-1week')}>-1 week</Button>
              <Button type="button" size="sm" onClick={() => setTimeOption('start', 'clear')}>Clear</Button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">End Timestamp</label>
            <div className="flex items-center space-x-2">
              <Input
                type="number"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                placeholder="End Timestamp"
              />
              <Button type="button" size="sm" onClick={() => setTimeOption('end', 'now')}>Now</Button>
              <Button type="button" size="sm" onClick={() => setTimeOption('end', '-1hr')}>-1 hr</Button>
              <Button type="button" size="sm" onClick={() => setTimeOption('end', '-1day')}>-1 day</Button>
              <Button type="button" size="sm" onClick={() => setTimeOption('end', '-1week')}>-1 week</Button>
              <Button type="button" size="sm" onClick={() => setTimeOption('end', 'clear')}>Clear</Button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Downsampling</label>
            <div className="flex items-center space-x-2">
              <Input
                type="number"
                value={downsampling}
                onChange={(e) => setDownsampling(e.target.value)}
                placeholder="Downsampling"
              />
              <Button type="button" size="sm" onClick={() => setDownsamplingOption('5min')}>5 min</Button>
              <Button type="button" size="sm" onClick={() => setDownsamplingOption('1hr')}>1 hr</Button>
              <Button type="button" size="sm" onClick={() => setDownsamplingOption('1day')}>1 day</Button>
              <Button type="button" size="sm" onClick={() => setDownsamplingOption('clear')}>Clear</Button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Last X Records</label>
            <div className="flex items-center space-x-2">
              <Input
                type="number"
                value={lastX}
                onChange={(e) => setLastX(e.target.value)}
                placeholder="Last X Records"
              />
              <Button type="button" size="sm" onClick={() => setLastXOption('5')}>5</Button>
              <Button type="button" size="sm" onClick={() => setLastXOption('20')}>20</Button>
              <Button type="button" size="sm" onClick={() => setLastXOption('100')}>100</Button>
              <Button type="button" size="sm" onClick={() => setLastXOption('clear')}>Clear</Button>
            </div>
          </div>
          <Button type="submit" disabled={isReading}>
            {isReading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Reading...
              </>
            ) : (
              'Read'
            )}
          </Button>
        </form>
        {result && (
          <pre className="mt-4 p-2 bg-gray-100 rounded overflow-x-auto w-full">
            {JSON.stringify(result, null, 2)}
          </pre>
        )}
        <Separator className="my-4" />
        <form onSubmit={handleWrite} className="flex items-center space-x-2">
          <Input
            type="number"
            value={writeValue}
            onChange={(e) => setWriteValue(e.target.value)}
            placeholder="Value to write"
            required
          />
          <Button type="submit" disabled={isWriting}>
            {isWriting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Writing...
              </>
            ) : (
              'Write'
            )}
          </Button>
        </form>
        <Separator className="my-4" />
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-700">Subscription Status: {isSubscribed ? 'Subscribed' : 'Not Subscribed'}</span>
          <Button onClick={isSubscribed ? handleUnsubscribe : handleSubscribe}>
            {isSubscribed ? 'Unsubscribe' : 'Subscribe'}
          </Button>
        </div>
        <DeleteKeyModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={() => {
            onDeleteKey(selectedKey)
            setIsDeleteModalOpen(false)
          }}
          keyName={selectedKey}
        />
      </CardContent>
      <AlertDialog open={isRenameModalOpen} onOpenChange={setIsRenameModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Rename Key</AlertDialogTitle>
            <AlertDialogDescription>
              Enter a new name for the key "{selectedKey}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input
            value={newKeyName}
            onChange={(e) => setNewKeyName(e.target.value)}
            placeholder="New key name"
          />
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRename}>
              Rename
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}

