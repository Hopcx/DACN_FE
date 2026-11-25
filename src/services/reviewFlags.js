// To-be T8: hàm thuần cho đánh dấu câu (không axios để chạy bằng node --test).

/** Đọc danh sách đánh dấu cũ trong sessionStorage (trang thi trước T8); hỏng/không có → []. */
export function legacyFlagIds(raw) {
  try {
    const value = JSON.parse(raw || '[]')
    return Array.isArray(value) ? [...new Set(value.filter((x) => typeof x === 'string' && x))] : []
  } catch { return [] }
}

/** Bật/tắt một câu trong tập đánh dấu (trả tập mới, không sửa tập cũ). */
export function toggled(flags, questionId) {
  const next = new Set(flags)
  if (next.has(questionId)) next.delete(questionId); else next.add(questionId)
  return next
}

/**
 * Danh sách câu hiển thị ở xem lại: kèm số thứ tự gốc; onlyFlagged → chỉ câu đã đánh dấu,
 * cộng các câu trong `kept` (vừa bỏ đánh dấu khi đang lọc — T19, nợ L3).
 */
export function visibleQuestions(questions, flags, onlyFlagged, kept) {
  const numbered = (questions || []).map((question, index) => ({ question, number: index + 1 }))
  return onlyFlagged ? numbered.filter((item) => flags.has(item.question.id) || Boolean(kept?.has(item.question.id))) : numbered
}

/**
 * T19 (nợ L3): bỏ đánh dấu câu khi đang lọc "Chỉ câu đã đánh dấu" thì giữ câu đó trong danh sách lọc
 * (không nhảy sang câu khác, không lệch số thứ tự) cho tới khi bật/tắt lại bộ lọc. Trả tập mới, không sửa tập cũ.
 */
export function keptAfterToggle(kept, flags, questionId, filtering) {
  const current = kept || new Set()
  if (!filtering || !flags.has(questionId)) return current
  const next = new Set(current)
  next.add(questionId)
  return next
}

/** Tập đánh dấu từ server + các ý định người dùng chưa được server xác nhận (true = đánh dấu, false = bỏ). */
export function applyIntents(serverIds, intents) {
  const next = new Set(serverIds || [])
  for (const [questionId, flagged] of intents || []) {
    if (flagged) next.add(questionId); else next.delete(questionId)
  }
  return next
}
