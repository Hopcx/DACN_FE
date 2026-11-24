// To-be T16: hàm thuần cho câu điền ngắn (loại 4) — khớp quy tắc BE ShortAnswerMatcher (QT16-3). Server vẫn kiểm lại.

import { answeredItems, hasItems, itemsToMap, mapToItems, MATCHING_TYPE, MAX_ITEMS, MIN_ITEMS, STATEMENTS_TYPE } from './itemAnswerView.js'
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

/** Giá trị nháp của một câu: điền ngắn là chuỗi (text); ghép cặp/nhiều mệnh đề (T17) là object theo mục; loại khác là mảng Id. */
export const draftValue = (answer) => (typeof answer?.text === 'string' ? answer.text
  : Array.isArray(answer?.items) ? itemsToMap(answer.items) : answer?.selectedAnswerIds || [])

/** Có trả lời chưa: chuỗi khác rỗng (sau trim), mảng có phần tử, hoặc object có ít nhất một mục (T17). */
export const hasAnswer = (value) => (typeof value === 'string' ? value.trim().length > 0
  : Array.isArray(value) ? value.length > 0 : answeredItems(value) > 0)

/** Câu trả lời gửi API: loại 4 gửi text; loại 5–6 gửi items; loại khác gửi Id đáp án. Phần rỗng không gửi. */
export function answerPayload(question, value) {
  if (isShortAnswer(question)) {
    const text = typeof value === 'string' ? value.trim().slice(0, MAX_TEXT) : ''
    return text ? { questionId: question.id, selectedAnswerIds: [], text } : { questionId: question.id, selectedAnswerIds: [] }
  }
  if (hasItems(question)) {
    const items = mapToItems(question, value)
    return items.length ? { questionId: question.id, selectedAnswerIds: [], items } : { questionId: question.id, selectedAnswerIds: [] }
  }
  return { questionId: question.id, selectedAnswerIds: Array.isArray(value) ? value : [] }
}

/**
 * Review T16 (mở rộng T17): đổi loại câu trong trình soạn mà không làm mất nội dung đáp án đã nhập.
 * Sang loại 4: giữ đáp án có nội dung làm đáp án chấp nhận (tối đa 10). Sang loại 5: nội dung thành vế trái (giữ vế phải nếu từ loại 5).
 * Sang loại 6: nội dung thành mệnh đề. Từ loại 4/5/6 sang 2/3: giữ nội dung, bỏ đánh dấu đúng. Bù cho đủ số dòng tối thiểu.
 * Trả null khi không cần đổi (cùng loại, giữa 2 và 3, hoặc sang loại 1 — trang tự đặt Đúng/Sai).
 */
export function answersForTypeChange(answers = [], fromType, toType) {
  const from = Number(fromType); const to = Number(toType)
  if (from === to || to === 1) return null
  // Đúng/Sai (loại 1) là đáp án cố định, không mang sang
  const rows = from === 1 ? [] : (answers || []).filter((x) => (x?.content ?? '').trim())
  const pad = (list, min, blank) => { while (list.length < min) list.push({ ...blank }); return list }
  if (to === SHORT_ANSWER_TYPE)
    return rows.length ? rows.slice(0, MAX_ACCEPTED).map((x) => ({ content: x.content, isCorrect: true })) : [{ content: '', isCorrect: true }]
  if (to === MATCHING_TYPE)
    return pad(rows.slice(0, MAX_ITEMS).map((x) => ({ content: x.content, matchContent: from === MATCHING_TYPE ? x.matchContent ?? '' : '', isCorrect: true })),
      MIN_ITEMS, { content: '', matchContent: '', isCorrect: true })
  if (to === STATEMENTS_TYPE)
    return pad(rows.slice(0, MAX_ITEMS).map((x) => ({ content: x.content, isCorrect: from === STATEMENTS_TYPE ? Boolean(x.isCorrect) : false })),
      MIN_ITEMS, { content: '', isCorrect: false })
  if ((to === 2 || to === 3) && [SHORT_ANSWER_TYPE, MATCHING_TYPE, STATEMENTS_TYPE].includes(from))
    return pad(rows.map((x) => ({ content: x.content, isCorrect: false })), 2, { content: '', isCorrect: false })
  return null
}
