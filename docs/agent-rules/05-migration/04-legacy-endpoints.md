# Endpoint declarations cũ

Mục lục: mỗi controller là một section. Trích các attribute HTTP đang không comment trong export. Route ghép ở đây là template khai báo, không chứng minh quyền, response, hoặc endpoint chạy thành công. Không dùng route cũ làm contract React mới một cách máy móc.

## Access

Nguồn: `Testify.API/Controllers/AccessController.cs`; class route: `Access`.

| Verb | Template | Symbol | Dòng export |
|---|---|---|---:|
| GET | `Access/Login` | `LoginReturnToken` | 602 |
| GET | `Access/CheckToken` | `CheckAndGetToken` | 665 |
| POST | `Access/Register` | `RegisterUser` | 696 |

## Answer

Nguồn: `Testify.API/Controllers/AnswerController.cs`; class route: `Answer`.

| Verb | Template | Symbol | Dòng export |
|---|---|---|---:|
| GET | `Answer/Get-All-Answers` | `GetAllAnswers` | 736 |
| GET | `Answer/Get-All-Answer-By-QuestionId` | `GetAllAnswerByQuestionId` | 743 |
| GET | `Answer/Get-Answer-By-Id` | `GetAnswerById` | 750 |
| POST | `Answer/Create-Answer` | `Create` | 757 |
| PUT | `Answer/Update-Answer` | `Update` | 764 |
| PUT | `Answer/Update-Status-Answer` | `UpdateSatus` | 771 |
| DELETE | `Answer/Delete-Answer` | `Delete` | 778 |

## AnswerSubmission

Nguồn: `Testify.API/Controllers/AnswerSubmissionController.cs`; class route: `AnswerSubmission`.

| Verb | Template | Symbol | Dòng export |
|---|---|---|---:|
| POST | `AnswerSubmission/Create-AnswerSubmission` | `Create` | 819 |
| GET | `AnswerSubmission/Get-AnswerById` | `GetAnswerById` | 826 |

## Candidate

Nguồn: `Testify.API/Controllers/CandidateController.cs`; class route: `Candidate`.

| Verb | Template | Symbol | Dòng export |
|---|---|---|---:|
| GET | `Candidate/Get-All-Candidate` | `GetlAllCandidate` | 856 |
| GET | `Candidate/Get-Candidate-By-Id` | `GetCandidateById` | 863 |
| POST | `Candidate/Create-Candidate` | `Create` | 870 |
| PUT | `Candidate/Update-Candidate` | `Update` | 876 |
| DELETE | `Candidate/Delete-Candidate` | `Delete` | 883 |

## Class

Nguồn: `Testify.API/Controllers/ClassController.cs`; class route: `Class`.

| Verb | Template | Symbol | Dòng export |
|---|---|---|---:|
| GET | `Class/Get-Classes` | `GetAll` | 914 |
| GET | `Class/Get-ClassList` | `GetList` | 921 |
| GET | `Class/Get-Classes-BySubjectIdExcludeInSchedule` | `GetAll` | 928 |
| GET | `Class/get-classes-by-id` | `GetByIdRoom` | 935 |
| GET | `Class/get-classes-by-TeacherID` | `GetByTeacherID` | 942 |
| GET | `Class/Get-Class-By-ClassCode` | `GetClassByCode` | 949 |
| POST | `Class/Add-Class` | `CreateClass` | 957 |
| DELETE | `Class/Delete-Class` | `DeleteClass` | 964 |
| PUT | `Class/Update-Class` | `UpdateClass` | 981 |
| PUT | `Class/Update-Status` | `UpdateStatus` | 988 |
| GET | `Class/Get-Count-Class-By-UserId` | `GetCountClass` | 995 |
| GET | `Class/Get-Users-In-Class` | `GetUsersInClassById` | 1003 |
| GET | `Class/Get-Classes-By-UserId` | `GetClassesByUserId` | 1009 |
| GET | `Class/Score-Distribution-By-Class` | `ScoreDistributionByClass` | 1016 |
| GET | `Class/Get-Classes-OfTeacher` | `GetAllClass_OfTeacher` | 1024 |

## ClassExamSchedule

Nguồn: `Testify.API/Controllers/ClassExamScheduleController.cs`; class route: `ClassExamSchedule`.

| Verb | Template | Symbol | Dòng export |
|---|---|---|---:|
| GET | `ClassExamSchedule/Get-Class-ByScheduleId` | `GetClassByScheduleId` | 1061 |
| POST | `ClassExamSchedule/Add-ListClassToSchedule` | `AddListClassToSchedule` | 1067 |
| POST | `ClassExamSchedule/Remove-ListClassToSchedule` | `RemoveListClassToSchedule` | 1073 |
| POST | `ClassExamSchedule/Checks-StudentExist-InSchedule` | `GetStudentExist` | 1079 |

