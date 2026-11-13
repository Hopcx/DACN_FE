/** Danh sách bài thi để hiển thị: bỏ bài đã xóa (status 255), lọc theo tên chứa từ khóa
 *  (trim, không phân biệt hoa thường theo 'vi'), xếp mới nhất trước (id giảm dần). Không sửa mảng đầu vào. */
export function visibleExams(exams, keyword) {
  if (!Array.isArray(exams)) return []
  const needle = String(keyword ?? '').trim().toLocaleLowerCase('vi')
  return exams
    .filter((exam) => exam && exam.status !== 255)
    .filter((exam) => !needle || String(exam.name ?? '').toLocaleLowerCase('vi').includes(needle))
    .slice()
    .sort((a, b) => Number(b.id) - Number(a.id))
}
