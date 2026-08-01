"use client"

import DataOperations from "./DataOperations"

export interface KeyCountItem {
  key: string
  count: number
}

interface KeyDetailProps {
  keyName: string
  keys?: KeyCountItem[]
  onBack: () => void
  onSelectKey?: (key: string) => void
  onDeleteKey: (key: string) => void
  onRename: (oldKey: string, newKey: string) => void
  onKeyWrite: () => void
}

export default function KeyDetail({
  keyName,
  keys,
  onBack,
  onSelectKey,
  onDeleteKey,
  onRename,
  onKeyWrite,
}: KeyDetailProps) {
  return (
    <div className="h-full overflow-y-auto">
      <DataOperations
        selectedKey={keyName}
        keys={keys}
        onBack={onBack}
        onSelectKey={onSelectKey}
        onWrite={onKeyWrite}
        onDeleteKey={onDeleteKey}
        onRename={onRename}
      />
    </div>
  )
}
