/** Danh sách bài thi để hiển thị: bỏ bài đã xóa (status 255), lọc theo tên chứa từ khóa
 *  (trim, không phân biệt hoa thường theo 'vi'), lọc theo môn/trạng thái nếu có (so dạng số),
 *  xếp mới nhất trước (id giảm dần). Không sửa mảng đầu vào. */
export function visibleExams(exams, keyword, { subjectId, status } = {}) {
  if (!Array.isArray(exams)) return []
  const needle = String(keyword ?? '').trim().toLocaleLowerCase('vi')
  return exams
    .filter((exam) => exam && exam.status !== 255)
    .filter((exam) => !needle || String(exam.name ?? '').toLocaleLowerCase('vi').includes(needle))
    .filter((exam) => subjectId == null || Number(exam.subjectId) === Number(subjectId))
    .filter((exam) => status == null || Number(exam.status) === Number(status))
    .slice()
    .sort((a, b) => Number(b.id) - Number(a.id))
}
