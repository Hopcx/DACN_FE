import axiosClient from '../api/axiosClient'
import { readPayload } from '../api/response'

export const getProfile = async () => readPayload(await axiosClient.get('/profile'))
export const updateProfile = async (body) => readPayload(await axiosClient.put('/profile', body))
export const changePassword = async (oldPassword, newPassword) =>
  readPayload(await axiosClient.post('/profile/change-password', { oldPassword, newPassword }))

export const getUsers = async () => readPayload(await axiosClient.get('/users/get-all-users'))
export const getUser = async (id) => readPayload(await axiosClient.get(`/users/${encodeURIComponent(id)}`))
export const updateUser = async (id, body) =>
  readPayload(await axiosClient.put(`/users/${encodeURIComponent(id)}`, body))
