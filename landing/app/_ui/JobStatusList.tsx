'use client'

import { apiService } from '@/lib/api.service'
import { useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import { Loader2 } from 'lucide-react'

interface Job {
  id: string
  status: string
}

interface Props {
  jobs: Job[]
  setJobs: React.Dispatch<React.SetStateAction<Job[]>>
}

export default function JobStatusList({ jobs, setJobs }: Props) {
  const activeIds = jobs.filter((j) => j.status !== 'completed' && j.status !== 'failed').map((j) => j.id)

  const { data, isFetching } = useQuery({
    queryKey: ['jobStatus', activeIds],
    queryFn: async () => {
      const responses = await Promise.all(activeIds.map((id) => apiService.getJob(id)))
      return responses.map((res, i) => ({ id: activeIds[i], status: res.state }))
    },
    enabled: activeIds.length > 0,
    refetchInterval: activeIds.length > 0 ? 3000 : false,
  })

  useEffect(() => {
    if (!data) return
    setJobs((prev) =>
      prev.map((job) => {
        const updated = data.find((u) => u.id === job.id)
        return updated ? { ...job, status: updated.status } : job
      })
    )
  }, [data, setJobs])

  useEffect(() => {
    if (jobs.length === 0) return

    const timer = setInterval(() => {
      setJobs((prev) =>
        prev.filter((job) => {
          if (job.status === 'completed' || job.status === 'failed') return false
          return true
        })
      )
    }, 10_000)

    return () => clearInterval(timer)
  }, [jobs, setJobs])

  return (
    <div className="mt-6 border-t pt-4">
      <h2 className="font-semibold mb-2">🧩 Job Status</h2>
      {jobs.length === 0 ? (
        <p className="text-gray-500 text-sm">No active jobs.</p>
      ) : (
        <ul className="space-y-2">
          {jobs.map((job) => {
            const isRunning = job.status !== 'completed' && job.status !== 'failed'
            return (
              <li
                key={job.id}
                className={`p-2 rounded border flex justify-between items-center ${
                  job.status === 'completed'
                    ? 'bg-green-50 text-green-700'
                    : job.status === 'failed'
                    ? 'bg-red-50 text-red-700'
                    : 'bg-gray-50 text-gray-600'
                }`}
              >
                <code className="font-mono text-sm">{job.id}</code>
                <div className="flex items-center gap-2">
                  {isRunning && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
                  <span className="font-medium text-sm capitalize">
                    {job.status === 'completed' ? '✅ Completed' : job.status === 'failed' ? '❌ Failed' : '⏳ Running'}
                  </span>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
