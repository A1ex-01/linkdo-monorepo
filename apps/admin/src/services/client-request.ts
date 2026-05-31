import axios, { type AxiosError, type AxiosRequestConfig } from 'axios'
import { createLogger } from '@/utils/logger'

const logger = createLogger('client-request')

const TOKEN_KEY = 'linkdo_admin_token'

function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY) || null
  } catch {
    return null
  }
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

const instance = axios.create({
  baseURL: '/api/v1',
  timeout: 50000,
})

instance.interceptors.request.use(
  (config) => {
    const token = getToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error: AxiosError) => {
    logger.error('Request error', error)
    return Promise.reject(error)
  }
)

instance.interceptors.response.use(
  (res) => {
    const payload = res.data as ApiResponse<unknown>
    if (payload && payload.success === false) {
      logger.error('API Error', payload.error)
    }
    return res
  },
  (error: AxiosError<ApiResponse<unknown>>) => {
    if (error.response?.data?.error) {
      logger.error('API Error', error.response.data.error)
    }
    return Promise.reject(error)
  }
)

export function request<T>(
  config: AxiosRequestConfig<unknown>
): Promise<ApiResponse<T>> {
  return instance.request<ApiResponse<T>>(config).then((res) => res.data)
}

export { getToken }
