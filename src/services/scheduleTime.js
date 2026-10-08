const vietnamTime = new Intl.DateTimeFormat('vi-VN', {
  timeZone: 'Asia/Ho_Chi_Minh', dateStyle: 'short', timeStyle: 'short', hourCycle: 'h23',
})

export function formatScheduleTime(value, timeZoneStatus) {
  if (!value) return '—'
  // Existing SQL datetime2 values have no offset. Their original zone must be
  // verified before displaying them as Vietnam time.
  if (timeZoneStatus === 'unknown' || !/(Z|[+-]\d{2}:\d{2})$/i.test(value))
    return `${value.replace('T', ' ')} (chưa rõ múi giờ)`
  const instant = new Date(value)
  return Number.isNaN(instant.getTime()) ? value : vietnamTime.format(instant)
}

const vietnamParts = new Intl.DateTimeFormat('en-US', {
  timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
})

function partsOf(date) {
  return Object.fromEntries(vietnamParts.formatToParts(date)
    .filter((part) => part.type !== 'literal').map((part) => [part.type, part.value]))
}

export function toVietnamInput(value) {
  if (!/(Z|[+-]\d{2}:\d{2})$/i.test(value || '')) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const parts = partsOf(date)
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`
}

export function vietnamInputToUtc(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value || '')
  if (!match) throw new Error('Thời gian phải theo định dạng ngày giờ Việt Nam.')
  const [, year, month, day, hour, minute] = match.map(Number)
  const wallAsUtc = Date.UTC(year, month - 1, day, hour, minute)
  const approximate = new Date(wallAsUtc)
  const observed = partsOf(approximate)
  const offset = Date.UTC(Number(observed.year), Number(observed.month) - 1,
    Number(observed.day), Number(observed.hour), Number(observed.minute)) - wallAsUtc
  const instant = new Date(wallAsUtc - offset)
  if (toVietnamInput(instant.toISOString()) !== value)
    throw new Error('Ngày giờ Việt Nam không hợp lệ hoặc không tồn tại.')
  return instant.toISOString()
}
