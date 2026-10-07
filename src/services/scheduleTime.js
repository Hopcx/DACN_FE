const vietnamTime = new Intl.DateTimeFormat('vi-VN', {
  timeZone: 'Asia/Ho_Chi_Minh', dateStyle: 'short', timeStyle: 'short', hourCycle: 'h23',
})

export function formatScheduleTime(value) {
  if (!value) return '—'
  // Existing SQL datetime2 values have no offset. Their original zone must be
  // verified before displaying them as Vietnam time.
  if (!/(Z|[+-]\d{2}:\d{2})$/i.test(value))
    return `${value.replace('T', ' ')} (chưa rõ múi giờ)`
  const instant = new Date(value)
  return Number.isNaN(instant.getTime()) ? value : vietnamTime.format(instant)
}
