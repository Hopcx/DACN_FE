# Ma trận chức năng Testify → DACN

## Task 12 rồi Task 09 tại checkout `dev/Hop` (2026-10-07)

Quyết định tiếp theo: DB DACN thử nghiệm, chưa ETL Testify; Exam 1→n Schedule. BE có khóa ghi SQL Server cho lịch/gán lớp/duyệt membership, kiểm `[start,end)` cùng phòng và học viên, chặn sửa lịch/gán lớp sau lượt thi/bài nộp. FE hiển thị timestamp có offset theo Asia/Ho_Chi_Minh, giữ nguyên timestamp cũ chưa rõ zone. Preflight DB `ProjectDACN` đã chạy; migration Task09 đã tạo nhưng chưa áp do auth migration còn pending và có một user. Chưa SQL E2E, nên F16/F17 vẫn IN_PROGRESS.

F16/F17 **IN_PROGRESS**. BE kiểm tĩnh migrations/snapshot và lập mapping tại `DACN_Project/docs/agent-rules/05-migration/12-data-readiness.md`; chưa xác minh DB hoặc ETL. BE thêm validation khoảng thời gian/tham chiếu và API lịch theo membership đã duyệt. FE thêm màn đọc lịch quản lý và học viên, nối `/web` qua Axios. Chưa có UI ghi/gán lớp, overlap policy, migration hoặc SQL E2E nên chưa VERIFIED.

## Task 08 tại checkout `dev/Hop` (2026-10-04)

F14/F15 **IN_PROGRESS**. FE thêm danh sách/cấu hình bài thi và mã đề, chọn câu thủ công hoặc số lượng ngẫu nhiên theo mức độ qua API permission 1; BE kiểm invariant và ghi mã đề cùng tập câu trong transaction. API giữ `maximmumMark`, bổ sung NumberOfRepeat/AllowViewResult/ScoreMethodId, không thêm schema. Chưa có SQL fixture để kiểm lịch sử đề khi công khai hoặc dữ liệu thi thật; không đánh dấu VERIFIED.

Mức bằng chứng: **CODE** có logic source đã xem; **DECLARED** mới thấy khai báo/route/model; **PARTIAL** có phần stub/thiếu rõ; không mức nào là “đã test runtime”. BE/FE đã đối chiếu source tại SHA trong README. **CODE** không có nghĩa chạy được; blocker chung B01/B02 và authorization xem audit. FE hầu hết chưa có nghiệp vụ ngoài placeholder auth/dashboard. Những hàng CODE phải có acceptance trước đánh dấu migrated.

