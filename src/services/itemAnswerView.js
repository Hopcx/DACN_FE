// To-be T17: hàm thuần cho câu ghép cặp (loại 5) và Đúng/Sai nhiều mệnh đề (loại 6). Server vẫn kiểm lại và chấm.

export const MATCHING_TYPE = 5
export const STATEMENTS_TYPE = 6
export const MIN_ITEMS = 2
export const MAX_ITEMS = 10

export const isMatching = (question) => Number(question?.questionTypeId) === MATCHING_TYPE
export const isStatements = (question) => Number(question?.questionTypeId) === STATEMENTS_TYPE
export const hasItems = (question) => isMatching(question) || isStatements(question)

// Review T17: chữ thường không theo locale (gần OrdinalIgnoreCase của BE)
const key = (text) => (text ?? '').trim().toLowerCase()

/** Lỗi bộ cặp/mệnh đề trong trình soạn (null = hợp lệ); khớp validator BE. */
export function itemsProblem(questionTypeId, answers = []) {
  const type = Number(questionTypeId)
  const name = type === MATCHING_TYPE ? 'cặp' : 'mệnh đề'
  const rows = answers || []
  if (rows.length < MIN_ITEMS || rows.length > MAX_ITEMS || rows.some((x) => !(x?.content ?? '').trim() || x.content.trim().length > 2000))
    return `Cần ${MIN_ITEMS}–${MAX_ITEMS} ${name}, mỗi ${name} có nội dung từ 1 đến 2000 ký tự.`
  if (new Set(rows.map((x) => key(x.content))).size !== rows.length)
    return type === MATCHING_TYPE ? 'Vế trái của các cặp không được trùng.' : 'Nội dung mệnh đề không được trùng.'
  if (type !== MATCHING_TYPE) return null
  if (rows.some((x) => !(x?.matchContent ?? '').trim() || x.matchContent.trim().length > 2000))
    return 'Mỗi cặp cần vế phải từ 1 đến 2000 ký tự.'
  if (new Set(rows.map((x) => key(x.matchContent))).size !== rows.length) return 'Vế phải của các cặp không được trùng.'
  return null
}

/** Nháp của câu loại 5/6: object { optionId: matchId (loại 5) | true/false (loại 6) }. */
export const itemsToMap = (items = []) => Object.fromEntries((items || []).map((x) => [x.optionId, x.matchId ?? x.value]))

/** Map → Items gửi API (bỏ mục chưa chọn). */
export function mapToItems(question, value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return []
  const ids = new Set((question?.options || []).map((x) => x.id))
  return Object.entries(value).filter(([id, v]) => ids.has(id) && v !== undefined && v !== null && v !== '')
    .map(([optionId, v]) => (isMatching(question) ? { optionId, matchId: v } : { optionId, value: Boolean(v) }))
}

/** Chọn vế phải cho một vế trái: vế phải đó bị bỏ khỏi vế trái khác (mỗi vế phải dùng một lần). */
export function chooseMatch(value, optionId, matchId) {
  const next = { ...(value && typeof value === 'object' && !Array.isArray(value) ? value : {}) }
  for (const [id, v] of Object.entries(next)) if (v === matchId && id !== optionId) delete next[id]
  if (matchId == null || matchId === '') delete next[optionId]; else next[optionId] = matchId
  return next
}

export const answeredItems = (value) => (value && typeof value === 'object' && !Array.isArray(value) ? Object.keys(value).length : 0)

/** Dòng xem lại: mỗi vế trái/mệnh đề kèm câu trả lời, đáp án đúng, đúng/sai. */
export function reviewRows(question, items = [], correctItems = []) {
  const mine = itemsToMap(items)
  const right = itemsToMap(correctItems)
  const matchText = Object.fromEntries((question?.matches || []).map((x) => [x.id, x.content]))
  const label = (v) => (isMatching(question) ? (v == null ? null : matchText[v] ?? '?') : v == null ? null : v ? 'Đúng' : 'Sai')
  return (question?.options || []).map((option) => {
    const given = mine[option.id]; const expected = right[option.id]
    return { id: option.id, content: option.content, given: label(given), expected: label(expected),
      correct: given !== undefined && given !== null && given === expected }
  })
}
