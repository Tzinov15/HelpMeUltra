import axios, { type AxiosRequestConfig } from 'axios'
import { tokenStore } from '@/auth/tokenStore'

const BASE_URL = 'https://www.strava.com/api/v3'

export const axiosInstance = axios.create({ baseURL: BASE_URL })

axiosInstance.interceptors.request.use(async (config) => {
  const token = await tokenStore.getValidToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Orval custom mutator — this is what orval calls for every generated hook
export const stravaAxiosInstance = <T>(config: AxiosRequestConfig): Promise<T> => {
  return axiosInstance(config).then((res) => res.data)
}
