import axios from 'axios'
import { store } from '../redux/store'
import { clearSession, updateTokens } from '../redux/slices/authSlice'
import { readPayload } from './response'

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/web',
  headers: {
    'Content-Type': 'application/json',
  },
})

let refreshPromise = null

axiosClient.interceptors.request.use((config) => {
  const token = store.getState().auth.accessToken
  if (token && !config.skipAuth) config.headers.Authorization = `Bearer ${token}`
  return config
})

axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const request = error.config
    if (error.response?.status !== 401 || !request || request.skipAuth || request.retried) {
      return Promise.reject(error)
    }

    const session = store.getState().auth
    if (!session.refreshToken) {
      store.dispatch(clearSession())
      return Promise.reject(error)
    }

    request.retried = true
    // A late 401 may arrive after another request has already rotated the token.
    if (request.headers?.Authorization !== `Bearer ${session.accessToken}`) {
      request.headers.Authorization = `Bearer ${session.accessToken}`
      return axiosClient(request)
    }

    if (!refreshPromise) {
      const refreshToken = session.refreshToken
      refreshPromise = axiosClient.post('/auth/refresh', { refreshToken }, { skipAuth: true })
        .then((response) => {
          const data = readPayload(response)
          if (!data.accessToken || !data.refreshToken) throw new Error('Phản hồi làm mới phiên không hợp lệ.')
          // A later login/logout must not be overwritten by an old refresh response.
          if (store.getState().auth.refreshToken !== refreshToken) throw new Error('Phiên đã thay đổi.')
          store.dispatch(updateTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken }))
          return data.accessToken
        })
        .catch((refreshError) => {
          if (store.getState().auth.refreshToken === refreshToken) store.dispatch(clearSession())
          throw refreshError
        })
        .finally(() => { refreshPromise = null })
    }

    try {
      request.headers.Authorization = `Bearer ${await refreshPromise}`
      return axiosClient(request)
    } catch (refreshError) {
      return Promise.reject(refreshError)
    }
  },
)

export default axiosClient
