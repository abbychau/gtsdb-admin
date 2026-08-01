"use client"

import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
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

export default function KeyDetail({
  keyName,
  onBack,
  onDeleteKey,
  onRename,
  onKeyWrite,
}: KeyDetailProps) {
  const { getHint } = useConfig()

  // Split folder/key for breadcrumb display
  const parts = keyName.split("_")
  const folder = parts.length > 1 ? parts[0] : ""
  const leaf = parts.length > 1 ? parts.slice(1).join("_") : keyName
  const hint = getHint(keyName)

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
