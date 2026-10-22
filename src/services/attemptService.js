import axiosClient from '../api/axiosClient'
import { readPayload } from '../api/response'

export const startAttempt = async (scheduleId) => readPayload(await axiosClient.post(`/exam-schedules/${scheduleId}/attempts`))
export const getAttempt = async (id) => readPayload(await axiosClient.get(`/attempts/${id}`))
export const getAttemptReview = async (id) => readPayload(await axiosClient.get(`/attempts/${id}/review`))
export const getMyAttemptHistory = async (page = 1, pageSize = 10, state) =>
  readPayload(await axiosClient.get('/attempts/mine', { params: { page, pageSize, state } }))
export const getMyLegacySubmissions = async (page = 1, pageSize = 10) =>
  readPayload(await axiosClient.get('/legacy-submissions/mine', { params: { page, pageSize } }))
export const saveAttempt = async (id, revision, answers) => readPayload(await axiosClient.put(`/attempts/${id}/answers`, { revision, answers }))
export const submitAttempt = async (id, revision) => readPayload(await axiosClient.post(`/attempts/${id}/submit`, { revision }))
export const getVisibilityCount = async (id) => readPayload(await axiosClient.get(`/attempts/${id}/visibility-count`))
export const recordVisibilityHidden = async (id, eventId) => readPayload(await axiosClient.post(`/attempts/${id}/visibility-hidden`, { eventId }))
