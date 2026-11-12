import { getApiError } from '../api/response.js'

export const XLSX_MAX_BYTES = 2 * 1024 * 1024

export function checkXlsxFile(file) {
  if (!file) return 'Chọn file .xlsx.'
  if (!/\.xlsx$/i.test(file.name || '')) return 'Chỉ nhận file .xlsx.'
  if (!file.size || file.size > XLSX_MAX_BYTES) return 'File .xlsx phải có dung lượng 1 byte đến 2 MB.'
  return ''
}

const CODE_MESSAGES = {
  INVALID_FILTER: 'Bộ lọc không hợp lệ.',
  SUBJECT_NOT_FOUND: 'Không tìm thấy môn học.',
  NO_QUESTIONS: 'Không có câu hỏi nào khớp bộ lọc để xuất.',
  EXPORT_TOO_LARGE: 'Quá 500 câu hỏi hoặc file vượt 2 MB. Hãy lọc thêm theo loại hoặc mức độ.',
}

export function apiCodeMessage(code) {
  return Object.hasOwn(CODE_MESSAGES, code) ? CODE_MESSAGES[code] : null
}

export function excelErrorMessage(error) {
  return apiCodeMessage(error?.response?.data?.message) ?? getApiError(error)
}

export function excelIssues(error) {
  const errors = error?.response?.data?.data?.errors
  return Array.isArray(errors) ? errors : []
}

export function issueRowLabel(row) {
  return row === 0 ? 'Toàn file' : String(row)
}
