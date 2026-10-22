import axiosClient from '../api/axiosClient'
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
