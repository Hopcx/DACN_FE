import axiosClient from '../api/axiosClient'
import { readPayload } from '../api/response'

export const getAttemptReport = async (params) =>
  readPayload(await axiosClient.get('/admin/attempt-reports', { params }))

export const getAttemptReportOptions = async () =>
  readPayload(await axiosClient.get('/admin/attempt-reports/options'))
