import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { APP_NAME, ROUTES } from '../../data/constants'
import Button from '../../components/ui/Button'
import './auth.css'

export default function RegisterPage() {
  const navigate = useNavigate()

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    // Placeholder: sau này gọi API /auth/register, rồi lưu tạm vào state.
    navigate(ROUTES.selectRole)
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

        <h1 className="auth-heading">Đăng Ký</h1>
        <p className="auth-subheading">Tạo tài khoản mới để bắt đầu</p>

        <form onSubmit={handleSubmit}>
          <div className="auth-field">
            <label className="auth-label">Họ tên</label>
            <input
              className="auth-input"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              autoComplete="name"
            />
          </div>

          <div className="auth-field">
            <label className="auth-label">Email</label>
            <input
              className="auth-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="auth-field">
            <label className="auth-label">Số điện thoại</label>
            <input
              className="auth-input"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              autoComplete="tel"
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
              autoComplete="new-password"
            />
          </div>

          <div className="auth-actions">
            <Button type="submit" variant="primary" className="auth-submit">
              ĐĂNG KÝ
            </Button>

            <Link
              to={ROUTES.login}
              className="ui-button ui-button--secondary auth-link-btn"
            >
              ĐĂNG NHẬP
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

