# Kiểu dữ liệu dùng chung FE–BE–SQL

## FACT — contract đang có

Exam/Submission/ExamDetailQuestion dùng double (SQL float); DateOfBirth/StartTime/EndTime/SubmitTime là DateTime (SQL datetime2). Submission.TimeTaken là TimeOnly (SQL time), khác TimeSpan ở Testify. UserId GUID, entity ID phần lớn int. MaximmumMark giữ đúng cách viết trong DTO và JSON camelCase maximmumMark; không tự sửa thành maximumMark chỉ ở FE.

## PROPOSED — kiểu mục tiêu cho thay đổi có migration

Bảng sau là hướng cải thiện, không được gửi decimal string/DateOnly/DateTimeOffset vào endpoint hiện tại rồi coi đó là contract sẵn có. Mỗi thay đổi phải cập nhật DTO/JSON adapter/SQL migration/FE đồng thời.

| Ý nghĩa | React/JSON | C# | SQL Server |
|---|---|---|---|
| User/attempt ID đề xuất GUID | string GUID | Guid | uniqueidentifier |
| ID int cũ | number nguyên trong safe range | int | int |
| ID bigint nếu có tương lai | string canonical | long | bigint |
| Điểm cần decimal chính xác | string, ví dụ "0.64" | decimal với converter/binder rõ | decimal precision/scale đã chốt |
| Số câu/phút | number integer | int | int |
| Instant | ISO 8601 có offset hoặc Z | DateTimeOffset | datetimeoffset |
| Ngày sinh | YYYY-MM-DD | DateOnly | date |
| Row version nếu expose | opaque base64 string | byte[] | rowversion |
| Trạng thái | enum string theo API | enum/domain type | value có mapping rõ |
| Điện thoại/mã | string | string | nvarchar có max length |

Không mặc định decimal C# sẽ tự serialize thành string: cần JsonConverter/contract DTO rõ và test round-trip. Cấm parse số decimal bằng culture hiện tại của server; canonical dùng dấu chấm. Không stringify toàn bộ số chỉ vì field điểm dùng string.

Testify cũ dùng double cho TotalMark/PassMark/Point và DateTime/TimeSpan; BE mới vẫn double/DateTime nhưng TimeTaken đã thành TimeOnly. Chuyển đổi phải quyết định precision, rounding và timezone; không tuyên bố giá trị cũ luôn chuyển đổi mất mát bằng 0.

Datetime-local không có timezone: adapter phải gắn timezone nghiệp vụ rồi chuyển sang instant. FE hiển thị theo timezone đã chọn; database lưu offset/UTC nhất quán. Không tự gán timezone cho DateTime lịch sử chưa rõ nguồn.

Enum Role.Exemer=2 trong Web cũ được mapping có chủ ý sang Examiner; QuestionType.FillAnswer=4 chưa coi là hỗ trợ. Status 1/2/255 phải lập map riêng cho từng bảng và endpoint trước ETL.

OpenAPI phải ghi required/nullable/format/enum/range/units và ví dụ; TypeScript non-null không thay cho validation runtime.
