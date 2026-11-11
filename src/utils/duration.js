const timeFmt = new Intl.DateTimeFormat('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
const dateFmt = new Intl.DateTimeFormat('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', day: '2-digit', month: '2-digit', year: 'numeric' })
const secondsFmt = new Intl.DateTimeFormat('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' })

const hasOffset = (value) => /(Z|[+-]\d{2}:\d{2})$/i.test(value || '')

/** "1 giờ 12 phút", "12 phút", "45 giây". */
export function formatDuration(totalSeconds) {
  const seconds = Math.max(0, Math.floor(totalSeconds || 0))
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  if (hours > 0) return minutes > 0 ? `${hours} giờ ${minutes} phút` : `${hours} giờ`
  if (minutes > 0) return `${minutes} phút`
  return `${seconds % 60} giây`
}

/** Đồng hồ đếm ngược "01:12:30" (hoặc "12:30" khi dưới 1 giờ). */
export function formatClock(totalSeconds) {
  const seconds = Math.max(0, Math.floor(totalSeconds || 0))
  const pad = (value) => String(value).padStart(2, '0')
  const hours = Math.floor(seconds / 3600)
  const rest = `${pad(Math.floor((seconds % 3600) / 60))}:${pad(seconds % 60)}`
  return hours > 0 ? `${pad(hours)}:${rest}` : rest
}

/** "09:00 – 10:30 | 12/04/2025" theo giờ Việt Nam; null khi giá trị chưa rõ múi giờ. */
export function formatVnRange(start, end) {
  if (!hasOffset(start) || !hasOffset(end)) return null
  const from = new Date(start); const to = new Date(end)
  const sameDay = dateFmt.format(from) === dateFmt.format(to)
  return sameDay ? `${timeFmt.format(from)} – ${timeFmt.format(to)} | ${dateFmt.format(from)}`
    : `${timeFmt.format(from)} ${dateFmt.format(from)} – ${timeFmt.format(to)} ${dateFmt.format(to)}`
}

/** "10:30 | 12/04/2025" */
export function formatVnMoment(value) {
  if (!hasOffset(value)) return null
  const date = new Date(value)
  return `${timeFmt.format(date)} | ${dateFmt.format(date)}`
}

/** "09:17:24" giờ Việt Nam. */
export function formatVnSeconds(value) {
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? '' : secondsFmt.format(date)
}
