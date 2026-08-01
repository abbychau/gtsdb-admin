'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import * as echarts from 'echarts'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2, RefreshCw } from 'lucide-react'
import { fetchApi } from '@/lib/utils'
import { DateTimePicker } from './DateTimePicker'

interface MultiQueryProps {
  keys: string[]
}

interface FlatPoint {
  key: string
  timestamp: number
  value: number
}

function epochToLocalInput(ts: number) {
  const d = new Date(ts * 1000)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`
}

const AGGREGATIONS = ['avg', 'sum', 'min', 'max', 'first', 'last', 'count']

// Multi-select query view — mirrors the cloud explorer: check several keys in
// the sidebar, query them together via multi-read, and view all series on one
// chart with a results table.
export default function MultiQuery({ keys }: MultiQueryProps) {
  const chartRef = useRef<HTMLDivElement | null>(null)
  const chartInstance = useRef<echarts.ECharts | null>(null)
  const [mode, setMode] = useState<'last' | 'range'>('last')
  const [lastN, setLastN] = useState(200)
  const [startInput, setStartInput] = useState('')
  const [endInput, setEndInput] = useState('')
  const [aggregation, setAggregation] = useState('avg')
  const [downsampling, setDownsampling] = useState('')
  const [live, setLive] = useState(false)
  const [results, setResults] = useState<FlatPoint[]>([])
  const [running, setRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const runQuery = useCallback(async () => {
    if (keys.length === 0) {
      setError('Select at least one key.')
      return
    }
    setRunning(true)
    setError(null)
    try {
      const read =
        mode === 'last'
          ? { lastx: lastN, aggregation }
          : {
              start_timestamp: Math.floor(new Date(startInput).getTime() / 1000),
              end_timestamp: Math.floor(new Date(endInput).getTime() / 1000),
              downsampling: downsampling ? Number(downsampling) : undefined,
              aggregation,
            }
      const data = await fetchApi({ body: { operation: 'multi-read', keys, read } })
      // The admin BFF wraps the GTSDB response: { success, data: <gtsdb response> }.
      const gtsdb = data?.data ?? data
      if (!data?.success || gtsdb?.success === false) {
        setError(gtsdb?.message || data?.message || 'Query failed')
        setResults([])
        return
      }
      const flat: FlatPoint[] = []
      if (gtsdb.multi_data) {
        for (const [key, pts] of Object.entries(gtsdb.multi_data)) {
          for (const p of (pts as any[])) {
            flat.push({ ...p, key: p.key || key })
          }
        }
      } else if (Array.isArray(gtsdb.data)) {
        for (const p of gtsdb.data) {
          flat.push({ ...p, key: p.key || '' })
        }
      }
      setResults(flat)
    } catch (e: any) {
      setError(e?.message || 'Query failed')
      setResults([])
    } finally {
      setRunning(false)
    }
  }, [keys, mode, lastN, startInput, endInput, downsampling, aggregation])

  // Run on mount and whenever the selected keys change.
  useEffect(() => {
    void runQuery()
  }, [runQuery])

  // Live polling.
  useEffect(() => {
    if (!live) return
    const t = setInterval(() => void runQuery(), 5000)
    return () => clearInterval(t)
  }, [live, runQuery])

  // Initial time range.
  useEffect(() => {
    const end = Math.floor(Date.now() / 1000)
    setStartInput(epochToLocalInput(end - 3600))
    setEndInput(epochToLocalInput(end))
  }, [])

  // Render the combined chart.
  useEffect(() => {
    if (!chartRef.current) return
    if (chartInstance.current) chartInstance.current.dispose()
    chartInstance.current = echarts.init(chartRef.current)

    const map = new Map<number, Record<string, number | string>>()
    for (const p of results) {
      const row = map.get(p.timestamp) ?? { t: p.timestamp }
      ;(row as Record<string, unknown>)[p.key] = p.value
      map.set(p.timestamp, row)
    }
    const rows = [...map.values()].sort((a, b) => Number(a.t) - Number(b.t))
    const xAxis = rows.map((r) => new Date(Number(r.t) * 1000).toLocaleString())
    const series = keys.map((key) => ({
      name: key,
      type: 'line' as const,
      symbol: 'none',
      sampling: 'lttb',
      data: rows.map((r) => r[key] ?? null),
    }))

    chartInstance.current.setOption({
      tooltip: { trigger: 'axis' },
      legend: { type: 'scroll', bottom: 0 },
      xAxis: { type: 'category', boundaryGap: false, data: xAxis },
      yAxis: { type: 'value' },
      dataZoom: [
        { type: 'inside', start: 0, end: 100 },
        { start: 0, end: 100 },
      ],
      series,
    })

    const onResize = () => chartInstance.current?.resize()
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('resize', onResize)
      chartInstance.current?.dispose()
      chartInstance.current = null
    }
  }, [results, keys])

  return (
    <div className="h-full space-y-4 overflow-y-auto p-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Multi-key query ({keys.length} keys)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <Select value={mode} onValueChange={(v) => setMode(v as 'last' | 'range')}>
              <SelectTrigger className="w-28">
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
                value={lastN}
                onChange={(e) => setLastN(Number(e.target.value))}
                className="w-24"
              />
            ) : (
              <>
                <DateTimePicker
                  value={startInput}
                  onChange={setStartInput}
                  placeholder="Start"
                  className="w-48"
                />
                <span className="text-muted-foreground">→</span>
                <DateTimePicker
                  value={endInput}
                  onChange={setEndInput}
                  placeholder="End"
                  className="w-48"
                />
              </>
            )}
            <Select value={aggregation} onValueChange={setAggregation}>
              <SelectTrigger className="w-28">
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
              className="w-28"
            />
            <label className="flex items-center gap-1.5">
              <input
                type="checkbox"
                checked={live}
                onChange={(e) => setLive(e.target.checked)}
                className="h-4 w-4 rounded border-input"
              />
              Live
            </label>
            <Button size="sm" onClick={() => void runQuery()} disabled={running}>
              {running ? (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
              )}
              Query
            </Button>
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-2">
          <div ref={chartRef} className="h-72 w-full" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Results ({results.length})</CardTitle>
        </CardHeader>
        <CardContent className="max-h-64 overflow-auto">
          {results.length === 0 ? (
            <p className="py-4 text-center text-xs text-muted-foreground">No data.</p>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-muted-foreground">
                  <th className="py-1 pr-2">Time</th>
                  <th className="py-1 pr-2">Key</th>
                  <th className="py-1">Value</th>
                </tr>
              </thead>
              <tbody>
                {results.slice(-200).map((r, i) => (
                  <tr key={i} className="border-t">
                    <td className="py-1 pr-2">
                      {new Date(r.timestamp * 1000).toLocaleString()}
                    </td>
                    <td className="py-1 pr-2 font-mono">{r.key}</td>
                    <td className="py-1">{r.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
