# Endpoint catalogue BE hiện tại

> Task 08 tại `dev/Hop`: thêm `GET /web/exams/subjects`, `GET /web/exams/{id}/question-options`, `GET /web/exams/{id}/variants[/{variantId}]`, `POST /web/exams/{id}/variants`, `PUT /web/exams/{id}/variants/{variantId}`; tất cả dùng permission 1. Các route ghi CRUD rời `/web/exam-details` và `/web/exam-detail-questions` trả 405. Bảng dưới vẫn là baseline cũ; xem [HTTP contract](01-http.md).

> Task 07 tại `dev/Hop`: bảng dưới là baseline cũ. `GET /web/questions` nhận thêm `subjectId`, `questionTypeId`, `questionLevelId`; `GET /web/questions/subjects` mới dùng permission 2; POST/PUT questions nhận tập `answers` và GET admin trả `isCorrect`. Các thao tác ghi `/web/answers` trả 405. Xem [HTTP contract](01-http.md) và source checkout.

Nguồn: DACN_Project/master `4d5ff309e130f385d207abbc215f5a3b3b4eaa7c`. Trích attribute đang active; chưa chạy request. Domain routes `/web`, không phải `/api/v1`. Auth ghi theo attribute trong source và hiện không có fallback policy. “Chưa gắn” không được xem là đã bảo vệ bởi Swagger security definition.

## Danh mục controller

| Controller | Class route | Service thiếu DI |
|---|---|---|
| AnswerController | `/web/answers` | Không phát hiện qua đối chiếu service interface |
| AnswerSubmissionController | `/web/answer-submissions` | Không phát hiện qua đối chiếu service interface |
| AuthController | `/web/auth` | Không phát hiện qua đối chiếu service interface |
| ClassController | `/web/classes` | Không phát hiện qua đối chiếu service interface |
| ClassExamScheduleController | `/web/class-exam-schedules` | IClassExamScheduleService |
| ClassUserController | `/web/class-users` | IClassUserService |
| ExamActivityLogController | `/web/exam-activity-logs` | IExamActivityLogService |
| ExamController | `/web/exams` | Không phát hiện qua đối chiếu service interface |
| ExamDetailController | `/web/exam-details` | IExamDetailService |
| ExamDetailQuestionController | `/web/exam-detail-questions` | IExamDetailQuestionService |
| ExamScheduleController | `/web/exam-schedules` | Không phát hiện qua đối chiếu service interface |
| LevelController | `/web/levels` | Không phát hiện qua đối chiếu service interface |
| LogController | `/web/logs` | ILogService |
| PermissionController | `/web/permissions` | Không phát hiện qua đối chiếu service interface |
| QuestionController | `/web/questions` | Không phát hiện qua đối chiếu service interface |
| QuestionLevelController | `/web/question-levels` | Không phát hiện qua đối chiếu service interface |
| QuestionTypeController | `/web/question-types` | Không phát hiện qua đối chiếu service interface |
| RoomController | `/web/rooms` | Không phát hiện qua đối chiếu service interface |
| SubjectController | `/web/subjects` | Không phát hiện qua đối chiếu service interface |
| SubmissionController | `/web/submissions` | Không phát hiện qua đối chiếu service interface |
| UserController | `/web/users` | Không phát hiện qua đối chiếu service interface |
| UserPermissionController | `/web/user-permissions` | IUserPermissionService |
| WeatherForecastController | `/WeatherForecast` | Không phát hiện qua đối chiếu service interface |

## Actions

