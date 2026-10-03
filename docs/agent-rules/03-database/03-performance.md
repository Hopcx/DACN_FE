# DATABASE — index, query, concurrency, Redis và procedure

## FACT — đã có gì

UserConfiguration có unique Email/PhoneNumber/UserName; ClassConfiguration có unique ClassCode; các configuration khác khai báo index FK. Không thấy rowversion hoặc các unique composite cho attempt/membership đề xuất trong configurations đã đọc. Đối chiếu index hiện có trước generate migration để tránh duplicate.

RoomRepository có filter/Count/Skip/Take nhưng thiếu OrderBy; sửa tính ổn định của paging và giới hạn kích thước trước đo performance. Repository thường commit mỗi CRUD.

ProjectHopADO tồn tại và được DI inject, nhưng có constructor bug và các helper ghép SQL string. Helper này không phải bằng chứng đã có stored procedure tối ưu. Chuyển implementation ra Infrastructure, parameterize values/allowlist identifiers; không mở rộng raw SQL trong Domain. Không đặt timeout lớn để thay cho đo query.

## Ưu tiên

Projection DTO, phân trang có sort ổn định, AsNoTracking cho read phù hợp, aggregate trong SQL, tránh N+1. Đo actual execution plan, logical reads, CPU, duration và tốc độ ghi với dữ liệu đại diện. Không tuyên bố giảm tải bao nhiêu khi chưa đo.

## Index candidates — chưa phải script triển khai

| Bảng/nhu cầu | Candidate | Chú ý |
|---|---|---|
| User đăng nhập | Unique normalized username; email theo policy | Source đã có unique UserName, Email, PhoneNumber; xét null và collation trước thay |
| Class tham gia theo mã | Unique ClassCode normalized | Source đã có unique ClassCode |
| ClassUser kiểm membership | Unique(ClassId, UserId); index(UserId, ClassId) nếu query cần | Hai thứ tự không phải lúc nào đều cần |
| ClassExamSchedule | Unique(ClassId, ExamScheduleId) | Dọn duplicate trước tạo |
| ExamDetailQuestion | Unique(ExamDetailId, QuestionId) | Với version mới dùng version ID tương ứng |
| Question filter | (SubjectId, Status, QuestionTypeId, QuestionLevelId) candidate | Chọn thứ tự theo filter/selectivity thực tế; không tạo composite dài mặc định |
| Answer lấy theo câu | QuestionId | Kiểm index FK đã được EF tạo để tránh trùng |
| Submission history | (UserId, ExamScheduleId, SubmitTime, Id) | INCLUDE score nếu plan chứng minh có ích |
| Submission finalize | Unique(AttemptId) | Bắt buộc theo invariant mới |
| Attempt active | Filtered unique(UserId, ExamScheduleId) cho state active | Predicate phải phù hợp enum/state và migration thực tế |
| Draft câu trả lời | Unique(AttemptId, SnapshotQuestionId), child unique(answerId) | Một tập lựa chọn hợp lệ trên mỗi câu |
| Idempotency | Unique(UserId, Operation, Key) | Cùng key nhưng requestHash khác trả conflict |

Index hỗ trợ ràng buộc phải có ngay khi thiết kế đã duyệt; index tối ưu thêm dựa trên query. Không “index mọi cột”. Contains wildcard đầu không được đảm bảo nhanh chỉ bằng B-tree; full-text chỉ cân nhắc sau đo và yêu cầu tìm kiếm rõ.

## Concurrency

Rowversion cho optimistic concurrency trên aggregate thay đổi; trả 409 cho stale update. Rowversion không tự ngăn hai insert trùng: cần unique constraint và transaction. Chống vượt số lượt bằng khóa/serialization trên user-schedule eligibility, không chỉ đếm Submission.

Kiểm tra trùng lịch bằng điều kiện giao khoảng startA < endB && endA > startB theo tài nguyên cần khóa. Uniqueness thông thường không chống overlap; cần serialize cùng phòng/lớp hoặc biện pháp tương đương. Phạm vi tài nguyên cấm trùng cần chủ dự án quyết định.

## Redis: chưa cần trong baseline

Chưa có dữ liệu tải để chứng minh lợi ích. SQL Server lưu draft/attempt, idempotency và refresh sessions. Cân nhắc Redis khi chạy nhiều instance cần shared cache/rate limit hoặc báo cáo đọc lặp đã đo chậm. Phải có TTL, invalidation, key theo quyền/phạm vi, hành vi khi Redis lỗi và memory budget. Không dùng Redis làm kho duy nhất cho bài đang thi hoặc kết quả.

## Stored procedure: chưa dùng mặc định

EF LINQ cho CRUD và phần lớn query. Chỉ thêm procedure khi query báo cáo/import được đo, rewrite/index chưa đủ và có lợi ích kiểm chứng. Procedure đặt version trong migration, parameterized, có test SQL integration và owner. Không đưa một bộ luật chấm điểm thứ hai vào SQL đồng thời với Domain. Raw SQL cũng phải parameterized.
