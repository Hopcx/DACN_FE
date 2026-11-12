import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Suspense, useState } from 'react'
import { useSelector } from 'react-redux'
import { Avatar, Dropdown } from 'antd'
import {
  ApartmentOutlined, AppstoreOutlined, BankOutlined, BarChartOutlined, BookOutlined, CalendarOutlined, DashboardOutlined, FileTextOutlined,
  FileSearchOutlined, HistoryOutlined, HomeOutlined, KeyOutlined, LogoutOutlined, MenuOutlined, QuestionCircleOutlined,
  ReadOutlined, SafetyOutlined, ScheduleOutlined, SolutionOutlined, TeamOutlined, UserOutlined,
} from '@ant-design/icons'
import { logout } from '../../services/authService'
import { getApiError } from '../../api/response'
import { ROUTES } from '../../data/constants'
import { PageLoading } from '../ui/PageState'
import './DashboardLayout.css'

const ROLE_LABELS = { 1: 'Quản trị viên', 2: 'Người ra đề', 3: 'Giảng viên', 4: 'Học viên' }

const STUDENT_NAV = [
  { to: ROUTES.myClasses, label: 'Lớp', icon: <ReadOutlined /> },
  { to: ROUTES.mySchedules, label: 'Lịch thi', icon: <ScheduleOutlined /> },
  { to: '/student/attempts', label: 'Bài đã làm', icon: <HistoryOutlined /> },
]

