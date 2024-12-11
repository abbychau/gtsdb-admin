import { useState } from 'react'
import { ChevronRight, ChevronDown, Database } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface TreeNodeProps {
  name: string
  children: string[]
  selectedKey: string | null
  onSelectKey: (key: string) => void
}

function TreeNode({ name, children, selectedKey, onSelectKey }: TreeNodeProps) {
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
            "flex-grow text-left px-2 py-1 rounded text-sm hover:bg-accent",
            selectedKey === name && "bg-accent"
          )}
          onClick={() => 
            {
              if (children.length > 0) {
                setIsOpen(!isOpen)
              }else{
                onSelectKey(name)
              }
            }
          }
        >
          {name}
        </button>
      </div>
      {isOpen && children.length > 0 && (
        <div className=" items-center">
          {children.map((key) => (
            <div className="flex items-center ml-5">
            <Database className="h-4 w-4 mr-2" />
            <button
              key={key}
              className={cn(
                "flex-grow text-left px-2 py-1 rounded text-sm hover:bg-accent",
                selectedKey === `${name}_${key}` && "bg-accent"
              )}
              onClick={() => onSelectKey(`${name}_${key}`)}
            >
              {key}
            </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

interface TreeViewProps {
  keys: string[]
  selectedKey: string | null
  onSelectKey: (key: string) => void
}

export function TreeView({ keys, selectedKey, onSelectKey }: TreeViewProps) {
  const groupedKeys = keys.reduce((acc, key) => {
    if (key.includes('_')) {
      const [prefix, ...rest] = key.split('_')
      if (!acc[prefix]) {
        acc[prefix] = []
      }
      acc[prefix].push(rest.join('_'))
    } else {
      acc[key] = []
    }
    return acc
  }, {} as Record<string, string[]>)

  return (
    <div className="space-y-2">
      {Object.entries(groupedKeys).map(([prefix, children]) => (
        <TreeNode
          key={prefix}
          name={prefix}
          children={children}
          selectedKey={selectedKey}
          onSelectKey={onSelectKey}
        />
      ))}
    </div>
  )
}

