import axiosClient from '../api/axiosClient'
import { readPayload } from '../api/response'

export const getAttemptReport = async (params) =>
  readPayload(await axiosClient.get('/admin/attempt-reports', { params }))

export const getAttemptReportOptions = async () =>
  readPayload(await axiosClient.get('/admin/attempt-reports/options'))

/** Phổ điểm theo nhóm: groupBy = exam | class | subject; điểm quy thang 10. */
export const getScoreGroups = async (params) =>
  readPayload(await axiosClient.get('/admin/attempt-reports/score-groups', { params }))

/** Số liệu trang Tổng quan quản trị (chỉ lượt DACN mới). */
export const getAdminDashboard = async (params) =>
  readPayload(await axiosClient.get('/admin/dashboard', { params }))

export const getLegacySubmissionReport = async (params) =>
  readPayload(await axiosClient.get('/admin/legacy-submission-reports', { params }))

export const voidAttempt = async (id, reason) =>
  readPayload(await axiosClient.post(`/admin/attempts/${id}/void`, { reason }))
