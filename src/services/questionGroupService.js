import axiosClient from '../api/axiosClient'
import { readPayload } from '../api/response'

// To-be T18: đoạn dùng chung (contract BE /web/question-groups)
const base = '/question-groups'
export const getQuestionGroups = async (params) => readPayload(await axiosClient.get(base, { params }))
export const getQuestionGroup = async (id) => readPayload(await axiosClient.get(`${base}/${id}`))
export const createQuestionGroup = async (body) => readPayload(await axiosClient.post(base, body))
export const updateQuestionGroup = async (id, body) => readPayload(await axiosClient.put(`${base}/${id}`, body))
export const setQuestionGroupStatus = async (id, status) => readPayload(await axiosClient.put(`${base}/${id}/status`, { status }))
export const deleteQuestionGroup = async (id) => readPayload(await axiosClient.delete(`${base}/${id}`))
export const attachGroupMedia = async (id, mediaId) => readPayload(await axiosClient.post(`${base}/${id}/media`, { mediaId }))
export const detachGroupMedia = async (id, mediaId) => readPayload(await axiosClient.delete(`${base}/${id}/media/${mediaId}`))
