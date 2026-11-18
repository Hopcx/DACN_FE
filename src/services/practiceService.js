import axiosClient from '../api/axiosClient'
import { readPayload } from '../api/response'

// To-be T5/T6: Luyện tập của học viên (contract 01-http.md mục To-be T5, T6).
const base = '/student/practice'
export const getPracticeOptions = async () => readPayload(await axiosClient.get(`${base}/options`))
export const createPractice = async (body) => readPayload(await axiosClient.post(base, body))
export const getMyPractice = async (page = 1, pageSize = 10) =>
  readPayload(await axiosClient.get(`${base}/mine`, { params: { page, pageSize } }))
export const getPractice = async (id) => readPayload(await axiosClient.get(`${base}/${id}`))
export const savePractice = async (id, revision, answers) =>
  readPayload(await axiosClient.put(`${base}/${id}/answers`, { revision, answers }))
export const checkPracticeQuestion = async (id, questionId, revision, selectedAnswerIds) =>
  readPayload(await axiosClient.post(`${base}/${id}/questions/${questionId}/check`, { revision, selectedAnswerIds }))
export const finishPractice = async (id, revision) => readPayload(await axiosClient.post(`${base}/${id}/finish`, { revision }))
export const getPracticeReview = async (id) => readPayload(await axiosClient.get(`${base}/${id}/review`))
export const retryPractice = async (id) => readPayload(await axiosClient.post(`${base}/${id}/retry`))
export const abandonPractice = async (id) => readPayload(await axiosClient.delete(`${base}/${id}`))
