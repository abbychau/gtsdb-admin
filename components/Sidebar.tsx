import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, ServerIcon, RefreshCw } from 'lucide-react'
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
}

export default function Sidebar({ keys, selectedKey, onSelectKey, onInitKey, onRefreshKeys }: SidebarProps) {
  const [filter, setFilter] = useState('')
  console.log(keys)
  const filteredKeys = keys?.filter(key => 
    key.key.toLowerCase().includes(filter.toLowerCase())
  )

  return (
    <Card className="w-64 h-[calc(100vh - 4)] flex flex-col m-4 mr-0">
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
          className="w-full mb-4"
          variant="outline"
        >
          <Plus className="mr-2 h-4 w-4" /> Add Key
        </Button>
        <Input
          placeholder="Filter keys..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-full mb-4"
        />
        <TreeView
          items={filteredKeys || []}
          selectedKey={selectedKey}
          onSelectKey={onSelectKey}
        />
      </CardContent>
    </Card>
  )
}

