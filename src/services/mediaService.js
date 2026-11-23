import axiosClient from '../api/axiosClient'
import { readPayload } from '../api/response'

// To-be T14: media của câu hỏi (người có quyền câu hỏi). URL trả về là URL ký tạm (10 phút), dùng trực tiếp cho <img>/<audio>.
export async function uploadMedia(file) {
  const data = new FormData()
  data.append('file', file)
  return readPayload(await axiosClient.post('/media', data, { headers: { 'Content-Type': undefined } }))
}
export const getQuestionMedia = async (questionId) => readPayload(await axiosClient.get(`/questions/${questionId}/media`))
export const attachQuestionMedia = async (questionId, mediaId) =>
  readPayload(await axiosClient.post(`/questions/${questionId}/media`, { mediaId }))
export const detachQuestionMedia = async (questionId, mediaId) =>
  readPayload(await axiosClient.delete(`/questions/${questionId}/media/${mediaId}`))
// Gốc API để ghép URL media khi API khác origin (xem resolveMediaUrl)
export const apiBaseURL = () => axiosClient.defaults.baseURL
// To-be T15: media mồ côi (Admin)
export const getOrphanMedia = async (page = 1, pageSize = 20) =>
  readPayload(await axiosClient.get('/admin/media/orphans', { params: { page, pageSize } }))
export const deleteOrphanMedia = async (id) => readPayload(await axiosClient.delete(`/admin/media/${id}`))
