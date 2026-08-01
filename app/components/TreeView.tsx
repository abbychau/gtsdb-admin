import { useState } from 'react'
import { ChevronRight, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface KeyItem {
  key: string
  count: number
}

interface TreeNodeProps {
  name: string
  items: KeyItem[]
  selectedKeys: string[]
  onToggleKey: (key: string) => void
  onSelectKey: (key: string) => void
  count?: number
}

function TreeNode({ name, items, selectedKeys, onToggleKey, onSelectKey, count }: TreeNodeProps) {
  const [isOpen, setIsOpen] = useState(false)
  const isGroup = items.length > 0

  return (
    <div>
      <div className="flex items-center">
        {isGroup ? (
          <Button
            variant="ghost"
            size="sm"
            className="p-0 h-6 w-6"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
        ) : (
          <input
            type="checkbox"
            checked={selectedKeys.includes(name)}
            onChange={() => onToggleKey(name)}
            className="ml-1 h-4 w-4 rounded border-input"
          />
        )}
        <button
          className="flex-grow text-left px-2 py-1 rounded text-sm hover:bg-accent relative pr-12"
          onClick={() => {
            if (isGroup) {
              setIsOpen(!isOpen)
            } else {
              onSelectKey(name)
            }
          }}
        >
          <span className="truncate">{name}</span>
          {count !== undefined && (
            <span className="absolute right-2 px-2 py-0.5 rounded-full bg-muted text-xs text-muted-foreground">
              {count}
            </span>
          )}
        </button>
      </div>
      {isOpen && isGroup && (
        <div>
          {items.map((item) => {
            const full = `${name}_${item.key}`
            const checked = selectedKeys.includes(full)
            return (
              <div className="flex items-center ml-5" key={full}>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => onToggleKey(full)}
                  className="h-4 w-4 rounded border-input"
                />
                <button
                  className="flex-grow text-left px-2 py-1 rounded text-sm hover:bg-accent relative pr-12"
                  onClick={() => onSelectKey(full)}
                >
                  <span className="truncate">{item.key}</span>
                  <span className="absolute right-2 px-2 py-0.5 rounded-full bg-muted text-xs text-muted-foreground">
                    {item.count}
                  </span>
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

interface TreeViewProps {
  items: KeyItem[]
  selectedKeys: string[]
  onToggleKey: (key: string) => void
  onSelectKey: (key: string) => void
}

export function TreeView({ items, selectedKeys, onToggleKey, onSelectKey }: TreeViewProps) {
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
  }, {} as Record<string, KeyItem[]>)

  return (
    <div className="space-y-2">
      {Object.entries(groupedItems).map(([prefix, children]) => (
        <TreeNode
          key={prefix}
          name={prefix}
          items={children}
          selectedKeys={selectedKeys}
          onToggleKey={onToggleKey}
          onSelectKey={onSelectKey}
          count={children.length === 0 ? items.find(item => item.key === prefix)?.count : undefined}
        />
      ))}
    </div>
  )
}


