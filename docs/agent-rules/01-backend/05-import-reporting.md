# BE — import/export, báo cáo và audit

## FACT — khoảng trống của BE mới

Controller mới chủ yếu CRUD; chưa thấy endpoint import/export Excel hoặc API phổ điểm tương đương Testify. Manifest BE mới không có EPPlus/SendGrid. Persistence/ViewModels còn các tên ScoreDistribution, ScoreStatistics, Achievenment nhưng file kiểu dữ liệu không chứng minh use case được expose. FE dashboard dùng số cố định.

Các mục dưới đây là yêu cầu chuyển đổi từ nguồn Testify; không gọi endpoint cũ hoặc cài lại package cũ trước khi lựa chọn thư viện/contract.

## Import/export parity

FACT: UserController có template/import/export account; QuestionController có template/import/export câu hỏi theo môn, lựa chọn kèm đáp án. Package cũ EPPlus 7.3.2. Không suy ra mọi định dạng file đang dùng đều hợp lệ chỉ từ controller.

Trước triển khai, lấy workbook mẫu thật, đối chiếu sheet/column/enum và lỗi từng dòng. Kiểm tra điều kiện sử dụng package Excel với bối cảnh sản phẩm trước chọn thư viện. Không tự sao chép LicenseContext trong code cũ như một xác nhận quyền sử dụng.

Baseline import atomic theo batch nhỏ: validate hết trước khi ghi; lỗi trả sheet,row,column,code,message; không lộ stack trace. Giới hạn số dòng/kích thước qua cấu hình. Không giữ transaction trong thời gian upload/parse; kiểm lại uniqueness khi commit. Với import account, không export password/hash và không tạo mật khẩu mặc định chung.

Export dữ liệu đúng phạm vi quyền và filter. Export đáp án yêu cầu policy riêng. Ngăn formula injection cho trường do người dùng nhập, dùng kiểu cell text nếu dữ liệu không phải công thức có chủ ý.

## Báo cáo

Phổ điểm theo exam/class/subject có controller/repository trong source. Chốt cách chọn lượt (lần gần nhất/cao nhất/tất cả), loại bài hủy, câu trả lời chưa nộp, cách tính pass và khoảng điểm trước viết query.

Aggregate/filter tại SQL và trả DTO gọn. Không join qua ClassUsers rồi đếm trùng Submission; xác định hạt dữ liệu một dòng cho một lượt thi trước aggregate. Phân trang lịch sử, sort ổn định gồm ID. Đo query thật trước thêm cache/procedure.

## Audit

Lưu actor từ identity, action, entityId, thời gian UTC, correlationId và dữ liệu thay đổi cần thiết. Không log hash/token/toàn bộ body login. Audit sửa quyền, phát hành đề, phân lịch, hủy bài và export đáp án. Không cho client tự nhận mình là actor khác.

Log kỹ thuật và audit nghiệp vụ khác mục đích; policy retention/ai được đọc còn OPEN. Không mặc định giữ dữ liệu học sinh vĩnh viễn.
