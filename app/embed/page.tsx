'use client'

import { useEffect, useState, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import * as echarts from 'echarts'
import { fetchApi } from '@/lib/utils'

function EmbedContent() {
  const searchParams = useSearchParams()
  const keyName = searchParams.get('key')
  const apiUrl = searchParams.get('apiUrl')
  const startTime = searchParams.get('start')
  const endTime = searchParams.get('end')
  const downsampling = searchParams.get('downsampling')
  const aggregationMethod = searchParams.get('aggregation') || 'avg'
  const lastX = searchParams.get('lastx')
  
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [chartContainer, setChartContainer] = useState<HTMLDivElement | null>(null)
  const chartInstance = useRef<echarts.ECharts | null>(null)
  const loadingRef = useRef(false)

  useEffect(() => {
    return () => {
      if (chartInstance.current) {
        chartInstance.current.dispose()
      }
    }
  }, [])

  // Load data when chart container becomes available
  useEffect(() => {
    if (!keyName || !apiUrl || !chartContainer) {
      if (!keyName || !apiUrl) {
        setError('Missing required parameters: key and apiUrl')
        setIsLoading(false)
      }
      return
    }

    const loadData = async () => {
      if (loadingRef.current) {
        return
      }

      loadingRef.current = true

      try {
        // First get the configuration
        const configResponse = await fetch(`/api/tsdb?apiUrl=${encodeURIComponent(apiUrl)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ operation: 'getapiurlconfig' })
        })
        
        const configResult = await configResponse.json()
        const config = configResult.success ? configResult.data : {}

        // Helper functions for config
        const getMultiplier = (key: string): number => {
          if (config.multipliers && config.multipliers[key] !== undefined) {
            console.log(`Exact match for ${key}: ${config.multipliers[key]}`)
            return config.multipliers[key]
          }
          if (config.multipliers) {
            const wildcardMatch = Object.keys(config.multipliers).find((k) => {
              const regex = new RegExp(k.replace(/\*/g, '.*'))
              const isMatch = regex.test(key)
              return isMatch
            })
            if (wildcardMatch) {
              console.log(`Wildcard match for ${key}: ${config.multipliers[wildcardMatch]}`)
              return config.multipliers[wildcardMatch]
            }
          }
          return 1
        }

        const getUnit = (key: string): string => {
          if (config.units && config.units[key] !== undefined) {
            return config.units[key]
          }
          if (config.units) {
            const wildcardMatch = Object.keys(config.units).find((k) => {
              const regex = new RegExp(k.replace(/\*/g, '.*'))
              return regex.test(key)
            })
            if (wildcardMatch) {
              return config.units[wildcardMatch]
            }
          }
          return ''
        }

        const getOffset = (key: string): number => {
          if (config.offsets && config.offsets[key] !== undefined) {
            return config.offsets[key]
          }
          if (config.offsets) {
            const wildcardMatch = Object.keys(config.offsets).find((k) => {
              const regex = new RegExp(k.replace(/\*/g, '.*'))
              return regex.test(key)
            })
            if (wildcardMatch) {
              return config.offsets[wildcardMatch]
            }
          }
          return 0
        }

        // Build read payload
        const readPayload = {
          start_timestamp: startTime ? parseInt(startTime) : undefined,
          end_timestamp: endTime ? parseInt(endTime) : undefined,
          downsampling: downsampling ? parseInt(downsampling) : undefined,
          lastx: lastX ? parseInt(lastX) : undefined,
          aggregation: downsampling ? aggregationMethod : undefined
        }

        const isEmpty = Object.values(readPayload).every(val => val === undefined)
        
        const payload = {
          operation: 'read',
          key: keyName,
          Read: isEmpty ? undefined : readPayload
        }

        // Fetch data
        const dataResponse = await fetch(`/api/tsdb?apiUrl=${encodeURIComponent(apiUrl)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
        
        const dataResult = await dataResponse.json()

        if (!dataResult.success) {
          setError(`API Error: ${dataResult.message || 'Unknown error'}`)
          setIsLoading(false)
          return
        }

        if (!dataResult.data || !dataResult.data.data) {
          setError('No data found for the given query')
          setIsLoading(false)
          return
        }

        // Create chart
        if (chartInstance.current) {
          chartInstance.current.dispose()
        }
        
        chartInstance.current = echarts.init(chartContainer)
        
        const timestamps = dataResult.data.data.map((item: any) => 
          new Date(item.timestamp * 1000).toLocaleString()
        )
        
        const multiplier = getMultiplier(keyName)
        const unit = getUnit(keyName)
        const offset = getOffset(keyName)
        const values = dataResult.data.data.map((item: any) => (item.value * multiplier) + offset)
        
        const option = {
            tooltip: {
              trigger: 'axis',
              formatter: function(params: any) {
                const timestamp = params[0].name
                const value = params[0].value
                return `${timestamp}<br/>${keyName}: ${value.toFixed(4)}${unit}`
              },
              position: function (pt: any) {
                return [pt[0], '10%']
              }
            },
            title: {
              left: 'center',
              text: `${keyName}${unit ? ` (${unit})` : ''}`,
              textStyle: {
                fontSize: 14
              }
            },
            grid: {
              left: '10%',
              right: '10%',
              bottom: '15%',
              top: '15%'
            },
            xAxis: {
              type: 'category',
              boundaryGap: false,
              data: timestamps,
              axisLabel: {
                fontSize: 10
              }
            },
            yAxis: {
              type: 'value',
              axisLabel: {
                fontSize: 10,
                formatter: `{value}${unit}`
              }
            },
            dataZoom: [
              {
                type: 'inside',
                start: 0,
                end: 100
              },
              {
                start: 0,
                end: 100,
                height: 20,
                bottom: 10
              }
            ],
            series: [{
              data: values,
              type: 'line',
              smooth: true,
              symbol: 'circle',
              symbolSize: 4,
              lineStyle: {
                width: 2
              }
            }]
        }
        
        chartInstance.current.setOption(option)
        
        // Handle resize
        const handleResize = () => {
          if (chartInstance.current) {
            chartInstance.current.resize()
          }
        }
        
        window.addEventListener('resize', handleResize)
        
        setIsLoading(false)
      } catch (error) {
        setError(`Failed to load chart data: ${error instanceof Error ? error.message : 'Unknown error'}`)
        setIsLoading(false)
      } finally {
        loadingRef.current = false
      }
    }

    loadData()
  }, [keyName, apiUrl, startTime, endTime, downsampling, aggregationMethod, lastX, chartContainer])

  if (!keyName || !apiUrl) {
    return (
      <div className="flex items-center justify-center h-full text-red-500">
        Missing required parameters: key and apiUrl
      </div>
    )
  }

  const chartRefCallback = (element: HTMLDivElement | null) => {
    setChartContainer(element)
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full text-red-500 text-sm">
        {error}
      </div>
    )
  }

  return (
    <div className="w-full h-full">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-10">
          <div className="text-sm">Loading chart...</div>
        </div>
      )}
      <div 
        ref={chartRefCallback} 
        className="w-full h-full" 
      />
    </div>
  )
}

export default function EmbedPage() {
  return (
    <div className="w-full h-screen bg-white">
      <Suspense fallback={
        <div className="flex items-center justify-center h-full">
          <div className="text-sm">Loading...</div>
        </div>
      }>
        <EmbedContent />
      </Suspense>
    </div>
  )
}