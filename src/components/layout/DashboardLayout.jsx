import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { logout } from '../../services/authService'
import { getApiError } from '../../api/response'
import { ROUTES } from '../../data/constants'
import { useSelector } from 'react-redux'
import './DashboardLayout.css'

export default function DashboardLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const [logoutError, setLogoutError] = useState('')
  const [logoutPending, setLogoutPending] = useState(false)
  const user = useSelector((state) => state.auth.user)

  const navItems = String(user?.levelId) === '4' ? [
    { to: ROUTES.myClasses, label: 'Lớp học của tôi', icon: 'S' },
    { to: ROUTES.profile, label: 'Hồ sơ của tôi', icon: 'P' },
  ] : [
    { to: '/admin/dashboard', label: 'Trang chủ', icon: 'H' },
    { to: '/admin/dashboard', label: 'Quản lý Lịch Thi', icon: 'L' },
    ...(String(user?.levelId) === '1' ? [{ to: ROUTES.classes, label: 'Quản lý Lớp Học', icon: 'C' }] : []),
    ...((user?.permissions || []).some((id) => String(id) === '1') ? [{ to: ROUTES.exams, label: 'Quản lý Đề Thi', icon: 'E' }] : []),
    { to: '/admin/dashboard', label: 'Bài Thi', icon: 'T' },
    ...((user?.permissions || []).some((id) => String(id) === '2') ? [{ to: ROUTES.questions, label: 'Ngân hàng Câu Hỏi', icon: 'Q' }] : []),
    ...((user?.permissions || []).some((id) => String(id) === '3') ? [{ to: ROUTES.subjects, label: 'Quản lý Môn Học', icon: 'M' }] : []),
    ...((user?.permissions || []).some((id) => String(id) === '4') ? [{ to: ROUTES.rooms, label: 'Quản lý Phòng Thi', icon: 'R' }] : []),
    ...(String(user?.levelId) === '4' ? [{ to: ROUTES.myClasses, label: 'Lớp học của tôi', icon: 'S' }] : []),
    { to: ROUTES.profile, label: 'Hồ sơ của tôi', icon: 'P' },
    ...(String(user?.levelId) === '1' ? [
      { to: ROUTES.users, label: 'Tài khoản', icon: 'U' },
      { to: ROUTES.levels, label: 'Cấp tài khoản', icon: 'V' },
      { to: ROUTES.permissions, label: 'Quyền', icon: 'Q' },
      { to: ROUTES.userPermissions, label: 'Gán quyền', icon: 'G' },
    ] : []),
  ]

  return (
    <div className="dashboard-shell">
      <aside className="dashboard-sidebar">
        <div className="dashboard-sidebar__brand">
          <div className="dashboard-logo-mark" aria-hidden="true">
            T
          </div>
          <div className="dashboard-sidebar__brand-name">Testify</div>
        </div>

        <nav className="dashboard-nav" aria-label="Dashboard navigation">
          {navItems.map((item) => {
            const isActive = location.pathname === item.to
            return (
              <Link
                key={`${item.to}-${item.label}`}
                to={item.to}
                className={`dashboard-nav__item ${isActive ? 'is-active' : ''}`}
              >
                <span
                  className="dashboard-nav__icon"
                  aria-hidden="true"
                  title={item.label}
                >
                  {item.icon}
                </span>
                <span className="dashboard-nav__label">{item.label}</span>
              </Link>
            )
          })}
        </nav>
        {logoutError && <p role="alert" className="account-error">{logoutError}</p>}
        <button type="button" className="dashboard-logout" disabled={logoutPending} onClick={async () => {
          setLogoutPending(true); setLogoutError('')
          try { await logout(); navigate(ROUTES.login, { replace: true }) }
          catch (error) { setLogoutError(getApiError(error)) }
          finally { setLogoutPending(false) }
        }}>
          Đăng xuất
        </button>
      </aside>

      <div className="dashboard-main">
        <Outlet />
      </div>
    </div>
  )
}