export default function DashboardLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const [logoutError, setLogoutError] = useState('')
  const [logoutPending, setLogoutPending] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const user = useSelector((state) => state.auth.user)
  const level = String(user?.levelId)
  const isAdmin = level === '1'
  // Admin có toàn quyền: không bị giới hạn bởi quyền chi tiết nào.
  const can = (id) => isAdmin || (user?.permissions || []).some((item) => String(item) === String(id))
  const profileRoute = level === '3' ? ROUTES.teacherProfile : level === '4' ? ROUTES.studentProfile : ROUTES.profile
  const topNav = level === '4'

  const sections = level === '3' ? [{ items: [
      { to: ROUTES.teacherOverview, label: 'Tổng quan', icon: <DashboardOutlined /> },
      { to: ROUTES.teacherClasses, label: 'Lớp của tôi', icon: <TeamOutlined /> },
    ] }]
    : topNav ? [] : [
      { items: [{ to: '/admin/dashboard', label: 'Trang chủ', icon: <HomeOutlined /> }] },
      { title: 'Quản lý', items: [
        ...(can(4) ? [{ to: ROUTES.schedules, label: 'Quản lý lịch thi', icon: <CalendarOutlined /> }] : []),
        ...(isAdmin ? [{ to: ROUTES.classes, label: 'Quản lý lớp học', icon: <ApartmentOutlined /> }] : []),
        ...(isAdmin ? [{ to: ROUTES.users, label: 'Quản lý tài khoản', icon: <UserOutlined /> }] : []),
        ...(can(1) ? [{ to: ROUTES.exams, label: 'Quản lý bài thi', icon: <FileTextOutlined /> }] : []),
        ...(can(3) ? [{ to: ROUTES.subjects, label: 'Quản lý môn học', icon: <BookOutlined /> }] : []),
        ...(can(2) ? [{ to: ROUTES.questions, label: 'Quản lý câu hỏi', icon: <QuestionCircleOutlined /> }] : []),
        ...(can(4) ? [{ to: ROUTES.rooms, label: 'Phòng thi', icon: <BankOutlined /> }] : []),
      ] },
      ...(isAdmin ? [
        { title: 'Báo cáo', items: [
          { to: ROUTES.attempts, label: 'Danh sách bài làm', icon: <BarChartOutlined /> },
          { to: ROUTES.audit, label: 'Nhật ký hệ thống', icon: <FileSearchOutlined /> },
        ] },
        { title: 'Phân quyền', items: [
          { to: ROUTES.levels, label: 'Cấp tài khoản', icon: <SolutionOutlined /> },
          { to: ROUTES.permissions, label: 'Danh mục quyền', icon: <SafetyOutlined /> },
          { to: ROUTES.userPermissions, label: 'Phân quyền người dùng', icon: <KeyOutlined /> },
        ] },
        { title: 'Khu vực giảng viên', items: [
          { to: ROUTES.teacherOverview, label: 'Tổng quan giảng viên', icon: <DashboardOutlined /> },
          { to: ROUTES.teacherClasses, label: 'Lớp và kết quả', icon: <TeamOutlined /> },
        ] },
        { title: 'Khu vực học viên', items: STUDENT_NAV.map((item) => ({ ...item, label: item.label === 'Lớp' ? 'Lớp học' : item.label })) },
      ] : []),
    ]

  async function handleLogout() {
    setLogoutPending(true); setLogoutError('')
    try { await logout(); navigate(ROUTES.login, { replace: true }) }
    catch (error) { setLogoutError(getApiError(error)) }
    finally { setLogoutPending(false) }
  }

  const displayName = user?.fullName || user?.userName || 'Người dùng'
  const menu = {
    items: [
      { key: 'profile', icon: <UserOutlined />, label: 'Hồ sơ của tôi' },
      { key: 'logout', icon: <LogoutOutlined />, label: logoutPending ? 'Đang đăng xuất...' : 'Đăng xuất', danger: true, disabled: logoutPending },
    ],
    onClick: ({ key }) => { if (key === 'profile') navigate(profileRoute); else handleLogout() },
  }
  const userMenu = (
    <Dropdown menu={menu} trigger={['click']} placement="bottomRight">
      <button type="button" className="dashboard-user">
        <Avatar style={{ background: '#26a69a' }}>{displayName.trim().charAt(0).toUpperCase()}</Avatar>
        <span className="dashboard-user__info">
          <span className="dashboard-user__name">{displayName}</span>
          <span className="dashboard-user__role">{ROLE_LABELS[user?.levelId] || ''}</span>
        </span>
      </button>
    </Dropdown>
  )
  const active = (to) => location.pathname === to || location.pathname.startsWith(`${to}/`)

  if (topNav) {
    return (
      <div className="student-shell">
        <header className="student-topbar">
          <Link to={ROUTES.mySchedules} className="student-topbar__brand">DACN</Link>
          <nav className="student-topbar__nav" aria-label="Điều hướng chính">
            {STUDENT_NAV.map((item) => (
              <Link key={item.to} to={item.to} className={`student-topbar__link ${active(item.to) ? 'is-active' : ''}`}>
                {item.icon}<span>{item.label}</span>
              </Link>
            ))}
          </nav>
          {userMenu}
        </header>
        {logoutError && <p role="alert" className="account-error dashboard-alert">{logoutError}</p>}
        <main className="dashboard-main"><Suspense fallback={<PageLoading />}><Outlet /></Suspense></main>
      </div>
    )
  }

  return (
    <div className={`dashboard-shell ${collapsed ? 'is-collapsed' : ''}`}>
      <aside className="dashboard-sidebar">
        <div className="dashboard-sidebar__brand">
          <div className="dashboard-logo-mark" aria-hidden="true"><AppstoreOutlined /></div>
          <div className="dashboard-sidebar__brand-text">
            <div className="dashboard-sidebar__brand-name">DACN</div>
            <div className="dashboard-sidebar__brand-sub">{level === '3' ? 'Giảng viên' : 'Quản trị'}</div>
          </div>
        </div>
        <nav className="dashboard-nav" aria-label="Điều hướng chính">
          {sections.map((section, index) => section.items.length > 0 && (
            <div key={section.title || index} className="dashboard-nav__section">
              {section.title && <div className="dashboard-nav__title">{section.title}</div>}
              {section.items.map((item) => (
                <Link key={item.to} to={item.to} title={item.label}
                  className={`dashboard-nav__item ${active(item.to) ? 'is-active' : ''}`}>
                  <span className="dashboard-nav__icon" aria-hidden="true">{item.icon}</span>
                  <span className="dashboard-nav__label">{item.label}</span>
                </Link>
              ))}
            </div>
          ))}
        </nav>
      </aside>

      <div className="dashboard-body">
        <header className="dashboard-topbar">
          <button type="button" className="dashboard-topbar__toggle" aria-label="Thu gọn menu"
            onClick={() => setCollapsed((value) => !value)}><MenuOutlined /></button>
          <div className="dashboard-topbar__spacer" />
          {userMenu}
        </header>
        {logoutError && <p role="alert" className="account-error dashboard-alert">{logoutError}</p>}
        <main className="dashboard-main"><Suspense fallback={<PageLoading />}><Outlet /></Suspense></main>
      </div>
    </div>
  )
}
