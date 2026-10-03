# FE — validation number, datetime và form

## FACT — validation hiện có và khoảng trống FE

UserCreateDtoValidator: FullName bắt buộc/max100; UserName bắt buộc/min6 và chỉ a-z/A-Z/0-9/_; email hợp lệ; PhoneNumber 10–11 chữ số; Address bắt buộc/max200; Password min6 có hoa/thường/số; LevelId 1..4; Status 0..1. DateOfBirth dùng LessThan(now-13y) và GreaterThan(now-100y), tức strict boundaries, không đúng hoàn toàn với câu chữ “đủ 13 tuổi”. Khi sửa hãy dùng clock và xác định ngày/biên rõ, không sao chép lỗi đó sang FE.

FE RegisterPage chỉ có fullName/email/phone/password, chưa đủ contract create-user (username/address/dateOfBirth/...); endpoint này là quản trị user, không tự coi là public registration. Login cần map emailOrPhone → keyword.

Các rule số/ngày dưới đây là mục tiêu validation chung. Điểm hiện API là number/double; decimal string chỉ áp dụng sau đổi contract, không gửi chuỗi vào DTO hiện tại theo phỏng đoán.

Validation FE phục vụ UX; BE và database vẫn bảo vệ dữ liệu. Mọi giới hạn max cụ thể phải lấy từ contract, không tự đặt 100/1000 nếu chưa có yêu cầu.

## Number

| Dữ liệu | Quy tắc |
|---|---|
| DurationMinutes, questionCount, capacity | Số nguyên dương; không NaN/Infinity, không thập phân |
| attemptLimit | Số nguyên >=1 theo baseline; giá trị “không giới hạn” cần contract riêng |
| questionPoint | Decimal không âm; đề phát hành cần tổng điểm dương |
| PassMark/MaximumMark | 0 <= PassMark <= MaximumMark, MaximumMark > 0 |
| Điện thoại, mã lớp, username | Chuỗi; giữ số 0 đầu; không dùng Number() |
| ID | Đúng định dạng GUID/int theo contract; không dựa coercion truthy/falsy |

Rỗng/null không biến thành 0. Không dùng parseFloat để âm thầm chấp nhận “12abc”. Với locale vi-VN, cho nhập 0,64 khi control hỗ trợ và normalize thành decimal canonical 0.64; chuỗi có separator mơ hồ phải báo lỗi, không replace tùy tiện cả dấu phẩy và chấm. Hiển thị số có số 0 trước dấu thập phân.

Không tính điểm quyết định ở React. Điểm decimal truyền dạng chuỗi canonical theo contract; InputNumber stringMode/adapter nếu phiên bản thư viện hỗ trợ, kiểm tra trước triển khai. Trạng thái đang gõ như “0,” là input draft, chưa phải số hợp lệ để submit.

## Ngày và giờ

| Loại | FE và API |
|---|---|
| Ngày sinh | YYYY-MM-DD; không chuyển qua UTC Date làm lệch ngày |
| Giờ bắt đầu/kết thúc lịch | Người dùng chọn theo timezone hiển thị; gửi ISO 8601 có offset/UTC |
| Deadline và SubmittedAt | Hiển thị giờ server trả; không FE tạo giá trị quyết định |
| Thời lượng | Integer minutes/seconds có tên field thể hiện đơn vị |

Không parse chuỗi dd/MM/yyyy bằng Date constructor. Parse đúng format, reject ngày không tồn tại như 31/02; start < end; validate cả hai field khi một field thay đổi. Date-only không kèm timezone. Timezone hiển thị mặc định đề xuất Asia/Ho_Chi_Minh, cần chủ dự án xác nhận.

## Form và lỗi API

Trim trường text định danh khi contract yêu cầu; không trim/normalize password. Giới hạn độ dài trùng BE/schema. Kiểm uniqueness async chỉ là thông báo sớm; vẫn map 409 server về field. Sau lỗi giữ nội dung người dùng đã nhập và focus lỗi đầu.

Test table gồm: rỗng, 0, âm, 0,64, .64, 12abc, số vượt phạm vi, ngày nhuận, 31/02, lịch end=start, timezone qua nửa đêm. Không test chỉ happy path.
