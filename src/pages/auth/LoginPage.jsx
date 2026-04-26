import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { APP_NAME, ROUTES } from '../../data/constants'
import Button from '../../components/ui/Button'
import './auth.css'

export default function LoginPage() {
  const navigate = useNavigate()

  const [emailOrPhone, setEmailOrPhone] = useState('')
  const [password, setPassword] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    // Placeholder: sau này gọi API /auth/login
    navigate(ROUTES.adminDashboard, { state: { role: 'Đăng nhập' } })
  }

  return (
    <section className="auth-card">
      <div className="auth-form">
        <div className="auth-brand">
          <div className="auth-brand__mark" aria-hidden="true">
            D
          </div>
          <div className="auth-brand__name">{APP_NAME}</div>
        </div>

        <h1 className="auth-heading">Đăng Nhập</h1>
        <p className="auth-subheading">Nhập thông tin để tiếp tục</p>

        <form onSubmit={handleSubmit}>
          <div className="auth-field">
            <label className="auth-label">Email/ Số điện thoại</label>
            <input
              className="auth-input"
              type="text"
              value={emailOrPhone}
              onChange={(e) => setEmailOrPhone(e.target.value)}
              required
              autoComplete="username"
            />
          </div>

          <div className="auth-field">
            <label className="auth-label">Mật khẩu</label>
            <input
              className="auth-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          <div className="auth-forgot">
            <a
              className="auth-forgot__link"
              href="#"
              onClick={(e) => e.preventDefault()}
            >
              Quên mật khẩu?
            </a>
          </div>

          <div className="auth-actions">
            <Button type="submit" variant="primary" className="auth-submit">
              ĐĂNG NHẬP
            </Button>

            <Link
              to={ROUTES.register}
              className="ui-button ui-button--secondary auth-link-btn"
            >
              ĐĂNG KÍ
            </Link>

            <button
              type="button"
              className="ui-button ui-button--outline auth-google-btn"
              onClick={() => {}}
            >
              Google
            </button>
          </div>
        </form>
      </div>

      <div className="auth-hero" aria-hidden="true">
        <div className="auth-hero__img" />
      </div>
    </section>
  )
}

