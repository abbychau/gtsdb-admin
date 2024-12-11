'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'

interface ReadDataProps {
  selectedKey: string
}

export default function ReadData({ selectedKey }: ReadDataProps) {
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [downsampling, setDownsampling] = useState('')
  const [lastX, setLastX] = useState('')
  const [result, setResult] = useState<any>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const response = await fetch('/api/tsdb', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        operation: 'read',
        Read: {
          id: selectedKey,
          start_timestamp: startTime ? parseInt(startTime) : undefined,
          end_timestamp: endTime ? parseInt(endTime) : undefined,
          downsampling: downsampling ? parseInt(downsampling) : undefined,
          lastx: lastX ? parseInt(lastX) : undefined
        }
      })
    })
    const data = await response.json()
    if (data.success) {
      setResult(data.data)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Read Data for {selectedKey}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="number"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            placeholder="Start Timestamp"
          />
          <Input
            type="number"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            placeholder="End Timestamp"
          />
          <Input
            type="number"
            value={downsampling}
            onChange={(e) => setDownsampling(e.target.value)}
            placeholder="Downsampling"
          />
          <Input
            type="number"
            value={lastX}
            onChange={(e) => setLastX(e.target.value)}
            placeholder="Last X Records"
          />
          <Button type="submit">Read</Button>
        </form>
      </CardContent>
      <CardFooter>
        {result && (
          <pre className="mt-4 p-2 bg-gray-100 rounded overflow-x-auto w-full">
            {JSON.stringify(result, null, 2)}
          </pre>
        )}
      </CardFooter>
    </Card>
  )
}

