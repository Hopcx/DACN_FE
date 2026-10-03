# Model và UI route declarations cũ

Trích cấu trúc tự động; field/property không chứng minh có cột DB được áp dụng. Không bao gồm giá trị cấu hình hoặc seed.

## Model properties

### Answer
Nguồn `Testify.DAL/Models/Answer.cs`, dòng 7413.

`Id: int`, `QuestionId: int`, `Question: Question?`, `Content: string`, `IsCorrect: bool`, `Status: byte?`, `CreatedBy: Guid?`, `UpdatedBy: Guid?`, `UpdatedAt: DateTime?`, `CreatedAt: DateTime?`

### AnswerSubmission
Nguồn `Testify.DAL/Models/AnswerSubmission.cs`, dòng 7440.

`Id: int`, `SubmissionId: int`, `AnswerId: int`, `QuestionId: int`, `Submission: Submission?`, `Answer: Answer?`, `Question: Question?`

### BlackListToken
Nguồn `Testify.DAL/Models/BlackListToken.cs`, dòng 7468.

`Id: int`, `Token: string`, `ExpiryDate: DateTime`, `BlacklistAt: DateTime`

### Class
Nguồn `Testify.DAL/Models/Class.cs`, dòng 7489.

`Id: int`, `Name: string`, `ClassCode: string`, `Description: string?`, `Capacity: int`, `TeacherId: Guid`, `SubjectId: int?`, `Subject: Subject?`, `ClassUsers: ICollection<ClassUser>?`, `Status: byte?`

### ClassExamSchedule
Nguồn `Testify.DAL/Models/ClassExamSchedule.cs`, dòng 7519.

`Id: int`, `ClassId: int`, `Class: Class?`, `ExamScheduleId: int`, `ExamSchedule: ExamSchedule?`

### ClassUser
Nguồn `Testify.DAL/Models/ClassUser.cs`, dòng 7542.

`Id: int`, `ClassId: int`, `Class: Class?`, `UserId: Guid`, `User: User?`, `Status: byte?`

### DoingExam
Nguồn `Testify.DAL/Models/DoingExam.cs`, dòng 7565.

`Id: int`, `UserId: Guid`, `ExamId: int`, `ExamDetailId: int?`, `InProgress: bool?`, `StartTime: DateTime`, `ExamScheduleId: int`, `Content: string?`

### Exam
Nguồn `Testify.DAL/Models/Exam.cs`, dòng 7593.

`Id: int`, `Name: string`, `Description: string?`, `SubjectId: int`, `Subject: Subject?`, `NumberOfQuestions: int`, `NumberOfRepeat: int`, `Status: byte`, `MaximmumMark: double`, `PassMark: double`, `AllowViewResult: bool?`, `Duration: int`, `ScoreMethodId: int?`, `ScoreMethod: ScoreMethod?`, `ExamDetails: ICollection<ExamDetail>?`, `CreatedBy: Guid?`, `UpdatedBy: Guid?`, `UpdatedAt: DateTime?`, `CreatedAt: DateTime?`

### ExamActivityLog
Nguồn `Testify.DAL/Models/ExamActivityLog.cs`, dòng 7630.

`Id: int`, `ExamId: int`, `ExamDetailId: int?`, `ExamScheduleId: int?`, `UserId: Guid`, `ActionTime: DateTime`, `ActionType: string?`, `User: User?`, `Exam: Exam?`, `ExamDetail: ExamDetail?`

### ExamDetail
Nguồn `Testify.DAL/Models/ExamDetail.cs`, dòng 7665.

`Id: int`, `ExamId: int`, `Exam: Exam?`, `Code: string`, `Status: byte?`, `CreateDate: DateTime`, `CreateBy: Guid`, `UpdateDate: DateTime`, `UpdateBy: Guid`

### ExamDetailQuestion
Nguồn `Testify.DAL/Models/ExamDetailQuestion.cs`, dòng 7692.

`Id: int`, `ExamDetailId: int`, `ExamDetail: ExamDetail?`, `QuestionId: int`, `Question: Question?`, `Point: double`

### ExamSchedule
Nguồn `Testify.DAL/Models/ExamSchedule.cs`, dòng 7716.

`Id: int`, `ExamId: int`, `Exams: ICollection<Exam>?`, `Title: string?`, `StartTime: DateTime`, `EndTime: DateTime`, `Description: string?`, `Status: byte?`, `SubjectId: int?`, `Subject: Subject?`, `RoomId: int?`, `Room: Room?`, `CreatedBy: Guid?`, `UpdatedBy: Guid?`, `UpdatedAt: DateTime?`, `CreatedAt: DateTime?`

### Level
Nguồn `Testify.DAL/Models/Level.cs`, dòng 7752.

`Id: int`, `Name: string`, `Status: byte?`, `Users: ICollection<User>?`

