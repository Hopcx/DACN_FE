// To-be T16: hàm thuần cho câu điền ngắn (loại 4) — khớp quy tắc BE ShortAnswerMatcher (QT16-3). Server vẫn kiểm lại.

export const SHORT_ANSWER_TYPE = 4
export const MAX_TEXT = 200
export const MAX_ACCEPTED = 10
export const MAX_TOLERANCE = 1_000_000_000

export const isShortAnswer = (question) => Number(question?.questionTypeId) === SHORT_ANSWER_TYPE

// NFC, trim, gộp khoảng trắng, chữ thường; tùy chọn bỏ dấu tiếng Việt (đ = d)
export function normalizeShortAnswer(text, ignoreDiacritics = false) {
  if (text == null) return ''
  let value = String(text).normalize('NFC').trim().replace(/\s+/gu, ' ').toLowerCase()
  if (!value) return ''
  if (ignoreDiacritics) value = value.replace(/đ/gu, 'd').normalize('NFD').replace(/\p{Mn}/gu, '').normalize('NFC')
  return value
}

/** Lỗi của bộ đáp án chấp nhận trong trình soạn (null = hợp lệ). */
export function shortAnswerProblem({ answers = [], shortAnswerIgnoreDiacritics, shortAnswerNumeric, shortAnswerTolerance } = {}) {
  const items = answers.map((x) => (x?.content ?? '').trim())
  if (items.length < 1 || items.length > MAX_ACCEPTED || items.some((x) => !x || x.length > MAX_TEXT))
    return `Câu điền ngắn cần 1–${MAX_ACCEPTED} đáp án chấp nhận, mỗi đáp án 1–${MAX_TEXT} ký tự.`
  const keys = items.map((x) => normalizeShortAnswer(x, Boolean(shortAnswerIgnoreDiacritics)))
  if (new Set(keys).size !== keys.length)
    return 'Đáp án chấp nhận bị trùng sau khi chuẩn hóa (hoa/thường, khoảng trắng' + (shortAnswerIgnoreDiacritics ? ', dấu' : '') + ').'
  if (shortAnswerNumeric && shortAnswerTolerance != null) {
    const t = Number(shortAnswerTolerance)
    if (!Number.isFinite(t) || t < 0 || t > MAX_TOLERANCE || Math.round(t * 1e6) / 1e6 !== t)
      return 'Sai số phải từ 0 đến 1.000.000.000, tối đa 6 chữ số thập phân.'
  }
  return null
}

/** Phần thân gửi API cho tùy chọn điền ngắn; loại khác gửi null. */
export function shortAnswerFields(values = {}) {
  if (Number(values.questionTypeId) !== SHORT_ANSWER_TYPE)
    return { shortAnswerIgnoreDiacritics: null, shortAnswerNumeric: null, shortAnswerTolerance: null }
  const numeric = Boolean(values.shortAnswerNumeric)
  return {
    shortAnswerIgnoreDiacritics: Boolean(values.shortAnswerIgnoreDiacritics),
    shortAnswerNumeric: numeric,
    shortAnswerTolerance: numeric ? Number(values.shortAnswerTolerance ?? 0) : null,
  }
}

/** Mô tả quy tắc chấm cho người soạn/xem lại. */
export function shortAnswerRuleText(question = {}) {
  const parts = ['không phân biệt hoa/thường, khoảng trắng thừa']
  if (question.shortAnswerIgnoreDiacritics) parts.push('bỏ qua dấu')
  if (question.shortAnswerNumeric) {
    const t = Number(question.shortAnswerTolerance ?? 0)
    // Review T16: "1.000" được hiểu là 1 (không có dấu phân cách nghìn) — báo rõ cho người soạn
    parts.push(`so số (dấu thập phân “,” hoặc “.”, không dùng dấu phân cách nghìn${t > 0 ? `; sai số ±${String(t).replace('.', ',')}` : ''})`)
  }
  return parts.join('; ')
}

/** Giá trị nháp của một câu: câu điền ngắn là chuỗi (text), loại khác là mảng Id đáp án. */
export const draftValue = (answer) => (typeof answer?.text === 'string' ? answer.text : answer?.selectedAnswerIds || [])

/** Có trả lời chưa: chuỗi khác rỗng (sau trim) hoặc mảng có phần tử. */
export const hasAnswer = (value) => (typeof value === 'string' ? value.trim().length > 0 : Array.isArray(value) && value.length > 0)

/** Câu trả lời gửi API: loại 4 gửi text (rỗng → không gửi), selectedAnswerIds luôn rỗng; loại khác gửi Id đáp án. */
export function answerPayload(question, value) {
  if (isShortAnswer(question)) {
    const text = typeof value === 'string' ? value.trim().slice(0, MAX_TEXT) : ''
    return text ? { questionId: question.id, selectedAnswerIds: [], text } : { questionId: question.id, selectedAnswerIds: [] }
  }
  return { questionId: question.id, selectedAnswerIds: Array.isArray(value) ? value : [] }
}

/**
 * Review T16: đổi loại câu trong trình soạn mà không làm mất nội dung đáp án đã nhập.
 * Sang loại 4: giữ các đáp án có nội dung làm đáp án chấp nhận (tối đa 10). Từ loại 4 sang 2/3: giữ nội dung, bỏ đánh dấu đúng,
 * bù cho đủ 2 dòng. Trả null khi không cần đổi (loại 1 do trang tự đặt Đúng/Sai).
 */
export function answersForTypeChange(answers = [], fromType, toType) {
  const from = Number(fromType); const to = Number(toType)
  // Đúng/Sai (loại 1) là đáp án cố định, không mang sang
  const filled = from === 1 ? [] : (answers || []).filter((x) => (x?.content ?? '').trim()).map((x) => x.content)
  if (to === SHORT_ANSWER_TYPE && from !== SHORT_ANSWER_TYPE)
    return filled.length ? filled.slice(0, MAX_ACCEPTED).map((content) => ({ content, isCorrect: true })) : [{ content: '', isCorrect: true }]
  if (from === SHORT_ANSWER_TYPE && (to === 2 || to === 3)) {
    const kept = filled.map((content) => ({ content, isCorrect: false }))
    while (kept.length < 2) kept.push({ content: '', isCorrect: false })
    return kept
  }
  return null
}
