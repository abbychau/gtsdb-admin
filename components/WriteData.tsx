'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { useSettings } from '../app/settings-context'
import { fetchApi } from '@/lib/utils'

interface WriteDataProps {
  selectedKey: string
  onWrite: () => void
}

export default function WriteData({ selectedKey, onWrite }: WriteDataProps) {
  const [value, setValue] = useState('')
  const { settings } = useSettings();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const data = await fetchApi({
      
      body: {
        operation: 'write',
        Write: { key: selectedKey, Value: parseFloat(value) }
      }
    })
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

