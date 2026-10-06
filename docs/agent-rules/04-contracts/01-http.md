# HTTP contract: hiện tại và quy tắc phát triển

## Task 08 — cấu hình bài thi và mã đề tại `dev/Hop`

`/web/exams` giữ `maximmumMark` và bổ sung `numberOfRepeat`, `allowViewResult`, `scoreMethodId` trong cấu hình. Permission 1 truy cập `GET /web/exams/subjects`, `GET /web/exams/{id}/question-options`, `GET /web/exams/{id}/variants`, `GET /web/exams/{id}/variants/{variantId}`. Question options chỉ có ID/nội dung/mức độ, không có đáp án. `POST/PUT /web/exams/{id}/variants[/{variantId}]` nhận `{code,status,questionIds,randomSelections:[{questionLevelId,count}]}`. Status 2 nháp, 1 công khai; null questionLevelId chọn mọi mức độ. Server kiểm số câu, trùng câu, môn/trạng thái, đủ câu ngẫu nhiên và tự phân điểm. Các route ghi CRUD cũ của exam-details và exam-detail-questions trả 405. Không thêm migration.

## Task 07 — ngân hàng câu hỏi tại `dev/Hop`

`GET /web/questions` (policy `QuestionManagement`, permission 2) nhận `textSearch`, `subjectId`, `questionTypeId`, `questionLevelId`; ba ID lọc phải dương. Response `data` là mảng admin `QuestionResponseDto`, có `answers: [{id,content,isCorrect}]` và `isUsedInExam`. `GET /web/questions/{id}` cũng là admin projection. Không dùng hai response này cho student attempt.

`GET /web/questions/subjects` trả `[{id,name}]` cho người có permission 2, vì `/web/subjects` yêu cầu permission 3. Lookup loại/mức độ vẫn là `/web/question-types`, `/web/question-levels`.

`POST /web/questions` và `PUT /web/questions/{id}` nhận `{content,status,subjectId,questionTypeId,questionLevelId,documentPath,answers:[{content,isCorrect}]}`. `questionLevelId` và `documentPath` có thể null. Loại 1 cần hai đáp án Đúng/Sai và một đáp án đúng; loại 2 cần đúng một đáp án đúng; loại 3 cần ít nhất một đáp án đúng. Mọi loại cần 2–20 đáp án khác nội dung. Chỉ loại 1–3 được nhận. Ghi câu hỏi và toàn bộ đáp án trong transaction serializable; update thay tập đáp án khi câu hỏi chưa được dùng trong đề/bài nộp. `PUT`/`DELETE` trả 409 nếu câu hỏi đã dùng. `DELETE` ẩn bằng status 255. Các route ghi độc lập `POST/PUT/DELETE /web/answers` trả 405; `GET /web/answers` còn dành cho admin.

Không có migration/schema mới. Student attempt vẫn phải dùng projection riêng không có `isCorrect`; Task 07 chưa tạo attempt API. Chưa kiểm SQL rollback thực tế vì chưa có SQL Server fixture.

PUT thay toàn bộ tập đáp án, vì vậy ID đáp án mới sẽ khác ID cũ; client quản trị phải tải lại response sau lưu.

## FACT — contract đang có

Các controller nghiệp vụ dùng `/web/*`; WeatherForecast dùng route theo controller. SwaggerDoc version v1 không làm path thành /api/v1. Xem [catalogue](04-current-endpoints.md) để lấy action path thật.

`ApiResponse<T>` có Success, Data, Message. Với JSON web camelCase: `{ "success": true, "data": ..., "message": null }`. Axios interceptor hiện trả nguyên response, nên envelope là response.data, payload là response.data.data. Không destructure payload ở sai tầng.

Room list trả ApiResponse<PagedResult<RoomResponseDto>>; PagedResult có items, totalCount, page, pageSize (không có totalPages). Query mặc định Page=1/PageSize=10. Các list khác thường trả array trong data, không được giả định đều đã phân trang.

HTTP create dùng 201 với Created("", ...); delete thường 200 envelope; lỗi controller 400/404 envelope. Middleware map ValidationException/BadRequestException=400, NotFound=404, unexpected=500, trả ApiResponse.Fail. MVC model-validation tự động có thể trả ValidationProblemDetails; 401/403 từ middleware có thể không có envelope. Chưa chạy để pin toàn bộ response runtime.

## REQUIRED — compatibility trước khi chuẩn hóa