| ID | Feature / bằng chứng cũ | Mức | Module đích và acceptance | BE tại commit đối chiếu | FE tại commit đối chiếu |
|---|---|---|---|---|---|
| F01 | Login/check token: AccessController; UserRepository | CODE | Identity: POST login, token lifecycle và deny unauthorized; không giữ GET credentials | AuthController login/refresh/me + BCrypt/JWT có code; IADO cần sửa; lifecycle còn B07 | LoginPage placeholder navigate; chưa gọi auth API |
| F02 | Register: AccessController.RegisterUser chỉ trả bool; UserController.RegisterStudent riêng | PARTIAL | Làm rõ public registration hay admin tạo tài khoản; không gộp hai flow thành hoàn chỉnh | Có POST /web/users/create-user quản trị; không có auth/register công khai; cần khóa role/policy | RegisterPage + SelectRolePage placeholder; không tạo account |
| F03 | Đổi mật khẩu/profile: Access/ChangePassword; InformationAdmin/Student | DECLARED | Identity/Profile: xác thực mật khẩu cũ, ownership, không mass assignment role | Chưa có endpoint profile/change-password trong controller mới; repo method update không phải public use case | Chưa có màn/service nghiệp vụ tương ứng trong cây FE |
| F04 | CRUD user, student/staff/lecturer views: UserController, Candidate/LecturerController | CODE/PARTIAL | Users: phân trang/search/role, uniqueness; dialog staff/student có phần placeholder phải kiểm từng route | UserController mới có list/create/delete; thiếu update/detail theo API quản trị đầy đủ | Chưa có quản lý user; dashboard chỉ số giả lập |
| F05 | Level/Permission/UserPermission; PermissionManagement | CODE | Access: role+permission+resource policy; matrix Teacher/Admin cần chốt | Level/Permission/UserPermission CRUD + bốn policy; UserPermissionService thiếu DI; auth chưa bao phủ | Chưa có màn/service nghiệp vụ tương ứng trong cây FE |
| F06 | Môn học: SubjectController/Repository, SubjectMn | CODE | AcademicCatalog: CRUD/disable/search, bảo vệ lịch sử | SubjectController/Service/Repository CRUD có code, chưa parity mọi report/filter legacy | Chưa có màn/service nghiệp vụ tương ứng trong cây FE |
| F07 | Lớp và thành viên: ClassController, ClassUserController, AddNewClass | CODE | Classes: mã lớp, capacity, teacher, join/remove, membership chống race | Class/ClassUser CRUD; ClassUserService thiếu DI; chưa có join-by-code/capacity concurrency use case đầy đủ | Chưa có màn/service nghiệp vụ tương ứng trong cây FE |
| F08 | Phòng thi: RoomController/Repository | CODE | Rooms: CRUD và lịch theo phòng; không suy diễn có kiểm trùng đầy đủ | Room CRUD + paging + ScheduleManagement; IADO blocker, cần stable sort/validator | Chưa có màn/service nghiệp vụ tương ứng trong cây FE |
| F09 | Loại/mức độ câu hỏi: QuestionType/QuestionLevelController | CODE | QuestionBank: lookup, CRUD theo quyền, không xóa loại đang dùng | QuestionType/QuestionLevel CRUD; chưa có validation nghiệp vụ đầy đủ | Chưa có màn/service nghiệp vụ tương ứng trong cây FE |
| F10 | Câu hỏi/đáp án: Question/AnswerController; CreateQuestionDialog | CODE | QuestionBank: true-false/single/multiple, filter môn/level/type, attachment theo quyền | Question/Answer CRUD riêng; DTO answer có IsCorrect; chưa có aggregate transaction + student safe projection | Chưa có màn/service nghiệp vụ tương ứng trong cây FE |
| F11 | FillAnswer=4 chỉ trong listQuestionTypes; seed chỉ 1..3 | DECLARED | OPEN: xác minh thực sự cần điền đáp án; chưa đưa thành parity hoàn thành | Chưa thấy engine FillAnswer; vẫn OPEN | Chưa có màn/service nghiệp vụ tương ứng trong cây FE |
| F12 | Import/export câu hỏi/template: QuestionController | CODE | Import: schema file, validate atomic, lỗi từng dòng; export correct answers theo quyền | Chưa có endpoint Excel import/export/template và package EPPlus trong manifest mới | Chưa có màn/service nghiệp vụ tương ứng trong cây FE |
| F13 | Import/export account/template: UserController | CODE | Users: giữ field nghiệp vụ cần thiết, không export hash/mật khẩu | Chưa có endpoint Excel account import/export/template trong UserController mới | Chưa có màn/service nghiệp vụ tương ứng trong cây FE |
| F14 | Exam: số câu, số lần, điểm tối đa/đạt, duration, AllowViewResult | CODE | ExamDefinition: cross-field invariant; ScoreMethod chưa có đủ căn cứ cơ chế riêng | Exam CRUD nhưng DTO thiếu NumberOfRepeat/AllowViewResult/ScoreMethodId; xem B09 | Chưa có màn/service nghiệp vụ tương ứng trong cây FE |
| F15 | ExamDetail/mã đề; CreateDeThi/UpdateExamDetail | CODE | Variants: chọn câu thủ công/ngẫu nhiên theo độ khó, không trùng, đủ số/tổng điểm | ExamDetail/ExamDetailQuestion CRUD; cả hai service thiếu DI; chưa có use case random/publish snapshot | Chưa có màn/service nghiệp vụ tương ứng trong cây FE |
| F16 | Lịch thi, gán lớp: ExamSchedule/ClassExamSchedule, DistributeSchedule | CODE | Scheduling: khoảng thời gian và quyền, membership, overlap theo policy đã duyệt | ExamSchedule/ClassExamSchedule CRUD; service gán lớp thiếu DI; relation Exam–Schedule cần sửa B11 | Chưa có màn/service nghiệp vụ tương ứng trong cây FE |
| F17 | Danh sách/lịch lớp của Student: Calendar, ListExam, CLassOfStudent | CODE | Student dashboard: chỉ thấy lịch/lớp hợp lệ, trạng thái trước/trong/sau thi đúng | Chưa expose student-specific calendar/list theo membership tương đương nguồn cũ | Chưa có Student calendar/lớp/thi |
| F18 | Làm bài: ViewExamTest.LoadExam, lựa chọn đáp án, localStorage, timer | CODE | Attempts: backend start/snapshot, resume, save revision, deadline authority | Có DoingExam entity/DbSet; chưa có start/save/resume/deadline API | Chưa có màn/service nghiệp vụ tương ứng trong cây FE |
| F19 | Nộp/chấm: ViewExamTest.ScoreExam; Submission/AnswerSubmission | CODE | Domain grading + transaction finalize; ghi nhận sửa lỗi chấm multiple-choice | Submission/AnswerSubmission CRUD, chưa server grading/atomic finalize; nhận điểm từ DTO B05 | Chưa có màn/service nghiệp vụ tương ứng trong cây FE |
| F20 | Kết quả/lịch sử: ResultOfSubmission; SubmissionReposiroty | CODE | Results: summary/review theo policy, snapshot bất biến, không xem bài người khác | Submission get-all/get-id có code; chưa có result-release/review theo ownership; repo user query chưa đủ UI/API | Chưa có màn/service nghiệp vụ tương ứng trong cây FE |
| F21 | Hủy/đổi status bài nộp: SetStatusSubmit; UpdateStatus | CODE | Results: explicit void use case có quyền, lý do, audit; không xóa lịch sử | Update/delete Submission CRUD; chưa có void use case với lý do/audit/quyền | Chưa có màn/service nghiệp vụ tương ứng trong cây FE |
| F22 | Thống kê/phổ điểm theo class/exam/subject | CODE | Reporting: thống nhất tập lượt, trạng thái hủy và denominator; đối soát fixture | Chưa có endpoint report/score-distribution; ViewModels còn tồn tại không đồng nghĩa feature hoạt động | AdminDashboardPage hardcode stats, chưa fetch |
| F23 | Nhật ký tài khoản và thi: AccountLogs, ExamActivityLog; tab event | CODE | Audit: actor/server time, quyền đọc; tab event không đủ để kết luận gian lận | Log/ExamActivityLog CRUD; cả hai service thiếu DI; chưa có đầy đủ audit use case actor server | Chưa có màn/service nghiệp vụ tương ứng trong cây FE |
| F24 | Ranked.razor có markup và list model, chưa thấy tải dữ liệu xếp hạng | PARTIAL | OPEN: xếp hạng thật, tie-break, phạm vi bài/lượt và quyền hiển thị | Chưa có endpoint ranking | Chưa có màn/service nghiệp vụ tương ứng trong cây FE |
| F25 | AdminReport UI, Organization/OrganizationUser models | DECLARED/PARTIAL | OPEN: không tự triển khai đa tổ chức hoặc báo cáo mới chỉ vì có model/UI | Chưa thấy module organization/report nghiệp vụ tương ứng được expose | Chưa có màn/service nghiệp vụ tương ứng trong cây FE |
| F26 | Gửi email: package/config SendGrid trong Web | DECLARED | OPEN: phải tìm call site thực tế trước nhận là tính năng nghiệp vụ cần port | Chưa có SendGrid package/API email nghiệp vụ được xác minh | Chưa có màn/service nghiệp vụ tương ứng trong cây FE |

