'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Loader2, Database, Copy } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { DeleteKeyModal } from './DeleteKeyModal'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import * as echarts from 'echarts'
import { useSettings } from '@/settings-context'
import { copyToClipboard, fetchApi } from '@/lib/utils'

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
  const [aggregationMethod, setAggregationMethod] = useState('avg')
  const [lastX, setLastX] = useState('')
  const [result, setResult] = useState<any>(null)
  const [writeValue, setWriteValue] = useState('')
  const [isReading, setIsReading] = useState(false)
  const [isWriting, setIsWriting] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false)
  const [newKeyName, setNewKeyName] = useState(selectedKey)
  const [requestPayload, setRequestPayload] = useState<any>(null)

  const chartRef = useRef<HTMLDivElement>(null)
  const chartInstance = useRef<echarts.ECharts | null>(null)
  // Load settings
  const { settings } = useSettings();
  
  useEffect(() => {
    return () => {
      if (chartInstance.current) {
        chartInstance.current.dispose()
      }
    }
  }, [])
  const handleResize = () => {
    if (chartInstance.current) {
      chartInstance.current.resize()
    }
  }
  // Clear data when key changes
  useEffect(() => {
    setResult(null)
    if (chartInstance.current) {
      chartInstance.current.dispose()
      chartInstance.current = null
    }
  }, [selectedKey])

  setInterval(handleResize, 1000)

  const handleReadAndPlot = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsReading(true)

    const readPayload = {
      start_timestamp: startTime ? parseInt(startTime) : undefined,
      end_timestamp: endTime ? parseInt(endTime) : undefined,
      downsampling: downsampling ? parseInt(downsampling) : undefined,
      lastx: lastX ? parseInt(lastX) : undefined,
      aggregation: downsampling ? aggregationMethod : undefined
    };
    // check if it is empty
    const isEmpty = Object.keys(readPayload).length === 0 && readPayload.constructor === Object;
    const payload = {
      operation: 'read',
      key: selectedKey,
      Read: isEmpty ? undefined : readPayload
    }
    setRequestPayload(payload)
    try {
      const data = await fetchApi({
        body: payload
      })
      if (data.success) {

        setResult(data.data)
        if (data.data.data == null) {
          toast({
            title: "Info",
            description: "No data found for the given query.",
            variant: "info",
          })
          return
        }
        
        
        // Plot the data
        if (chartRef.current) {
          if (chartInstance.current) {
            chartInstance.current.dispose()
          }
          
          chartInstance.current = echarts.init(chartRef.current)
          const timestamps = data.data.data.map((item: any) => 
            new Date(item.timestamp * 1000).toLocaleString()
          )
          const values = data.data.data.map((item: any) => item.value)
          
          const option = {
            tooltip: {
              trigger: 'axis',
              position: function (pt: any) {
                return [pt[0], '10%']
              }
            },
            title: {
              left: 'center',
              text: `${selectedKey} Data Visualization`
            },
            toolbox: {
              feature: {
                dataZoom: {
                  yAxisIndex: 'none'
                },
                restore: {},
                saveAsImage: {}
              }
            },
            xAxis: {
              type: 'category',
              boundaryGap: false,
              data: timestamps
            },
            yAxis: {
              type: 'value',
              boundaryGap: [0, '100%']
            },
            dataZoom: [
              {
                type: 'inside',
                start: 0,
                end: 100
              },
              {
                start: 0,
                end: 100
              }
            ],
            series: [
              {
                name: selectedKey,
                type: 'line',
                symbol: 'none',
                sampling: 'lttb',
                itemStyle: {
                  color: 'rgb(255, 70, 131)'
                },
                data: values
              }
            ]
          }

          chartInstance.current.setOption(option)
          
        }
      }


    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to read data. Please try again.",
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
      const data = await fetchApi({
        
        body: {
          operation: 'write',
          key: selectedKey,
          Write: { Value: parseFloat(writeValue) }
        }
      })
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
    const timeMap: { [key: string]: number } = {
      'now': now,
      '-1hr': now - 3600,
      '-1day': now - 86400,
      '-1week': now - 604800,
      'clear': 0
    }

    if (field === 'start') {
      setStartTime(option === 'clear' ? '' : timeMap[option].toString())
    } else {
      setEndTime(option === 'clear' ? '' : timeMap[option].toString())
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
      case '1week':
        setDownsampling('604800')
        break
      case 'clear':
        setDownsampling('')
        break
    }
  }

  const setLastXOption = (option: string) => {
    switch (option) {
      case 'clear':
        setLastX('')
        break
      default:
        setLastX(option)
        break
    }
  }

  const setAggregationOption = (option: string) => {
    setAggregationMethod(option);
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
    toast({
      title: "Subscribing (Work in Progress)",
      description: `Subscribing to ${selectedKey}...`,
    })
    return
    try {
      const data = await fetchApi({
        
        body: {
          operation: 'subscribe',
          key: selectedKey
        }
      })
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
      const data = await fetchApi({
        
        body: {
          operation: 'unsubscribe',
          key: selectedKey
        }
      })
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
      const data = await fetchApi({
        
        body: {
          operation: 'renamekey',
          Key: selectedKey,
          toKey: newKeyName
        }
      })
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

  const handleCopy = (text: string, type: 'request' | 'response') => {
    copyToClipboard(text);
    toast({
      title: "Copied!",
      description: `${type === 'request' ? 'Request payload' : 'Response data'} copied to clipboard`,
      duration: 2000,
    });
  };

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
        <form onSubmit={handleReadAndPlot} className="space-y-4">
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
              <Button type="button" size="sm" onClick={() => setTimeOption('start', 'clear')}>Clear/All</Button>
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
              <Button type="button" size="sm" onClick={() => setTimeOption('end', 'clear')}>Clear/All</Button>
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
              <Button type="button" size="sm" onClick={() => setDownsamplingOption('1week')}>1 week</Button>
              <Button type="button" size="sm" onClick={() => setDownsamplingOption('clear')}>Clear</Button>
            </div>
          </div>

          {downsampling && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Aggregation Method</label>
              <div className="flex items-center space-x-2">
                <Button 
                  type="button" 
                  size="sm" 
                  variant={aggregationMethod === 'avg' ? 'default' : 'outline'}
                  onClick={() => setAggregationOption('avg')}
                >
                  Average
                </Button>
                <Button 
                  type="button" 
                  size="sm" 
                  variant={aggregationMethod === 'sum' ? 'default' : 'outline'}
                  onClick={() => setAggregationOption('sum')}
                >
                  Sum
                </Button>
                <Button 
                  type="button" 
                  size="sm" 
                  variant={aggregationMethod === 'min' ? 'default' : 'outline'}
                  onClick={() => setAggregationOption('min')}
                >
                  Min
                </Button>
                <Button 
                  type="button" 
                  size="sm" 
                  variant={aggregationMethod === 'max' ? 'default' : 'outline'}
                  onClick={() => setAggregationOption('max')}
                >
                  Max
                </Button>
                <Button 
                  type="button" 
                  size="sm" 
                  variant={aggregationMethod === 'first' ? 'default' : 'outline'}
                  onClick={() => setAggregationOption('first')}
                >
                  First
                </Button>
                <Button 
                  type="button" 
                  size="sm" 
                  variant={aggregationMethod === 'last' ? 'default' : 'outline'}
                  onClick={() => setAggregationOption('last')}
                >
                  Last
                </Button>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700">Last X Records</label>
            <div className="flex items-center space-x-2">
              <Input
                type="number"
                value={lastX}
                onChange={(e) => setLastX(e.target.value)}
                placeholder="Last X Records (Will override downsampling)"
              />
              <Button type="button" size="sm" onClick={() => setLastXOption('20')}>10</Button>
              <Button type="button" size="sm" onClick={() => setLastXOption('100')}>100</Button>
              <Button type="button" size="sm" onClick={() => setLastXOption('500')}>500</Button>
              <Button type="button" size="sm" onClick={() => setLastXOption('1000')}>1000</Button>
              <Button type="button" size="sm" onClick={() => setLastXOption('10000')}>10000</Button>
              <Button type="button" size="sm" onClick={() => setLastXOption('clear')}>Clear</Button>
            </div>
          </div>
          <div className="flex space-x-2">
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
          </div>
        </form>
        {settings.showRequest && requestPayload && (
          <Card className="mt-4 shadow-none">
            <CardHeader className="py-3">
              <div className="flex justify-between items-center">
                <h3 className="font-medium text-sm">Request Payload</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopy(JSON.stringify(requestPayload, null, 2), 'request')}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pb-3">
              <pre className="p-2 bg-gray-100 rounded overflow-x-auto overflow-y-auto w-full max-h-[200px]">
                {JSON.stringify(requestPayload, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}
        {result && (
          <Card className="mt-4 shadow-none">
            <CardHeader className="py-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <h3 className="font-medium text-sm">Response Data</h3>
                  {result.data && (
                    <span className="px-2 py-0.5 bg-gray-200 rounded-full text-xs">
                      {result.data.length} records
                    </span>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopy(JSON.stringify(result, null, 2), 'response')}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pb-3">
              <pre className="p-2 bg-gray-100 rounded overflow-x-auto overflow-y-auto w-full max-h-[200px]">
                {JSON.stringify(result, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}
        
        {settings.showVisualization && (
          <Card className='mt-4 shadow-none'>
            <div ref={chartRef} style={{ width: '100%', height: '400px' }} />
          </Card>
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
              Enter a new name for the key &quot;{selectedKey}&quot;.
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

