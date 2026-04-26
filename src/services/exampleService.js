import axiosClient from '../api/axiosClient'

/**
 * Gọi API mẫu — đổi path theo controller trong Project.Api (vd. /api/rooms).
 */
export async function fetchExample() {
  const { data } = await axiosClient.get('/example')
  return data
}
