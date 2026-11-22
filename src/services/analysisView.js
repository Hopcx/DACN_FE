// To-be T11: hàm thuần cho trang Phân tích của học viên (không axios để chạy bằng node --test).

export const LEVELS = {
  weak: { label: 'Yếu', tone: 'danger' },
  needsImprovement: { label: 'Cần cải thiện', tone: 'warning' },
  fair: { label: 'Khá', tone: 'info' },
  good: { label: 'Tốt', tone: 'success' },
  insufficient: { label: 'Chưa đủ dữ liệu', tone: 'default' },
}
export const levelView = (level) => LEVELS[level] || LEVELS.insufficient

const percent = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 1 })
export const formatRate = (rate) => rate === null || rate === undefined ? '—' : `${percent.format(Number(rate))}%`

export function thresholdText(t) {
  if (!t) return ''
  return `Yếu < ${t.weakBelow}%, Cần cải thiện < ${t.improveBelow}%, Khá < ${t.goodFrom}%, Tốt ≥ ${t.goodFrom}%;` +
    ` cần ít nhất ${t.minQuestions} câu mới xếp loại.`
}

// Liên kết "Luyện tập chương/tag này": điền sẵn form Luyện tập (chương/tag ẩn không luyện được → null)
export function practiceLink(subjectId, { chapterId, tagId, hidden } = {}) {
  if (!subjectId || hidden) return null
  const query = new URLSearchParams({ subjectId: String(subjectId) })
  if (chapterId) query.set('chapterId', String(chapterId))
  if (tagId) query.set('tagId', String(tagId))
  return `/student/practice?${query}`
}

// Ghi chú về dữ liệu: phân loại theo ngân hàng hiện tại, câu chưa gán chương, cắt bớt
export function dataNotes(data) {
  if (!data?.totals) return []
  const notes = []
  if (data.currentClassificationCount > 0)
    notes.push(`${data.currentClassificationCount} câu làm trước khi lưu phân loại được tính theo chương/tag hiện tại của ngân hàng câu hỏi.`)
  if (data.unchaptered?.total > 0) notes.push(`${data.unchaptered.total} câu chưa được gán chương (không có trong bảng theo chương).`)
  if (data.truncated) notes.push('Dữ liệu quá nhiều, chỉ tính 20.000 câu gần nhất.')
  return notes
}
