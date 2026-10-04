import axiosClient from '../api/axiosClient'
import { readPayload } from '../api/response'

export const getProfile = async () => readPayload(await axiosClient.get('/profile'))
export const updateProfile = async (body) => readPayload(await axiosClient.put('/profile', body))
export const changePassword = async (oldPassword, newPassword) =>
  readPayload(await axiosClient.post('/profile/change-password', { oldPassword, newPassword }))

export const getUsers = async (search) => readPayload(await axiosClient.get('/users/get-all-users', {
  params: search ? { search } : undefined,
}))
export const getUser = async (id) => readPayload(await axiosClient.get(`/users/${encodeURIComponent(id)}`))
export const updateUser = async (id, body) =>
  readPayload(await axiosClient.put(`/users/${encodeURIComponent(id)}`, body))
export const createUser = async (body) => readPayload(await axiosClient.post('/users/create-user', body))
export const deleteUser = async (id) => {
  const response = await axiosClient.delete(`/users/delete-user-${encodeURIComponent(id)}`)
  if (response.data?.success !== true) throw new Error(response.data?.message || 'Không thể xóa tài khoản.')
}
