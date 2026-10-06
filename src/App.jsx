import { Route, Routes } from 'react-router-dom'
import MainLayout from './components/layout/MainLayout'
import AuthLayout from './components/layout/AuthLayout'
import DashboardLayout from './components/layout/DashboardLayout'
import HomePage from './pages/HomePage'
import NotFoundPage from './pages/NotFoundPage'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import VerifyEmailPage from './pages/auth/VerifyEmailPage'
import SelectRolePage from './pages/auth/SelectRolePage'
import AdminDashboardPage from './pages/dashboard/AdminDashboardPage'
import RequireAuth from './components/auth/RequireAuth'
import ProfilePage from './pages/account/ProfilePage'
import AdminUsersPage from './pages/account/AdminUsersPage'
import CatalogPage from './pages/catalog/CatalogPage'
import UserPermissionsPage from './pages/catalog/UserPermissionsPage'
import AdminClassesPage from './pages/classes/AdminClassesPage'
import StudentClassesPage from './pages/classes/StudentClassesPage'
import QuestionBankPage from './pages/questions/QuestionBankPage'
import ExamManagementPage from './pages/exams/ExamManagementPage'

export default function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<HomePage />} />
      </Route>

      <Route path="auth" element={<AuthLayout />}>
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="verify-email" element={<VerifyEmailPage />} />
        <Route path="register/role" element={<SelectRolePage />} />
      </Route>

      <Route element={<RequireAuth />}>
        <Route path="admin" element={<DashboardLayout />}>
          <Route path="dashboard" element={<AdminDashboardPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="levels" element={<CatalogPage kind="levels" />} />
          <Route path="permissions" element={<CatalogPage kind="permissions" />} />
          <Route path="user-permissions" element={<UserPermissionsPage />} />
          <Route path="subjects" element={<CatalogPage kind="subjects" />} />
          <Route path="rooms" element={<CatalogPage kind="rooms" />} />
          <Route path="classes" element={<AdminClassesPage />} />
          <Route path="questions" element={<QuestionBankPage />} />
          <Route path="exams" element={<ExamManagementPage />} />
        </Route>
        <Route path="student" element={<DashboardLayout />}>
          <Route path="classes" element={<StudentClassesPage />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
