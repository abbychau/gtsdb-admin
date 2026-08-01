"use client"

import DataOperations from "./DataOperations"

interface KeyDetailProps {
  keyName: string
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
  return (
    <div className="h-full overflow-y-auto">
      <DataOperations
        selectedKey={keyName}
        onBack={onBack}
        onWrite={onKeyWrite}
        onDeleteKey={onDeleteKey}
        onRename={onRename}
      />
    </div>
  )
}