## ClassUser

Nguồn: `Testify.API/Controllers/ClassUserController.cs`; class route: `ClassUser`.

| Verb | Template | Symbol | Dòng export |
|---|---|---|---:|
| GET | `ClassUser/Get-All` | `GetAll` | 1160 |
| GET | `ClassUser/Get-By-StudentId` | `GetAllByStudentId` | 1166 |
| POST | `ClassUser/Create-ClassUser` | `Create` | 1173 |
| PUT | `ClassUser/Update-Status` | `UpdateStatus` | 1180 |
| DELETE | `ClassUser/Delete-User-In-Class` | `DeleteUserInClass` | 1194 |
| GET | `ClassUser/Get-All-Class-By-UserId` | `GetAllClassByUserId` | 1201 |

## ExamActivityLog

Nguồn: `Testify.API/Controllers/ExamActivityLogController.cs`; class route: `ExamActivityLog`.

| Verb | Template | Symbol | Dòng export |
|---|---|---|---:|
| GET | `ExamActivityLog/GetAllByExamId` | `GetAllByExamId` | 1230 |
| GET | `ExamActivityLog/GetAllByUidAndEid` | `GetAllByUidAndEid` | 1236 |
| POST | `ExamActivityLog/AddExamLog` | `AddExLog` | 1242 |
| GET | `ExamActivityLog/GetAllByUserId` | `GetAllByUserId` | 1248 |
| GET | `ExamActivityLog/GetById` | `GetById` | 1254 |

## Exam

Nguồn: `Testify.API/Controllers/ExamController.cs`; class route: `Exam`.

| Verb | Template | Symbol | Dòng export |
|---|---|---|---:|
| GET | `Exam/Get-Active` | `GetAllActicve` | 1284 |
| GET | `Exam/Get-ExamBySubject` | `GetBySubject` | 1290 |
| GET | `Exam/Get-ExamHaveExDetailBySubject` | `GetExamHaveExDetailBySubject` | 1296 |
| GET | `Exam/Get-Exams` | `GetAll` | 1302 |
| GET | `Exam/get-exams-by-id` | `GetByIdExam` | 1308 |
| POST | `Exam/Add-Exam` | `CreateExam` | 1314 |
| PUT | `Exam/Delete-Exam` | `DeleteExam` | 1320 |
| PUT | `Exam/Update-Exam` | `UpdateClass` | 1336 |
| GET | `Exam/Get-InfoBasic` | `GetInfoBasic` | 1343 |
| GET | `Exam/Get-Count-Exam-By-UserId` | `GetCountExamByUserId` | 1380 |
| GET | `Exam/Get-Exams-By-UserId` | `GetExamsByUserId` | 1387 |
| GET | `Exam/Score-Distribution-By-Exam` | `ScoreDistributionByExam` | 1394 |
| GET | `Exam/Check-TrungNamExam` | `ChekTrungCodeDT_Exam` | 1401 |

## ExamDetail

Nguồn: `Testify.API/Controllers/ExamDetailController.cs`; class route: `ExamDetail`.

| Verb | Template | Symbol | Dòng export |
|---|---|---|---:|
| GET | `ExamDetail/Get-ExamDetail` | `GetAll` | 1432 |
| GET | `ExamDetail/Get-ExamDetail-id` | `GetExamDetailId` | 1439 |
| GET | `ExamDetail/Get-ExamDetail-By-ExamID` | `GetExamDetailByExamId` | 1446 |
| POST | `ExamDetail/Create-Exam-Detail` | `Create` | 1453 |
| DELETE | `ExamDetail/Delete-ExamDetail` | `DeleteExamDetail` | 1460 |
| PUT | `ExamDetail/Update-satus` | `UpdateStatus` | 1477 |
| GET | `ExamDetail/CheckTrungCodeDT` | `ChekTrungCodeDT` | 1484 |

## ExamDetailQuestion

Nguồn: `Testify.API/Controllers/ExamDetailQuestionController.cs`; class route: `ExamDetailQuestion`.

