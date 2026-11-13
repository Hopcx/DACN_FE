/** Trang hợp lệ khi tổng số dòng thay đổi (vd vừa xóa dòng cuối của trang cuối). Luôn ≥ 1. */
export function clampPage(page, pageSize, total) {
  if (!Number.isFinite(pageSize) || pageSize <= 0) return 1
  const safeTotal = Number.isFinite(total) && total > 0 ? total : 0
  const safePage = Number.isFinite(page) && page > 0 ? Math.trunc(page) : 1
  const maxPage = Math.max(1, Math.ceil(safeTotal / pageSize))
  return Math.min(Math.max(1, safePage), maxPage)
}

/** STT của dòng thứ `index` (0-based trong trang hiện tại). */
export function rowNumber(page, pageSize, index) {
  return (page - 1) * pageSize + index + 1
}

/** Hàm cho `pagination.showTotal` của antd: (total, range) → "Hiển thị 1–10 của 25 môn học". */
export function showTotalLabel(unit) {
  return (total, range) => Array.isArray(range)
    ? `Hiển thị ${range[0]}–${range[1]} của ${total} ${unit}`
    : `Tổng ${total} ${unit}`
}

/** Tag trạng thái chung: { tone, label } cho StatusTag. */
export function statusView(value) {
  if (value === true || Number(value) === 1) return { tone: 'success', label: 'Đang hoạt động' }
  if (Number(value) === 255) return { tone: 'default', label: 'Đã ẩn' }
  return { tone: 'danger', label: 'Ngừng hoạt động' }
}
