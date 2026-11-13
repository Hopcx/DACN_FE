/** Lớp hiển thị: activeOnly → chỉ status 1; subjectId (số) → chỉ lớp cùng môn. Không sửa mảng gốc, giữ thứ tự API. */
export function visibleClasses(classes, { subjectId, activeOnly = true } = {}) {
  if (!Array.isArray(classes)) return []
  return classes
    .filter(Boolean)
    .filter((item) => !activeOnly || Number(item.status) === 1)
    .filter((item) => subjectId == null || (item.subjectId != null && Number(item.subjectId) === Number(subjectId)))
}

/** Đếm thành viên: approved = status 1, pending = status 2. */
export function memberSummary(members) {
  const summary = { approved: 0, pending: 0 }
  if (!Array.isArray(members)) return summary
  for (const member of members) {
    const status = Number(member?.status)
    if (status === 1) summary.approved += 1
    else if (status === 2) summary.pending += 1
  }
  return summary
}
