import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { getUser, getUsers, updateUser } from '../../services/accountService'
import { getApiError } from '../../api/response'
import './account.css'

export default function AdminUsersPage() {
  const levelId = useSelector((state) => state.auth.user?.levelId)
  const [users, setUsers] = useState(null)
  const [selected, setSelected] = useState(null)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [pending, setPending] = useState(false)

  useEffect(() => {
    if (String(levelId) !== '1') return
    let active = true
    getUsers().then((data) => { if (active) setUsers(data) })
      .catch((failure) => { if (active) setError(getApiError(failure)) })
    return () => { active = false }
  }, [levelId])

  async function selectUser(id) {
    setError(''); setMessage('')
    try { setSelected(await getUser(id)) }
    catch (failure) { setError(getApiError(failure)) }
  }

  async function save(event) {
    event.preventDefault()
    setPending(true); setError(''); setMessage('')
    try {
      const saved = await updateUser(selected.id, {
        fullName: selected.fullName, userName: selected.userName, email: selected.email,
        phoneNumber: selected.phoneNumber, address: selected.address, avatarUrl: selected.avatarUrl,
      })
      setSelected(saved)
      setUsers((current) => current.map((user) => user.id === saved.id ? saved : user))
      setMessage('Đã cập nhật tài khoản.')
    } catch (failure) { setError(getApiError(failure)) }
    finally { setPending(false) }
  }

  if (String(levelId) !== '1') return <p>Bạn không có quyền quản lý tài khoản.</p>
  return <section className="account-page">
    <h1>Tài khoản</h1>
    {error && <p role="alert" className="account-error">{error}</p>}
    {message && <p role="status">{message}</p>}
    {!users && !error && <p>Đang tải tài khoản...</p>}
    {users && <ul>{users.map((user) => <li key={user.id}>
      <button type="button" onClick={() => selectUser(user.id)}>{user.fullName} ({user.userName})</button>
    </li>)}</ul>}
    {selected && <form onSubmit={save} className="account-form">
      <h2>Chi tiết tài khoản</h2>
      <p>ID: {selected.id} · Vai trò: {selected.levelId} · Trạng thái: {selected.status}</p>
      {[
        ['fullName', 'Họ tên'], ['userName', 'Tên đăng nhập'], ['email', 'Email'],
        ['phoneNumber', 'Số điện thoại'], ['address', 'Địa chỉ'],
      ].map(([key, label]) => <label key={key}>{label}
        <input required type={key === 'email' ? 'email' : 'text'} value={selected[key] || ''}
          onChange={(e) => setSelected({ ...selected, [key]: e.target.value })} />
      </label>)}
      <button disabled={pending}>Lưu tài khoản</button>
    </form>}
  </section>
}
