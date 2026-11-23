// To-be T3: hàm thuần cho metadata câu hỏi (chương, tag, lời giải). Không import axios để chạy được bằng node --test.
import { shortAnswerFields, SHORT_ANSWER_TYPE } from './shortAnswerView.js'
export const MAX_TAGS = 10
export const EXPLANATION_MAX = 4000
export const HIDDEN = 255

const toId = (value) => (Number.isInteger(Number(value)) && Number(value) > 0 ? Number(value) : null)

export function uniqueTagIds(tagIds) {
  return [...new Set((tagIds || []).map(toId).filter((id) => id != null))]
}

// PUT câu hỏi là thay toàn bộ (contract To-be T2): luôn gửi đủ documentPath, chapterId, explanation, tagIds.
export function questionBody(values, editing = null) {
  const explanation = (values.explanation ?? '').trim()
  return {
    subjectId: values.subjectId,
    questionTypeId: values.questionTypeId,
    questionLevelId: values.questionLevelId ?? null,
    status: values.status ?? 1,
    content: (values.content ?? '').trim(),
    documentPath: editing ? editing.documentPath ?? null : values.documentPath ?? null,
    chapterId: toId(values.chapterId),
    explanation: explanation || null,
    tagIds: uniqueTagIds(values.tagIds),
    // To-be T16: câu điền ngắn — mọi đáp án là đáp án chấp nhận (isCorrect = true) + tùy chọn so khớp
    answers: (values.answers || []).map((x) => ({ content: (x.content ?? '').trim(),
      isCorrect: Number(values.questionTypeId) === SHORT_ANSWER_TYPE || Boolean(x.isCorrect) })),
    ...shortAnswerFields(values),
  }
}

// "Hiện" lại câu đã ẩn: gửi lại toàn bộ câu với status 1. Chương đã ẩn không gắn lại được (BE 400) → bỏ chương.
export function restoreBody(item, chapters = []) {
  const droppedChapter = isHiddenChapter(item.chapterId, chapters)
  const body = questionBody({ ...item, status: 1, chapterId: droppedChapter ? null : item.chapterId }, item)
  return { body, droppedChapter }
}

export function isHiddenChapter(chapterId, chapters = []) {
  if (chapterId == null) return false
  return chapters.find((x) => x.id === chapterId)?.status === HIDDEN
}

export function chapterProblem(chapterId, chapters = []) {
  return isHiddenChapter(chapterId, chapters) ? 'Chương đã bị ẩn, hãy chọn chương khác hoặc bỏ chương.' : null
}

export function tagProblem(tagIds) {
  return uniqueTagIds(tagIds).length > MAX_TAGS ? `Tối đa ${MAX_TAGS} tag mỗi câu hỏi.` : null
}

// Lựa chọn trong Select: chỉ mục chưa ẩn; mục đã ẩn đang được chọn vẫn hiện để giữ tên, gắn nhãn và khóa.
export function metadataOptions(items, selected = []) {
  const keep = new Set((Array.isArray(selected) ? selected : [selected]).filter((x) => x != null))
  return items.filter((x) => x.status !== HIDDEN || keep.has(x.id)).map((x) => ({
    value: x.id,
    label: x.status === HIDDEN ? `${x.name} (đã ẩn)` : x.status === 0 ? `${x.name} (ngừng)` : x.name,
    disabled: x.status !== 1 && !keep.has(x.id),
  }))
}

export function tagSummary(tagIds, tags = [], max = 3) {
  const names = uniqueTagIds(tagIds).map((id) => tags.find((x) => x.id === id)?.name ?? `#${id}`)
  return { shown: names.slice(0, max), more: Math.max(0, names.length - max), all: names }
}

// 409 tạo tag: "Tag đã tồn tại (id X)." → X
export function duplicateTagId(message) {
  const match = /\(id (\d+)\)/.exec(message || '')
  return match ? Number(match[1]) : null
}

export function normalizeTagName(name) {
  return (name ?? '').trim().replace(/\s+/g, ' ')
}

// Khóa so trùng gần giống BE (TagName.Normalize): gộp khoảng trắng, chữ thường, bỏ dấu, đ→d; giữ gạch nối
export function tagKey(name) {
  return normalizeTagName(name).toLowerCase().replace(/đ/g, 'd').normalize('NFD').replace(/[\u0300-\u036f]/g, '').normalize('NFC')
}
