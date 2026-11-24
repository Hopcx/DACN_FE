// To-be T18: hàm thuần cho đoạn dùng chung (không axios để chạy bằng node --test). Server vẫn kiểm lại.

export const MIN_GROUP_QUESTIONS = 2
export const MAX_GROUP_QUESTIONS = 10
export const MAX_TITLE = 200
export const MAX_CONTENT = 8000
export const MAX_PRACTICE_QUESTIONS = 59

/** Lỗi form soạn đoạn (null = hợp lệ); khớp validator BE. */
export function groupFormProblem({ subjectId, title, content, questionIds } = {}) {
  if (!subjectId) return 'Chọn môn học.'
  if (!(title ?? '').trim() || title.trim().length > MAX_TITLE) return `Tiêu đề đoạn cần 1–${MAX_TITLE} ký tự.`
  if (!(content ?? '').trim() || content.trim().length > MAX_CONTENT) return `Nội dung đoạn cần 1–${MAX_CONTENT} ký tự.`
  const ids = questionIds || []
  if (ids.length < MIN_GROUP_QUESTIONS || ids.length > MAX_GROUP_QUESTIONS || new Set(ids).size !== ids.length)
    return `Đoạn cần ${MIN_GROUP_QUESTIONS}–${MAX_GROUP_QUESTIONS} câu hỏi không trùng.`
  return null
}

/** Đổi chỗ phần tử `index` lên (-1) hoặc xuống (+1); ngoài biên thì giữ nguyên. */
export function moveItem(list, index, direction) {
  const to = index + direction
  if (index < 0 || index >= list.length || to < 0 || to >= list.length) return list
  const next = [...list];
  [next[index], next[to]] = [next[to], next[index]]
  return next
}

/** Số thứ tự (1-based) đầu và cuối của các câu thuộc đoạn `groupId` trong danh sách câu (theo thứ tự hiển thị). */
export function groupRange(questions = [], groupId) {
  if (!groupId) return null
  const numbers = questions.map((q, i) => (q.groupId === groupId ? i + 1 : null)).filter((x) => x != null)
  return numbers.length ? { from: numbers[0], to: numbers[numbers.length - 1] } : null
}

export const rangeLabel = (range) => (range ? (range.from === range.to ? `Câu ${range.from}` : `Câu ${range.from}–${range.to}`) : '')

/** Đoạn của một câu (từ danh sách groups của bài làm/phiên). */
export const groupOf = (groups = [], question) => (question?.groupId ? (groups || []).find((g) => g.id === question.groupId) || null : null)

/**
 * Chọn câu cho mã đề (QT18-3): thêm/bỏ một câu con là thêm/bỏ CẢ đoạn.
 * options: [{ id, groupId }]; selected: mảng id; next: lựa chọn mới của người dùng (Select multiple).
 */
export function withWholeGroups(options = [], selected = [], next = []) {
  const groupOfId = new Map(options.map((o) => [o.id, o.groupId ?? null]))
  const members = (groupId) => options.filter((o) => o.groupId === groupId).map((o) => o.id)
  const added = next.filter((id) => !selected.includes(id))
  const removed = selected.filter((id) => !next.includes(id))
  let result = [...next]
  for (const id of removed) {
    const g = groupOfId.get(id)
    if (g) result = result.filter((x) => !members(g).includes(x))
  }
  for (const id of added) {
    const g = groupOfId.get(id)
    if (g) for (const m of members(g)) if (!result.includes(m)) result.push(m)
  }
  return result
}

/** Số câu thực tế có thể vượt yêu cầu khi môn có đoạn dùng chung. */
export const practiceOverflowNote = (count) =>
  `Có thể nhiều hơn ${count} câu (tối đa ${MAX_PRACTICE_QUESTIONS}) vì câu theo đoạn dùng chung luôn đi cùng cả đoạn.`
