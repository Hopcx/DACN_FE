import axiosClient from '../api/axiosClient'
import { readPayload } from '../api/response'
import { store } from '../redux/store'
import { clearSession, setSession, setUser } from '../redux/slices/authSlice'

export async function login(keyword, password) {
  const data = readPayload(await axiosClient.post('/auth/login', { keyword, password }, { skipAuth: true }))
  if (!data.accessToken || !data.userId) {
    throw new Error('Phản hồi đăng nhập thiếu dữ liệu phiên.')
  }
  store.dispatch(setSession({
    accessToken: data.accessToken,
    user: { userId: data.userId, userName: data.userName, permissionIds: data.permissionIds || [] },
  }))
  try {
    const me = readPayload(await axiosClient.get('/auth/me'))
    if (!me.userId || String(me.userId).toLowerCase() !== String(data.userId).toLowerCase()) {
      throw new Error('Thông tin phiên không khớp.')
    }
    store.dispatch(setUser(me))
    return me
  } catch (error) {
    store.dispatch(clearSession())
    throw error
  }
}

export async function logout() {
  if (store.getState().auth.accessToken) await axiosClient.post('/auth/logout')
  store.dispatch(clearSession())
}

export async function resumeSession() {
  const current = store.getState().auth
  if (current.accessToken && current.user) return current.user
  const data = readPayload(await axiosClient.post('/auth/refresh', {}, { skipAuth: true }))
  if (!data.accessToken || !data.userId) throw new Error('Phiên không hợp lệ.')
  try {
    const me = readPayload(await axiosClient.get('/auth/me', {
      skipAuth: true, headers: { Authorization: `Bearer ${data.accessToken}` },
    }))
    if (String(me.userId).toLowerCase() !== String(data.userId).toLowerCase())
      throw new Error('Thông tin phiên không khớp.')
    store.dispatch(setSession({ accessToken: data.accessToken, user: me }))
    return me
  } catch (error) {
    store.dispatch(clearSession())
    throw error
  }
}

export async function registerStudent(payload) {
  return readPayload(await axiosClient.post('/auth/register', payload, { skipAuth: true }))
}

export async function verifyEmail(token) {
  return readPayload(await axiosClient.post('/auth/verify-email', { token }, { skipAuth: true }))
}

export async function resendVerification(email) {
  return readPayload(await axiosClient.post('/auth/resend-verification', { email }, { skipAuth: true }))
}
