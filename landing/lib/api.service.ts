import { axiosInstance } from './axios'

type ScrapeResponse = {
  jobId: string
  status: string
}

type GetJobResponse = {
  id: string
  state: string
  progress: number
  result: unknown
  attemptsMade: number
}

export type MediaItem = {
  id: string
  url: string
  type: MediaType
  createdAt: string
}

type GetMediaResponse = {
  data: MediaItem[]
  metadata: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export enum MediaType {
  Image = 'image',
  Video = 'video',
}

type getMediaParams = {
  page: number
  limit: number
  type?: MediaType
  search?: string
}

export const apiService = {
  scrape: (urls: string[]): Promise<ScrapeResponse> => axiosInstance.post('/scrape', { urls }),
  getJob: (id: string): Promise<GetJobResponse> => axiosInstance.get(`/scrape/${id}`),

  getMedia: (params: getMediaParams): Promise<GetMediaResponse> => axiosInstance.get('/media', { params }),
}
