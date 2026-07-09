import { useEffect, useState } from 'react'
import { useSettings } from '@/settings-context'
import { fetchApi } from '@/lib/utils'

interface ServerStats {
  version: string
  key_count: number
  health: string
  uptime_seconds: number
  goroutines: number
  memory_alloc_mb: number
  memory_total_mb: number
  num_cpu: number
  listen_tcp: string
  listen_http: string
  data_dir: string
  file_handle_lru: number
}

function formatUptime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  return `${h}h ${m}m`
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
      <div className="grid gap-3">
        <div className="flex justify-between">
          <span className="text-sm font-extrabold">Connected Server</span>
          <span className="text-sm">{settings.apiUrl == '' ? "<Demo Server>" : settings.apiUrl}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm font-extrabold">Version</span>
          <span className="text-sm">{stats.version}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm font-extrabold">Status</span>
          <span className="text-sm text-green-600">{stats.health || 'ok'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm font-extrabold">Total Keys</span>
          <span className="text-sm">{stats.key_count}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm font-extrabold">Uptime</span>
          <span className="text-sm">{stats.uptime_seconds ? formatUptime(stats.uptime_seconds) : '-'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm font-extrabold">Goroutines</span>
          <span className="text-sm">{stats.goroutines ?? '-'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm font-extrabold">Memory (alloc)</span>
          <span className="text-sm">{stats.memory_alloc_mb != null ? `${stats.memory_alloc_mb.toFixed(1)} MB` : '-'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm font-extrabold">Memory (total)</span>
          <span className="text-sm">{stats.memory_total_mb != null ? `${stats.memory_total_mb.toFixed(1)} MB` : '-'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm font-extrabold">CPUs</span>
          <span className="text-sm">{stats.num_cpu ?? '-'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm font-extrabold">TCP Listen</span>
          <span className="text-sm">{stats.listen_tcp || '-'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm font-extrabold">HTTP Listen</span>
          <span className="text-sm">{stats.listen_http || '-'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm font-extrabold">Data Dir</span>
          <span className="text-sm truncate max-w-[150px]" title={stats.data_dir}>{stats.data_dir || '-'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm font-extrabold">File Handle LRU</span>
          <span className="text-sm">{stats.file_handle_lru ?? '-'}</span>
        </div>
      </div>
    </div>
  )
}