| Verb | Template | Symbol | Dòng export |
|---|---|---|---:|
| GET | `ExamDetailQuestion/Get-ExamDetailQuestion-By-ExamDetailID` | `GetExamDetailQuestionByExamId` | 1518 |
| POST | `ExamDetailQuestion/Create` | `CreateExamDetailQuestion` | 1525 |
| DELETE | `ExamDetailQuestion/Delete` | `DeleteExamDetailQuestionsByExamDetailId` | 1532 |
| GET | `ExamDetailQuestion/Get-Question-By-ExamDetailID` | `GetAllQuestionByExamDetailID` | 1540 |
| GET | `ExamDetailQuestion/Get-Question-By-ExamDetailID-Not` | `GetAllQuestionByExamDetailID_NOT` | 1547 |
| GET | `ExamDetailQuestion/Get-Question-By-ExamDetailID-NotAndLevel` | `GetAllQuestionByExamDetailID_NOTAndLevel` | 1566 |
| POST | `ExamDetailQuestion/AddListQuestionToExam_New` | `AddListQuestionToExam` | 1583 |
| POST | `ExamDetailQuestion/Remove-ListQuestionToExam` | `RemoveFromListQuestionToExam` | 1592 |

## ExamSchedule

Nguồn: `Testify.API/Controllers/ExamScheduleController.cs`; class route: `ExamSchedule`.

| Verb | Template | Symbol | Dòng export |
|---|---|---|---:|
| POST | `ExamSchedule/Create` | `Add` | 1625 |
| GET | `ExamSchedule/Get-All` | `GetAll` | 1630 |
| GET | `ExamSchedule/Get-Future` | `GetScheduleFuture` | 1636 |
| GET | `ExamSchedule/Get-Past` | `GetSchedulePast` | 1643 |
| GET | `ExamSchedule/Get-Active` | `GetScheduleActive` | 1650 |
| GET | `ExamSchedule/Get-Current` | `GetScheduleCurrent` | 1658 |
| GET | `ExamSchedule/Get-InfoBasic` | `GetInfoBasic` | 1665 |
| PUT | `ExamSchedule/Update` | `UpdateSchedule` | 1698 |
| DELETE | `ExamSchedule/Delete` | `DeleteSchedule` | 1705 |
| GET | `ExamSchedule/Get-InTime` | `GetInTime` | 1711 |
| GET | `ExamSchedule/Get-InTime-ExcludeId` | `GetInTime` | 1717 |
| GET | `ExamSchedule/Get-InTime-NoSubject` | `GetInTimeNoSubject` | 1723 |
| GET | `ExamSchedule/Get-ById` | `GetById` | 1729 |
| GET | `ExamSchedule/Get-ExamScheduleTimes-By-ClassUserIdAsync` | `GetExamScheduleTimesByClassUserIdAsync` | 1735 |
| GET | `ExamSchedule/Get-All-Schedule-ByStudentId` | `GetAllScheduleOfStudentById` | 1740 |
| GET | `ExamSchedule/Get-ExamSchedule-By-UserId` | `GetAllExamScheduleByUserId` | 1770 |
| GET | `ExamSchedule/Get-Count-By-UserId` | `GetCountByUserId` | 1777 |
| GET | `ExamSchedule/Check-LT` | `Check_LichTHI` | 1784 |

## Lecturer

Nguồn: `Testify.API/Controllers/LecturerController.cs`; class route: `Lecturer`.

| Verb | Template | Symbol | Dòng export |
|---|---|---|---:|
| GET | `Lecturer/Get-All-Lecturer` | `GetlAllLecturer` | 1822 |
| GET | `Lecturer/Get-score` | `GetAllScore` | 1829 |
| GET | `Lecturer/Get-score2` | `GetAllScore2` | 1836 |
| GET | `Lecturer/Get-Lecturer-By-Id` | `GetLecturerById` | 1842 |
| POST | `Lecturer/Create-Lecturer` | `Create` | 1849 |
| POST | `Lecturer/Create-Students` | `CreateStu` | 1856 |
| PUT | `Lecturer/Update-Lecturer` | `Update` | 1862 |
| PUT | `Lecturer/Update-Forgot-Password` | `UpdateForgotPass` | 1869 |
| GET | `Lecturer/Get-All-Teacher` | `GetlAllTeacher` | 1876 |
| GET | `Lecturer/Get-All-Student` | `GetlAllStudent` | 1883 |
| GET | `Lecturer/Get-All-List-Exam-By-StudentId` | `GetExamStudentId` | 1891 |
| DELETE | `Lecturer/Delete-Lecturer` | `Delete` | 1900 |
| POST | `Lecturer/Import-Excel-User` | `UploadFile` | 1918 |
| POST | `Lecturer/Create-User-In-Import-Excel` | `CreateAccountInExcel` | 1971 |
| GET | `Lecturer/Get-ClassByTeacher` | `GetByTeacher` | 1997 |
| GET | `Lecturer/Get-Score-Class-By-Teacher` | `Check` | 2003 |
| GET | `Lecturer/Get-All-Count-Student-By-UserId` | `GetCountStudent` | 2010 |
| GET | `Lecturer/Confirm-Email` | `ConfirmEmail` | 2017 |

