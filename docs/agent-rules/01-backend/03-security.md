# BE — identity và authorization

## FACT — hiện trạng BE đã đọc

AuthController: POST /web/auth/login, POST /web/auth/refresh và GET /web/auth/me. Password được UserService BCrypt.HashPassword và UserRepository BCrypt.Verify. JWT kiểm signature/issuer/audience/lifetime, có level_id và permission claims. Refresh đang trả trong JSON/lưu nguyên token trong DB, không có Set-Cookie; chưa thấy logout/token-family hoặc xử lý race rotate đầy đủ.

Chỉ RoomController có ScheduleManagement và auth/me có Authorize trong controllers hiện tại; chưa có FallbackPolicy. UserResponseDto chứa PasswordHash; public user create nhận LevelId. Phải bảo vệ các đường đi này, không xem policy definitions là đã bảo vệ mọi endpoint.

Các phần còn lại là đích hardening, cần thay đổi BE+FE phối hợp. FE chưa gọi auth nên không được nói cookie/session flow đã hoạt động.

Thiết kế mục tiêu phải giữ tương thích hoặc ghi rõ đổi contract auth hiện tại. Các role cũ có bằng chứng: Admin=1, Examiner=2 (enum Web viết Exemer), Teacher=3, Student=4; đây không phải permission matrix đầy đủ.

## Authentication

- POST login body qua HTTPS; không gửi mật khẩu hoặc hash thay mật khẩu trong query string.
- Server hash bằng cơ chế phù hợp của thư viện identity/password hasher được chọn. Không so sánh hash bằng ToUpper, không coi hash cũ là password mới.
- Nếu migrate account: xác minh thuật toán hash cũ và cơ chế reset/rehash. Chưa biết thuật toán thì đánh dấu cần reset, không tự suy luận từ độ dài chuỗi.
- Access token ngắn hạn trong bộ nhớ FE; refresh token ngẫu nhiên lưu HttpOnly+Secure cookie và chỉ lưu hash token ở DB. Access token được kiểm issuer/audience/signature/lifetime.
- Rotate refresh token nguyên tử; phát hiện dùng lại token đã rotate và thu hồi token family. Có rate limit login/refresh và cơ chế khóa phù hợp; tham số phải được cấu hình, không tự chốt con số sản phẩm.
- Logout thu hồi refresh session; access token còn hiệu lực đến expiry trừ khi có kiểm tra session/revocation. Nếu cần thu hồi ngay, kiểm session trạng thái tại API và ghi rõ chi phí.

## Cookie và origin

Production cùng origin là baseline. Refresh/logout dùng POST, kiểm tra Origin cùng anti-CSRF token; SameSite phù hợp deployment. Nếu cross-site buộc SameSite=None thì Secure và chống CSRF vẫn bắt buộc. Không bật AllowAnyOrigin cùng AllowCredentials.

## Authorization

Áp dụng policy mặc định yêu cầu đăng nhập; AllowAnonymous chỉ cho endpoint công khai đã thống nhất. Kiểm tra role/permission và resource ownership trong use case.

| Hành vi | Ràng buộc bắt buộc; quyền cụ thể còn cần chốt |
|---|---|
| Student bắt đầu/nộp/xem bài | Identity của chính mình, thuộc lịch/lớp hợp lệ; không nhận UserId làm quyền |
| Teacher sửa câu hỏi/lớp | Phạm vi môn/lớp được giao; không suy ra quyền chỉ từ role |
| Examiner lập đề/lịch | Có permission tương ứng và phạm vi tài nguyên |
| Admin quản lý user/permission | Policy đặc quyền; audit thay đổi; không mass assignment LevelId |
| Xem đáp án đúng/export đáp án | Policy riêng; không đi chung student DTO |

Kiểm tra quyền cả endpoint danh sách, đọc chi tiết, tải file, báo cáo và export. Test đổi ID tài nguyên của người khác phải bị từ chối.

## Nội dung và file

Render text thuần mặc định; rich text phải sanitize theo allowlist cả lúc lưu và render. Upload kiểm giới hạn kích thước, kiểu file thực, tên do server sinh và quyền download. Không chạy macro/formula upload; export nội dung người dùng không được trở thành công thức Excel ngoài ý muốn.

Không copy secrets trong snapshot. Dùng config ngoài source và secret redaction; không bật EF sensitive-data logging trên production.
