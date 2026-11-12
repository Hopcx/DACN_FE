import axiosClient from '../api/axiosClient'
import { readPayload } from '../api/response'

export const getAuditLogs = async (params) => readPayload(await axiosClient.get('/admin/audit/logs', { params }))
export const getExamActivity = async (params) => readPayload(await axiosClient.get('/admin/audit/exam-activity', { params }))