## Level

Nguồn: `Testify.API/Controllers/LevelController.cs`; class route: `Level`.

| Verb | Template | Symbol | Dòng export |
|---|---|---|---:|
| GET | `Level/get-all-level-by-id` | `GetAllById` | 2050 |
| GET | `Level/get-all` | `GetAll` | 2057 |
| GET | `Level/get-user-by-idlevel` | `GetUserById` | 2063 |

## Log

Nguồn: `Testify.API/Controllers/LogController.cs`; class route: `LogUser`.

| Verb | Template | Symbol | Dòng export |
|---|---|---|---:|
| GET | `LogUser/by-guid` | `GetLogsByGuid` | 2095 |

## Permission

Nguồn: `Testify.API/Controllers/PermissionController.cs`; class route: `Permission`.

| Verb | Template | Symbol | Dòng export |
|---|---|---|---:|
| GET | `Permission/GetAll` | `GetAll` | 2133 |

## Question

Nguồn: `Testify.API/Controllers/QuestionController.cs`; class route: `Question`.

| Verb | Template | Symbol | Dòng export |
|---|---|---|---:|
| GET | `Question/Get-All-Questions` | `GetlAllQuestions` | 2176 |
| GET | `Question/Get-Question-By-Id` | `GetQuestionById` | 2189 |
| GET | `Question/Check-Validate` | `CheckValidate` | 2196 |
| GET | `Question/Check-Update` | `CheckUpdate` | 2204 |
| POST | `Question/Create-Question` | `Create` | 2211 |
| PUT | `Question/Update-Question` | `Update` | 2218 |
| PUT | `Question/Update-UploadFile-Question` | `UpdateUpload` | 2225 |
| PUT | `Question/Update-Status` | `UpdateStatus` | 2232 |
| DELETE | `Question/Delete-Question` | `Delete` | 2239 |
| GET | `Question/Get-AnswerIsTrue-Point-Question` | `GetQuestionWithTrueAnswer` | 2256 |
| GET | `Question/Export-Excel-Template-Question` | `ExportExcel` | 2263 |
| POST | `Question/Import-Excel-Question` | `UploadFile` | 2490 |
| GET | `Question/Export-Question-By-SubjectId` | `ExportQuestionBySubjectId` | 2643 |
| GET | `Question/Get-Question-By-Id_Sub-And-Level` | `GetAllQuestionById_sub_andlevel` | 2768 |
| GET | `Question/Get-Question-By-Id_Sub` | `GetAllQuestionById_sub` | 2776 |
| GET | `Question/Get-Count-By-UserId` | `GetCountByUserId` | 2784 |

## QuestionLevel

Nguồn: `Testify.API/Controllers/QuestionLevelController.cs`; class route: `QuestionLevel`.

| Verb | Template | Symbol | Dòng export |
|---|---|---|---:|
| GET | `QuestionLevel/Get-All-Question-Level` | `GetAllQuestionTypes` | 2815 |
| GET | `QuestionLevel/Get-Question-Level-By-Id` | `GetQuestionTypeById` | 2823 |
| POST | `QuestionLevel/Create-Question-Level` | `Create` | 2830 |
| PUT | `QuestionLevel/Update-Question-Level` | `Update` | 2837 |
| DELETE | `QuestionLevel/Delete-Question-Level` | `Delete` | 2844 |

## QuestionType

Nguồn: `Testify.API/Controllers/QuestionTypeController.cs`; class route: `QuestionType`.

| Verb | Template | Symbol | Dòng export |
|---|---|---|---:|
| GET | `QuestionType/Get-All-Question-Type` | `GetAllQuestionTypes` | 2885 |
| GET | `QuestionType/Get-Question-Type-By-Id` | `GetQuestionTypeById` | 2892 |
| POST | `QuestionType/Create-Question-Type` | `Create` | 2899 |
| PUT | `QuestionType/Update-Question-Type` | `Update` | 2906 |
| DELETE | `QuestionType/Delete-Question-Type` | `Delete` | 2913 |

## Room

Nguồn: `Testify.API/Controllers/RoomController.cs`; class route: `Room`.

