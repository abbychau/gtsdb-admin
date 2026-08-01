'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Loader2, Eye, Clock } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { fetchApi } from '@/lib/utils'

interface ParsedRow {
  timestamp: number
  value: number
}

interface DataPatchToolProps {
  selectedKey: string
  onPatchComplete: () => void
}

export default function DataPatchTool({ selectedKey, onPatchComplete }: DataPatchToolProps) {
  const [patchCsvData, setPatchCsvData] = useState('')
  const [isPatching, setIsPatching] = useState(false)
  const [previewData, setPreviewData] = useState<ParsedRow[] | null>(null)
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [showPreview, setShowPreview] = useState(false)

  const parseCsv = useCallback((csv: string) => {
    const lines = csv.trim().split('\n')
    const data: ParsedRow[] = []
    const errors: string[] = []

    lines.forEach((line, i) => {
      const trimmed = line.trim()
      if (!trimmed) return
      const parts = trimmed.split(',')
      if (parts.length !== 2) {
        errors.push(`Line ${i + 1}: Expected "timestamp,value", got ${parts.length} values`)
        return
      }
      const ts = parseInt(parts[0], 10)
      const val = parseFloat(parts[1])
      if (isNaN(ts)) {
        errors.push(`Line ${i + 1}: Invalid timestamp "${parts[0]}"`)
        return
      }
      if (isNaN(val)) {
        errors.push(`Line ${i + 1}: Invalid value "${parts[1]}"`)
        return
      }
      data.push({ timestamp: ts, value: val })
    })

    setPreviewData(data)
    setValidationErrors(errors)
    setShowPreview(true)
  }, [])

  const insertTimestamp = (ts: number) => {
    const suffix = `${ts},`
    if (!patchCsvData) {
      setPatchCsvData(suffix)
    } else {
      setPatchCsvData(prev => prev + '\n' + suffix)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!patchCsvData.trim()) {
      toast({
        title: "Error",
        description: "Please enter CSV data first.",
        variant: "destructive",
      })
      return
    }

    // Parse and validate before sending
    parseCsv(patchCsvData)
    if (validationErrors.length > 0) {
      toast({
        title: "Validation Error",
        description: "Please fix CSV errors before submitting.",
        variant: "destructive",
      })
      return
    }

    setIsPatching(true)
    try {
      const data = await fetchApi({
        body: {
          operation: 'data-patch',
          key: selectedKey,
          data: patchCsvData
        }
      })
      if (data.success) {
        setPatchCsvData('')
        setPreviewData(null)
        setShowPreview(false)
        toast({
          title: "Success",
          description: data.data?.message || "Data patch completed.",
        })
        onPatchComplete()
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to patch data.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to patch data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsPatching(false)
    }
  }

  const now = Math.floor(Date.now() / 1000)
  const quickTimestamps = [
    { label: 'Now', ts: now },
    { label: '-1min', ts: now - 60 },
    { label: '-5min', ts: now - 300 },
    { label: '-1hr', ts: now - 3600 },
    { label: '-1day', ts: now - 86400 },
    { label: '-1week', ts: now - 604800 },
  ]

  return (
    <div className="space-y-4">
      {/* Quick Timestamp Insert */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          <Clock className="h-3.5 w-3.5 inline mr-1" />
          Quick Insert Timestamp
        </label>
        <div className="flex flex-wrap gap-1.5">
          {quickTimestamps.map(qt => (
            <Button
              key={qt.label}
              type="button"
              size="sm"
              variant="outline"
              onClick={() => insertTimestamp(qt.ts)}
              title={`Insert ${qt.ts}`}
            >
              {qt.label}
            </Button>
          ))}
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setPatchCsvData('')}
            title="Clear CSV"
          >
            Clear
          </Button>
        </div>
      </div>

      {/* CSV Textarea */}
      <form onSubmit={handleSubmit} className="space-y-2">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            CSV Data (timestamp,value per line)
          </label>
          <textarea
            className="w-full min-h-[120px] rounded-md border border-input bg-background px-3 py-2 text-sm font-mono ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            value={patchCsvData}
            onChange={e => {
              setPatchCsvData(e.target.value)
              if (showPreview) setShowPreview(false)
            }}
            placeholder={`1717965210,123.45\n1717965211,123.46\n1717965212,123.47`}
            rows={6}
            required
          />
        </div>

        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => parseCsv(patchCsvData)}
            disabled={!patchCsvData.trim()}
          >
            <Eye className="h-4 w-4 mr-1" />
            Preview
          </Button>
          <Button type="submit" disabled={isPatching || !patchCsvData.trim()}>
            {isPatching ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Patching...
              </>
            ) : (
              'Submit Data Patch'
            )}
          </Button>
        </div>
      </form>

      {/* Validation Errors */}
      {validationErrors.length > 0 && showPreview && (
        <Card className="border-red-200 bg-red-50 shadow-none">
          <CardContent className="pt-3 pb-2">
            <p className="text-sm font-medium text-red-800 mb-1">CSV Validation Errors:</p>
            <ul className="list-disc list-inside space-y-0.5">
              {validationErrors.map((err, i) => (
                <li key={i} className="text-xs text-red-700">{err}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Preview Table */}
      {previewData && previewData.length > 0 && showPreview && (
        <Card className="shadow-none border-green-200">
          <CardHeader className="py-2 px-3">
            <div className="flex justify-between items-center">
              <CardTitle className="text-sm font-medium">
                Preview: {previewData.length} data points
              </CardTitle>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 text-xs"
                onClick={() => setShowPreview(false)}
              >
                Hide
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pb-2 px-3">
            <div className="max-h-[200px] overflow-y-auto border rounded">
              <table className="w-full text-xs">
                <thead className="bg-gray-100 sticky top-0">
                  <tr>
                    <th className="px-2 py-1 text-left font-medium">#</th>
                    <th className="px-2 py-1 text-left font-medium">Timestamp</th>
                    <th className="px-2 py-1 text-left font-medium">DateTime</th>
                    <th className="px-2 py-1 text-right font-medium">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {previewData.map((row, i) => (
                    <tr key={i} className="border-t border-gray-100 hover:bg-gray-50">
                      <td className="px-2 py-0.5 text-gray-400">{i + 1}</td>
                      <td className="px-2 py-0.5 font-mono">{row.timestamp}</td>
                      <td className="px-2 py-0.5 text-gray-500">
                        {new Date(row.timestamp * 1000).toLocaleString()}
                      </td>
                      <td className="px-2 py-0.5 text-right font-mono">{row.value.toFixed(4)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
