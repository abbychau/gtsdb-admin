"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  BarChart3,
  Plus,
  RefreshCw,
  Search,
  ServerIcon,
  Settings,
} from "lucide-react"
import { TreeView } from "./TreeView"
import { ServerInfo } from "./ServerInfo"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export interface SidebarKey {
  key: string
  count: number
}

interface SidebarProps {
  keys: SidebarKey[]
  selectedKey: string | null
  onSelectKey: (key: string) => void
  onInitKey: () => void
  onRefreshKeys: () => void
  onCompare?: (keys: string[]) => void
  onOpenSettings?: () => void
}

export default function Sidebar({
  keys,
  selectedKey,
  onSelectKey,
  onInitKey,
  onRefreshKeys,
  onCompare,
  onOpenSettings,
}: SidebarProps) {
  const [filter, setFilter] = useState("")
  const [selectedKeys, setSelectedKeys] = useState<string[]>([])
  const filteredKeys = (keys || [])
    .filter((key) => key.key.toLowerCase().includes(filter.toLowerCase()))
    .sort((a, b) => a.key.localeCompare(b.key))

  const toggleKey = (key: string) => {
    setSelectedKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    )
  }
  const clearSelected = () => setSelectedKeys([])

  return (
    <div className="flex h-full w-72 shrink-0 flex-col border-r bg-background">
      {/* Brand row */}
      <div className="flex items-center justify-between gap-2 border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <span className="text-sm font-bold">🐹</span>
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold">GTSDB Admin</div>
            <div className="text-[11px] text-muted-foreground">Timeseries Studio</div>
          </div>
        </div>
        <div className="flex items-center gap-0.5">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <ServerIcon className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-96" align="start">
              <ServerInfo />
            </PopoverContent>
          </Popover>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={onRefreshKeys}
            title="Refresh keys"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          {onOpenSettings && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={onOpenSettings}
              title="Settings"
            >
              <Settings className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-2 border-b p-3">
        <Button onClick={onInitKey} className="w-full">
          <Plus className="mr-2 h-4 w-4" /> Add Key
        </Button>
        {onCompare && (
          <Button
            onClick={() => {
              onCompare(selectedKeys)
              clearSelected()
            }}
            className="w-full"
            variant="outline"
            disabled={selectedKeys.length === 0}
          >
            <BarChart3 className="mr-2 h-4 w-4" />
            Query selected ({selectedKeys.length})
          </Button>
        )}
        {selectedKeys.length > 0 && (
          <Button onClick={clearSelected} className="w-full" variant="ghost" size="sm">
            Clear selection
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="border-b p-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Filter keys…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="h-9 pl-8"
          />
        </div>
      </div>

      {/* Key tree */}
      <div className="flex-1 overflow-y-auto p-3">
        {filteredKeys.length === 0 ? (
          <p className="px-1 text-sm text-muted-foreground">
            {keys.length === 0 ? "No keys yet." : "No keys match your filter."}
          </p>
        ) : (
          <TreeView
            items={filteredKeys}
            selectedKeys={selectedKeys}
            onToggleKey={toggleKey}
            onSelectKey={onSelectKey}
          />
        )}
      </div>

      {/* Footer */}
      <div className="border-t px-4 py-2.5">
        <p className="text-[11px] text-muted-foreground">
          Select a key to inspect, or check boxes and run a combined query.
        </p>
      </div>
    </div>
  )
}


