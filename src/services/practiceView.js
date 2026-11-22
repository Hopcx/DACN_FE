// To-be T7: hàm thuần cho giao diện Luyện tập (không axios để chạy bằng node --test).
import { getApiError } from '../api/response.js'

export const MODE_LABELS = { end: 'Cuối phiên', perQuestion: 'Từng câu' }
export const STATE_LABELS = { inProgress: 'Đang làm', finished: 'Đã nộp', expired: 'Hết giờ' }
// To-be T9: loại phiên và thời lượng Thi thử (khớp BE PracticeSnapshotFactory/PracticeTiming)
export const KIND_LABELS = { practice: 'Luyện tập', mock: 'Thi thử' }
export const MIN_DURATION = 5
export const MAX_DURATION = 180
export const DEFAULT_COUNT = 10
export const MAX_COUNT = 50

const MESSAGES = {
  PRACTICE_TOO_MANY_OPEN: 'Bạn đang có 3 phiên chưa nộp. Hãy làm tiếp hoặc bỏ bớt phiên trong lịch sử luyện tập.',
  PRACTICE_SUBJECT_FORBIDDEN: 'Bạn chỉ luyện tập được môn của lớp đã tham gia.',
  PRACTICE_NOT_FOUND: 'Không tìm thấy phiên luyện tập.',
  PRACTICE_QUESTION_NOT_FOUND: 'Câu hỏi không thuộc phiên luyện tập.',
  CONCURRENCY_CONFLICT: 'Bài làm đã thay đổi ở nơi khác (tab hoặc thiết bị khác). Đã tải lại từ máy chủ.',
  PRACTICE_QUESTION_LOCKED: 'Câu đã kiểm tra không đổi được đáp án.',
  PRACTICE_HAS_CHECKED: 'Phiên đã kiểm tra đáp án ít nhất một câu nên không bỏ được, hãy nộp bài.',
  PRACTICE_NOT_FINISHED: 'Phiên chưa nộp bài.',
  PRACTICE_FINISHED: 'Phiên đã nộp bài, không bỏ được.',
  PRACTICE_CLOSED: 'Phiên đã nộp bài.',
  PRACTICE_CHECK_NOT_ALLOWED: 'Phiên này chỉ hiện đáp án sau khi nộp bài.',
  INVALID_SELECTION: 'Lựa chọn không hợp lệ cho câu hỏi.',
  MOCK_ALREADY_OPEN: 'Bạn đang có một bài thi thử chưa nộp. Hãy làm tiếp hoặc bỏ bài đó trong lịch sử.',
  PRACTICE_EXPIRED: 'Đã hết giờ làm bài. Bài được chấm theo đáp án đã lưu.',
}

/** Thông báo tiếng Việt theo mã lỗi của API Luyện tập; mã khác → getApiError. */
export function practiceErrorMessage(error) {
  const body = error?.response?.data
  const code = body?.message
  if (code === 'PRACTICE_NOT_ENOUGH_QUESTIONS') {
    const available = body?.data?.available ?? 0
    return available > 0
      ? `Chỉ có ${available} câu phù hợp với tiêu chí (bạn chọn ${body?.data?.requested ?? '?'} câu). Hãy giảm số câu hoặc nới bộ lọc.`
      : 'Không còn câu hỏi nào phù hợp với tiêu chí.'
  }
  return (typeof code === 'string' && MESSAGES[code]) || getApiError(error)
}

const ids = (values) => [...new Set((values || []).map(Number).filter((x) => Number.isInteger(x) && x > 0))]

/** Body POST tạo phiên từ giá trị form. */
export function buildCreateBody(values) {
  return {
    subjectId: Number(values.subjectId),
    chapterIds: ids(values.chapterIds),
    questionLevelIds: ids(values.questionLevelIds),
    tagIds: ids(values.tagIds),
    questionCount: Number(values.questionCount),
    // Thi thử luôn hiện đáp án sau khi nộp và cần thời lượng
    revealMode: values.kind !== 'mock' && values.revealMode === 'perQuestion' ? 'perQuestion' : 'end',
    kind: values.kind === 'mock' ? 'mock' : 'practice',
    ...(values.kind === 'mock' ? { durationMinutes: Number(values.durationMinutes) } : {}),
  }
}

