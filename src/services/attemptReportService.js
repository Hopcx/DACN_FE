import axiosClient from '../api/axiosClient'
import { readPayload } from '../api/response'

export const getAttemptReport = async (params) =>
  readPayload(await axiosClient.get('/admin/attempt-reports', { params }))

export const getAttemptReportOptions = async () =>
  readPayload(await axiosClient.get('/admin/attempt-reports/options'))

export const getLegacySubmissionReport = async (params) =>
  readPayload(await axiosClient.get('/admin/legacy-submission-reports', { params }))

export const voidAttempt = async (id, reason) =>
  readPayload(await axiosClient.post(`/admin/attempts/${id}/void`, { reason }))
