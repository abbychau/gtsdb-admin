import { useEffect, useState } from 'react'
import { useSettings } from '@/settings-context'
import { fetchApi } from '@/lib/utils'

interface ServerStats {
  'key-count': number
  version: string
}

export function ServerInfo() {
  const [stats, setStats] = useState<ServerStats | null>(null)
  const [loading, setLoading] = useState(true)
  const { settings } = useSettings()

  useEffect(() => {
    const fetchServerInfo = async () => {
      try {
        let data = await fetchApi({
          body: JSON.stringify({
            operation: 'serverInfo'
          })
        })
        data = data.data
        if (data.success) {
          setStats(data.data)
        }
      } catch (error) {
        console.error('Failed to fetch server info:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchServerInfo()
    const interval = setInterval(fetchServerInfo, 5000) // Update every 5 seconds

    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return <div className="p-2">Loading server information...</div>
  }

  if (!stats) {
    return <div className="p-2">No server information available</div>
  }

  return (
    <div className="space-y-4">
      <h4 className="font-medium leading-none mb-4">Server Information</h4>
      <div className="grid gap-4">
        <div className="flex justify-between">
          <span className="text-sm font-extrabold">Connected Server</span>
          <span className="text-sm">{settings.apiUrl == '' ? "<Demo Server>" : settings.apiUrl}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm font-extrabold">Version</span>
          <span className="text-sm">{stats.version}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm font-extrabold">Total Keys</span>
          <span className="text-sm">{stats['key-count']}</span>
        </div>
      </div>
    </div>
  )
}
