import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, ServerIcon, RefreshCw, BarChart3 } from 'lucide-react'
import { ServerInfo } from './ServerInfo'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface SidebarProps {
  keys: Array<{ key: string; count: number }>;  // Modified type to include count
  selectedKey: string | null
  onSelectKey: (key: string) => void
  onInitKey: () => void
  onRefreshKeys: () => void
  onOpenComparisonTool?: () => void
}

export default function Sidebar({ keys, selectedKey, onSelectKey, onInitKey, onRefreshKeys, onOpenComparisonTool }: SidebarProps) {
  const [filter, setFilter] = useState('')
  const filteredKeys = keys?.filter(key => 
    key.key.toLowerCase().includes(filter.toLowerCase())
  ).sort((a, b) => a.key.localeCompare(b.key))

  return (
    <Card className="w-74 h-[calc(100vh - 4)] flex flex-col m-4 mr-0">
      <CardHeader>
        <div className="flex justify-end items-center">
          <CardTitle className='flex-1'>All Keys</CardTitle>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
              >
                <ServerIcon className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-96">
              <ServerInfo />
            </PopoverContent>
          </Popover>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={onRefreshKeys}  // Changed from window.location.reload()
            className="ml-2"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto">
        <Button
          onClick={onInitKey}
          className="w-full mb-2"
          variant="outline"
        >
          <Plus className="mr-2 h-4 w-4" /> Add Key
        </Button>
        {onOpenComparisonTool && (
          <Button
            onClick={onOpenComparisonTool}
            className="w-full mb-4"
            variant="outline"
          >
            <BarChart3 className="mr-2 h-4 w-4" /> Comparison Tool
          </Button>
        )}
        <Input
          placeholder="Filter keys..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-full mb-4"
        />
        {/* Flat key list — simpler than a tree, mirrors the cloud explorer. */}
        <div className="space-y-0.5">
          {(filteredKeys || []).map((k) => {
            const active = selectedKey === k.key;
            return (
              <button
                key={k.key}
                type="button"
                onClick={() => onSelectKey(k.key)}
                className={cn(
                  "flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent",
                  active && "bg-primary/10 font-medium text-primary"
                )}
              >
                <span className="truncate font-mono text-xs">{k.key}</span>
                <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                  {(k.count ?? 0).toLocaleString()}
                </span>
              </button>
            );
          })}
          {(!filteredKeys || filteredKeys.length === 0) && (
            <p className="px-2 py-4 text-center text-xs text-muted-foreground">
              {filter ? "No keys match your filter." : "No keys yet."}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

