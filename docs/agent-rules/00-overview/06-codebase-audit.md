# Đối chiếu codebase và danh sách cần xử lý — v0.2

BE master `4d5ff309e130f385d207abbc215f5a3b3b4eaa7c`; FE main `37d5883c8ea272613686aae90dfccadd81bda3c5`. Static review source; chưa build/run hoặc kết nối database. Đã lấy 244 file text BE và 35 file text FE tại các SHA này, không bao gồm binary.

## BE — phát hiện và hành động

### B01 — Chặn tích hợp

**FACT:** Constructor gán configuration = configuration, không gán _configuration rồi gọi _configuration.GetConnectionString. IADO được AddScoped và repository User/Room/Submission cùng nhiều repository khác inject.

**REQUIRED:** Sửa assignment hoặc bỏ dependency không dùng; smoke test DI/controller activation. Không kết luận login hoạt động chỉ vì controller tồn tại.

Nguồn: [Project.Domain/Interfaces/Repositories/ProjectHopADO.cs](https://github.com/Hopcx/DACN_Project/blob/4d5ff309e130f385d207abbc215f5a3b3b4eaa7c/Project.Domain/Interfaces/Repositories/ProjectHopADO.cs).

### B02 — Chặn một số controller

**FACT:** Thiếu AddScoped cho IClassExamScheduleService, IClassUserService, IExamActivityLogService, IExamDetailService, IExamDetailQuestionService, ILogService, IUserPermissionService; controller tương ứng inject các interface này.

**REQUIRED:** Đăng ký đúng implementation đã có; test activation từng controller. Không viết lại các service đã tồn tại.

Nguồn: [Project.Application/DependencyInjection.cs](https://github.com/Hopcx/DACN_Project/blob/4d5ff309e130f385d207abbc215f5a3b3b4eaa7c/Project.Application/DependencyInjection.cs).

### B03 — Bảo vệ dữ liệu

**FACT:** DTO chứa PasswordHash; MappingProfile CreateMap<User,UserResponseDto>() và UserService trả mapped DTO.

**REQUIRED:** Loại PasswordHash khỏi public contract/map, kiểm toàn bộ response nested; không để FE “ẩn” field thay cho loại khỏi API.

Nguồn: [Project.Application/DTOs/UserDTO/UserResponseDto.cs](https://github.com/Hopcx/DACN_Project/blob/4d5ff309e130f385d207abbc215f5a3b3b4eaa7c/Project.Application/DTOs/UserDTO/UserResponseDto.cs).

### B04 — Phân quyền

**FACT:** Có bốn policy permission nhưng không có FallbackPolicy. Trong controllers, Room có ScheduleManagement và auth/me có Authorize; các controller CRUD còn lại không có attribute bảo vệ theo source đã đọc.

**REQUIRED:** Thiết lập policy mặc định và quyền từng action; public registration không nhận LevelId đặc quyền; kiểm object ownership. Không tự gán Admin bypass chưa có.

Nguồn: [Project.Api/Extensions/AuthorizationExtensions.cs](https://github.com/Hopcx/DACN_Project/blob/4d5ff309e130f385d207abbc215f5a3b3b4eaa7c/Project.Api/Extensions/AuthorizationExtensions.cs).

### B05 — Toàn vẹn bài thi

**FACT:** Create/Update copy UserId, TotalMark, IsPassed, SubmitTime từ DTO. Submission và AnswerSubmission được lưu qua CRUD riêng.

**REQUIRED:** Tạo use case finalize server-side nguyên tử/idempotent; không nối student submit với CRUD nhận điểm.

Nguồn: [Project.Application/Services/SubmissionService.cs](https://github.com/Hopcx/DACN_Project/blob/4d5ff309e130f385d207abbc215f5a3b3b4eaa7c/Project.Application/Services/SubmissionService.cs).

### B06 — Bảo mật đề

**FACT:** AnswerResponseDto có IsCorrect và AnswerController trả DTO này.

**REQUIRED:** Phân tách admin DTO và student attempt DTO; không dùng endpoint answers hiện tại để cung cấp bài thi cho student.

Nguồn: [Project.Application/DTOs/AnswerCreateDto/AnswerResponseDto.cs](https://github.com/Hopcx/DACN_Project/blob/4d5ff309e130f385d207abbc215f5a3b3b4eaa7c/Project.Application/DTOs/AnswerCreateDto/AnswerResponseDto.cs).

### B07 — Auth lifecycle

**FACT:** Refresh token trả JSON/lưu Token nguyên giá trị, rotate bằng read/revoke/add; chưa thấy token-family/reuse detection, concurrency token hoặc logout endpoint.

**REQUIRED:** Giữ contract hiện tại rõ trong adapter; harden bằng hash, rotation atomic, revoke/logout và HttpOnly cookie có CSRF khi đổi transport.

Nguồn: [Project.Api/Controllers/AuthController.cs](https://github.com/Hopcx/DACN_Project/blob/4d5ff309e130f385d207abbc215f5a3b3b4eaa7c/Project.Api/Controllers/AuthController.cs).

### B08 — Boundary

**FACT:** Domain chứa SQL/config dependencies và ProjectHopADO/ProjectHopEncrypt implementation; auth dùng trực tiếp DbContext.

**REQUIRED:** Chuyển I/O implementation ra Infrastructure khi refactor; giữ interface/contract phù hợp để giảm phá vỡ.

Nguồn: [Project.Domain/Project.Domain.csproj](https://github.com/Hopcx/DACN_Project/blob/4d5ff309e130f385d207abbc215f5a3b3b4eaa7c/Project.Domain/Project.Domain.csproj).

### B09 — Parity Exam

**FACT:** DTO tạo/trả Exam thiếu NumberOfRepeat, AllowViewResult, ScoreMethodId so với entity/Testify; tên MaximmumMark vẫn giữ typo.

**REQUIRED:** Bổ sung field/use case có validation và mapping; rename cần coordinated contract migration, không tự sửa một phía.

Nguồn: [Project.Application/DTOs/ExamDTO/ExamCreateDto.cs](https://github.com/Hopcx/DACN_Project/blob/4d5ff309e130f385d207abbc215f5a3b3b4eaa7c/Project.Application/DTOs/ExamDTO/ExamCreateDto.cs).

### B10 — Query

**FACT:** Skip/Take chưa có OrderBy; RoomQueryDto mặc định page=1/pageSize=10, chưa thấy giới hạn max và validator tương ứng.

**REQUIRED:** Thêm sort ổn định, validate paging/capacity; đo query trước index bổ sung.

Nguồn: [Project.Infrastructure/Persistence/Repositories/RoomRepository.cs](https://github.com/Hopcx/DACN_Project/blob/4d5ff309e130f385d207abbc215f5a3b3b4eaa7c/Project.Infrastructure/Persistence/Repositories/RoomRepository.cs).

### B11 — Quan hệ database

**FACT:** EF map Exam.ExamScheduleId → ExamSchedule.Exams; ExamSchedule đồng thời có ExamId nhưng configuration chưa map quan hệ đó. Migration tạo FK phía Exams.

**REQUIRED:** Chốt cardinality nghiệp vụ (Exam có nhiều Schedule), kiểm dữ liệu và migration chuyển quan hệ; không chỉ sửa ERD.

Nguồn: [Project.Infrastructure/Persistence/Configurations/ExamConfiguration.cs](https://github.com/Hopcx/DACN_Project/blob/4d5ff309e130f385d207abbc215f5a3b3b4eaa7c/Project.Infrastructure/Persistence/Configurations/ExamConfiguration.cs).

### B12 — Kiểu duration

**FACT:** TimeTaken là TimeOnly; migration SQL time. Testify cũ dùng TimeSpan. Điểm hiện dùng double/SQL float.

**REQUIRED:** Định nghĩa durationSeconds hoặc TimeSpan có contract rõ; chuyển decimal/timezone cần migration, không nói đã thực hiện.

Nguồn: [Project.Application/DTOs/SubmissionDTO/SubmissionCreateDto.cs](https://github.com/Hopcx/DACN_Project/blob/4d5ff309e130f385d207abbc215f5a3b3b4eaa7c/Project.Application/DTOs/SubmissionDTO/SubmissionCreateDto.cs).

## FE — khoảng trống đã xác minh

### FBE01

**FACT:** handleSubmit chỉ navigate, không gọi API; RegisterPage tương tự.

**REQUIRED:** Nối /web/auth/login với keyword/password; xử lý token/error theo contract thật.

Nguồn: [src/pages/auth/LoginPage.jsx](https://github.com/Hopcx/DACN_FE/blob/37d5883c8ea272613686aae90dfccadd81bda3c5/src/pages/auth/LoginPage.jsx).

### FBE02

**FACT:** Cho chọn Admin/Examiner/Teacher/Student rồi navigate dashboard; đây là placeholder.

**REQUIRED:** Không dùng lựa chọn UI để cấp role. Role/permission do server và quy trình admin quyết định.

Nguồn: [src/pages/auth/SelectRolePage.jsx](https://github.com/Hopcx/DACN_FE/blob/37d5883c8ea272613686aae90dfccadd81bda3c5/src/pages/auth/SelectRolePage.jsx).

### FBE03

**FACT:** baseURL env hoặc /api, withCredentials=true, response interceptor chỉ passthrough, chưa attach JWT.

**REQUIRED:** Giữ Axios client chung; sửa routing/proxy/token; withCredentials không tự biến JSON token thành cookie.

Nguồn: [src/api/axiosClient.js](https://github.com/Hopcx/DACN_FE/blob/37d5883c8ea272613686aae90dfccadd81bda3c5/src/api/axiosClient.js).

### FBE04

**FACT:** Proxy /api tới localhost:5000; BE launch profile 5081/7242 và /web.

**REQUIRED:** Sửa cấu hình cùng nhau; ưu tiên local same-origin proxy /web về HTTPS BE.

Nguồn: [vite.config.js](https://github.com/Hopcx/DACN_FE/blob/37d5883c8ea272613686aae90dfccadd81bda3c5/vite.config.js).

### FBE05

**FACT:** roleDisplay và stats hardcode; không có fetch. App.jsx chưa có route guard.

**REQUIRED:** Không tuyên bố dashboard dữ liệu thật; bổ sung guard UX và API aggregation theo quyền.

Nguồn: [src/pages/dashboard/AdminDashboardPage.jsx](https://github.com/Hopcx/DACN_FE/blob/37d5883c8ea272613686aae90dfccadd81bda3c5/src/pages/dashboard/AdminDashboardPage.jsx).

### FBE06

**FACT:** Chỉ app slice; Context giữ sidebarOpen. Không có RTK Query/TanStack Query/auth slice.

**REQUIRED:** Giữ Redux baseline, thêm state có owner rõ; TypeScript và query framework mới là quyết định riêng.

Nguồn: [src/redux/store.js](https://github.com/Hopcx/DACN_FE/blob/37d5883c8ea272613686aae90dfccadd81bda3c5/src/redux/store.js).

## Thứ tự thực hiện

1. B01/B02: cấu hình/DI để endpoint có thể được khởi tạo; kiểm restore/build trước sửa tiếp.
2. B03/B04/B06: loại dữ liệu nhạy cảm và bảo vệ endpoint trước kết nối dữ liệu thật.
3. FBE01/FBE03/FBE04: login → me → rooms tạo lát cắt FE–BE–SQL đầu tiên.
4. Hoàn thiện CRUD/validation/membership/exam fields, import/export theo parity.
5. B05/B09/B11/B12: engine thi, dữ liệu lịch sử và contract đúng.
6. Báo cáo, audit, polish UI và nghiệm thu end-to-end.

## Phạm vi chưa xác minh

Không có bằng chứng runtime/SQL deployed. Không đánh giá DOCX binary trong Project.Api/Docs hoặc screenshot giao diện đang chạy. Không suy ra database engine version từ EF 8. Không dùng secret của appsettings để kết nối database. Repo có cấu hình auth/connection và crypto constants cần xử lý ngoài source nếu là giá trị thật; tài liệu không chép các giá trị đó.