## Theo dõi khi triển khai

### Task 07 tại checkout dev/Hop (2026-10-04)

| Feature | Trạng thái | Bằng chứng hiện tại và phần còn thiếu |
|---|---|---|
| F09 | IN_PROGRESS | Lookup `question-types`/`question-levels` dùng trên FE với permission 2; chưa làm màn CRUD loại/mức độ hoặc kiểm xóa lookup đang dùng. |
| F10 | IN_PROGRESS | `QuestionService` validate loại 1–3; `QuestionRepository.SaveWithAnswersAsync` ghi aggregate trong transaction serializable, chặn sửa/xóa câu đã dùng trong đề hoặc submission. FE `QuestionBankPage.jsx` lọc, tạo, sửa, ẩn và hiển thị đáp án qua API thật. Chưa có SQL fixture để xác minh rollback/concurrency, attachment upload, hoặc dữ liệu lịch sử. |
| F11 | OPEN | Testify seed chỉ 1–3, `FillAnswer=4` chỉ xuất hiện ở enum UI; chưa có engine tương ứng. API từ chối loại 4. |

Task 07 thêm `GET /web/questions/subjects` cho permission 2, lọc `subjectId/questionTypeId/questionLevelId`, và đổi request POST/PUT câu hỏi sang aggregate `answers`. Các route ghi `/web/answers` trả 405. Admin response có `IsCorrect`; student attempt projection vẫn tách riêng, chưa có attempt API. Không thêm migration. `dotnet build` và smoke validation/quyền/DI, `npm run lint` và Vite build đã qua; chưa đánh dấu VERIFIED khi chưa có SQL E2E.


