'use client'

import { apiService } from '@/lib/api.service'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { Plus, Trash2, X } from 'lucide-react'
import { useState } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import { z } from 'zod'
import JobStatusList from '../_ui/JobStatusList'

const urlSchema = z.object({
  urls: z
    .array(z.object({ url: z.url('Invalid URL format') }))
    .min(1, 'At least one URL is required')
    .max(10, 'At most 10 URLs are allowed'),
})

type FormValues = z.infer<typeof urlSchema>

export default function SubmitPage() {
  const [message, setMessage] = useState('')
  const [jobs, setJobs] = useState<{ id: string; status: string }[]>([])

  const {
    control,
    handleSubmit,
    reset,
    register,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(urlSchema),
    defaultValues: { urls: [{ url: '' }] },
    mode: 'onSubmit',
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'urls',
  })

  const { mutate: scrape, isPending: isScraping } = useMutation({
    mutationFn: (data: FormValues) => apiService.scrape(data.urls.map((item) => item.url)),

    onSuccess: (res) => {
      setJobs((prev) => [...prev, { id: res.jobId, status: 'pending' }])
      setMessage('🕐 Job started successfully!')
      // reset({ urls: [{ url: '' }] })
    },
    onError: () => setMessage('❌ Failed to start scrape job'),
  })

  const onSubmit = (data: FormValues) => scrape(data)

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Submit URLs to Scrape</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={isScraping}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded disabled:opacity-50"
          >
            {isScraping ? 'Scraping...' : 'Submit'}
          </button>

          {fields.length < 10 && (
            <button
              type="button"
              onClick={() => append({ url: '' })}
              className="bg-gray-200 hover:bg-gray-300 text-gray-500 px-4 py-2 rounded flex items-center gap-2"
            >
              <Plus size={16} /> Add
            </button>
          )}

          <button
            type="button"
            onClick={() => reset({ urls: [{ url: '' }] })}
            className="bg-gray-200 hover:bg-gray-300 text-gray-500 px-4 py-2 rounded flex items-center gap-2"
          >
            <Trash2 size={16} /> Clear
          </button>
        </div>

        {fields.map((field, index) => (
          <div key={field.id} className="grid gap-2">
            <div className="flex items-center gap-2">
              <input
                {...register(`urls.${index}.url`)}
                type="text"
                placeholder="https://example.com"
                className="flex-1 border p-2 rounded"
              />
              {fields.length > 1 ? (
                <button
                  type="button"
                  onClick={() => remove(index)}
                  className="text-red-500 hover:text-red-600 bg-red-100 hover:bg-red-200 p-2 rounded"
                >
                  <X size={16} />
                </button>
              ) : (
                <div className="size-8" />
              )}
            </div>
            {errors.urls?.[index]?.url && <p className="text-sm text-red-600">{errors.urls[index]?.url?.message}</p>}
          </div>
        ))}

        {typeof errors.urls?.message === 'string' && <p className="text-sm text-red-600">{errors.urls.message}</p>}
      </form>

      {message && <p className="text-sm text-center text-gray-600 mt-4">{message}</p>}

      {jobs.length > 0 && <JobStatusList jobs={jobs} setJobs={setJobs} />}
    </div>
  )
}
