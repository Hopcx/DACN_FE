import axiosClient from '../api/axiosClient'
import { readPayload } from '../api/response'

const resource = (path) => ({
  list: async (params) => readPayload(await axiosClient.get(path, { params })),
  get: async (id) => readPayload(await axiosClient.get(`${path}/${encodeURIComponent(id)}`)),
  create: async (body) => readPayload(await axiosClient.post(path, body)),
  update: async (id, body) => readPayload(await axiosClient.put(`${path}/${encodeURIComponent(id)}`, body)),
  remove: async (id) => readPayload(await axiosClient.delete(`${path}/${encodeURIComponent(id)}`)),
})

export const levelsApi = resource('/levels')
export const permissionsApi = resource('/permissions')
export const userPermissionsApi = resource('/user-permissions')
export const subjectsApi = resource('/subjects')
export const roomsApi = resource('/rooms')
