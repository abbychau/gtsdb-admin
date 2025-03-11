import { useState } from 'react'
import { ChevronRight, ChevronDown, Database } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface TreeNodeProps {
  name: string
  children: Array<{ key: string; count: number }>
  selectedKey: string | null
  onSelectKey: (key: string) => void
  count?: number
}

function TreeNode({ name, children, selectedKey, onSelectKey, count }: TreeNodeProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div>
      <div className="flex items-center">
        {children.length > 0 ? (
          <Button
            variant="ghost"
            size="sm"
            className="p-0 h-6 w-6"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
        ) : <Database className="h-4 w-4 mr-2" />}
        
        <button
          className={cn(
            "flex-grow text-left px-2 py-1 rounded text-sm hover:bg-accent  relative pr-12",
            selectedKey === name && "bg-accent"
          )}
          onClick={() => {
            if (children.length > 0) {
              setIsOpen(!isOpen)
            } else {
              onSelectKey(name)
            }
          }}
        >
          <span className="truncate">{name}</span>
          {count !== undefined && (
            <span className="absolute right-2 px-2 py-0.5 bg-gray-200 rounded-full text-xs">
              {count}
            </span>
          )}
        </button>
      </div>
      {isOpen && children.length > 0 && (
        <div className="items-center">
          {children.map((item) => (
            <div className="flex items-center ml-5" key={`${name}_${item.key}`}>
              <Database className="h-4 w-4 mr-2" />
              <button
                className={cn(
                  "flex-grow text-left px-2 py-1 rounded text-sm hover:bg-accent relative pr-12",
                  selectedKey === `${name}_${item.key}` && "bg-accent"
                )}
                onClick={() => onSelectKey(`${name}_${item.key}`)}
              >
                <span className="truncate">{item.key}</span>
                <span className="absolute right-2 px-2 py-0.5 bg-gray-200 rounded-full text-xs">
                  {item.count}
                </span>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

interface TreeViewProps {
  items: Array<{ key: string; count: number }>
  selectedKey: string | null
  onSelectKey: (key: string) => void
}

export function TreeView({ items, selectedKey, onSelectKey }: TreeViewProps) {
  const groupedItems = items.reduce((acc, item) => {
    if (item.key.includes('_')) {
      const [prefix, ...rest] = item.key.split('_')
      if (!acc[prefix]) {
        acc[prefix] = []
      }
      acc[prefix].push({ key: rest.join('_'), count: item.count })
    } else {
      acc[item.key] = []
    }
    return acc
  }, {} as Record<string, Array<{ key: string; count: number }>>)

  return (
    <div className="space-y-2">
      {Object.entries(groupedItems).map(([prefix, children]) => (
        <TreeNode
          key={prefix}
          name={prefix}
          children={children}
          selectedKey={selectedKey}
          onSelectKey={onSelectKey}
          count={children.length === 0 ? items.find(item => item.key === prefix)?.count : undefined}
        />
      ))}
    </div>
  )
}

