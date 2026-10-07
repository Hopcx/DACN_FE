import axiosClient from '../api/axiosClient'
import { readPayload } from '../api/response'

export const getSchedules = async () => readPayload(await axiosClient.get('/exam-schedules'))
export const getScheduleClassOptions = async () => readPayload(await axiosClient.get('/exam-schedules/class-options'))
export const getScheduleAssignments = async () => readPayload(await axiosClient.get('/class-exam-schedules'))
export const getMySchedules = async () => readPayload(await axiosClient.get('/student/schedules'))
