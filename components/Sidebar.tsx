import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { TreeView } from './TreeView'

interface SidebarProps {
  keys: string[]
  selectedKey: string | null
  onSelectKey: (key: string) => void
  onInitKey: () => void
}

export default function Sidebar({ keys, selectedKey, onSelectKey, onInitKey }: SidebarProps) {
  return (
    <Card className="w-64 h-full flex flex-col">
      <CardHeader>
        <CardTitle>All Keys</CardTitle>
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

