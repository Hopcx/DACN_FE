# BE — use case, pattern và code convention

## FACT — cách hoạt động hiện tại

RoomService dùng mapping tường minh; UserService dùng AutoMapper và BCrypt. Interfaces repository ở Project.Domain; service interfaces ở Project.Application. Repository hiện SaveChangesAsync riêng; chưa có UoW tập trung. JwtService nằm trong Application và AuthController trực tiếp dùng DbContext.

Các quy tắc dưới đây là REQUIRED khi thêm/sửa use case; không mô tả chúng đã có đầy đủ. Giữ AutoMapper/FluentValidation đã cài, không thay framework tùy ý. DI thiếu và IADO constructor được ghi trong audit.

## Quy trình chuẩn

Controller bind DTO → xác thực → validator request → use case kiểm tra resource permission → tải dữ liệu → domain operation → SaveChanges/transaction → map result → HTTP.

Một use case có input, output và invariant rõ; ví dụ CreateQuestion, PublishExamVersion, StartAttempt, SaveAttemptAnswers, SubmitAttempt. Controller ngắn; không giải quyết retry hoặc tính điểm ở controller.

## Patterns áp dụng

| Pattern | Áp dụng cụ thể | Giới hạn |
|---|---|---|
| Dependency inversion | ICurrentUser, IClock, IAttemptStore, IQuestionRepository trong Application | Không tạo interface chỉ để bọc mọi class |
| Repository | Truy vấn/lưu theo nhu cầu feature và aggregate | Không generic CRUD công khai cho mọi entity |
| Unit of Work | Một scoped DbContext cho một use case; SaveChanges tại ranh giới use case | Repository không tự commit từng entity trong luồng nộp bài |
| Strategy | Bộ chấm theo QuestionType, thuần và dễ test | Không xây plugin system khi chỉ ba loại |
| DTO mapping | Mapping tường minh cho student/admin | Không serialize entity có IsCorrect/PasswordHash |
| CQRS ở mức tổ chức | Tách read projection và write use case | Không bắt buộc event sourcing, bus hoặc MediatR |

## Async và transaction

Await mỗi EF operation trước khi dùng cùng context lần tiếp theo. Không Task.WhenAll các query cùng DbContext; chỉ song song khi thật sự cần và dùng context độc lập, hiểu tính nhất quán. Truyền CancellationToken đến I/O; không .Result/.Wait.

SaveChanges đơn lẻ đã có tính nguyên tử theo provider; multi-step nghiệp vụ cần transaction rõ. Không mở transaction chờ người dùng hoặc parse file lớn. Retry transient error phải bao trọn unit transaction theo execution strategy; idempotency vẫn cần ở tầng nghiệp vụ.

## Errors và logging

Expected failures dùng mã nghiệp vụ ổn định: EXAM_NOT_OPEN, ATTEMPT_LIMIT_REACHED, ANSWER_NOT_IN_ATTEMPT, ATTEMPT_CLOSED, CONCURRENCY_CONFLICT. Middleware hiện map lỗi ra ApiResponse.Fail; error code/field errors/traceId là phần cần bổ sung có contract migration. Không assume ProblemDetails cho mọi response. Không catch rỗng hoặc return null cho mọi lỗi; không log token/password/đáp án thi nhạy cảm.

Log correlationId, feature, duration, exception class; audit actor từ ICurrentUser, server time từ IClock. Không lấy CreatedBy từ client.

## Validation và mapping

Validate cross-field (PassMark <= MaximumMark) tại Application/Domain; uniqueness được DB đảm bảo. Pre-check uniqueness chỉ cải thiện UX, không chống race. Mapping enum/status cũ phải tường minh theo từng entity; không mặc định 255 ở mọi bảng có cùng nghĩa.