| Verb | Template | Symbol | Dòng export |
|---|---|---|---:|
| GET | `Room/get-all-room` | `GetAll` | 2943 |
| GET | `Room/get-room-by-id` | `GetByIdRoom` | 2950 |
| POST | `Room/create-room` | `Create` | 2957 |
| PUT | `Room/update-room` | `Update` | 2964 |
| DELETE | `Room/delete-room` | `Delete` | 2971 |

## Subject

Nguồn: `Testify.API/Controllers/SubjectController.cs`; class route: `Subject`.

| Verb | Template | Symbol | Dòng export |
|---|---|---|---:|
| GET | `Subject/get-all-subject` | `GetAll` | 3002 |
| GET | `Subject/get-subject-by-id` | `GetByIdSub` | 3009 |
| POST | `Subject/create-subject` | `Create` | 3016 |
| PUT | `Subject/update-subject` | `Update` | 3023 |
| DELETE | `Subject/delete-subject` | `Delete` | 3030 |
| GET | `Subject/Get-Count-By-UserId` | `GetCountByUserId` | 3047 |
| GET | `Subject/Score-Distribution-By-Subject` | `ScoreDistributionBySubject` | 3054 |
| GET | `Subject/get-all-by-subjectId` | `GetAllSubmissionsAsync` | 3061 |

## Submission

Nguồn: `Testify.API/Controllers/SubmissionController.cs`; class route: `submission`.

| Verb | Template | Symbol | Dòng export |
|---|---|---|---:|
| GET | `submission/Get-All-Submission` | `GetAll` | 3092 |
| GET | `submission/Get-By-Id` | `GetById` | 3098 |
| POST | `submission/Create-Submission` | `Create` | 3104 |
| GET | `submission/Check-NumberOfSubmit` | `NumberOfSubmits` | 3111 |
| GET | `submission/Get-SubmitHistory` | `GetHistory` | 3117 |
| GET | `submission/Submitted-By-User` | `GetSubmittedByUser` | 3123 |
| GET | `submission/Achievenments` | `GetAllAchievenment` | 3129 |
| POST | `submission/Update-Status` | `UpdateStatus` | 3135 |

## Token

Nguồn: `Testify.API/Controllers/TokenController.cs`; class route: `Token`.

| Verb | Template | Symbol | Dòng export |
|---|---|---|---:|
| GET | `Token/GetToken` | `Index` | 3165 |

## User

Nguồn: `Testify.API/Controllers/UserController.cs`; class route: `User`.

| Verb | Template | Symbol | Dòng export |
|---|---|---|---:|
| POST | `User/Register-Student` | `RegisterStudent` | 3206 |
| GET | `User/get-all-users` | `GetAll` | 3221 |
| GET | `User/Get-By-idUser` | `GetByidUser` | 3228 |
| POST | `User/create-user` | `CreateAccount` | 3235 |
| PUT | `User/update-user` | `UpdateAccount` | 3242 |
| DELETE | `User/delete-user` | `DeleteAccount` | 3249 |
| GET | `User/Export-Excel-Template-Account` | `ExportTemplateAccount` | 3256 |
| POST | `User/Import-Excel-User` | `UploadFile` | 3396 |
| GET | `User/Get-Users-With-Status-One` | `UsersWithStatusOne` | 3494 |
| GET | `User/Get-Users-With-Status-Two` | `UsersWithStatusTwo` | 3501 |
| GET | `User/Check-Email-Or-Phone` | `CheckEmailOrPhone` | 3508 |
| GET | `User/Get-Users-Not-In-Class` | `GetUsersNotInClassAsync` | 3515 |
| GET | `User/Export-Account-By-LevelId` | `ExportAccountByLevelId` | 3524 |

## UserPermission

Nguồn: `Testify.API/Controllers/UserPermissionController.cs`; class route: `UserPermission`.

| Verb | Template | Symbol | Dòng export |
|---|---|---|---:|
| POST | `UserPermission/Create-UserPermission` | `Create` | 3680 |
| DELETE | `UserPermission/Delete-ListUserPermission` | `RemoveListUP` | 3687 |
| DELETE | `UserPermission/Delete-UserPermission` | `Delete` | 3694 |
| GET | `UserPermission/Get-PermissionByUserId` | `GetPermissionByUserId` | 3701 |
| GET | `UserPermission/Check-PermissionByUserIdAndName` | `CheckPermission` | 3707 |
| POST | `UserPermission/Add-ListUserPermission` | `AddListUserPermission` | 3713 |

## WeatherForecast

Nguồn: `Testify.API/Controllers/WeatherForecastController.cs`; class route: `WeatherForecast`.

| Verb | Template | Symbol | Dòng export |
|---|---|---|---:|
