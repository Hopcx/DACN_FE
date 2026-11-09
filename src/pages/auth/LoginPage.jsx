import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ROUTES } from '../../data/constants'
import Button from '../../components/ui/Button'
import './auth.css'
import { login } from '../../services/authService'
import { notifyApiError, notifyWarning } from '../../utils/notify'

export default function LoginPage() {
  const navigate = useNavigate()

  const [emailOrPhone, setEmailOrPhone] = useState('')
  const [password, setPassword] = useState('')
  const [pending, setPending] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (pending) return
    if (!emailOrPhone.trim()) return notifyWarning('Vui lòng nhập tên đăng nhập, email hoặc số điện thoại.')
    if (!password) return notifyWarning('Vui lòng nhập mật khẩu.')
    setPending(true)
    try {
      const user = await login(emailOrPhone.trim(), password)
      navigate(String(user.levelId) === '4' ? ROUTES.myClasses
        : String(user.levelId) === '3' ? ROUTES.teacherClasses : ROUTES.adminDashboard, { replace: true })
    } catch (failure) {
      notifyApiError(failure)
    } finally {
      setPending(false)
    }
  }

  return (
    <section className="auth-card">
      <div className="auth-form">
        <h1 className="auth-heading">Đăng nhập</h1>
        <p className="auth-subheading">Chào mừng bạn quay trở lại DACN</p>

        <form onSubmit={handleSubmit} noValidate>
          <div className="auth-field">
            <label className="auth-label" htmlFor="login-keyword">Email hoặc số điện thoại</label>
            <input
              id="login-keyword"
              className="auth-input"
              type="text"
              placeholder="Nhập tên đăng nhập, email hoặc số điện thoại"
              value={emailOrPhone}
              onChange={(e) => setEmailOrPhone(e.target.value)}
              autoComplete="username"
            />
          </div>

          <div className="auth-field">
            <label className="auth-label" htmlFor="login-password">Mật khẩu</label>
            <input
              id="login-password"
              className="auth-input"
              type="password"
              placeholder="Nhập mật khẩu của bạn"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          <div className="auth-actions">
            <Button type="submit" variant="primary" className="auth-submit" disabled={pending}>
              {pending ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </Button>

            <Link to={ROUTES.register} className="ui-button ui-button--secondary auth-link-btn">
              Tạo tài khoản mới
            </Link>
            <Link to={ROUTES.home} className="auth-back">← Về trang giới thiệu</Link>
          </div>
        </form>
      </div>
    </section>
  )
}
