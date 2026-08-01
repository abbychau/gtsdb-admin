'use client'

import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import MultiQuery from './MultiQuery'
import DataOperations from './DataOperations'

export interface Tab {
  id: string
  title: string
  keyName: string
  isMultiQuery?: boolean
  keys?: string[]
}

function formatTabTitle(keyName: string) {
  if (keyName.includes('_')) {
    const [folder, ...rest] = keyName.split('_')
    return {
      folder,
      key: rest.join('_')
    }
  }
  return {
    folder: '',
    key: keyName
  }
}

interface TabSystemProps {
  tabs: Tab[]
  activeTabId: string | null
  onTabSelect: (tabId: string) => void
  onTabClose: (tabId: string) => void
  onDeleteKey?: (key: string) => void
  onRename?: (oldKey: string, newKey: string) => void
  onKeyWrite?: () => void
}

export function TabSystem({
  tabs,
  activeTabId,
  onTabSelect,
  onTabClose,
  onDeleteKey,
  onRename,
  onKeyWrite,
}: TabSystemProps) {
  if (tabs.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        Select a key from the sidebar to open a new tab.
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Tab Bar */}
      <div className="flex border-b bg-background">
        <div className="flex overflow-x-auto">
          {tabs.map((tab) => {
            let displayTitle = tab.title
            let folder = ''

            if (!tab.isMultiQuery) {
              const { folder: f, key } = formatTabTitle(tab.keyName)
              folder = f
              displayTitle = key
            }

            return (
              <div
                key={tab.id}
                className={cn(
                  "flex items-center gap-1 px-2 py-1 border-r cursor-pointer min-w-0 group",
                  activeTabId === tab.id
                    ? "bg-primary/10 border-b-2 border-b-primary"
                    : "hover:bg-muted"
                )}
                onClick={() => onTabSelect(tab.id)}
              >
                <div className="flex flex-col min-w-0 text-xs leading-tight">
                  {folder && (
                    <div className="truncate max-w-24 text-muted-foreground" title={folder}>
                      {folder}
                    </div>
                  )}
                  <div className="truncate max-w-24 font-medium" title={displayTitle}>
                    {displayTitle}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-3 w-3 min-w-3 hover:bg-destructive hover:text-destructive-foreground"
                  onClick={(e) => {
                    e.stopPropagation()
                    onTabClose(tab.id)
                  }}
                >
                  <X className="h-2 w-2" />
                </Button>
              </div>
            )
          })}
        </div>
      </div>

      {/* Tab Content — rendered inline (no iframes) */}
      <div className="flex-1 relative">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={cn(
              "absolute inset-0 overflow-hidden",
              activeTabId === tab.id ? "block" : "hidden"
            )}
          >
            {tab.isMultiQuery ? (
              <MultiQuery keys={tab.keys || []} />
            ) : (
              <DataOperations
                selectedKey={tab.keyName}
                onWrite={onKeyWrite || (() => {})}
                onDeleteKey={onDeleteKey || (() => {})}
                onRename={onRename || (() => {})}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}