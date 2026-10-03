import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { changePassword, getProfile, updateProfile } from '../../services/accountService'
import { logout } from '../../services/authService'
import { getApiError } from '../../api/response'
import { ROUTES } from '../../data/constants'
import './account.css'

export default function ProfilePage() {
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [pending, setPending] = useState(false)

  useEffect(() => {
    let active = true
    getProfile().then((data) => { if (active) setProfile(data) })
      .catch((failure) => { if (active) setError(getApiError(failure)) })
    return () => { active = false }
  }, [])

  async function saveProfile(event) {
    event.preventDefault()
    setPending(true); setError(''); setMessage('')
    try {
      setProfile(await updateProfile({ fullName: profile.fullName, address: profile.address }))
      setMessage('Đã cập nhật hồ sơ.')
    } catch (failure) { setError(getApiError(failure)) }
    finally { setPending(false) }
  }

  async function savePassword(event) {
    event.preventDefault()
    if (newPassword !== confirmPassword) { setError('Mật khẩu xác nhận không khớp.'); return }
    setPending(true); setError(''); setMessage('')
    try {
      await changePassword(oldPassword, newPassword)
      await logout()
      navigate(ROUTES.login, { replace: true })
    } catch (failure) { setError(getApiError(failure)) }
    finally { setPending(false) }
  }

  return <section className="account-page">
    <h1>Hồ sơ của tôi</h1>
    {error && <p role="alert" className="account-error">{error}</p>}
    {message && <p role="status">{message}</p>}
    {!profile && !error && <p>Đang tải hồ sơ...</p>}
    {profile && <>
      <form onSubmit={saveProfile} className="account-form">
        <label>Họ tên<input required maxLength="100" value={profile.fullName || ''} onChange={(e) => setProfile({ ...profile, fullName: e.target.value })} /></label>
        <label>Địa chỉ<input required maxLength="200" value={profile.address || ''} onChange={(e) => setProfile({ ...profile, address: e.target.value })} /></label>
        <p>Tên đăng nhập: {profile.userName} · Email: {profile.email}</p>
        <button disabled={pending}>Lưu hồ sơ</button>
      </form>
      <form onSubmit={savePassword} className="account-form">
        <h2>Đổi mật khẩu</h2>
        <label>Mật khẩu cũ<input required type="password" autoComplete="current-password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} /></label>
        <label>Mật khẩu mới<input required type="password" minLength="8" autoComplete="new-password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} /></label>
        <label>Nhập lại mật khẩu mới<input required type="password" autoComplete="new-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} /></label>
        <button disabled={pending}>Đổi mật khẩu</button>
      </form>
    </>}
  </section>
}
