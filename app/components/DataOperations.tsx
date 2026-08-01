'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Loader2, Database, Copy, Code, RefreshCw, ArrowLeft, Save, Pencil, Trash2 } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { DeleteKeyModal } from './DeleteKeyModal'
import DataPatchTool from './DataPatchTool'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import * as echarts from 'echarts'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DateTimePicker } from './DateTimePicker'
import { useSettings } from '@/settings-context'
import { useConfig } from '@/config-context'
import { cn, copyToClipboard, fetchApi } from '@/lib/utils'

const AGGREGATIONS = ['avg', 'sum', 'min', 'max', 'first', 'last', 'count', 'median', 'p95', 'p99']

function epochToLocalInput(ts: number) {
  const d = new Date(ts * 1000)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`
}

interface DataOperationsProps {
  selectedKey: string
  onWrite: () => void
  onDeleteKey: (key: string) => void
  onRename: (oldKey: string, newKey: string) => void
  onBack?: () => void
  keys?: { key: string; count: number }[]
  onSelectKey?: (key: string) => void
}

export default function DataOperations({ selectedKey, onWrite, onDeleteKey, onRename, onBack, keys, onSelectKey }: DataOperationsProps) {
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [downsampling, setDownsampling] = useState('')
  const [aggregationMethod, setAggregationMethod] = useState('avg')
  const [lastX, setLastX] = useState('')
  const [mode, setMode] = useState<'last' | 'range'>('last')
  const [startInput, setStartInput] = useState('')
  const [endInput, setEndInput] = useState('')
  const [live, setLive] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [writeValue, setWriteValue] = useState('')
  const [deleteValueOperator, setDeleteValueOperator] = useState<'>' | '<'>('>')
  const [deleteValueThreshold, setDeleteValueThreshold] = useState('')
  const [timestampFrom, setTimestampFrom] = useState('')
  const [timestampTo, setTimestampTo] = useState('')
  const [isReading, setIsReading] = useState(false)
  const [isWriting, setIsWriting] = useState(false)
  const [isDeletingByValue, setIsDeletingByValue] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false)
  const [newKeyName, setNewKeyName] = useState(selectedKey)
  const [requestPayload, setRequestPayload] = useState<any>(null)

  const chartRef = useRef<HTMLDivElement>(null)
  const chartInstance = useRef<echarts.ECharts | null>(null)
  // Load settings
  const { settings } = useSettings();
  const { getMultiplier, getUnit, getOffset, getHint } = useConfig();

  const generateIframeCode = () => {
    const baseUrl = window.location.origin
    const params = new URLSearchParams({
      key: selectedKey,
      apiUrl: settings.apiUrl
    })

    // Add query parameters if they exist
    if (startTime) params.set('start', startTime)
    if (endTime) params.set('end', endTime)
    if (downsampling) params.set('downsampling', downsampling)
    if (aggregationMethod && downsampling) params.set('aggregation', aggregationMethod)
    if (lastX) params.set('lastx', lastX)

    const embedUrl = `${baseUrl}/embed?${params.toString()}`
    const iframeCode = `<iframe src="${embedUrl}" width="600" height="400" frameborder="0" style="border: 1px solid #ddd; border-radius: 4px;"></iframe>`
    
    return { embedUrl, iframeCode }
  }

  const copyIframeCode = () => {
    const { iframeCode } = generateIframeCode()
    copyToClipboard(iframeCode)
    toast({
      title: "Success",
      description: "Iframe code copied to clipboard!",
    })
  }
  
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

  // Set up resize observer and visibility change handling
  useEffect(() => {
    let resizeObserver: ResizeObserver | null = null
    let intervalId: NodeJS.Timeout | null = null

    // Handle iframe visibility changes (when tabs switch)
    const handleVisibilityChange = () => {
      if (!document.hidden && chartInstance.current) {
        // Small delay to ensure iframe is fully visible
        setTimeout(() => {
          if (chartInstance.current) {
            chartInstance.current.resize()
          }
        }, 100)
      }
    }

    // Listen for tab activation messages from parent
    const handleTabActivation = (event: MessageEvent) => {
      if (event.data.type === 'tabActivated' && chartInstance.current) {
        // Resize chart when tab becomes active
        setTimeout(() => {
          if (chartInstance.current) {
            chartInstance.current.resize()
          }
        }, 50)
      }
    }

    const setupResize = () => {
      // Resize when window is resized
      window.addEventListener('resize', handleResize)
      
      // Use ResizeObserver for chart container
      if (chartRef.current && 'ResizeObserver' in window) {
        resizeObserver = new ResizeObserver(() => {
          handleResize()
        })
        resizeObserver.observe(chartRef.current)
      }

      document.addEventListener('visibilitychange', handleVisibilityChange)
      window.addEventListener('message', handleTabActivation)

      // Periodic resize for iframe context (reduced frequency)
      intervalId = setInterval(handleResize, 3000)
    }

    setupResize()

    return () => {
      window.removeEventListener('resize', handleResize)
      if (resizeObserver) {
        resizeObserver.disconnect()
      }
      if (intervalId) {
        clearInterval(intervalId)
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('message', handleTabActivation)
    }
  }, [])

  // Clear data when key changes
  useEffect(() => {
    setResult(null)
    if (chartInstance.current) {
      chartInstance.current.dispose()
      chartInstance.current = null
    }
  }, [selectedKey])

  // Default range: now - 1 day → now.
  useEffect(() => {
    const end = Math.floor(Date.now() / 1000)
    setStartInput(epochToLocalInput(end - 86400))
    setEndInput(epochToLocalInput(end))
  }, [])

  const runRead = useCallback(async () => {
    setIsReading(true)

    const readPayload =
      mode === 'last'
        ? { lastx: lastX ? parseInt(lastX) : 200, aggregation: aggregationMethod }
        : {
            start_timestamp: startInput
              ? Math.floor(new Date(startInput).getTime() / 1000)
              : undefined,
            end_timestamp: endInput
              ? Math.floor(new Date(endInput).getTime() / 1000)
              : undefined,
            downsampling: downsampling ? parseInt(downsampling) : undefined,
            aggregation: aggregationMethod,
          }
    const payload = {
      operation: 'read',
      key: selectedKey,
      read: readPayload
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
          
          // Apply multiplier and offset to values
          const multiplier = getMultiplier(selectedKey);
          const unit = getUnit(selectedKey);
          const offset = getOffset(selectedKey);
          const values = data.data.data.map((item: any) => (item.value * multiplier) + offset);
          
          const option = {
            tooltip: {
              trigger: 'axis',
              formatter: function(params: any) {
                const timestamp = params[0].name;
                const value = params[0].value;
                return `${timestamp}<br/>${selectedKey}: ${value.toFixed(4)}${unit}`;
              },
              position: function (pt: any) {
                return [pt[0], '10%']
              }
            },
            title: {
              left: 'center',
              text: `${selectedKey} Data Visualization${unit ? ` (${unit})` : ''}`
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
              boundaryGap: [0, '100%'],
              axisLabel: {
                formatter: `{value}${unit}`
              }
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
  }, [mode, lastX, startInput, endInput, downsampling, aggregationMethod, selectedKey])

  const handleReadAndPlot = (e: React.FormEvent) => {
    e.preventDefault()
    void runRead()
  }

  // Live polling — mirrors the multi-key query view.
  useEffect(() => {
    if (!live) return
    const t = setInterval(() => void runRead(), 5000)
    return () => clearInterval(t)
  }, [live, runRead])

  const handleWrite = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsWriting(true)
    try {
      const data = await fetchApi({
        
        body: {
          operation: 'write',
          key: selectedKey,
          write: { value: parseFloat(writeValue) }
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

  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [isCompacting, setIsCompacting] = useState(false)
  const [isFlushing, setIsFlushing] = useState(false)
  const [isReloading, setIsReloading] = useState(false)
  const [exportFormat, setExportFormat] = useState<'csv' | 'json'>('csv')


  const handleSubscribe = async () => {
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

  // Auto-unsubscribe on unmount
  useEffect(() => {
    return () => {
      if (isSubscribed) {
        fetchApi({
          body: {
            operation: 'unsubscribe',
            key: selectedKey
          }
        }).catch(() => {})
      }
    }
  }, [selectedKey])

  const handleFlush = async () => {
    setIsFlushing(true)
    try {
      const data = await fetchApi({
        body: { operation: 'flush' }
      })
      if (data.success) {
        toast({ title: "Success", description: "All data flushed to disk." })
      } else {
        throw new Error(data.message)
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to flush data.", variant: "destructive" })
    } finally {
      setIsFlushing(false)
    }
  }

  const handleReload = async () => {
    setIsReloading(true)
    try {
      const data = await fetchApi({
        body: {
          operation: 'reloadkey',
          key: selectedKey
        }
      })
      if (data.success) {
        toast({ title: "Success", description: data.data?.message || `Key "${selectedKey}" reloaded.` })
        onWrite()
      } else {
        throw new Error(data.message)
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to reload key.", variant: "destructive" })
    } finally {
      setIsReloading(false)
    }
  }

  const handleExport = async () => {
    setIsExporting(true)
    const exportPayload: any = {
      format: exportFormat
    }
    if (lastX) {
      exportPayload.lastx = parseInt(lastX)
    } else if (startTime && endTime) {
      exportPayload.start_timestamp = parseInt(startTime)
      exportPayload.end_timestamp = parseInt(endTime)
      if (downsampling) {
        exportPayload.downsampling = parseInt(downsampling)
        exportPayload.aggregation = aggregationMethod
      }
    } else {
      exportPayload.lastx = 1000
    }

    try {
      const data = await fetchApi({
        body: {
          operation: 'export',
          key: selectedKey,
          export: exportPayload
        }
      })
      if (data.success && data.data) {
        const exportData = data.data.data
        const mimeType = exportFormat === 'csv' ? 'text/csv' : 'application/json'
        const extension = exportFormat === 'csv' ? 'csv' : 'json'
        const blob = new Blob(
          [typeof exportData === 'string' ? exportData : JSON.stringify(exportData, null, 2)],
          { type: mimeType }
        )
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${selectedKey}_export.${extension}`
        a.click()
        URL.revokeObjectURL(url)
        toast({
          title: "Success",
          description: `Data exported as ${exportFormat.toUpperCase()}.`,
        })
      } else {
        throw new Error(data.message || 'Export failed')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
    }
  }

  const handleCompact = async () => {
    setIsCompacting(true)
    try {
      const data = await fetchApi({
        body: {
          operation: 'compact',
          key: selectedKey
        }
      })
      if (data.success) {
        toast({
          title: "Success",
          description: data.data?.message || `Key "${selectedKey}" compacted successfully.`,
        })
        onWrite()
      } else {
        throw new Error(data.message || 'Compact failed')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to compact key. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsCompacting(false)
    }
  }

  const handleRename = async () => {
    try {
      const data = await fetchApi({
        
        body: {
          operation: 'renamekey',
          key: selectedKey,
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

  const handleDeleteDataPoint = async (e: React.FormEvent) => {
    e.preventDefault()
    const hasValue = deleteValueThreshold.trim() !== ''
    const hasTimestampFrom = timestampFrom.trim() !== ''
    const hasTimestampTo = timestampTo.trim() !== ''
    const hasTimeRange = hasTimestampFrom && hasTimestampTo

    if (!hasValue && !hasTimeRange) {
      toast({
        title: "Error",
        description: "Please provide either a value threshold, or both timestampFrom and timestampTo.",
        variant: "destructive",
      })
      return
    }
    if ((hasTimestampFrom && !hasTimestampTo) || (!hasTimestampFrom && hasTimestampTo)) {
      toast({
        title: "Error",
        description: "timestampFrom and timestampTo must be provided together.",
        variant: "destructive",
      })
      return
    }
    if (hasTimeRange && parseInt(timestampFrom) > parseInt(timestampTo)) {
      toast({
        title: "Error",
        description: "timestampFrom must be less than or equal to timestampTo.",
        variant: "destructive",
      })
      return
    }

    setIsDeletingByValue(true)

    const payload = {
      operation: 'deleteDataPoint',
      key: selectedKey,
      payload: {
        operator: hasValue ? deleteValueOperator : undefined,
        value: hasValue ? parseFloat(deleteValueThreshold) : undefined,
        timestampFrom: hasTimestampFrom ? parseInt(timestampFrom) : undefined,
        timestampTo: hasTimestampTo ? parseInt(timestampTo) : undefined
      }
    }
    setRequestPayload(payload)

    try {
      const data = await fetchApi({ body: payload })
      if (data.success) {
        setResult(data.data)
        toast({
          title: "Success",
          description: data.data?.message || "deleteDataPoint completed.",
        })
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to run deleteDataPoint.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to run deleteDataPoint. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsDeletingByValue(false)
    }
  }

  // Sibling series in the same folder (cloud-explorer style navigation)
  const parts = selectedKey.split('_')
  const folderPrefix = parts.length > 1 ? `${parts[0]}_` : ''
  const siblings = (keys || [])
    .filter((k) => (folderPrefix ? k.key.startsWith(folderPrefix) : true))
    .sort((a, b) => a.key.localeCompare(b.key))

  return (
    <div className="space-y-4">
      {/* Toolbar: back + key + actions */}
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {onBack && (
            <Button variant="ghost" size="icon" onClick={onBack} title="Back to overview">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <Database className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-bold">{selectedKey}</h2>
        </div>
        <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleReload}
              disabled={isReloading}
              className="gap-1.5"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              {isReloading ? 'Reloading...' : 'Reload'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleFlush}
              disabled={isFlushing}
              className="gap-1.5"
            >
              <Save className="h-3.5 w-3.5" />
              {isFlushing ? 'Flushing...' : 'Flush'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsRenameModalOpen(true)}
              className="gap-1.5"
            >
              <Pencil className="h-3.5 w-3.5" />
              Rename
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setIsDeleteModalOpen(true)}
              className="gap-1.5"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </Button>
          </div>
      </div>

      {/* Split layout: series (left) + query panel (right), like the cloud explorer */}
      <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
        {/* Series navigator */}
        <Card className="h-fit border-0 shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">
              {folderPrefix ? folderPrefix.replace(/_$/, '') : 'Series'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {siblings.length === 0 ? (
              <p className="px-2 py-3 text-xs text-muted-foreground">No other series.</p>
            ) : (
              siblings.map((s) => (
                <button
                  key={s.key}
                  onClick={() => onSelectKey?.(s.key)}
                  className={cn(
                    'flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted',
                    s.key === selectedKey && 'bg-primary/10 font-medium'
                  )}
                >
                  <span className="truncate font-mono text-xs">
                    {folderPrefix ? s.key.replace(folderPrefix, '') : s.key}
                  </span>
                  <span className="text-xs tabular-nums text-muted-foreground">
                    {s.count.toLocaleString()}
                  </span>
                </button>
              ))
            )}
          </CardContent>
        </Card>

        {/* Query panel */}
        <Card className="border-0 shadow-none">
          <CardContent className="p-4">
          <form onSubmit={handleReadAndPlot} className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Select value={mode} onValueChange={(v) => setMode(v as 'last' | 'range')}>
              <SelectTrigger className="h-9 w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="last">Last N</SelectItem>
                <SelectItem value="range">Range</SelectItem>
              </SelectContent>
            </Select>
            {mode === 'last' ? (
              <Input
                type="number"
                value={lastX}
                onChange={(e) => setLastX(e.target.value)}
                placeholder="200"
                className="h-9 w-24"
              />
            ) : (
              <>
                <DateTimePicker
                  value={startInput}
                  onChange={(v) => {
                    setStartInput(v)
                    setStartTime(v ? String(Math.floor(new Date(v).getTime() / 1000)) : '')
                  }}
                  placeholder="Start"
                  className="w-48"
                />
                <span className="text-muted-foreground">→</span>
                <DateTimePicker
                  value={endInput}
                  onChange={(v) => {
                    setEndInput(v)
                    setEndTime(v ? String(Math.floor(new Date(v).getTime() / 1000)) : '')
                  }}
                  placeholder="End"
                  className="w-48"
                />
              </>
            )}
            <Select value={aggregationMethod} onValueChange={setAggregationMethod}>
              <SelectTrigger className="h-9 w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AGGREGATIONS.map((a) => (
                  <SelectItem key={a} value={a}>
                    {a}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder="downsample"
              value={downsampling}
              onChange={(e) => setDownsampling(e.target.value)}
              className="h-9 w-28"
            />
            <label className="flex items-center gap-1.5 text-sm">
              <input
                type="checkbox"
                checked={live}
                onChange={(e) => setLive(e.target.checked)}
                className="h-4 w-4 rounded border-input"
              />
              Live
            </label>
            <Button type="submit" size="sm" disabled={isReading}>
              {isReading ? (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
              )}
              Query
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
              {result.data && result.data.length > 0 && (
                <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
                  <p className="text-sm text-green-800">
                    <span className="font-bold">Latest Value:</span> {((result.data[result.data.length - 1].value * getMultiplier(selectedKey)) + getOffset(selectedKey)).toFixed(4)}{getUnit(selectedKey)}
                  </p>
                </div>
              )}
              {/* show multiplier, offset and unit */}
              {result.data && result.data.length > 0 && (
                <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded">
                  <p className="text-sm text-blue-800">
                    <span className="font-bold">Multiplier:</span> {getMultiplier(selectedKey)}
                    <span className="font-bold ml-3">Offset:</span> {getOffset(selectedKey)}
                    <span className="font-bold ml-3">Unit:</span> {getUnit(selectedKey)!=''? getUnit(selectedKey) : '<none>'}
                    <span className="font-bold ml-3">Key:</span> {selectedKey}
                  </p>
                </div>
              )}
              {/* Show hint if available */}
              {getHint(selectedKey) && (
                <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded">
                  <p className="text-sm text-amber-800">
                    <span className="font-bold">Hint:</span> {getHint(selectedKey)}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
        
        {settings.showVisualization && (
          <Card className='mt-4 shadow-none'>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">Data Visualization</CardTitle>
                {result && result.data && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={copyIframeCode}
                      className="flex items-center gap-2"
                    >
                      <Code className="h-4 w-4" />
                      Copy Embed Code
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div ref={chartRef} style={{ width: '100%', height: '400px' }} />
            </CardContent>
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
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Data Patch (Add/Update Data Points)</label>
          <DataPatchTool selectedKey={selectedKey} onPatchComplete={onWrite} />
        </div>
        <Separator className="my-4" />
        <form onSubmit={handleDeleteDataPoint} className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Delete data points by value?</label>
          <div className="flex items-center space-x-2">
            <select
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              value={deleteValueOperator}
              onChange={(e) => setDeleteValueOperator(e.target.value as '>' | '<')}
            >
              <option value=">">{'>'}</option>
              <option value="<">{'<'}</option>
            </select>
            <Input
              type="number"
              step="any"
              value={deleteValueThreshold}
              onChange={(e) => setDeleteValueThreshold(e.target.value)}
              placeholder="Threshold value"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Input
              type="number"
              value={timestampFrom}
              onChange={(e) => setTimestampFrom(e.target.value)}
              placeholder="timestampFrom (optional)"
            />
            <Input
              type="number"
              value={timestampTo}
              onChange={(e) => setTimestampTo(e.target.value)}
              placeholder="timestampTo (optional)"
            />
            <Button type="submit" disabled={isDeletingByValue}>
              {isDeletingByValue ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Running...
                </>
              ) : (
                'Delete Matching Data'
                
              )}
            </Button>
          </div>
        </form>
        <Separator className="my-4" />
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-700">Subscription Status: {isSubscribed ? 'Subscribed' : 'Not Subscribed'}</span>
          <Button onClick={isSubscribed ? handleUnsubscribe : handleSubscribe}>
            {isSubscribed ? 'Unsubscribe' : 'Subscribe'}
          </Button>
        </div>
        <Separator className="my-4" />
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Export Data</label>
          <div className="flex items-center space-x-2">
            <select
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value as 'csv' | 'json')}
            >
              <option value="csv">CSV</option>
              <option value="json">JSON</option>
            </select>
            <Button onClick={handleExport} disabled={isExporting} variant="outline">
              {isExporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Exporting...
                </>
              ) : (
                'Export'
              )}
            </Button>
          </div>
          <p className="text-xs text-gray-500">
            Exports using current read parameters (time range / lastX / downsampling).
          </p>
        </div>
        <Separator className="my-4" />
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Compaction</label>
          <p className="text-xs text-gray-500">
            Rewrite key files to reclaim disk space from deleted data points. The server also runs automatic background compaction.
          </p>
          <Button onClick={handleCompact} disabled={isCompacting} variant="outline" size="sm">
            {isCompacting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Compacting...
              </>
            ) : (
              'Compact Key'
            )}
          </Button>
        </div>
          </CardContent>
        </Card>
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
    </div>
  )
}