### Organization
Nguồn `Testify.DAL/Models/Organization.cs`, dòng 7771.

`Id: int`, `OrganizationCode: string`, `Name: string`, `Address: string`, `ContactPhone: string?`, `Email: string?`

### OrganizationUser
Nguồn `Testify.DAL/Models/OrganizationUser.cs`, dòng 7794.

`Id: int`, `OrganizationId: int`, `Organization: Organization`, `UserId: Guid`, `User: User`, `Status: bool?`

### Permission
Nguồn `Testify.DAL/Models/Permission.cs`, dòng 7817.

`Id: int`, `Name: string`, `Description: string`, `Status: byte?`

### Question
Nguồn `Testify.DAL/Models/Question.cs`, dòng 7833.

`Id: int`, `Content: string`, `CreatedDate: DateTime`, `Status: byte?`, `SubjectId: int`, `DocumentPath: string?`, `QuestionTypeId: int`, `QuestionType: QuestionType?`, `QuestionLevelId: int?`, `QuestionLevel: QuestionLevel?`, `CreatedBy: Guid?`, `UpdatedBy: Guid?`, `UpdatedAt: DateTime?`, `CreatedAt: DateTime?`, `QuestionAnswers: ICollection<QuestionAnswer>?`, `ExamDetailQuestions: ICollection<ExamDetailQuestion>?`

### QuestionAnswer
Nguồn `Testify.DAL/Models/QuestionAnswer.cs`, dòng 7865.

`Id: int`, `QuestionId: int`, `Question: Question`, `AnswerId: int`, `Answer: Answer`

### QuestionLevel
Nguồn `Testify.DAL/Models/QuestionLevel.cs`, dòng 7888.

`Id: int`, `Name: string`, `Description: string?`, `Status: bool?`, `Questions: ICollection<Question>?`

### QuestionType
Nguồn `Testify.DAL/Models/QuestionType.cs`, dòng 7908.

`Id: int`, `Name: string`, `Description: string`, `Status: bool?`

### RefreshToken
Nguồn `Testify.DAL/Models/RefreshToken.cs`, dòng 7927.

`Id: int`, `UserId: Guid`, `Token: string`, `ExpiryDate: DateTime`, `CreatedAt: DateTime`, `IsRevoked: bool`

### Room
Nguồn `Testify.DAL/Models/Room.cs`, dòng 7950.

`Id: int`, `Name: string`, `Capacity: int`, `Address: string`, `Status: bool?`

### ScoreMethod
Nguồn `Testify.DAL/Models/ScoreMethod.cs`, dòng 7973.

`Id: int`, `Name: string`, `Description: string`, `Status: byte?`, `Exams: ICollection<Exam>?`

### Subject
Nguồn `Testify.DAL/Models/Subject.cs`, dòng 7993.

`Id: int`, `Name: string`, `Description: string?`, `Status: byte?`, `CreatedBy: Guid?`, `UpdatedBy: Guid?`, `UpdatedAt: DateTime?`, `CreatedAt: DateTime?`, `ExamSchedules: ICollection<ExamSchedule>?`, `Exams: ICollection<Exam>?`

### Submission
Nguồn `Testify.DAL/Models/Submission.cs`, dòng 8019.

`Id: int`, `UserId: Guid`, `User: User?`, `ExamDetailId: int`, `ExamDetail: ExamDetail?`, `ExamScheduleId: int`, `ExamSchedule: ExamSchedule?`, `SubmitTime: DateTime`, `TimeTaken: TimeSpan`, `TotalMark: double`, `IsPassed: bool`, `UnAnswered: int`, `Answered: int`, `Note: string?`, `Type: byte?`, `Status: bool?`, `AnswerSubmissions: ICollection<AnswerSubmission>?`

### User
Nguồn `Testify.DAL/Models/User.cs`, dòng 8061.

`Id: Guid`, `FullName: string`, `UserName: string`, `DateOfBirth: DateTime`, `PhoneNumber: string`, `Address: string`, `Email: string`, `PasswordHash: string`, `AvatarUrl: string?`, `Sex: bool`, `LastLogin: DateTime?`, `Status: byte`, `LevelId: int`, `Level: Level?`, `ClassUsers: ICollection<ClassUser>?`, `UserPermissions: ICollection<UserPermission>?`, `Submissions: ICollection<Submission>?`, `ExamActivityLogs: ICollection<ExamActivityLog>?`

### UserLog
Nguồn `Testify.DAL/Models/UserLog.cs`, dòng 8096.

`Id: int`, `Message: string?`, `MessageTemplate: string?`, `Level: string?`, `TimeStamp: DateTime?`, `Exception: string?`, `Properties: string?`

### UserPermission
Nguồn `Testify.DAL/Models/UserPermission.cs`, dòng 8115.

`Id: int`, `UserId: Guid`, `PermissionId: int`, `Permission: Permission?`, `User: User?`

