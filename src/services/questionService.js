import axiosClient from '../api/axiosClient'
import { readPayload } from '../api/response'

export const getQuestions = async (params) => readPayload(await axiosClient.get('/questions', { params }))
export const createQuestion = async (body) => readPayload(await axiosClient.post('/questions', body))
export const updateQuestion = async (id, body) => readPayload(await axiosClient.put(`/questions/${id}`, body))
export const deleteQuestion = async (id) => readPayload(await axiosClient.delete(`/questions/${id}`))
export const getQuestionTypes = async () => readPayload(await axiosClient.get('/question-types'))
export const getQuestionLevels = async () => readPayload(await axiosClient.get('/question-levels'))
export const getQuestionSubjects = async () => readPayload(await axiosClient.get('/questions/subjects'))
