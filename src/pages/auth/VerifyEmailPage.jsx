import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { verifyEmail } from '../../services/authService'
import { getApiError } from '../../api/response'
import { notifyApiError, notifySuccess } from '../../utils/notify'
import { ROUTES } from '../../data/constants'
import './auth.css'

export default function VerifyEmailPage() {
  const location = useLocation()
  const token = new URLSearchParams(location.hash.slice(1)).get('token')
  const [status, setStatus] = useState(token ? 'Đang xác minh email...' : 'Liên kết xác minh không hợp lệ.')

  useEffect(() => {
    if (!token) return
    let active = true
    verifyEmail(token).then(() => { if (active) { setStatus('Email đã được xác minh. Bạn có thể đăng nhập.'); notifySuccess('Email đã được xác minh. Bạn có thể đăng nhập.') } })
      .catch((error) => { if (active) { setStatus(getApiError(error)); notifyApiError(error) } })
    return () => { active = false }
  }, [token])

  return <section className="auth-card"><div className="auth-form">
    <h1 className="auth-heading">Xác minh email</h1>
    <p role="status" className="auth-subheading">{status}</p>
    <div className="auth-actions"><Link to={ROUTES.login} className="ui-button ui-button--primary auth-submit">Đăng nhập</Link></div>
  </div></section>
}
