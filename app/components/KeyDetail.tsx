"use client"

import { useEffect, useState } from "react"
import { ArrowLeft, Database, Gauge, Ruler } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { fetchApi } from "@/lib/utils"
import { useConfig } from "@/config-context"
import DataOperations from "./DataOperations"

interface KeyDetailProps {
  keyName: string
  points?: number
  onBack: () => void
  onDeleteKey: (key: string) => void
  onRename: (oldKey: string, newKey: string) => void
  onKeyWrite: () => void
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`
  return String(n)
}

export default function KeyDetail({
  keyName,
  points = 0,
  onBack,
  onDeleteKey,
  onRename,
  onKeyWrite,
}: KeyDetailProps) {
  const [latest, setLatest] = useState<number | null>(null)
  const [latestTs, setLatestTs] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const { getMultiplier, getUnit, getOffset, getHint } = useConfig()

  useEffect(() => {
    let active = true
    const load = async () => {
      setLoading(true)
      try {
        const data = await fetchApi({
          body: JSON.stringify({
            operation: "read",
            key: keyName,
            read: { lastx: 1, aggregation: "avg" },
          }),
        })
        const gtsdb = data?.data ?? data
        if (active && gtsdb?.success && Array.isArray(gtsdb.data) && gtsdb.data.length > 0) {
          const p = gtsdb.data[gtsdb.data.length - 1]
          setLatest(p.value)
          setLatestTs(p.timestamp ? new Date(p.timestamp * 1000).toLocaleString() : null)
        } else {
          setLatest(null)
          setLatestTs(null)
        }
      } catch {
        if (active) {
          setLatest(null)
          setLatestTs(null)
        }
      } finally {
        if (active) setLoading(false)
      }
    }
    void load()
    return () => {
      active = false
    }
  }, [keyName])

  const multiplier = getMultiplier(keyName)
  const offset = getOffset(keyName)
  const unit = getUnit(keyName)
  const hint = getHint(keyName)

  // Split folder/key for breadcrumb display
  const parts = keyName.split("_")
  const folder = parts.length > 1 ? parts[0] : ""
  const leaf = parts.length > 1 ? parts.slice(1).join("_") : keyName

  const latestDisplay =
    latest == null ? "—" : `${((latest + offset) * multiplier).toFixed(multiplier < 1 ? 4 : 2)}${unit ? ` ${unit}` : ""}`

  return (
    <div className="h-full space-y-4 overflow-y-auto p-4 md:p-6">
      {/* Breadcrumb / header strip */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={onBack} title="Back to overview">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            {folder && (
              <>
                <span className="text-muted-foreground">{folder}</span>
                <span>/</span>
              </>
            )}
            <span className="font-mono font-medium text-foreground">{leaf}</span>
          </div>
        </div>
        {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Latest Value</CardTitle>
            <Gauge className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "…" : latestDisplay}
            </div>
            {latestTs && (
              <p className="text-xs text-muted-foreground">at {latestTs}</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Data Points</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCount(points)}</div>
            <p className="text-xs text-muted-foreground">
              {points.toLocaleString()} stored
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Scale</CardTitle>
            <Ruler className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {multiplier !== 1 || offset !== 0 ? (
                <span className="text-lg">
                  ×{multiplier}
                  {offset ? ` ${offset > 0 ? "+" : ""}${offset}` : ""}
                </span>
              ) : (
                "1:1"
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {unit ? `unit: ${unit}` : "no unit configured"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Operations */}
      <DataOperations
        selectedKey={keyName}
        onWrite={onKeyWrite}
        onDeleteKey={onDeleteKey}
        onRename={onRename}
      />
    </div>
  )
}
