"use client"

import { useEffect, useState } from "react"
import {
  Activity,
  Database,
  Hash,
  KeyRound,
  Plus,
  RefreshCw,
  Server,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { fetchApi } from "@/lib/utils"

interface ServerStats {
  version: string
  key_count: number
  health: string
  uptime_seconds: number
  goroutines: number
  memory_alloc_mb: number
  memory_total_mb: number
  num_cpu: number
  listen_tcp: string
  listen_http: string
  data_dir: string
  file_handle_lru: number
}

export interface KeyCountItem {
  key: string
  count: number
}

function formatUptime(seconds: number): string {
  if (!seconds) return "—"
  if (seconds < 60) return `${seconds}s`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  return `${h}h ${m}m`
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`
  return String(n)
}

interface OverviewProps {
  keys: KeyCountItem[]
  onSelectKey: (key: string) => void
  onAddKey: () => void
  onRefresh: () => void
}

export default function Overview({ keys, onSelectKey, onAddKey, onRefresh }: OverviewProps) {
  const [stats, setStats] = useState<ServerStats | null>(null)
  const [filter, setFilter] = useState("")

  const fetchServerInfo = async () => {
    try {
      const data = await fetchApi({ body: JSON.stringify({ operation: "serverInfo" }) })
      const inner = data?.data
      if (inner?.success) setStats(inner.data)
    } catch (e) {
      console.error("Failed to fetch server info:", e)
    }
  }

  useEffect(() => {
    void fetchServerInfo()
  }, [])

  const totalPoints = keys.reduce((sum, k) => sum + (k.count || 0), 0)
  const filteredKeys = keys
    .filter((k) => k.key.toLowerCase().includes(filter.toLowerCase()))
    .sort((a, b) => a.key.localeCompare(b.key))

  return (
    <div className="h-full space-y-4 overflow-y-auto p-4 md:p-6">
      {/* Stat cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Keys</CardTitle>
            <KeyRound className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{keys.length}</div>
            <p className="text-xs text-muted-foreground">across all namespaces</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Data Points</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCount(totalPoints)}</div>
            <p className="text-xs text-muted-foreground">
              {totalPoints.toLocaleString()} stored
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Server Version</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.version ?? "—"}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.health ? (
                <span className="inline-flex items-center gap-1 text-emerald-600">
                  <Activity className="h-3 w-3" /> healthy
                </span>
              ) : (
                "connecting…"
              )}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Uptime</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.uptime_seconds ? formatUptime(stats.uptime_seconds) : "—"}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.goroutines != null ? `${stats.goroutines} goroutines` : "\u00A0"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Keys table */}
      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Hash className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium">Keys</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Input
              placeholder="Filter keys…"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="h-8 w-44"
            />
            <Button variant="outline" size="sm" onClick={onRefresh}>
              <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
              Refresh
            </Button>
            <Button size="sm" onClick={onAddKey}>
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Add Key
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {filteredKeys.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
              <div className="rounded-full bg-muted p-3">
                <KeyRound className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium">No keys yet</p>
                <p className="text-xs text-muted-foreground">
                  Create your first key to start writing time-series data.
                </p>
              </div>
              <Button size="sm" onClick={onAddKey}>
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Add Key
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Key</TableHead>
                  <TableHead className="text-right">Data points</TableHead>
                  <TableHead className="w-1/3">Share</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredKeys.map((k) => (
                  <TableRow
                    key={k.key}
                    className="cursor-pointer"
                    onClick={() => onSelectKey(k.key)}
                  >
                    <TableCell className="font-mono text-sm">{k.key}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {k.count.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary/80"
                          style={{
                            width: totalPoints > 0 ? `${Math.max(2, (k.count / totalPoints) * 100)}%` : "0%",
                          }}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
