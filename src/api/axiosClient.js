import axios from 'axios'
import { store } from '../redux/store'
import { clearSession, updateTokens } from '../redux/slices/authSlice'
import { readPayload } from './response'

const axiosClient = axios.create({
  baseURL: '/web',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

let refreshPromise = null
let csrfPromise = null
let csrfToken = null

async function ensureCsrfToken() {
  if (csrfToken) return csrfToken
  if (!csrfPromise) {
    csrfPromise = axios.get(`${axiosClient.defaults.baseURL}/auth/csrf`, { withCredentials: true })
      .then((response) => {
        const token = readPayload(response)?.csrfToken
        if (!token) throw new Error('Không thể khởi tạo CSRF token.')
        csrfToken = token
        return token
      }).finally(() => { csrfPromise = null })
  }
  return csrfPromise
}

axiosClient.interceptors.request.use(async (config) => {
  const token = store.getState().auth.accessToken
  if (token && !config.skipAuth) config.headers.Authorization = `Bearer ${token}`
  if (config.method?.toLowerCase() === 'post' && config.url?.startsWith('/auth/')) {
    config.headers['X-CSRF-TOKEN'] = await ensureCsrfToken()
  }
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
    if (!session.accessToken) {
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
      const oldAccessToken = session.accessToken
      refreshPromise = axiosClient.post('/auth/refresh', {}, { skipAuth: true })
        .then((response) => {
          const data = readPayload(response)
          if (!data.accessToken) throw new Error('Phản hồi làm mới phiên không hợp lệ.')
          // A later login/logout must not be overwritten by an old refresh response.
          if (store.getState().auth.accessToken !== oldAccessToken) throw new Error('Phiên đã thay đổi.')
          store.dispatch(updateTokens({ accessToken: data.accessToken }))
          return data.accessToken
        })
        .catch((refreshError) => {
          if (store.getState().auth.accessToken === oldAccessToken) store.dispatch(clearSession())
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