### Task 06 tại checkout dev/Hop (2026-10-04)

| Feature | Trạng thái | Bằng chứng hiện tại và phần còn thiếu |
|---|---|---|
| F07 Classes/membership | IN_PROGRESS | BE thêm `ClassMembershipStore` khóa hàng Class trong giao dịch cho join/duyệt/xóa, kiểm trùng cặp và sĩ số đã duyệt; class create/update kiểm mã, capacity, giảng viên/môn. FE `AdminClassesPage.jsx` và `StudentClassesPage.jsx` gọi API thật; student query chỉ dựa claim. Legacy status 2 chờ duyệt, 1 đã duyệt. Chưa có SQL concurrency E2E, audit dữ liệu trùng cũ hoặc unique index ClassUser; Teacher management vẫn OPEN. |
| F16 ClassExamSchedule | DEFERRED_TO_TASK09 | Source hiện chỉ có CRUD, không kiểm trùng gán lịch, overlap học viên hoặc quan hệ Exam–Schedule. Chưa nối UI gán lịch; cần Task 09 chốt model/contract trước. |

Task 06 thêm route `/web/classes/options`, `/web/class-users/by-class/{classId}` và `/web/student/classes` (GET), `/join` (POST), `/{classId}` (DELETE). Không thêm migration/schema; endpoint ClassUser POST/PUT nay kiểm invariant và có thể trả 409. Source checkout mới hơn catalogue baseline, nên quyền `[Authorize]` trên Class/ClassUser/ClassExamSchedule và auth cookie Task 04 là căn cứ áp dụng.

Kiểm tra checkout: `dotnet build DACN_Project.sln --no-restore`, `npm run lint`, `npm run build`, `git diff --check` qua. Chưa có SQL Server/account fixture để thực chạy join/approve đồng thời, nên không gắn VERIFIED.

Sai khác tài liệu: `03-database/01-model.md` nói hai DbSet ClassExamSchedule chỉ có ở Testify, nhưng `ProjectDACNDbContext` hiện cũng có `ClassExamSchedules` và `UserExamSchedules` cùng kiểu `ClassExamSchedule`. Cần xử lý trong Task 09 khi chốt mapping lịch; Task 06 không đổi schema này.

### Task 05 tại checkout dev/Hop (2026-10-04)