| Verb | Route template | Symbol | Authorize trong source | Nguồn |
|---|---|---|---|---|
| GET | `/web/answers` | `GetAllAnswersAsync` | `Chưa gắn` | [AnswerController.cs:21](https://github.com/Hopcx/DACN_Project/blob/4d5ff309e130f385d207abbc215f5a3b3b4eaa7c/Project.Api/Controllers/AnswerController.cs#L21) |
| POST | `/web/answers` | `CreateAnswerAsync` | `Chưa gắn` | [AnswerController.cs:28](https://github.com/Hopcx/DACN_Project/blob/4d5ff309e130f385d207abbc215f5a3b3b4eaa7c/Project.Api/Controllers/AnswerController.cs#L28) |
| DELETE | `/web/answers/{id}` | `DeleteAnswerAsync` | `Chưa gắn` | [AnswerController.cs:42](https://github.com/Hopcx/DACN_Project/blob/4d5ff309e130f385d207abbc215f5a3b3b4eaa7c/Project.Api/Controllers/AnswerController.cs#L42) |
| PUT | `/web/answers/{id}` | `UpdateAnswerAsync` | `Chưa gắn` | [AnswerController.cs:55](https://github.com/Hopcx/DACN_Project/blob/4d5ff309e130f385d207abbc215f5a3b3b4eaa7c/Project.Api/Controllers/AnswerController.cs#L55) |
| GET | `/web/answer-submissions` | `GetAll` | `Chưa gắn` | [AnswerSubmissionController.cs:19](https://github.com/Hopcx/DACN_Project/blob/4d5ff309e130f385d207abbc215f5a3b3b4eaa7c/Project.Api/Controllers/AnswerSubmissionController.cs#L19) |
| GET | `/web/answer-submissions/{id}` | `GetById` | `Chưa gắn` | [AnswerSubmissionController.cs:26](https://github.com/Hopcx/DACN_Project/blob/4d5ff309e130f385d207abbc215f5a3b3b4eaa7c/Project.Api/Controllers/AnswerSubmissionController.cs#L26) |
| POST | `/web/answer-submissions` | `Create` | `Chưa gắn` | [AnswerSubmissionController.cs:36](https://github.com/Hopcx/DACN_Project/blob/4d5ff309e130f385d207abbc215f5a3b3b4eaa7c/Project.Api/Controllers/AnswerSubmissionController.cs#L36) |
| PUT | `/web/answer-submissions/{id}` | `Update` | `Chưa gắn` | [AnswerSubmissionController.cs:46](https://github.com/Hopcx/DACN_Project/blob/4d5ff309e130f385d207abbc215f5a3b3b4eaa7c/Project.Api/Controllers/AnswerSubmissionController.cs#L46) |
| DELETE | `/web/answer-submissions/{id}` | `Delete` | `Chưa gắn` | [AnswerSubmissionController.cs:56](https://github.com/Hopcx/DACN_Project/blob/4d5ff309e130f385d207abbc215f5a3b3b4eaa7c/Project.Api/Controllers/AnswerSubmissionController.cs#L56) |
| POST | `/web/auth/login` | `Login` | `Chưa gắn` | [AuthController.cs:36](https://github.com/Hopcx/DACN_Project/blob/4d5ff309e130f385d207abbc215f5a3b3b4eaa7c/Project.Api/Controllers/AuthController.cs#L36) |
| POST | `/web/auth/refresh` | `RefreshToken` | `Chưa gắn` | [AuthController.cs:103](https://github.com/Hopcx/DACN_Project/blob/4d5ff309e130f385d207abbc215f5a3b3b4eaa7c/Project.Api/Controllers/AuthController.cs#L103) |
| GET | `/web/auth/me` | `GetCurrentUser` | `[Authorize]` | [AuthController.cs:164](https://github.com/Hopcx/DACN_Project/blob/4d5ff309e130f385d207abbc215f5a3b3b4eaa7c/Project.Api/Controllers/AuthController.cs#L164) |
| GET | `/web/classes` | `GetAll` | `Chưa gắn` | [ClassController.cs:19](https://github.com/Hopcx/DACN_Project/blob/4d5ff309e130f385d207abbc215f5a3b3b4eaa7c/Project.Api/Controllers/ClassController.cs#L19) |
| GET | `/web/classes/{id}` | `GetById` | `Chưa gắn` | [ClassController.cs:26](https://github.com/Hopcx/DACN_Project/blob/4d5ff309e130f385d207abbc215f5a3b3b4eaa7c/Project.Api/Controllers/ClassController.cs#L26) |
| POST | `/web/classes` | `Create` | `Chưa gắn` | [ClassController.cs:36](https://github.com/Hopcx/DACN_Project/blob/4d5ff309e130f385d207abbc215f5a3b3b4eaa7c/Project.Api/Controllers/ClassController.cs#L36) |
| PUT | `/web/classes/{id}` | `Update` | `Chưa gắn` | [ClassController.cs:46](https://github.com/Hopcx/DACN_Project/blob/4d5ff309e130f385d207abbc215f5a3b3b4eaa7c/Project.Api/Controllers/ClassController.cs#L46) |
| DELETE | `/web/classes/{id}` | `Delete` | `Chưa gắn` | [ClassController.cs:56](https://github.com/Hopcx/DACN_Project/blob/4d5ff309e130f385d207abbc215f5a3b3b4eaa7c/Project.Api/Controllers/ClassController.cs#L56) |
| GET | `/web/class-exam-schedules` | `GetAll` | `Chưa gắn` | [ClassExamScheduleController.cs:19](https://github.com/Hopcx/DACN_Project/blob/4d5ff309e130f385d207abbc215f5a3b3b4eaa7c/Project.Api/Controllers/ClassExamScheduleController.cs#L19) |
| GET | `/web/class-exam-schedules/{id}` | `GetById` | `Chưa gắn` | [ClassExamScheduleController.cs:26](https://github.com/Hopcx/DACN_Project/blob/4d5ff309e130f385d207abbc215f5a3b3b4eaa7c/Project.Api/Controllers/ClassExamScheduleController.cs#L26) |
| POST | `/web/class-exam-schedules` | `Create` | `Chưa gắn` | [ClassExamScheduleController.cs:36](https://github.com/Hopcx/DACN_Project/blob/4d5ff309e130f385d207abbc215f5a3b3b4eaa7c/Project.Api/Controllers/ClassExamScheduleController.cs#L36) |
| PUT | `/web/class-exam-schedules/{id}` | `Update` | `Chưa gắn` | [ClassExamScheduleController.cs:46](https://github.com/Hopcx/DACN_Project/blob/4d5ff309e130f385d207abbc215f5a3b3b4eaa7c/Project.Api/Controllers/ClassExamScheduleController.cs#L46) |
| DELETE | `/web/class-exam-schedules/{id}` | `Delete` | `Chưa gắn` | [ClassExamScheduleController.cs:56](https://github.com/Hopcx/DACN_Project/blob/4d5ff309e130f385d207abbc215f5a3b3b4eaa7c/Project.Api/Controllers/ClassExamScheduleController.cs#L56) |
| GET | `/web/class-users` | `GetAll` | `Chưa gắn` | [ClassUserController.cs:19](https://github.com/Hopcx/DACN_Project/blob/4d5ff309e130f385d207abbc215f5a3b3b4eaa7c/Project.Api/Controllers/ClassUserController.cs#L19) |
| GET | `/web/class-users/{id}` | `GetById` | `Chưa gắn` | [ClassUserController.cs:26](https://github.com/Hopcx/DACN_Project/blob/4d5ff309e130f385d207abbc215f5a3b3b4eaa7c/Project.Api/Controllers/ClassUserController.cs#L26) |
| POST | `/web/class-users` | `Create` | `Chưa gắn` | [ClassUserController.cs:36](https://github.com/Hopcx/DACN_Project/blob/4d5ff309e130f385d207abbc215f5a3b3b4eaa7c/Project.Api/Controllers/ClassUserController.cs#L36) |
| PUT | `/web/class-users/{id}` | `Update` | `Chưa gắn` | [ClassUserController.cs:46](https://github.com/Hopcx/DACN_Project/blob/4d5ff309e130f385d207abbc215f5a3b3b4eaa7c/Project.Api/Controllers/ClassUserController.cs#L46) |
| DELETE | `/web/class-users/{id}` | `Delete` | `Chưa gắn` | [ClassUserController.cs:56](https://github.com/Hopcx/DACN_Project/blob/4d5ff309e130f385d207abbc215f5a3b3b4eaa7c/Project.Api/Controllers/ClassUserController.cs#L56) |
| GET | `/web/exam-activity-logs` | `GetAll` | `Chưa gắn` | [ExamActivityLogController.cs:19](https://github.com/Hopcx/DACN_Project/blob/4d5ff309e130f385d207abbc215f5a3b3b4eaa7c/Project.Api/Controllers/ExamActivityLogController.cs#L19) |
| GET | `/web/exam-activity-logs/{id}` | `GetById` | `Chưa gắn` | [ExamActivityLogController.cs:26](https://github.com/Hopcx/DACN_Project/blob/4d5ff309e130f385d207abbc215f5a3b3b4eaa7c/Project.Api/Controllers/ExamActivityLogController.cs#L26) |
| POST | `/web/exam-activity-logs` | `Create` | `Chưa gắn` | [ExamActivityLogController.cs:36](https://github.com/Hopcx/DACN_Project/blob/4d5ff309e130f385d207abbc215f5a3b3b4eaa7c/Project.Api/Controllers/ExamActivityLogController.cs#L36) |
| PUT | `/web/exam-activity-logs/{id}` | `Update` | `Chưa gắn` | [ExamActivityLogController.cs:46](https://github.com/Hopcx/DACN_Project/blob/4d5ff309e130f385d207abbc215f5a3b3b4eaa7c/Project.Api/Controllers/ExamActivityLogController.cs#L46) |
| DELETE | `/web/exam-activity-logs/{id}` | `Delete` | `Chưa gắn` | [ExamActivityLogController.cs:56](https://github.com/Hopcx/DACN_Project/blob/4d5ff309e130f385d207abbc215f5a3b3b4eaa7c/Project.Api/Controllers/ExamActivityLogController.cs#L56) |
| GET | `/web/exams` | `GetAll` | `Chưa gắn` | [ExamController.cs:19](https://github.com/Hopcx/DACN_Project/blob/4d5ff309e130f385d207abbc215f5a3b3b4eaa7c/Project.Api/Controllers/ExamController.cs#L19) |
| GET | `/web/exams/{id}` | `GetById` | `Chưa gắn` | [ExamController.cs:26](https://github.com/Hopcx/DACN_Project/blob/4d5ff309e130f385d207abbc215f5a3b3b4eaa7c/Project.Api/Controllers/ExamController.cs#L26) |
| POST | `/web/exams` | `Create` | `Chưa gắn` | [ExamController.cs:36](https://github.com/Hopcx/DACN_Project/blob/4d5ff309e130f385d207abbc215f5a3b3b4eaa7c/Project.Api/Controllers/ExamController.cs#L36) |
| PUT | `/web/exams/{id}` | `Update` | `Chưa gắn` | [ExamController.cs:46](https://github.com/Hopcx/DACN_Project/blob/4d5ff309e130f385d207abbc215f5a3b3b4eaa7c/Project.Api/Controllers/ExamController.cs#L46) |
| DELETE | `/web/exams/{id}` | `Delete` | `Chưa gắn` | [ExamController.cs:56](https://github.com/Hopcx/DACN_Project/blob/4d5ff309e130f385d207abbc215f5a3b3b4eaa7c/Project.Api/Controllers/ExamController.cs#L56) |
| GET | `/web/exam-details` | `GetAll` | `Chưa gắn` | [ExamDetailController.cs:19](https://github.com/Hopcx/DACN_Project/blob/4d5ff309e130f385d207abbc215f5a3b3b4eaa7c/Project.Api/Controllers/ExamDetailController.cs#L19) |
| GET | `/web/exam-details/{id}` | `GetById` | `Chưa gắn` | [ExamDetailController.cs:26](https://github.com/Hopcx/DACN_Project/blob/4d5ff309e130f385d207abbc215f5a3b3b4eaa7c/Project.Api/Controllers/ExamDetailController.cs#L26) |
| POST | `/web/exam-details` | `Create` | `Chưa gắn` | [ExamDetailController.cs:36](https://github.com/Hopcx/DACN_Project/blob/4d5ff309e130f385d207abbc215f5a3b3b4eaa7c/Project.Api/Controllers/ExamDetailController.cs#L36) |
| PUT | `/web/exam-details/{id}` | `Update` | `Chưa gắn` | [ExamDetailController.cs:46](https://github.com/Hopcx/DACN_Project/blob/4d5ff309e130f385d207abbc215f5a3b3b4eaa7c/Project.Api/Controllers/ExamDetailController.cs#L46) |
| DELETE | `/web/exam-details/{id}` | `Delete` | `Chưa gắn` | [ExamDetailController.cs:56](https://github.com/Hopcx/DACN_Project/blob/4d5ff309e130f385d207abbc215f5a3b3b4eaa7c/Project.Api/Controllers/ExamDetailController.cs#L56) |
| GET | `/web/exam-detail-questions` | `GetAll` | `Chưa gắn` | [ExamDetailQuestionController.cs:19](https://github.com/Hopcx/DACN_Project/blob/4d5ff309e130f385d207abbc215f5a3b3b4eaa7c/Project.Api/Controllers/ExamDetailQuestionController.cs#L19) |
| GET | `/web/exam-detail-questions/{id}` | `GetById` | `Chưa gắn` | [ExamDetailQuestionController.cs:26](https://github.com/Hopcx/DACN_Project/blob/4d5ff309e130f385d207abbc215f5a3b3b4eaa7c/Project.Api/Controllers/ExamDetailQuestionController.cs#L26) |
| POST | `/web/exam-detail-questions` | `Create` | `Chưa gắn` | [ExamDetailQuestionController.cs:36](https://github.com/Hopcx/DACN_Project/blob/4d5ff309e130f385d207abbc215f5a3b3b4eaa7c/Project.Api/Controllers/ExamDetailQuestionController.cs#L36) |
| PUT | `/web/exam-detail-questions/{id}` | `Update` | `Chưa gắn` | [ExamDetailQuestionController.cs:46](https://github.com/Hopcx/DACN_Project/blob/4d5ff309e130f385d207abbc215f5a3b3b4eaa7c/Project.Api/Controllers/ExamDetailQuestionController.cs#L46) |
| DELETE | `/web/exam-detail-questions/{id}` | `Delete` | `Chưa gắn` | [ExamDetailQuestionController.cs:56](https://github.com/Hopcx/DACN_Project/blob/4d5ff309e130f385d207abbc215f5a3b3b4eaa7c/Project.Api/Controllers/ExamDetailQuestionController.cs#L56) |
| GET | `/web/exam-schedules` | `GetAllExamSchedules` | `Chưa gắn` | [ExamScheduleController.cs:19](https://github.com/Hopcx/DACN_Project/blob/4d5ff309e130f385d207abbc215f5a3b3b4eaa7c/Project.Api/Controllers/ExamScheduleController.cs#L19) |
| GET | `/web/exam-schedules/{id}` | `GetExamScheduleById` | `Chưa gắn` | [ExamScheduleController.cs:26](https://github.com/Hopcx/DACN_Project/blob/4d5ff309e130f385d207abbc215f5a3b3b4eaa7c/Project.Api/Controllers/ExamScheduleController.cs#L26) |
| POST | `/web/exam-schedules` | `CreateExamSchedule` | `Chưa gắn` | [ExamScheduleController.cs:36](https://github.com/Hopcx/DACN_Project/blob/4d5ff309e130f385d207abbc215f5a3b3b4eaa7c/Project.Api/Controllers/ExamScheduleController.cs#L36) |
| PUT | `/web/exam-schedules/{id}` | `UpdateExamSchedule` | `Chưa gắn` | [ExamScheduleController.cs:46](https://github.com/Hopcx/DACN_Project/blob/4d5ff309e130f385d207abbc215f5a3b3b4eaa7c/Project.Api/Controllers/ExamScheduleController.cs#L46) |
| DELETE | `/web/exam-schedules/{id}` | `DeleteExamSchedule` | `Chưa gắn` | [ExamScheduleController.cs:56](https://github.com/Hopcx/DACN_Project/blob/4d5ff309e130f385d207abbc215f5a3b3b4eaa7c/Project.Api/Controllers/ExamScheduleController.cs#L56) |
| GET | `/web/levels` | `GetAllLevelAsync` | `Chưa gắn` | [LevelController.cs:20](https://github.com/Hopcx/DACN_Project/blob/4d5ff309e130f385d207abbc215f5a3b3b4eaa7c/Project.Api/Controllers/LevelController.cs#L20) |
| POST | `/web/levels` | `CreateLevelAsync` | `Chưa gắn` | [LevelController.cs:28](https://github.com/Hopcx/DACN_Project/blob/4d5ff309e130f385d207abbc215f5a3b3b4eaa7c/Project.Api/Controllers/LevelController.cs#L28) |
| DELETE | `/web/levels/{id}` | `DeleteLevelAsync` | `Chưa gắn` | [LevelController.cs:42](https://github.com/Hopcx/DACN_Project/blob/4d5ff309e130f385d207abbc215f5a3b3b4eaa7c/Project.Api/Controllers/LevelController.cs#L42) |
| GET | `/web/levels/{levelId}` | `GetUsersByLevelAsync` | `Chưa gắn` | [LevelController.cs:55](https://github.com/Hopcx/DACN_Project/blob/4d5ff309e130f385d207abbc215f5a3b3b4eaa7c/Project.Api/Controllers/LevelController.cs#L55) |
| PUT | `/web/levels/{id}` | `UpdateLevelAsync` | `Chưa gắn` | [LevelController.cs:68](https://github.com/Hopcx/DACN_Project/blob/4d5ff309e130f385d207abbc215f5a3b3b4eaa7c/Project.Api/Controllers/LevelController.cs#L68) |
| GET | `/web/logs` | `GetAll` | `Chưa gắn` | [LogController.cs:19](https://github.com/Hopcx/DACN_Project/blob/4d5ff309e130f385d207abbc215f5a3b3b4eaa7c/Project.Api/Controllers/LogController.cs#L19) |
| GET | `/web/logs/{id}` | `GetById` | `Chưa gắn` | [LogController.cs:26](https://github.com/Hopcx/DACN_Project/blob/4d5ff309e130f385d207abbc215f5a3b3b4eaa7c/Project.Api/Controllers/LogController.cs#L26) |
| POST | `/web/logs` | `Create` | `Chưa gắn` | [LogController.cs:36](https://github.com/Hopcx/DACN_Project/blob/4d5ff309e130f385d207abbc215f5a3b3b4eaa7c/Project.Api/Controllers/LogController.cs#L36) |
| PUT | `/web/logs/{id}` | `Update` | `Chưa gắn` | [LogController.cs:46](https://github.com/Hopcx/DACN_Project/blob/4d5ff309e130f385d207abbc215f5a3b3b4eaa7c/Project.Api/Controllers/LogController.cs#L46) |
| DELETE | `/web/logs/{id}` | `Delete` | `Chưa gắn` | [LogController.cs:56](https://github.com/Hopcx/DACN_Project/blob/4d5ff309e130f385d207abbc215f5a3b3b4eaa7c/Project.Api/Controllers/LogController.cs#L56) |
| GET | `/web/permissions` | `GetAllPermissionAsync` | `Chưa gắn` | [PermissionController.cs:20](https://github.com/Hopcx/DACN_Project/blob/4d5ff309e130f385d207abbc215f5a3b3b4eaa7c/Project.Api/Controllers/PermissionController.cs#L20) |
| POST | `/web/permissions` | `CreatePermissionAsync` | `Chưa gắn` | [PermissionController.cs:28](https://github.com/Hopcx/DACN_Project/blob/4d5ff309e130f385d207abbc215f5a3b3b4eaa7c/Project.Api/Controllers/PermissionController.cs#L28) |
| DELETE | `/web/permissions/{id}` | `DeletePermissionAsync` | `Chưa gắn` | [PermissionController.cs:39](https://github.com/Hopcx/DACN_Project/blob/4d5ff309e130f385d207abbc215f5a3b3b4eaa7c/Project.Api/Controllers/PermissionController.cs#L39) |
| PUT | `/web/permissions/{id}` | `UpdatePermissionAsync` | `Chưa gắn` | [PermissionController.cs:52](https://github.com/Hopcx/DACN_Project/blob/4d5ff309e130f385d207abbc215f5a3b3b4eaa7c/Project.Api/Controllers/PermissionController.cs#L52) |
| GET | `/web/questions` | `GetAll` | `Chưa gắn` | [QuestionController.cs:19](https://github.com/Hopcx/DACN_Project/blob/4d5ff309e130f385d207abbc215f5a3b3b4eaa7c/Project.Api/Controllers/QuestionController.cs#L19) |
| GET | `/web/questions/{id}` | `GetById` | `Chưa gắn` | [QuestionController.cs:26](https://github.com/Hopcx/DACN_Project/blob/4d5ff309e130f385d207abbc215f5a3b3b4eaa7c/Project.Api/Controllers/QuestionController.cs#L26) |
| POST | `/web/questions` | `Create` | `Chưa gắn` | [QuestionController.cs:36](https://github.com/Hopcx/DACN_Project/blob/4d5ff309e130f385d207abbc215f5a3b3b4eaa7c/Project.Api/Controllers/QuestionController.cs#L36) |
| PUT | `/web/questions/{id}` | `Update` | `Chưa gắn` | [QuestionController.cs:46](https://github.com/Hopcx/DACN_Project/blob/4d5ff309e130f385d207abbc215f5a3b3b4eaa7c/Project.Api/Controllers/QuestionController.cs#L46) |
| DELETE | `/web/questions/{id}` | `Delete` | `Chưa gắn` | [QuestionController.cs:56](https://github.com/Hopcx/DACN_Project/blob/4d5ff309e130f385d207abbc215f5a3b3b4eaa7c/Project.Api/Controllers/QuestionController.cs#L56) |
| GET | `/web/question-levels` | `GetAllQuestionLevels` | `Chưa gắn` | [QuestionLevelController.cs:19](https://github.com/Hopcx/DACN_Project/blob/4d5ff309e130f385d207abbc215f5a3b3b4eaa7c/Project.Api/Controllers/QuestionLevelController.cs#L19) |
| GET | `/web/question-levels/{id}` | `GetQuestionLevelById` | `Chưa gắn` | [QuestionLevelController.cs:26](https://github.com/Hopcx/DACN_Project/blob/4d5ff309e130f385d207abbc215f5a3b3b4eaa7c/Project.Api/Controllers/QuestionLevelController.cs#L26) |
| POST | `/web/question-levels` | `CreateQuestionLevel` | `Chưa gắn` | [QuestionLevelController.cs:36](https://github.com/Hopcx/DACN_Project/blob/4d5ff309e130f385d207abbc215f5a3b3b4eaa7c/Project.Api/Controllers/QuestionLevelController.cs#L36) |
| PUT | `/web/question-levels/{id}` | `UpdateQuestionLevel` | `Chưa gắn` | [QuestionLevelController.cs:46](https://github.com/Hopcx/DACN_Project/blob/4d5ff309e130f385d207abbc215f5a3b3b4eaa7c/Project.Api/Controllers/QuestionLevelController.cs#L46) |
| DELETE | `/web/question-levels/{id}` | `DeleteQuestionLevel` | `Chưa gắn` | [QuestionLevelController.cs:56](https://github.com/Hopcx/DACN_Project/blob/4d5ff309e130f385d207abbc215f5a3b3b4eaa7c/Project.Api/Controllers/QuestionLevelController.cs#L56) |
| GET | `/web/question-types` | `GetAllQuestionTypes` | `Chưa gắn` | [QuestionTypeController.cs:19](https://github.com/Hopcx/DACN_Project/blob/4d5ff309e130f385d207abbc215f5a3b3b4eaa7c/Project.Api/Controllers/QuestionTypeController.cs#L19) |
| GET | `/web/question-types/{id}` | `GetQuestionTypeById` | `Chưa gắn` | [QuestionTypeController.cs:26](https://github.com/Hopcx/DACN_Project/blob/4d5ff309e130f385d207abbc215f5a3b3b4eaa7c/Project.Api/Controllers/QuestionTypeController.cs#L26) |
| POST | `/web/question-types` | `CreateQuestionType` | `Chưa gắn` | [QuestionTypeController.cs:36](https://github.com/Hopcx/DACN_Project/blob/4d5ff309e130f385d207abbc215f5a3b3b4eaa7c/Project.Api/Controllers/QuestionTypeController.cs#L36) |
| PUT | `/web/question-types/{id}` | `UpdateQuestionType` | `Chưa gắn` | [QuestionTypeController.cs:46](https://github.com/Hopcx/DACN_Project/blob/4d5ff309e130f385d207abbc215f5a3b3b4eaa7c/Project.Api/Controllers/QuestionTypeController.cs#L46) |
| DELETE | `/web/question-types/{id}` | `DeleteQuestionType` | `Chưa gắn` | [QuestionTypeController.cs:56](https://github.com/Hopcx/DACN_Project/blob/4d5ff309e130f385d207abbc215f5a3b3b4eaa7c/Project.Api/Controllers/QuestionTypeController.cs#L56) |
| GET | `/web/rooms` | `GetRooms` | `[Authorize(Policy = "ScheduleManagement")]` | [RoomController.cs:25](https://github.com/Hopcx/DACN_Project/blob/4d5ff309e130f385d207abbc215f5a3b3b4eaa7c/Project.Api/Controllers/RoomController.cs#L25) |
| GET | `/web/rooms/{id}` | `GetRoomById` | `[Authorize(Policy = "ScheduleManagement")]` | [RoomController.cs:32](https://github.com/Hopcx/DACN_Project/blob/4d5ff309e130f385d207abbc215f5a3b3b4eaa7c/Project.Api/Controllers/RoomController.cs#L32) |
| POST | `/web/rooms` | `CreateRoomAsync` | `[Authorize(Policy = "ScheduleManagement")]` | [RoomController.cs:42](https://github.com/Hopcx/DACN_Project/blob/4d5ff309e130f385d207abbc215f5a3b3b4eaa7c/Project.Api/Controllers/RoomController.cs#L42) |
| PUT | `/web/rooms/{id}` | `UpdateRoomAsync` | `[Authorize(Policy = "ScheduleManagement")]` | [RoomController.cs:52](https://github.com/Hopcx/DACN_Project/blob/4d5ff309e130f385d207abbc215f5a3b3b4eaa7c/Project.Api/Controllers/RoomController.cs#L52) |
| DELETE | `/web/rooms/{id}` | `DeleteRoomAsync` | `[Authorize(Policy = "ScheduleManagement")]` | [RoomController.cs:62](https://github.com/Hopcx/DACN_Project/blob/4d5ff309e130f385d207abbc215f5a3b3b4eaa7c/Project.Api/Controllers/RoomController.cs#L62) |
| GET | `/web/subjects` | `GetAllSubjects` | `Chưa gắn` | [SubjectController.cs:19](https://github.com/Hopcx/DACN_Project/blob/4d5ff309e130f385d207abbc215f5a3b3b4eaa7c/Project.Api/Controllers/SubjectController.cs#L19) |
| GET | `/web/subjects/{id}` | `GetSubjectById` | `Chưa gắn` | [SubjectController.cs:26](https://github.com/Hopcx/DACN_Project/blob/4d5ff309e130f385d207abbc215f5a3b3b4eaa7c/Project.Api/Controllers/SubjectController.cs#L26) |
| POST | `/web/subjects` | `CreateSubject` | `Chưa gắn` | [SubjectController.cs:36](https://github.com/Hopcx/DACN_Project/blob/4d5ff309e130f385d207abbc215f5a3b3b4eaa7c/Project.Api/Controllers/SubjectController.cs#L36) |
| PUT | `/web/subjects/{id}` | `UpdateSubject` | `Chưa gắn` | [SubjectController.cs:46](https://github.com/Hopcx/DACN_Project/blob/4d5ff309e130f385d207abbc215f5a3b3b4eaa7c/Project.Api/Controllers/SubjectController.cs#L46) |
| DELETE | `/web/subjects/{id}` | `DeleteSubject` | `Chưa gắn` | [SubjectController.cs:56](https://github.com/Hopcx/DACN_Project/blob/4d5ff309e130f385d207abbc215f5a3b3b4eaa7c/Project.Api/Controllers/SubjectController.cs#L56) |
| GET | `/web/submissions` | `GetAll` | `Chưa gắn` | [SubmissionController.cs:19](https://github.com/Hopcx/DACN_Project/blob/4d5ff309e130f385d207abbc215f5a3b3b4eaa7c/Project.Api/Controllers/SubmissionController.cs#L19) |
| GET | `/web/submissions/{id}` | `GetById` | `Chưa gắn` | [SubmissionController.cs:26](https://github.com/Hopcx/DACN_Project/blob/4d5ff309e130f385d207abbc215f5a3b3b4eaa7c/Project.Api/Controllers/SubmissionController.cs#L26) |
| POST | `/web/submissions` | `Create` | `Chưa gắn` | [SubmissionController.cs:36](https://github.com/Hopcx/DACN_Project/blob/4d5ff309e130f385d207abbc215f5a3b3b4eaa7c/Project.Api/Controllers/SubmissionController.cs#L36) |
| PUT | `/web/submissions/{id}` | `Update` | `Chưa gắn` | [SubmissionController.cs:46](https://github.com/Hopcx/DACN_Project/blob/4d5ff309e130f385d207abbc215f5a3b3b4eaa7c/Project.Api/Controllers/SubmissionController.cs#L46) |
| DELETE | `/web/submissions/{id}` | `Delete` | `Chưa gắn` | [SubmissionController.cs:56](https://github.com/Hopcx/DACN_Project/blob/4d5ff309e130f385d207abbc215f5a3b3b4eaa7c/Project.Api/Controllers/SubmissionController.cs#L56) |
| GET | `/web/users/get-all-users` | `GetAllUserAsync` | `Chưa gắn` | [UserController.cs:20](https://github.com/Hopcx/DACN_Project/blob/4d5ff309e130f385d207abbc215f5a3b3b4eaa7c/Project.Api/Controllers/UserController.cs#L20) |
| DELETE | `/web/users/delete-user-{id}` | `DeleteUsserAsync` | `Chưa gắn` | [UserController.cs:26](https://github.com/Hopcx/DACN_Project/blob/4d5ff309e130f385d207abbc215f5a3b3b4eaa7c/Project.Api/Controllers/UserController.cs#L26) |
| POST | `/web/users/create-user` | `CreateUserAsync` | `Chưa gắn` | [UserController.cs:42](https://github.com/Hopcx/DACN_Project/blob/4d5ff309e130f385d207abbc215f5a3b3b4eaa7c/Project.Api/Controllers/UserController.cs#L42) |
| GET | `/web/user-permissions` | `GetAll` | `Chưa gắn` | [UserPermissionController.cs:19](https://github.com/Hopcx/DACN_Project/blob/4d5ff309e130f385d207abbc215f5a3b3b4eaa7c/Project.Api/Controllers/UserPermissionController.cs#L19) |
| GET | `/web/user-permissions/{id}` | `GetById` | `Chưa gắn` | [UserPermissionController.cs:26](https://github.com/Hopcx/DACN_Project/blob/4d5ff309e130f385d207abbc215f5a3b3b4eaa7c/Project.Api/Controllers/UserPermissionController.cs#L26) |
| POST | `/web/user-permissions` | `Create` | `Chưa gắn` | [UserPermissionController.cs:36](https://github.com/Hopcx/DACN_Project/blob/4d5ff309e130f385d207abbc215f5a3b3b4eaa7c/Project.Api/Controllers/UserPermissionController.cs#L36) |
| PUT | `/web/user-permissions/{id}` | `Update` | `Chưa gắn` | [UserPermissionController.cs:46](https://github.com/Hopcx/DACN_Project/blob/4d5ff309e130f385d207abbc215f5a3b3b4eaa7c/Project.Api/Controllers/UserPermissionController.cs#L46) |
| DELETE | `/web/user-permissions/{id}` | `Delete` | `Chưa gắn` | [UserPermissionController.cs:56](https://github.com/Hopcx/DACN_Project/blob/4d5ff309e130f385d207abbc215f5a3b3b4eaa7c/Project.Api/Controllers/UserPermissionController.cs#L56) |

Tổng 104 HTTP action declarations tại 23 controllers. Chỉ metadata tĩnh; các controller vẫn có thể bị chặn bởi IADO/DI/DB. Public registration, logout, attempt, Excel/report APIs chưa xuất hiện trong danh mục này.
