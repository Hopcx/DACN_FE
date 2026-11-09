import { useState } from 'react'
import { Link } from 'react-router-dom'
import { DatePicker } from 'antd'
import dayjs from 'dayjs'
import 'dayjs/locale/vi'
import { ROUTES } from '../../data/constants'
import { registerStudent, resendVerification } from '../../services/authService'
import { notifyApiError, notifySuccess, notifyWarning } from '../../utils/notify'
import './auth.css'

const DATE_FORMAT = 'DD/MM/YYYY'

const FIELDS = [
  { key: 'fullName', label: 'Họ và tên', type: 'text', placeholder: 'Ví dụ: Nguyễn Văn An', autoComplete: 'name' },
  { key: 'userName', label: 'Tên đăng nhập', type: 'text', placeholder: 'Từ 6 ký tự: chữ không dấu, số, dấu gạch dưới', autoComplete: 'username' },
  { key: 'email', label: 'Email', type: 'email', placeholder: 'Ví dụ: ten@example.com', autoComplete: 'email' },
  { key: 'phoneNumber', label: 'Số điện thoại (không bắt buộc)', type: 'tel', placeholder: 'Gồm 10 hoặc 11 chữ số', autoComplete: 'tel' },
  { key: 'address', label: 'Địa chỉ', type: 'text', placeholder: 'Số nhà, đường, phường/xã, tỉnh/thành phố', autoComplete: 'street-address' },
]

export default function RegisterPage() {
  const [form, setForm] = useState({ fullName: '', userName: '', email: '', phoneNumber: '',
    address: '', sex: '', password: '' })
  const [dateOfBirth, setDateOfBirth] = useState(() => dayjs())
  const [pending, setPending] = useState(false)

  function validate() {
    if (!form.fullName.trim()) return 'Vui lòng nhập họ và tên.'
    if (form.userName.trim().length < 6) return 'Tên đăng nhập phải có ít nhất 6 ký tự.'
    if (!/^[a-zA-Z0-9_]+$/.test(form.userName.trim())) return 'Tên đăng nhập chỉ gồm chữ cái không dấu, số và dấu gạch dưới.'
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) return 'Email không đúng định dạng (ví dụ: ten@example.com).'
    if (form.phoneNumber.trim() && !/^[0-9]{10,11}$/.test(form.phoneNumber.trim())) return 'Số điện thoại phải gồm 10 hoặc 11 chữ số.'
    if (!form.address.trim()) return 'Vui lòng nhập địa chỉ.'
    if (!dateOfBirth) return 'Vui lòng chọn ngày sinh.'
    if (!form.sex) return 'Vui lòng chọn giới tính.'
    if (form.password.length < 8) return 'Mật khẩu phải có ít nhất 8 ký tự.'
    if (!/[A-Z]/.test(form.password) || !/[a-z]/.test(form.password) || !/\d/.test(form.password))
      return 'Mật khẩu phải có ít nhất một chữ hoa, một chữ thường và một chữ số.'
    return ''
  }

  async function submit(event) {
    event.preventDefault()
    if (pending) return
    const problem = validate()
    if (problem) return notifyWarning(problem, 'Vui lòng kiểm tra lại thông tin')
    setPending(true)
    try {
      await registerStudent({
        ...form, email: form.email.trim(), userName: form.userName.trim(), fullName: form.fullName.trim(),
        address: form.address.trim(), phoneNumber: form.phoneNumber.trim() || null,
        dateOfBirth: `${dateOfBirth.format('YYYY-MM-DD')}T00:00:00`,
        sex: form.sex === 'true',
      })
      notifySuccess('Đăng ký thành công. Vui lòng kiểm tra email để xác minh tài khoản trước khi đăng nhập.')
    } catch (failure) { notifyApiError(failure) }
    finally { setPending(false) }
  }

  async function resend() {
    if (!form.email.trim()) return notifyWarning('Vui lòng nhập email trước khi gửi lại email xác minh.')
    setPending(true)
    try {
      await resendVerification(form.email.trim())
      notifySuccess('Nếu email có tài khoản chưa xác minh, liên kết xác minh mới sẽ được gửi.')
    } catch (failure) { notifyApiError(failure) }
    finally { setPending(false) }
  }

  const set = (key) => (event) => setForm({ ...form, [key]: event.target.value })
  return <section className="auth-card auth-card--wide">
    <div className="auth-form">
      <h1 className="auth-heading">Đăng ký</h1>
      <p className="auth-subheading">Tạo tài khoản học viên. Email cần được xác minh trước khi đăng nhập.</p>
      <form onSubmit={submit} noValidate>
        {FIELDS.map(({ key, label, type, placeholder, autoComplete }) => <div className="auth-field" key={key}>
          <label className="auth-label" htmlFor={key}>{label}</label>
          <input id={key} className="auth-input" type={type} placeholder={placeholder}
            autoComplete={autoComplete} value={form[key]} onChange={set(key)} />
        </div>)}
        <div className="auth-row">
          <div className="auth-field">
            <label className="auth-label" htmlFor="dateOfBirth">Ngày sinh</label>
              <DatePicker id="dateOfBirth" className="auth-date" format={DATE_FORMAT} value={dateOfBirth}
                onChange={setDateOfBirth} allowClear={false} placeholder="dd/mm/yyyy" inputReadOnly
                disabledDate={(day) => day.isAfter(dayjs(), 'day')} />
          </div>
          <div className="auth-field">
            <label className="auth-label" htmlFor="sex">Giới tính</label>
            <select id="sex" className="auth-input" value={form.sex} onChange={set('sex')}>
              <option value="">Chọn giới tính</option><option value="true">Nam</option><option value="false">Nữ</option>
            </select>
          </div>
        </div>
        <div className="auth-field">
          <label className="auth-label" htmlFor="password">Mật khẩu</label>
          <input id="password" className="auth-input" type="password" autoComplete="new-password"
            placeholder="Tối thiểu 8 ký tự, gồm chữ hoa, chữ thường và số" value={form.password} onChange={set('password')} />
        </div>
        <div className="auth-actions">
          <button type="submit" className="ui-button ui-button--primary auth-submit" disabled={pending}>
            {pending ? 'Đang xử lý...' : 'Đăng ký'}
          </button>
          <button type="button" className="ui-button ui-button--outline" disabled={pending} onClick={resend}>Gửi lại email xác minh</button>
          <p className="auth-switch">Đã có tài khoản? <Link to={ROUTES.login}>Đăng nhập ngay</Link></p>
          <Link to={ROUTES.home} className="auth-back">← Về trang giới thiệu</Link>
        </div>
      </form>
    </div>
  </section>
}
