import axios from 'axios'

export const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api',
  auth: {
    username: process.env.NEXT_PUBLIC_BASIC_USER || 'admin',
    password: process.env.NEXT_PUBLIC_BASIC_PASS || 'admin',
  },
})

axiosInstance.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.error(error)
    return Promise.reject(error)
  }
)
