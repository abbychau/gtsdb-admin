'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'

interface WriteDataProps {
  selectedKey: string
  onWrite: () => void
}

export default function WriteData({ selectedKey, onWrite }: WriteDataProps) {
  const [value, setValue] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const response = await fetch('/api/tsdb', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        operation: 'write',
        Write: { key: selectedKey, Value: parseFloat(value) }
      })
    })
    const data = await response.json()
    if (data.success) {
      setValue('')
      onWrite()
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Write Data for {selectedKey}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="number"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Value"
            required
          />
          <Button type="submit">Write</Button>
        </form>
      </CardContent>
    </Card>
  )
}

