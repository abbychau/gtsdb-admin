import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from '@/hooks/use-toast'

interface InitKeyModalProps {
  isOpen: boolean
  onClose: () => void
  onInitKey: (keyName: string) => void
}

export function InitKeyModal({ isOpen, onClose, onInitKey }: InitKeyModalProps) {
  const [keyName, setKeyName] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onInitKey(keyName)
    setKeyName('')
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Initialize New Key</DialogTitle>
          <DialogDescription>
            Enter a name for the new key you want to initialize.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <Input
            value={keyName}
            onChange={(e) => setKeyName(e.target.value)}
            placeholder="Enter key name"
            className="mb-4"
          />
          <DialogFooter>
            <Button type="submit" disabled={!keyName}>Initialize Key</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

