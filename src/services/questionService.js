import axiosClient from '../api/axiosClient'
import { readPayload } from '../api/response'
import { downloadFile } from '../api/download'

export const getQuestions = async (params) => readPayload(await axiosClient.get('/questions', { params, paramsSerializer: { indexes: null } }))
// T19 (nợ L7): một trang { page, pageSize, totalCount, items } theo cùng bộ lọc (BE phân trang khi có page)
export const getQuestionsPage = async (params, page, pageSize) =>
  readPayload(await axiosClient.get('/questions', { params: { ...params, page, pageSize }, paramsSerializer: { indexes: null } }))
export const createQuestion = async (body) => readPayload(await axiosClient.post('/questions', body))
export const updateQuestion = async (id, body) => readPayload(await axiosClient.put(`/questions/${id}`, body))
export const deleteQuestion = async (id) => readPayload(await axiosClient.delete(`/questions/${id}`))
export const getQuestionTypes = async () => readPayload(await axiosClient.get('/question-types'))
export const getQuestionLevels = async () => readPayload(await axiosClient.get('/question-levels'))
export const getQuestionSubjects = async () => readPayload(await axiosClient.get('/questions/subjects'))
export const importQuestions = async (file) => {
  const data = new FormData()
  data.append('file', file)
  return readPayload(await axiosClient.post('/questions/import', data, { headers: { 'Content-Type': undefined } }))
}
export const downloadQuestionTemplate = async () => {
  const response = await axiosClient.get('/questions/import/template', { responseType: 'blob' })
  const url = URL.createObjectURL(response.data)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = 'dacn-questions-v1.xlsx'
  anchor.click()
  URL.revokeObjectURL(url)
}
export const exportQuestions = ({ subjectId, questionTypeId, questionLevelId }) => downloadFile('/questions/export', {
  params: Object.fromEntries(Object.entries({ subjectId, questionTypeId, questionLevelId }).filter(([, value]) => value != null)),
  fileName: `dacn-questions-v1-subject-${subjectId}.xlsx`,
})

// To-be T3: chương, tag (contract To-be T2). getQuestions gửi tagIds dạng lặp (tagIds=1&tagIds=2) để ASP.NET bind List<int>.
export const getChapters = async ({ subjectId, includeHidden } = {}) =>
  readPayload(await axiosClient.get('/chapters', { params: { subjectId, includeHidden } }))
export const createChapter = async (body) => readPayload(await axiosClient.post('/chapters', body))
export const updateChapter = async (id, body) => readPayload(await axiosClient.put(`/chapters/${id}`, body))
export const hideChapter = async (id) => readPayload(await axiosClient.delete(`/chapters/${id}`))
export const getTags = async ({ textSearch, includeHidden } = {}) =>
  readPayload(await axiosClient.get('/tags', { params: { textSearch, includeHidden } }))
export const createTag = async (name) => readPayload(await axiosClient.post('/tags', { name }))
