// To-be T12: hàm thuần cho tab "Phân tích lớp" (không axios để chạy bằng node --test).

const percent = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 1 })
export const formatPercent = (rate) => rate === null || rate === undefined ? '—' : `${percent.format(Number(rate))}%`

// Màu tỉ lệ đúng của chương: dưới ngưỡng "Yếu" → đỏ
export const rateTone = (rate, thresholds) =>
  rate === null || rate === undefined ? 'default' : Number(rate) < (thresholds?.weakBelow ?? 50) ? 'danger' : 'success'

export function scopeText(data) {
  if (!data) return ''
  const parts = [`Chỉ bài thi: ${data.scheduleCount} lịch đã kết thúc và đã công bố kết quả`]
  if (data.notCountedCount > 0) parts.push(`${data.notCountedCount} lịch chưa tính`)
  parts.push(`${data.attemptCount} lượt được tính (lượt cao nhất mỗi lịch)`, `${data.studentCount} học viên có dữ liệu`)
  return `${parts.join('; ')}.`
}

export function reportNotes(data) {
  if (!data) return []
  const notes = []
  if (data.attemptsWithoutOutcomes > 0)
    notes.push(`${data.attemptsWithoutOutcomes} lượt chưa có kết quả từng câu (đang được bù tự động) nên chưa nằm trong báo cáo.`)
  if (data.currentClassificationCount > 0)
    notes.push(`${data.currentClassificationCount} câu trả lời làm trước khi lưu phân loại được tính theo chương hiện tại của ngân hàng câu hỏi.`)
  return notes
}

export function hardEmptyText(data) {
  const t = data?.thresholds
  if (!data || !t) return 'Chưa có dữ liệu'
  if ((data.maxAnswersPerQuestion ?? 0) < t.hardMinAnswers)
    return `Chưa có câu nào đủ ${t.hardMinAnswers} lượt trả lời (nhiều nhất hiện có: ${data.maxAnswersPerQuestion ?? 0}).`
  return `Không có câu nào có tỉ lệ đúng dưới ${t.hardBelow}%.`
}

// To-be T13: tên file từ Content-Disposition (ưu tiên filename*=UTF-8''…); chỉ giữ ký tự an toàn
export function fileNameFromDisposition(header, fallback = 'bao-cao-lop.xlsx') {
  const text = String(header || '')
  const star = /filename\*=UTF-8''([^;]+)/i.exec(text)
  const plain = /filename="?([^";]+)"?/i.exec(text)
  let name = ''
  try { name = star ? decodeURIComponent(star[1]) : plain ? plain[1] : '' } catch { name = plain ? plain[1] : '' }
  name = name.replace(/[\\/:*?"<>|]+/g, '-').trim()
  return name && name.toLowerCase().endsWith('.xlsx') ? name : fallback
}