Giữ prefix/envelope hiện có khi port FE. Viết error adapter nhận được envelope, validation problem hoặc body rỗng. Không nhận định mọi lỗi là ProblemDetails hoặc có code/traceId khi current DTO chưa chứa chúng.

Bổ sung code/fieldErrors/traceId và chuẩn hóa HTTP theo một change có OpenAPI/contract tests + FE adapter đi cùng. Không đổi tất cả endpoint sang /api/v1 chỉ để khớp v0.1. Nếu chọn versioning sau này, ghi transition rõ.

## HTTP semantics mục tiêu

## Task 05 — thay đổi validation tại `dev/Hop`

`GET /web/users/get-all-users` nhận thêm query tùy chọn `search` (tên, username hoặc email), trim tối đa 100 ký tự; response vẫn là mảng `UserResponseDto` trong envelope, chưa phân trang.

## Task 06 — lớp và thành viên tại `dev/Hop`

`GET /web/classes/options` (AdminManagement) trả `teachers[{id,fullName}]`, `subjects[{id,name}]` đang hoạt động. `GET /web/class-users/by-class/{classId}` (AdminManagement) trả thành viên lớp. `POST /web/class-users` chỉ nhận `status=1` để admin thêm học viên; `PUT /web/class-users/{id}` chỉ duyệt bản ghi đang chờ với cùng classId/userId và `status=1`; `DELETE` xóa thành viên. Các ghi thành viên khóa hàng Class trong giao dịch; trùng cặp hoặc đầy sĩ số trả 409.

`GET /web/student/classes` (level_id=4) chỉ trả lớp của claim user hiện tại, gồm trạng thái thành viên 1=đã duyệt, 2=chờ duyệt. `POST /web/student/classes/join` nhận `{classCode}` và tạo yêu cầu status=2; `DELETE /web/student/classes/{classId}` rời lớp của chính mình. Không nhận userId từ FE cho student flow. `POST/PUT /web/classes` kiểm tên/mã/sức chứa, giáo viên level 3 đang hoạt động, môn học đang hoạt động; mã trùng và sĩ số giảm dưới số đã duyệt trả 409. Không thêm migration. Gán lịch qua ClassExamSchedule giữ nguyên endpoint cũ và chờ Task 09 để xác định Exam–Schedule.

Không có route hoặc schema mới. `GET /web/rooms` trả 400 nếu `page < 1`, `pageSize` ngoài 1..100, capacity âm, khoảng capacity đảo chiều hoặc offset vượt `int.MaxValue`; danh sách sắp theo `Id` tăng dần trước phân trang. `POST/PUT /web/rooms` yêu cầu tên, địa chỉ và sức chứa dương; `DELETE /web/rooms/{id}` trả 409 nếu phòng có lịch thi hoặc bị FK chặn. `POST/PUT /web/subjects` yêu cầu tên. `POST /web/users/create-user` trả 409 nếu tên đăng nhập, email hoặc số điện thoại đã tồn tại và cấp token xác minh email sau khi tạo. `POST/PUT /web/user-permissions` trả 400 nếu user/permission không tồn tại, 409 nếu cặp đã được gán (kiểm trước ở API, chưa có unique DB constraint). `DELETE /web/levels/{id}` chặn ID 1..4; `DELETE /web/permissions/{id}` chặn ID 1..4; PUT cùng ID chặn status khác 1. `DELETE /web/users/delete-user-{id}` chặn tự xóa và xóa admin hoạt động cuối cùng. Các trường hợp chặn trả `ApiResponse.Fail` với HTTP 409, ID user sai trả 400.

200 đọc/update, 201 tạo có Location phù hợp, 204 cho thao tác không body nếu đã đổi contract; 400 invalid, 401 unauthenticated, 403 forbidden, 404 missing, 409 state/concurrency/idempotency conflict, 429 rate limit, 500 unexpected. Không bọc mọi lỗi bằng status 200.

List mới phải validate page/pageSize và sort allowlist; hiện chưa áp dụng đồng nhất. Payload không chứa entity navigation hoặc secret.

## PROPOSED — engine thi

Start/submit cần Idempotency-Key, identity+operation+key scope, request hash. Cùng key/cùng request trả cùng kết quả; payload khác trả conflict. Unique Submission.AttemptId vẫn bảo vệ sau TTL. Save draft dùng revision hoặc rowversion mapping rõ. Chưa có các cơ chế này trong snapshot hiện tại.

OpenAPI là contract build artifact khi thiết lập pipeline. Hiện chỉ thấy Swagger startup, chưa thấy artifact client generation. Không gọi lệnh generate chưa được khai báo trong repo.
