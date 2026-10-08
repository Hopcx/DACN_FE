export const canChangeSchedule = (item) =>
  item?.hasAttempts === false && item?.timeZoneStatus === 'utc'

export function scheduleChangeReason(item) {
  if (item?.hasAttempts) return 'Lịch đã có lượt thi hoặc bài nộp; hãy tạo lịch mới.'
  if (item?.timeZoneStatus !== 'utc') return 'Lịch cũ chưa xác định múi giờ; hãy tạo lịch mới.'
  return ''
}
