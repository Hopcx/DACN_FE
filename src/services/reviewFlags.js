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

/** Danh sách câu hiển thị ở xem lại: kèm số thứ tự gốc; onlyFlagged → chỉ câu đã đánh dấu. */
export function visibleQuestions(questions, flags, onlyFlagged) {
  const numbered = (questions || []).map((question, index) => ({ question, number: index + 1 }))
  return onlyFlagged ? numbered.filter((item) => flags.has(item.question.id)) : numbered
}

/** Tập đánh dấu từ server + các ý định người dùng chưa được server xác nhận (true = đánh dấu, false = bỏ). */
export function applyIntents(serverIds, intents) {
  const next = new Set(serverIds || [])
  for (const [questionId, flagged] of intents || []) {
    if (flagged) next.add(questionId); else next.delete(questionId)
  }
  return next
}
