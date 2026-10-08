import axiosClient from '../api/axiosClient'
import { readPayload } from '../api/response'

export const getSchedules = async () => readPayload(await axiosClient.get('/exam-schedules'))
export const getScheduleExamOptions = async () => readPayload(await axiosClient.get('/exam-schedules/exam-options'))
export const getScheduleRoomOptions = async () => readPayload(await axiosClient.get('/exam-schedules/room-options'))
export const getScheduleClassOptions = async () => readPayload(await axiosClient.get('/exam-schedules/class-options'))
export const getScheduleAssignments = async () => readPayload(await axiosClient.get('/class-exam-schedules'))
export const getMySchedules = async () => readPayload(await axiosClient.get('/student/schedules'))
export const createSchedule = async (body) => readPayload(await axiosClient.post('/exam-schedules', body))
export const updateSchedule = async (id, body) => readPayload(await axiosClient.put(`/exam-schedules/${id}`, body))
export const deleteSchedule = async (id) => readPayload(await axiosClient.delete(`/exam-schedules/${id}`))
export const assignScheduleClass = async (examScheduleId, classId) => readPayload(await axiosClient.post('/class-exam-schedules', { examScheduleId, classId }))
export const unassignScheduleClass = async (id) => readPayload(await axiosClient.delete(`/class-exam-schedules/${id}`))
