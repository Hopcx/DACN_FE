import { getApiError } from '../api/response.js'

const REVIEW_MESSAGES = {
  ATTEMPT_VOIDED: 'Kết quả của lượt thi này đã bị hủy.',
  ATTEMPT_NOT_FINALIZED: 'Lượt thi chưa kết thúc nên chưa thể xem lại.',
  RESULT_NOT_RELEASED: 'Giảng viên chưa cho phép xem kết quả bài thi này.',
  REVIEW_NOT_RELEASED: 'Đáp án chỉ được mở sau khi lịch thi kết thúc.',
}

/** Thông báo tiếng Việt cho lỗi mở phần xem lại; mã BE: ATTEMPT_VOIDED, ATTEMPT_NOT_FINALIZED, RESULT_NOT_RELEASED, REVIEW_NOT_RELEASED. Mã khác → getApiError(error). */
export function reviewErrorMessage(error) {
  const code = error?.response?.data?.message
  return (typeof code === 'string' && REVIEW_MESSAGES[code]) || getApiError(error)
}

/** "88 phút", "1 phút 5 giây", "45 giây"; null/âm/không phải số → "—". */
export function formatDuration(seconds) {
  if (seconds == null || seconds === '' || typeof seconds === 'boolean') return '—'
  const value = Number(seconds)
  if (!Number.isFinite(value) || value < 0) return '—'
  const total = Math.round(value)
  const minutes = Math.floor(total / 60)
  const rest = total % 60
  if (minutes && rest) return `${minutes} phút ${rest} giây`
  if (minutes) return `${minutes} phút`
  return `${rest} giây`
}

/** Trạng thái từng câu ở bảng số câu xem lại: 'answered' nếu có selectedAnswerIds, ngược lại 'empty'. */
export function reviewQuestionState(question) {
  return Array.isArray(question?.selectedAnswerIds) && question.selectedAnswerIds.length > 0 ? 'answered' : 'empty'
}
