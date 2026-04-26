import { Link, Outlet, useLocation } from 'react-router-dom'
import './DashboardLayout.css'

export default function DashboardLayout() {
  const location = useLocation()

  const navItems = [
    { to: '/admin/dashboard', label: 'Trang chủ', icon: 'H' },
    { to: '/admin/dashboard', label: 'Quản lý Lịch Thi', icon: 'L' },
    { to: '/admin/dashboard', label: 'Quản lý Lớp Học', icon: 'C' },
    { to: '/admin/dashboard', label: 'Quản lý Đề Thi', icon: 'E' },
    { to: '/admin/dashboard', label: 'Bài Thi', icon: 'T' },
    { to: '/admin/dashboard', label: 'Quản lý Môn Học', icon: 'M' },
    { to: '/admin/dashboard', label: 'Lớp học', icon: 'S' },
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
      </aside>

      <div className="dashboard-main">
        <Outlet />
      </div>
    </div>
  )
}