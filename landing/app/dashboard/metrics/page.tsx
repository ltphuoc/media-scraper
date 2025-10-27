'use client'

import { apiService } from '@/lib/api.service'
import { useQuery } from '@tanstack/react-query'

export default function MetricsPage() {
  const {
    data: metrics,
    isLoading,
    isError,
    error,
    dataUpdatedAt,
    isFetching,
  } = useQuery({
    queryKey: ['metrics'],
    queryFn: apiService.getMetrics,
    refetchInterval: 5000,
    refetchOnWindowFocus: true,
  })

  if (isLoading) return <div className="p-6 text-gray-600">Loading metrics...</div>
  if (isError) return <div className="p-6 text-red-600">{(error as Error).message}</div>
  if (!metrics) return null

  const { memory, cpu, queue } = metrics
  const updatedTime = new Date(dataUpdatedAt).toLocaleTimeString()

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold text-gray-800">
        📊 System Metrics
        {isFetching && <span className="text-xs text-blue-500 animate-pulse">(refreshing...)</span>}
      </h1>

      <p className="text-sm text-gray-500 text-right">
        Last updated: <span className="font-medium">{updatedTime}</span>
      </p>

      {/* General Info */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard title="Status" value={metrics.status} />
        <MetricCard title="Uptime (s)" value={metrics.uptimeSeconds.toFixed(1)} />
        <MetricCard title="Requests" value={metrics.requests.toString()} />
      </div>

      {/* Memory */}
      <Section title="Memory">
        <MetricRow label="Total" value={`${memory.totalMB} MB`} />
        <MetricRow label="Heap Used" value={`${memory.heapUsedMB} MB`} />
        <MetricRow label="Heap Total" value={`${memory.heapTotalMB} MB`} />
        <MetricRow label="Heap Used %" value={memory.heapUsedPercent} />
      </Section>

      {/* CPU */}
      <Section title="CPU">
        <MetricRow label="User Time (ms)" value={cpu.userMs} />
        <MetricRow label="System Time (ms)" value={cpu.systemMs} />
        <MetricRow label="Usage %" value={cpu.usagePercent} />
      </Section>

      {/* Redis */}
      <Section title="Redis">
        <MetricRow label="Memory Used" value={metrics.redisMemory} />
      </Section>

      {/* Queue */}
      <Section title="Queue">
        <MetricCard title="Waiting" value={queue.waiting.toString()} />
        <MetricCard title="Active" value={queue.active.toString()} />
        <MetricCard title="Completed" value={queue.completed.toString()} />
        <MetricCard title="Failed" value={queue.failed.toString()} />
      </Section>
    </div>
  )
}

function MetricCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="bg-white border rounded-lg shadow-sm p-4">
      <p className="text-sm text-gray-500">{title}</p>
      <p className="text-lg font-semibold text-gray-800">{value}</p>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border rounded-lg shadow-sm p-4 space-y-3">
      <h2 className="font-semibold text-gray-700 border-b pb-2">{title}</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">{children}</div>
    </div>
  )
}

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="font-medium text-gray-800">{value}</p>
    </div>
  )
}
