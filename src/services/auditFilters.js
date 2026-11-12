import { vietnamInputToUtc } from './scheduleTime.js'

export const GUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const EMPTY_GUID = '00000000-0000-0000-0000-000000000000'
const LOCAL_DATETIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/

const isEmpty = (value) => value === undefined || value === null || value === ''

function keyword(value) {
  if (isEmpty(value)) return undefined
  const text = String(value).trim()
  if (!text) return undefined
  if (text.length > 100) throw new Error('Từ khóa tối đa 100 ký tự.')
  return text
}

function guid(value) {
  if (isEmpty(value)) return undefined
  const text = String(value).trim()
  if (!GUID_PATTERN.test(text) || text.toLowerCase() === EMPTY_GUID) throw new Error('Mã người dùng không hợp lệ.')
  return text
}

function positiveInt(value) {
  if (isEmpty(value)) return undefined
  if (!Number.isInteger(value) || value <= 0) throw new Error('Bộ lọc không hợp lệ.')
  return value
}

function ordered(from, to) {
  if (from !== undefined && to !== undefined && from > to) throw new Error('Thời điểm bắt đầu phải trước thời điểm kết thúc.')
}

function compact(query) {
  return Object.fromEntries(Object.entries(query).filter(([, value]) => value !== undefined))
}

export function buildLogQuery({ page, pageSize, search, action, actorUserId, from, to }) {
  const fromUtc = isEmpty(from) ? undefined : vietnamInputToUtc(from)
  const toUtc = isEmpty(to) ? undefined : vietnamInputToUtc(to)
  ordered(fromUtc, toUtc)
  return compact({
    page, pageSize, search: keyword(search), action: keyword(action),
    actorUserId: guid(actorUserId), fromUtc, toUtc,
  })
}

function activityTime(value) {
  if (isEmpty(value)) return undefined
  if (!LOCAL_DATETIME.test(value)) throw new Error('Thời gian phải theo định dạng ngày giờ.')
  return `${value}:00`
}

export function buildActivityQuery({ page, pageSize, userId, examId, examScheduleId, actionType, from, to }) {
  // ActionTime chưa rõ múi giờ nên gửi nguyên, không đổi sang UTC.
  const fromValue = activityTime(from)
  const toValue = activityTime(to)
  ordered(fromValue, toValue)
  return compact({
    page, pageSize, userId: guid(userId), examId: positiveInt(examId),
    examScheduleId: positiveInt(examScheduleId), actionType: keyword(actionType), from: fromValue, to: toValue,
  })
}
