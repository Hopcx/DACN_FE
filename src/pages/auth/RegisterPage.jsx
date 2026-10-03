import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ROUTES } from '../../data/constants'
import { registerStudent, resendVerification } from '../../services/authService'
import { getApiError } from '../../api/response'
import './auth.css'

export default function RegisterPage() {
  const [form, setForm] = useState({ fullName: '', userName: '', email: '', phoneNumber: '',
    address: '', dateOfBirth: '', sex: '', password: '' })
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function submit(event) {
    event.preventDefault()
    setPending(true); setError(''); setMessage('')
    try {
      await registerStudent({
        ...form, email: form.email.trim(), userName: form.userName.trim(),
        phoneNumber: form.phoneNumber.trim() || null,
        dateOfBirth: `${form.dateOfBirth}T00:00:00`,
        sex: form.sex === 'true',
      })
      setMessage('Đã tiếp nhận đăng ký. Hãy kiểm tra email để xác minh tài khoản.')
    } catch (failure) { setError(getApiError(failure)) }
    finally { setPending(false) }
  }

  async function resend() {
    if (!form.email.trim()) { setError('Nhập email trước khi gửi lại.'); return }
    setPending(true); setError(''); setMessage('')
    try {
      await resendVerification(form.email.trim())
      setMessage('Nếu email có tài khoản chưa xác minh, liên kết mới sẽ được gửi.')
    } catch (failure) { setError(getApiError(failure)) }
    finally { setPending(false) }
  }

  const fields = [
    ['fullName', 'Họ tên', 'text'], ['userName', 'Tên đăng nhập', 'text'],
    ['email', 'Email', 'email'], ['phoneNumber', 'Số điện thoại (tùy chọn)', 'tel'],
    ['address', 'Địa chỉ', 'text'], ['dateOfBirth', 'Ngày sinh', 'date'],
    ['password', 'Mật khẩu', 'password'],
  ]
  return <section className="auth-card">
    <div className="auth-form">
      <h1 className="auth-heading">Đăng ký Student</h1>
      <p className="auth-subheading">Email cần được xác minh trước khi đăng nhập.</p>
      {error && <p role="alert" className="auth-error">{error}</p>}
      {message && <p role="status">{message}</p>}
      <form onSubmit={submit}>
        {fields.map(([key, label, type]) => <div className="auth-field" key={key}>
          <label className="auth-label" htmlFor={key}>{label}</label>
          <input id={key} className="auth-input" type={type}
            required={key !== 'phoneNumber'} minLength={key === 'password' ? 8 : undefined}
            autoComplete={key === 'password' ? 'new-password' : undefined}
            value={form[key]} onChange={(event) => setForm({ ...form, [key]: event.target.value })} />
        </div>)}
        <div className="auth-field">
          <label className="auth-label" htmlFor="sex">Giới tính</label>
          <select id="sex" className="auth-input" required value={form.sex}
            onChange={(event) => setForm({ ...form, sex: event.target.value })}>
            <option value="">Chọn</option><option value="true">Nam</option><option value="false">Nữ</option>
          </select>
        </div>
        <div className="auth-actions">
          <button type="submit" className="ui-button ui-button--primary" disabled={pending}>Đăng ký</button>
          <button type="button" className="ui-button ui-button--outline" disabled={pending} onClick={resend}>Gửi lại email</button>
          <Link to={ROUTES.login} className="ui-button ui-button--secondary">Đăng nhập</Link>
        </div>
      </form>
    </div>
  </section>
}
