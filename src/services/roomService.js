import axiosClient from '../api/axiosClient'
import { readPayload } from '../api/response'

export async function getRooms(page = 1, pageSize = 10) {
  const data = readPayload(await axiosClient.get('/rooms', { params: { page, pageSize } }))
  if (!Array.isArray(data.items) || !Number.isInteger(data.totalCount)) {
    throw new Error('Danh sách phòng từ máy chủ không hợp lệ.')
  }
  return data
}
