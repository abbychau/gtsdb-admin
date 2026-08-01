import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, ServerIcon, RefreshCw, BarChart3 } from 'lucide-react'
import { TreeView } from './TreeView'
import { ServerInfo } from './ServerInfo'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { useState } from 'react'
import { Input } from '@/components/ui/input'

interface SidebarProps {
  keys: Array<{ key: string; count: number }>;  // Modified type to include count
  selectedKey: string | null
  onSelectKey: (key: string) => void
  onInitKey: () => void
  onRefreshKeys: () => void
  onCompare?: (keys: string[]) => void
}

export default function Sidebar({ keys, selectedKey, onSelectKey, onInitKey, onRefreshKeys, onCompare }: SidebarProps) {
  const [filter, setFilter] = useState('')
  const [selectedKeys, setSelectedKeys] = useState<string[]>([])
  const filteredKeys = keys?.filter(key =>
    key.key.toLowerCase().includes(filter.toLowerCase())
  ).sort((a, b) => a.key.localeCompare(b.key))

  const toggleKey = (key: string) => {
    setSelectedKeys(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    )
  }
  const clearSelected = () => setSelectedKeys([])

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
            onClick={onRefreshKeys}
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
        {onCompare && (
          <Button
            onClick={() => { onCompare(selectedKeys); clearSelected(); }}
            className="w-full mb-4"
            variant="outline"
            disabled={selectedKeys.length === 0}
          >
            <BarChart3 className="mr-2 h-4 w-4" /> Query selected ({selectedKeys.length})
          </Button>
        )}
        {selectedKeys.length > 0 && (
          <Button
            onClick={clearSelected}
            className="w-full mb-4"
            variant="ghost"
            size="sm"
          >
            Clear selection
          </Button>
        )}
        <Input
          placeholder="Filter keys..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-full mb-4"
        />
        <TreeView
          items={filteredKeys || []}
          selectedKeys={selectedKeys}
          onToggleKey={toggleKey}
          onSelectKey={onSelectKey}
        />
      </CardContent>
    </Card>
  )
}


