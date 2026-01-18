'use client'

import { useEffect, useRef, useState } from 'react'
import { useComparison } from '@/comparison-context'
import { useConfig } from '@/config-context'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { X, Trash2, LayoutGrid, Maximize2 } from 'lucide-react'
import * as echarts from 'echarts'

export default function ComparisonTool() {
  const { charts, removeChart, clearCharts } = useComparison()
  const { getMultiplier, getUnit, getOffset } = useConfig()
  const chartRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  const chartInstances = useRef<Map<string, echarts.ECharts>>(new Map())
  const [gridCols, setGridCols] = useState<1 | 2 | 3>(2)

  useEffect(() => {
    // Initialize charts for new data
    charts.forEach((chartData) => {
      const chartDiv = chartRefs.current.get(chartData.id)
      if (!chartDiv || chartInstances.current.has(chartData.id)) return

      const chart = echarts.init(chartDiv)
      chartInstances.current.set(chartData.id, chart)

      // Render chart with data
      renderChart(chart, chartData)
    })

    // Cleanup removed charts
    chartInstances.current.forEach((chart, id) => {
      if (!charts.find(c => c.id === id)) {
        chart.dispose()
        chartInstances.current.delete(id)
      }
    })

    return () => {
      chartInstances.current.forEach(chart => chart.dispose())
      chartInstances.current.clear()
    }
  }, [charts])

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      chartInstances.current.forEach(chart => chart.resize())
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Resize charts when grid layout changes
  useEffect(() => {
    setTimeout(() => {
      chartInstances.current.forEach(chart => chart.resize())
    }, 100)
  }, [gridCols, charts.length])

  // Handle tab activation and visibility change
  useEffect(() => {
    const handleTabActivated = (e: MessageEvent) => {
      if (e.data.type === 'tabActivated') {
        setTimeout(() => {
          window.dispatchEvent(new Event('resize'))
        }, 100)
      }
    }

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        setTimeout(() => {
          window.dispatchEvent(new Event('resize'))
        }, 100)
      }
    }

    window.addEventListener('message', handleTabActivated)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('message', handleTabActivated)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  const renderChart = (chart: echarts.ECharts, chartData: any) => {
    if (!chartData.data || chartData.data.length === 0) {
      return
    }

    const multiplier = getMultiplier(chartData.keyName)
    const unit = getUnit(chartData.keyName)
    const offset = getOffset(chartData.keyName)

    const timestamps = chartData.data.map((item: any) => {
      const date = new Date(item.timestamp * 1000)
      return date.toLocaleString()
    })

    const values = chartData.data.map((item: any) => {
      const rawValue = item.value
      return rawValue * multiplier + offset
    })

    const option = {
      title: {
        text: chartData.title,
        left: 'center',
        textStyle: {
          fontSize: 14,
          fontWeight: 'normal'
        }
      },
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          if (params && params.length > 0) {
            const param = params[0]
            return `${param.name}<br/>${param.seriesName}: ${param.value} ${unit}`
          }
          return ''
        }
      },
      grid: {
        left: '10%',
        right: '10%',
        top: '15%',
        bottom: '15%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: timestamps,
        axisLabel: {
          rotate: 45,
          fontSize: 10
        }
      },
      yAxis: {
        type: 'value',
        name: unit,
        axisLabel: {
          formatter: `{value} ${unit}`,
          fontSize: 10
        }
      },
      series: [
        {
          name: chartData.keyName,
          type: 'line',
          data: values,
          smooth: true,
          symbol: 'circle',
          symbolSize: 4,
          lineStyle: {
            width: 2
          }
        }
      ]
    }

    chart.setOption(option)
  }

  const getGridClass = () => {
    switch (gridCols) {
      case 1:
        return 'grid-cols-1'
      case 2:
        return 'grid-cols-1 md:grid-cols-2'
      case 3:
        return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
      default:
        return 'grid-cols-1 md:grid-cols-2'
    }
  }

  return (
    <div className="h-full flex flex-col p-4 bg-background">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Comparison Tool</h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setGridCols(1)}
            className={gridCols === 1 ? 'bg-secondary' : ''}
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setGridCols(2)}
            className={gridCols === 2 ? 'bg-secondary' : ''}
          >
            <LayoutGrid className="h-4 w-4" />
            2
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setGridCols(3)}
            className={gridCols === 3 ? 'bg-secondary' : ''}
          >
            <LayoutGrid className="h-4 w-4" />
            3
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={clearCharts}
            disabled={charts.length === 0}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Clear All
          </Button>
        </div>
      </div>

      {charts.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          <div className="text-center">
            <LayoutGrid className="h-16 w-16 mx-auto mb-4 opacity-20" />
            <p className="text-lg">No visualizations added yet</p>
            <p className="text-sm mt-2">Click "Send to Comparison Tool" to add visualizations</p>
          </div>
        </div>
      ) : (
        <div className={`grid ${getGridClass()} flex-1 overflow-auto`}>
          {charts.map((chartData) => (
            <Card key={chartData.id} className="flex flex-col p-0">
              <CardHeader className='p-3'>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
                      <span className="font-semibold text-foreground">{chartData.keyName}</span>
                      <span>•</span>
                      <span>{new Date(chartData.timestamp).toLocaleString()}</span>
                      {chartData.requestParams && (
                        <>
                          <span>•</span>
                          <span>
                            {chartData.requestParams.lastx && `Last ${chartData.requestParams.lastx} records`}
                            {chartData.requestParams.start_timestamp && `Start: ${new Date(chartData.requestParams.start_timestamp).toLocaleString()}`}
                            {chartData.requestParams.downsampling && ` | Downsample: ${chartData.requestParams.downsampling}ms (${chartData.requestParams.aggregation})`}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeChart(chartData.id)}
                    className="h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="flex-1 min-h-0 p-0">
                <div
                  ref={(el) => {
                    if (el) chartRefs.current.set(chartData.id, el)
                  }}
                  style={{ width: '100%', height: '100%', minHeight: '300px' }}
                />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
