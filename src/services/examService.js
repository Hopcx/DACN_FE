import axiosClient from '../api/axiosClient'
import { readPayload } from '../api/response'

export const getExams = async (params) => readPayload(await axiosClient.get('/exams', { params }))
export const getExamSubjects = async () => readPayload(await axiosClient.get('/exams/subjects'))
export const createExam = async (body) => readPayload(await axiosClient.post('/exams', body))
export const updateExam = async (id, body) => readPayload(await axiosClient.put(`/exams/${id}`, body))
export const getVariants = async (id) => readPayload(await axiosClient.get(`/exams/${id}/variants`))
export const getQuestionOptions = async (id) => readPayload(await axiosClient.get(`/exams/${id}/question-options`))
export const createVariant = async (id, body) => readPayload(await axiosClient.post(`/exams/${id}/variants`, body))
export const updateVariant = async (id, variantId, body) => readPayload(await axiosClient.put(`/exams/${id}/variants/${variantId}`, body))
