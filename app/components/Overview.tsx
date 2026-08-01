"use client"

import { useState } from "react"
import { Hash, KeyRound, Plus, RefreshCw } from "lucide-react"
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

export interface KeyCountItem {
  key: string
  count: number
}

interface OverviewProps {
  keys: KeyCountItem[]
  onSelectKey: (key: string) => void
  onAddKey: () => void
  onRefresh: () => void
}

export default function Overview({ keys, onSelectKey, onAddKey, onRefresh }: OverviewProps) {
  const [filter, setFilter] = useState("")

  const totalPoints = keys.reduce((sum, k) => sum + (k.count || 0), 0)
  const filteredKeys = keys
    .filter((k) => k.key.toLowerCase().includes(filter.toLowerCase()))
    .sort((a, b) => a.key.localeCompare(b.key))

  return (
    <div className="h-full space-y-4 overflow-y-auto p-4 md:p-6">
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
