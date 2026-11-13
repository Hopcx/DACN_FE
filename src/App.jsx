import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import AuthLayout from './components/layout/AuthLayout'
import RequireLevel from './components/auth/RequireLevel'
import RequireAuth from './components/auth/RequireAuth'
import { PageLoading } from './components/ui/PageState'
import PageErrorBoundary from './components/ui/PageErrorBoundary'
const HomePage = lazy(() => import('./pages/HomePage'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'))
const LoginPage = lazy(() => import('./pages/auth/LoginPage'))
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'))
const VerifyEmailPage = lazy(() => import('./pages/auth/VerifyEmailPage'))
const SelectRolePage = lazy(() => import('./pages/auth/SelectRolePage'))
const AdminDashboardPage = lazy(() => import('./pages/dashboard/AdminDashboardPage'))
const AdminAttemptsPage = lazy(() => import('./pages/dashboard/AdminAttemptsPage'))
const TeacherOverviewPage = lazy(() => import('./pages/dashboard/TeacherOverviewPage'))
const AdminAuditPage = lazy(() => import('./pages/audit/AdminAuditPage'))
const ProfilePage = lazy(() => import('./pages/account/ProfilePage'))
const AdminUsersPage = lazy(() => import('./pages/account/AdminUsersPage'))
const CatalogPage = lazy(() => import('./pages/catalog/CatalogPage'))
const UserPermissionsPage = lazy(() => import('./pages/catalog/UserPermissionsPage'))
const AdminClassesPage = lazy(() => import('./pages/classes/AdminClassesPage'))
const StudentClassesPage = lazy(() => import('./pages/classes/StudentClassesPage'))
const TeacherClassesPage = lazy(() => import('./pages/classes/TeacherClassesPage'))
const QuestionBankPage = lazy(() => import('./pages/questions/QuestionBankPage'))
const ExamManagementPage = lazy(() => import('./pages/exams/ExamManagementPage'))
const AdminSchedulesPage = lazy(() => import('./pages/schedules/AdminSchedulesPage'))
const StudentSchedulesPage = lazy(() => import('./pages/schedules/StudentSchedulesPage'))
const StudentAttemptPage = lazy(() => import('./pages/attempts/StudentAttemptPage'))
const StudentAttemptHistoryPage = lazy(() => import('./pages/attempts/StudentAttemptHistoryPage'))

export default function App() {
  return (
    <PageErrorBoundary fullScreen>
    <Suspense fallback={<PageLoading fullScreen />}>
    <Routes>
      <Route path="/" element={<HomePage />} />

      <Route path="auth" element={<AuthLayout />}>
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="verify-email" element={<VerifyEmailPage />} />
        <Route path="register/role" element={<SelectRolePage />} />
      </Route>

      <Route element={<RequireAuth />}>
        <Route path="admin" element={<RequireLevel levels={[1, 2]} />}>
          <Route path="dashboard" element={<AdminDashboardPage />} />
          <Route path="attempts" element={<AdminAttemptsPage />} />
          <Route path="audit" element={<AdminAuditPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="levels" element={<CatalogPage key="levels" kind="levels" />} />
          <Route path="permissions" element={<CatalogPage key="permissions" kind="permissions" />} />
          <Route path="user-permissions" element={<UserPermissionsPage />} />
          <Route path="subjects" element={<CatalogPage key="subjects" kind="subjects" />} />
          <Route path="rooms" element={<CatalogPage key="rooms" kind="rooms" />} />
          <Route path="classes" element={<AdminClassesPage />} />
          <Route path="questions" element={<QuestionBankPage />} />
          <Route path="exams" element={<ExamManagementPage />} />
          <Route path="schedules" element={<AdminSchedulesPage />} />
        </Route>
        <Route path="student" element={<RequireLevel levels={[4]} />}>
          <Route path="profile" element={<ProfilePage />} />
          <Route path="classes" element={<StudentClassesPage />} />
          <Route path="schedules" element={<StudentSchedulesPage />} />
          <Route path="attempts/:id" element={<StudentAttemptPage />} />
          <Route path="attempts" element={<StudentAttemptHistoryPage />} />
        </Route>
        <Route path="teacher" element={<RequireLevel levels={[3]} />}>
          <Route path="profile" element={<ProfilePage />} />
          <Route path="overview" element={<TeacherOverviewPage />} />
          <Route path="classes" element={<TeacherClassesPage />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
    </Suspense>
    </PageErrorBoundary>
  )
}