| Feature | Trạng thái | Bằng chứng hiện tại và phần còn thiếu |
|---|---|---|
| F04 Users | IN_PROGRESS | FE `AdminUsersPage.jsx` nối list/detail/create/update/delete với `/web/users`; search gọi query `GET /web/users/get-all-users?search=`. BE đã có GET/PUT detail từ Task 04 và Task 05 thêm email verification khi admin tạo user. Chưa có server paging, import/export và E2E SQL/mail. |
| F05 Levels/Permissions | IN_PROGRESS | FE `CatalogPage.jsx` dùng `/web/levels`, `/web/permissions`; `UserPermissionsPage.jsx` dùng `/web/user-permissions`. BE bổ sung kiểm tồn tại user/permission và trùng cặp trước create/update, bảo vệ ID hệ thống 1..4. Chưa có unique DB constraint, nên vẫn có race; thay đổi quyền chỉ thể hiện trong JWT cấp mới. Quyền Teacher ngoài Task 05 vẫn OPEN. |
| F06 Subjects | IN_PROGRESS | FE list/search/detail từ hàng list, create/update/delete qua `/web/subjects`; BE thêm validation tên. Theo quyết định người dùng, giữ `SubjectManagement` cho xóa, không cấm tên trùng. Chưa xác minh DB. |
| F08 Rooms | IN_PROGRESS | FE CRUD/paging/search qua `/web/rooms`; BE `RoomQueryDto` validate page/pageSize/capacity, controller kiểm range và lịch thi trước xóa, repository OrderBy(Id) trước Skip/Take. Theo quyết định người dùng, không cấm tên trùng. Chưa có SQL E2E. |

Task 05 giữ `/web` và `ApiResponse`; không thêm route hoặc migration. `npm run lint`, `npm run build`, `dotnet build DACN_Project.sln --no-restore` qua tại checkout; build BE còn warning cũ. Chưa đánh dấu VERIFIED vì chưa có DB/account đủ quyền để chạy CRUD end-to-end.

Quyết định người dùng ngày 2026-10-04: giữ hard delete tài khoản của BE, giữ quyền xóa môn theo `SubjectManagement` hiện tại (permission 3), không cấm trùng tên môn/phòng. BE tạo user quản trị nay phát hành email verification token và gửi liên kết như luồng đăng ký; FE có thao tác gửi lại. Chưa xác minh mail/SQL thật.

### Task 03 tại checkout dev/Hop (2026-10-01)

F01/F08: FE đã nối login → me và danh sách rooms qua `/web`; Redux giữ phiên trong memory, Axios gửi Bearer và refresh JSON một lần khi 401. Dashboard bỏ số thống kê hardcode, chỉ gọi rooms khi claim permission 4 có trong `me`. BE tại `b61d4a0a1b9f24ab17eab2e54bfbc92004acd7c0` đã sửa ProjectHopADO constructor, đăng ký bảy service và có fallback policy; các nhận định B01/B02 và phần "không có FallbackPolicy" của B04 trong audit chỉ đúng với baseline cũ. Phân quyền chi tiết theo resource vẫn chưa được chứng minh đầy đủ. Không có migration/schema hoặc route API mới trong Task 03. `npm run lint`, `npm run build`, `dotnet build DACN_Project.sln` qua; smoke HTTPS không token: me/rooms 401, login body rỗng 400. Chưa có account có permission 4 và SQL được xác minh để đánh dấu E2E VERIFIED. Refresh token hiện vẫn là JSON và BE chưa có logout/revoke endpoint.

Bước tiếp theo cho mỗi feature: legacy file+symbol; BE path+commit; FE path+commit; schema migration; contract diff; test evidence; sai khác được duyệt; trạng thái TODO/IN_PROGRESS/VERIFIED/DEFERRED. Không ghi VERIFIED chỉ vì màn hình render hoặc endpoint trả 200.

Phải duyệt rõ F11/F24/F25/F26 và quyền Teacher để tránh bỏ sót hoặc mở rộng phạm vi không có căn cứ.
