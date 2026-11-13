import { toVietnamInput } from './scheduleTime.js'

const blank = (value) => value == null || value === ''

/** Ngày Việt Nam "YYYY-MM-DD" của một mốc giờ có hậu tố múi giờ; '' nếu chưa rõ múi giờ hoặc sai định dạng. */
export function vietnamDate(value) {
  return toVietnamInput(value).slice(0, 10)
}

/** Lịch hiển thị theo bộ lọc client. from/to = "YYYY-MM-DD" (bao gồm hai đầu, theo ngày bắt đầu giờ Việt Nam);
 *  examId, classId, status so dạng số; bỏ lịch status 255. Không sửa mảng gốc, giữ thứ tự API. */
export function visibleSchedules(schedules, assignments, { from, to, examId, classId, status } = {}) {
  if (!Array.isArray(schedules)) return []
  const links = Array.isArray(assignments) ? assignments : []
  const byDate = !blank(from) || !blank(to)
  return schedules.filter((item) => {
    if (!item || Number(item.status) === 255) return false
    if (byDate) {
      const day = vietnamDate(item.startTime)
      if (!day || (!blank(from) && day < from) || (!blank(to) && day > to)) return false
    }
    if (!blank(examId) && Number(item.examId) !== Number(examId)) return false
    if (!blank(status) && Number(item.status) !== Number(status)) return false
    if (!blank(classId) && !links.some((link) => link && Number(link.examScheduleId) === Number(item.id)
      && Number(link.classId) === Number(classId))) return false
    return true
  })
}

/** Lớp còn gán được: chưa nằm trong links của lịch, khớp từ khóa (tên hoặc mã, không phân biệt hoa thường 'vi'). */
export function assignableClasses(classes, links, keyword) {
  if (!Array.isArray(classes)) return []
  const taken = new Set((Array.isArray(links) ? links : []).filter(Boolean).map((link) => Number(link.classId)))
  const needle = String(keyword ?? '').trim().toLocaleLowerCase('vi')
  return classes.filter((item) => item && !taken.has(Number(item.id)) && (!needle
    || String(item.name ?? '').toLocaleLowerCase('vi').includes(needle)
    || String(item.classCode ?? '').toLocaleLowerCase('vi').includes(needle)))
}