## Razor routes

| File | Route khai báo | Dòng export |
|---|---|---:|
| `Testify.Web/Components/Pages/Counter.razor` | `/counter` | 13936 |
| `Testify.Web/Components/Pages/Error.razor` | `/Error` | 13960 |
| `Testify.Web/Components/Pages/NotFoundPage.razor` | `/404` | 14003 |
| `Testify.Web/Components/Pages/ResultOfSubmission.razor` | `/result-of-submission/{Id:int?}` | 14149 |
| `Testify.Web/Components/Pages/ViewExamTest.razor` | `/ExamTest/{idExam:int}` | 14710 |
| `Testify.Web/Components/Pages/Weather.razor` | `/weather` | 15380 |
| `Testify.Web/Components/Pages/Access/ChangePassword.razor` | `/ChangePassword` | 15446 |
| `Testify.Web/Components/Pages/Admin/AccountLogs.razor` | `/Account/Logs` | 15638 |
| `Testify.Web/Components/Pages/Admin/AdminReport.razor` | `/Admin/Report` | 15831 |
| `Testify.Web/Components/Pages/Admin/Home.razor` | `/Admin/Home` | 15931 |
| `Testify.Web/Components/Pages/Admin/InformationAdmin.razor` | `/Admin-Information` | 16328 |
| `Testify.Web/Components/Pages/Admin/ScoreDistribution/ByClass.razor` | `/ScoreDistribution-Class` | 16620 |
| `Testify.Web/Components/Pages/Admin/ScoreDistribution/ByExam.razor` | `/ScoreDistribution-Exam` | 16761 |
| `Testify.Web/Components/Pages/Admin/ScoreDistribution/BySubject.razor` | `/ScoreDistribution-Subject` | 16922 |
| `Testify.Web/Components/Pages/Examiner/AccountManagement.razor` | `/Examiner/AccountManagement` | 17075 |
| `Testify.Web/Components/Pages/Examiner/AnswerManagement.razor` | `/Examiner/AnswerManagement` | 17373 |
| `Testify.Web/Components/Pages/Examiner/ClassManagement.razor` | `/Examiner/ClassManagement` | 17523 |
| `Testify.Web/Components/Pages/Examiner/CreateExamDetail.razor` | `/Examiner/CreateExamDetail` | 17851 |
| `Testify.Web/Components/Pages/Examiner/Dashboard.razor` | `/Examiner/Home` | 18126 |
| `Testify.Web/Components/Pages/Examiner/ExamManagement.razor` | `/Examiner/ExamManagement` | 18249 |
| `Testify.Web/Components/Pages/Examiner/ExamScheduleManagement.razor` | `/Examiner/ExamScheduleManagement` | 18563 |
| `Testify.Web/Components/Pages/Examiner/PermissionManagement.razor` | `/Examiner/PermissionManagement` | 18852 |
| `Testify.Web/Components/Pages/Examiner/QuestionLevelManagement.razor` | `/Examiner/QuestionLevelManagement` | 19047 |
| `Testify.Web/Components/Pages/Examiner/QuestionManagement.razor` | `/Examiner/QuestionManagement` | 19209 |
| `Testify.Web/Components/Pages/Examiner/QuestionTypeManagement.razor` | `/Examiner/QuestionTypeManagement` | 19570 |
| `Testify.Web/Components/Pages/Examiner/RoomManagement.razor` | `/Examiner/RoomManagement` | 19722 |
| `Testify.Web/Components/Pages/Examiner/StaffManagement.razor` | `/Examiner/StaffManagement` | 19858 |
| `Testify.Web/Components/Pages/Examiner/StudentManagement.razor` | `/Student/StudentManagement` | 20004 |
| `Testify.Web/Components/Pages/Examiner/SubjectMn.razor` | `/Examiner/SubjectManagement` | 20149 |
| `Testify.Web/Components/Pages/Examiner/ViewDetailExam.razor` | `/Examiner/ViewDetailExam` | 20350 |
| `Testify.Web/Components/Pages/Examiner/Dialog/Exam/CreateExam.razor` | `/Examiner/ExamManagement/CreateExam` | 23939 |
| `Testify.Web/Components/Pages/Student/Calendar.razor` | `/Student/Calendar` | 27995 |
| `Testify.Web/Components/Pages/Student/CLassOfStudent.razor` | `/Class` | 28098 |
| `Testify.Web/Components/Pages/Student/Home.razor` | `/Student/Home` | 28253 |
| `Testify.Web/Components/Pages/Student/InformationStudent.razor` | `/Student-Information` | 28484 |
| `Testify.Web/Components/Pages/Student/ListExam.razor` | `/ExamList` | 28675 |
| `Testify.Web/Components/Pages/Student/Ranked.razor` | `/Student/Ranked` | 28779 |
