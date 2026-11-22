// To-be T10: hàm thuần hiển thị xếp hạng lớp (thang 10, chỉ bài thi).

const scoreFormat = new Intl.NumberFormat('vi-VN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })

export function formatScore(value) {
  if (value === null || value === undefined || value === '') return '—'
  const number = Number(value)
  return Number.isFinite(number) ? scoreFormat.format(number) : '—'
}

const GROUPS = { top: { label: 'Top', tone: 'success' }, bottom: { label: 'Bottom', tone: 'danger' } }
export const groupView = (group) => GROUPS[group] || null

const REASONS = {
  notEnded: 'Chưa kết thúc', unknownTimeZone: 'Chưa rõ múi giờ',
  resultNotReleased: 'Chưa cho xem kết quả', inactive: 'Lịch đã tắt',
}
export const notCountedLabel = (reason) => REASONS[reason] || 'Không tính'

// Dòng hạng cho học viên: chỉ hạng của mình.
export function myRankText(data) {
  if (!data) return ''
  if (data.rankHiddenReason === 'NO_SCORE' || data.total === null || data.total === undefined)
    return 'Bạn chưa có điểm trong các lịch thi được tính.'
  if (data.rank === null || data.rank === undefined)
    return `Lớp chưa đủ ${data.minScoredForRanking ?? 5} học viên có điểm nên chưa hiện hạng (hiện có ${data.scoredCount}).`
  return `Hạng ${data.rank} / ${data.scoredCount} học viên có điểm`
}

export const rankingRule = (data) =>
  `Điểm quy về thang 10; mỗi lịch lấy lượt cao nhất; điểm tổng = trung bình ${data?.schedules?.length ?? 0} lịch đã kết thúc` +
  ' và đã cho xem kết quả (lịch không làm tính 0). Top/Bottom = 20% cao nhất/thấp nhất (làm tròn lên); đồng điểm ở ranh giới vào cùng nhóm.' +
  ' Chỉ tính bài thi, không tính Luyện tập/Thi thử.'

// Review T10: mã lỗi xếp hạng → câu tiếng Việt (không hiện mã thô)
const ERRORS = {
  CLASS_TOO_LARGE: 'Lớp quá lớn để xếp hạng trực tiếp (giới hạn 500 học viên, 200 lịch thi).',
  CLASS_NOT_FOUND: 'Bạn không còn là thành viên đã duyệt của lớp này.',
  EXPORT_TOO_LARGE: 'File báo cáo quá lớn để xuất (giới hạn 10 MB).',
}
export function rankingErrorMessage(failure, fallback) {
  const code = failure?.response?.data?.message
  return ERRORS[code] || fallback
}
