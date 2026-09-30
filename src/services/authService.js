import axiosClient from '../api/axiosClient'
import { readPayload } from '../api/response'
import { store } from '../redux/store'
import { clearSession, setSession, setUser } from '../redux/slices/authSlice'

export async function login(keyword, password) {
  const data = readPayload(await axiosClient.post('/auth/login', { keyword, password }, { skipAuth: true }))
  if (!data.accessToken || !data.refreshToken || !data.userId) {
    throw new Error('Phản hồi đăng nhập thiếu dữ liệu phiên.')
  }
  store.dispatch(setSession({
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
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

export function logout() {
  store.dispatch(clearSession())
}
