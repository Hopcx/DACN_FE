import axiosClient from '../api/axiosClient'
import { readPayload } from '../api/response'

// To-be T11: phân tích của chính học viên (GET /web/student/analysis)
export const getMyAnalysis = async (params) => readPayload(await axiosClient.get('/student/analysis', { params }))
