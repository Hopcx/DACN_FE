# Lộ trình sau đối chiếu source v0.2

Không ước lượng ngày khi chưa có tải/team size/dữ liệu cần giữ. Baseline repo đã hoàn tất đọc source, chưa có runtime verification.

| Giai đoạn | Đầu ra | Điều kiện hoàn tất |
|---|---|---|
| 0. Baseline — đã đọc | BE master 4d5ff309…; FE main 37d5883c…; stack/routes/gaps | Audit và parity theo source, không coi là build passed |
| 1. Sửa blocker | IADO assignment, bảy DI registrations; loại PasswordHash; khóa API/role | Build, DI activation, negative auth tests với data synthetic |
| 2. Nối FE–BE | /web proxy, login/refresh/me, envelope, Bearer; rooms list | Một lát cắt gọi SQL thật trong môi trường test; 401/403/validation rõ |
| 3. Học vụ/identity | User CRUD đầy đủ, permission, môn/lớp/phòng, membership | Quyền theo tài nguyên, uniqueness, filter/paging, form validation |
| 4. Question/exam | Atomic question+answers, Excel, Exam fields thiếu, chọn mã đề | Parity fixtures, pool ngẫu nhiên đúng, snapshot/publish |
| 5. Lịch/thi | Sửa Exam–Schedule relation, gán lịch/lớp, attempt/save/resume | Concurrency, deadline server, không lộ đáp án đúng |
| 6. Nộp/kết quả | Server grading, finalize atomic/idempotent, release/void | Retry/race/timeout, kết quả không đổi theo ngân hàng |
| 7. Report/UI/cutover | Aggregate thật, audit, polish, ETL nếu yêu cầu | UAT parity, backup/restore và quan sát lỗi |

Mỗi feature làm contract → schema/use case → API → FE → acceptance. Giữ .NET8/JSX/Redux baseline, nâng major/TypeScript là task riêng. Không hoàn thiện toàn bộ BE rồi mới kiểm kết nối FE.

Bug legacy phải ghi hành vi cũ → quyết định mới → fixture. Không giữ lỗi scoring để gọi là “giống hệt”; không thay semantics thiếu quyết định.

Nếu migrate dữ liệu cũ: backup, dry-run mapping ID/status/hash/timezone, đối soát, cutover và rollback phù hợp. Không dùng credential trong source để thử kết nối server thật. Nếu database mới, tạo fixture synthetic để test, không điền số dashboard giả thành số liệu production.
