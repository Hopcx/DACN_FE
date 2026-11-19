import axiosClient from '../api/axiosClient'
import { readPayload } from '../api/response'

// To-be T8: đánh dấu câu lưu ở server (contract 01-http.md mục To-be T8). kind: 'exam' | 'practice'.
export const getReviewFlags = async (sourceKind, sourceId) =>
  readPayload(await axiosClient.get('/review-flags', { params: { sourceKind, sourceId } }))
export const flagQuestion = async (sourceKind, sourceId, questionId) =>
  readPayload(await axiosClient.put('/review-flags', { sourceKind, sourceId, questionId }))
export const unflagQuestion = async (sourceKind, sourceId, questionId) =>
  readPayload(await axiosClient.delete('/review-flags', { params: { sourceKind, sourceId, questionId } }))
