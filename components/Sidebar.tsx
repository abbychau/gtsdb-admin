import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, ServerIcon } from 'lucide-react'
import { TreeView } from './TreeView'
import { ServerInfo } from './ServerInfo'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { useState } from 'react'

interface SidebarProps {
  keys: string[]
  selectedKey: string | null
  onSelectKey: (key: string) => void
  onInitKey: () => void
}

export default function Sidebar({ keys, selectedKey, onSelectKey, onInitKey }: SidebarProps) {
  keys.sort()

  return (
    <Card className="w-64 h-[calc(100vh - 4)] flex flex-col m-4 mr-0">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>All Keys</CardTitle>
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
        <TreeView
          keys={keys}
          selectedKey={selectedKey}
          onSelectKey={onSelectKey}
        />
      </CardContent>
    </Card>
  )
}

