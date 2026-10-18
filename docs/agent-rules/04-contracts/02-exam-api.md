# API thi — contract sketch PROPOSED

Trạng thái 2026-10-11: đã đọc `VibeCoding/Task10.md`; file hiện có và yêu cầu start/resume/save, snapshot, revision, deadline server và trang làm bài. Các route attempt dưới đây vẫn chưa được triển khai. Phần đã chạy thực tế là `GET /web/student/schedules` bổ sung `serverNow`/`scheduleState`, xem `01-http.md`. Cách tính/phạm vi số lượt và deadline O05/O06 đang chờ chốt; rounding/chấm điểm thuộc phần finalize, không chặn việc chuẩn bị snapshot và draft. Không dùng trạng thái `open` của lịch làm xác nhận đủ điều kiện start. Route Submission hiện chỉ dành AdminManagement và các thao tác ghi là NonAction; kết quả cho Student cần route owner riêng khi triển khai engine.

Đã thêm code thuần `AttemptSnapshotFactory` chuẩn bị snapshot từ mã đề công khai, chiếu DTO học viên theo allowlist và validate draft thay toàn bộ. ID câu/options trong snapshot là Guid; DTO không có SourceQuestionId/SourceAnswerId/Point/IsCorrect. Snapshot phía server giữ nguồn và cờ đúng để phục vụ chấm sau này; điểm hiện giữ double của source, chưa chốt rounding hay chuyển dữ liệu cũ. Chưa nối persistence/controller, chưa có route để FE gọi; kiểm cô lập không thay cho nghiệm thu SQL/concurrency.

Các route/field dưới đây là PROPOSED, chưa tồn tại trong BE đã đọc. Dùng prefix /web để đồng nhất với API hiện tại; không nối student submit vào /web/submissions CRUD vì endpoint đó nhận điểm từ request. Envelope ngoài cùng tiếp tục ApiResponse theo 01-http.md; JSON ví dụ bên dưới là phần data.

| Method + route | Input chính | Output / policy |
|---|---|---|
| POST /web/exam-schedules/{id}/attempts | Idempotency-Key | Attempt đang có hoặc mới; identity từ auth |
| GET /web/attempts/{id} | ID | Safe questions, savedAnswers, revision, deadline |
| PUT /web/attempts/{id}/answers | revision + answers | revision mới, savedAt; chỉ khi còn hạn |
| POST /web/attempts/{id}/submit | Idempotency-Key + revision + finalAnswers tùy chọn | Kết quả đã persisted; retry trả cùng kết quả |
| GET /web/submissions/{id} | ID | Summary theo ownership và release policy |
| GET /web/submissions/{id}/review | ID | Chi tiết theo AllowViewResult và policy riêng |
| POST /web/attempts/{id}/activity-events | eventType, clientObservedAt tùy chọn | Audit với serverReceivedAt; không tin client là chứng cứ tuyệt đối |

## Safe attempt DTO (ví dụ minh họa, không phải dữ liệu thật)

```json
{
  "attemptId": "00000000-0000-4000-8000-000000000001",
  "state": "inProgress",
  "serverNow": "2026-09-23T02:00:00Z",
  "expiresAt": "2026-09-23T02:45:00Z",
  "revision": 1,
  "questions": [{
    "id": "snapshot-q-1",
    "type": "singleChoice",
    "content": "Nội dung câu hỏi minh họa",
    "options": [{ "id": "snapshot-a-1", "content": "Đáp án minh họa" }]
  }],
  "savedAnswers": []
}
```

ID snapshot dạng chuỗi trong ví dụ là opaque identifier; format cuối cùng phải pin trong OpenAPI. ID không cho phép suy ra đáp án đúng. Không có IsCorrect, correctAnswerIds, PasswordHash hoặc navigation entity trong DTO này.

## Save/final answers

```json
{
  "revision": 1,
  "answers": [{ "questionId": "snapshot-q-1", "selectedAnswerIds": ["snapshot-a-1"] }]
}
```

PUT answers thay toàn bộ tập trả lời của attempt trong bản baseline; FE gửi snapshot draft đầy đủ để xóa lựa chọn có semantics rõ. Nếu đổi sang patch từng câu, phải đổi contract/revision policy và tests. Submit `finalAnswers` có cùng kiểu array; chỉ tiếp nhận khi server còn hạn và revision hợp lệ. Không nhận totalMark/isPassed/userId/deadline.

Sau deadline: không merge finalAnswers mới; finalize draft server đã lưu và trả trạng thái timeout rõ. Nếu revision conflict trước deadline, FE fetch state mới và cho xử lý; không tự overwrite draft của tab khác.

## Các lỗi cụ thể

403 user không có quyền; 409 ATTEMPT_LIMIT_REACHED/ATTEMPT_CLOSED/CONCURRENCY_CONFLICT; 400 ANSWER_NOT_IN_ATTEMPT/INVALID_SELECTION. EXAM_NOT_OPEN trả 409 với thông tin lịch được phép công khai. Retry do network phải giữ key và payload ban đầu, hoặc fetch attempt khi trạng thái commit chưa rõ.