/** Thời lượng gợi ý: 1,5 phút/câu, làm tròn lên bội 5, trong khoảng 5–180 (khớp BE PracticeTiming.SuggestedMinutes). */
export function suggestedMinutes(questionCount) {
  const minutes = Math.ceil((Number(questionCount) || 0) * 1.5 / 5) * 5
  return Math.min(MAX_DURATION, Math.max(MIN_DURATION, minutes))
}

/** Số giây còn lại theo đồng hồ máy chủ: hạn nộp − giờ máy chủ lúc tải − thời gian đã trôi kể từ lúc tải. */
export function remainingSeconds(deadlineUtc, serverNow, elapsedMs) {
  const deadline = Date.parse(deadlineUtc); const now = Date.parse(serverNow)
  if (Number.isNaN(deadline) || Number.isNaN(now)) return null
  return Math.max(0, Math.ceil((deadline - now - (elapsedMs || 0)) / 1000))
}

/**
 * Cận trên số câu chọn được (để giới hạn ô số câu): mỗi nhóm lọc lấy tổng số câu của mục đã chọn,
 * nhóm không chọn = cả môn; lấy nhỏ nhất và không quá 50. Kết hợp nhiều nhóm có thể ít hơn — máy chủ trả số chính xác khi thiếu.
 */
export function maxSelectable(subject, values = {}) {
  if (!subject) return 0
  const sum = (items, selected) => {
    const chosen = ids(selected)
    return chosen.length ? (items || []).filter((x) => chosen.includes(x.id)).reduce((t, x) => t + x.questionCount, 0) : Infinity
  }
  return Math.min(MAX_COUNT, subject.questionCount, sum(subject.chapters, values.chapterIds),
    sum(subject.levels, values.questionLevelIds), sum(subject.tags, values.tagIds))
}

export const toDraft = (answers = []) => Object.fromEntries(answers.map((x) => [x.questionId, x.selectedAnswerIds]))
export const toPayload = (questions, choices) => questions.map((q) => ({ questionId: q.id, selectedAnswerIds: choices[q.id] || [] }))
export const toCheckedMap = (checked = []) => Object.fromEntries(checked.map((x) => [x.questionId, x]))

/** Trạng thái ô câu trên bảng: right/wrong (đã kiểm tra), answered, empty. */
export function paletteState(questionId, choices, checkedMap) {
  const result = checkedMap?.[questionId]
  if (result) return result.isCorrect ? 'right' : 'wrong'
  return (choices?.[questionId] || []).length > 0 ? 'answered' : 'empty'
}

/** Kết quả "x/y" của một phiên trong lịch sử; chưa nộp → "—". */
export function resultLabel(item) {
  return item?.state === 'finished' && item.correctCount != null ? `${item.correctCount}/${item.questionCount}` : '—'
}

/** Cột *Utc của PracticeSessions là UTC nhưng API trả datetime2 không có hậu tố: thêm 'Z' để định dạng giờ Việt Nam. */
export function asUtc(value) {
  if (!value || typeof value !== 'string') return value
  return /(Z|[+-]\d{2}:\d{2})$/i.test(value) ? value : `${value}Z`
}

// To-be T11: điền sẵn form từ ?subjectId=&chapterId=&tagId= (từ trang Phân tích). Chỉ nhận id có trong options.
export function prefillFromQuery(query, subjects) {
  const id = (name) => { const v = Number(query?.get?.(name)); return Number.isInteger(v) && v > 0 ? v : null }
  const subject = (subjects || []).find((x) => x.id === id('subjectId'))
  if (!subject) return null
  const chapterId = id('chapterId'); const tagId = id('tagId')
  return {
    subjectId: subject.id,
    chapterIds: chapterId && (subject.chapters || []).some((x) => x.id === chapterId) ? [chapterId] : [],
    questionLevelIds: [],
    tagIds: tagId && (subject.tags || []).some((x) => x.id === tagId) ? [tagId] : [],
  }
}
