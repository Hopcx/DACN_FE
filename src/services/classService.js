import axiosClient from '../api/axiosClient'
import { normalizeBlobError, saveBlob } from '../api/blob'
import { fileNameFromDisposition } from './classReport'
import { readPayload } from '../api/response'

export const getClasses = async (textSearch) => readPayload(await axiosClient.get('/classes', {
  params: textSearch ? { textSearch } : undefined,
}))
export const getClassOptions = async () => readPayload(await axiosClient.get('/classes/options'))
export const createClass = async (body) => readPayload(await axiosClient.post('/classes', body))
export const updateClass = async (id, body) => readPayload(await axiosClient.put(`/classes/${id}`, body))
export const deleteClass = async (id) => readPayload(await axiosClient.delete(`/classes/${id}`))
export const getClassMembers = async (classId) => readPayload(await axiosClient.get(`/class-users/by-class/${classId}`))
export const addClassMember = async (classId, userId) => readPayload(await axiosClient.post('/class-users', {
  classId, userId, status: 1,
}))
export const approveClassMember = async (member) => readPayload(await axiosClient.put(`/class-users/${member.id}`, {
  classId: member.classId, userId: member.userId, status: 1,
}))
export const removeClassMember = async (id) => readPayload(await axiosClient.delete(`/class-users/${id}`))
export const getMyClasses = async () => readPayload(await axiosClient.get('/student/classes'))
export const joinClass = async (classCode) => readPayload(await axiosClient.post('/student/classes/join', { classCode }))
export const leaveClass = async (classId) => readPayload(await axiosClient.delete(`/student/classes/${classId}`))
export const getTeacherClasses = async () => readPayload(await axiosClient.get('/teacher/classes'))
export const getTeacherClassMembers = async (classId) => readPayload(await axiosClient.get(`/teacher/classes/${classId}/members`))
export const lookupTeacherStudent = async (classId, email) => readPayload(await axiosClient.get(`/teacher/classes/${classId}/students/lookup`, { params: { email } }))
export const addTeacherClassMember = async (classId, email) => readPayload(await axiosClient.post(`/teacher/classes/${classId}/members`, { email }))
export const approveTeacherClassMember = async (classId, memberId) => readPayload(await axiosClient.post(`/teacher/classes/${classId}/members/${memberId}/approve`))
export const removeTeacherClassMember = async (classId, memberId) => readPayload(await axiosClient.delete(`/teacher/classes/${classId}/members/${memberId}`))
export const getTeacherClassSchedules = async (classId) => readPayload(await axiosClient.get(`/teacher/classes/${classId}/schedules`))
export const getTeacherClassResults = async (classId) => readPayload(await axiosClient.get(`/teacher/classes/${classId}/results`))
export const getTeacherOverview = async (params) => readPayload(await axiosClient.get('/teacher/overview', { params }))
// To-be T10: xếp hạng lớp
export const getTeacherClassRanking = async (classId) => readPayload(await axiosClient.get(`/teacher/classes/${classId}/ranking`))
export const getMyClassRanking = async (classId) => readPayload(await axiosClient.get(`/student/classes/${classId}/ranking`))
// To-be T12: báo cáo lớp (theo chương, câu hay sai)
export const getTeacherClassAnalysis = async (classId) => readPayload(await axiosClient.get(`/teacher/classes/${classId}/analysis`))
// To-be T13: xuất báo cáo lớp (.xlsx); tên file theo Content-Disposition của BE
export async function downloadClassReport(classId, fallbackName) {
  try {
    const response = await axiosClient.get(`/teacher/classes/${classId}/report.xlsx`, { responseType: 'blob' })
    const fileName = fileNameFromDisposition(response.headers?.['content-disposition'], fallbackName)
    saveBlob(response.data, fileName)
    return fileName
  } catch (failure) {
    await normalizeBlobError(failure)
    throw failure
  }
}
