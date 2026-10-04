import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { createUser, deleteUser, getUser, getUsers, updateUser } from '../../services/accountService'
import { getApiError } from '../../api/response'
import { Button, Form, Input, Modal, Popconfirm, Select } from 'antd'
import { levelsApi } from '../../services/catalogService'
import { resendVerification } from '../../services/authService'
import './account.css'

export default function AdminUsersPage() {
  const levelId = useSelector((state) => state.auth.user?.levelId)
  const [users, setUsers] = useState(null)
  const [selected, setSelected] = useState(null)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [pending, setPending] = useState(false)
  const [creating, setCreating] = useState(false)
  const [search, setSearch] = useState('')
  const [form] = Form.useForm()
  const [levels, setLevels] = useState([])

  async function reload() {
    setUsers(await getUsers(search))
  }

  useEffect(() => {
    if (String(levelId) !== '1') return
    let active = true
    getUsers(search).then((data) => { if (active) { setUsers(data); setError('') } })
      .catch((failure) => { if (active) setError(getApiError(failure)) })
    return () => { active = false }
  }, [levelId, search])

  useEffect(() => {
    if (String(levelId) !== '1') return
    let active = true
    levelsApi.list().then((items) => { if (active) setLevels(items) })
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

  async function add(values) {
    setPending(true); setError(''); setMessage('')
    try {
      await createUser({ ...values, dateOfBirth: values.dateOfBirth, status: 1, sex: false })
      await reload(); setCreating(false); form.resetFields()
      setMessage('Đã tạo tài khoản. Người dùng cần xác minh email trước khi đăng nhập.')
    } catch (failure) { setError(getApiError(failure)) }
    finally { setPending(false) }
  }

  async function remove(id) {
    setPending(true); setError(''); setMessage('')
    try { await deleteUser(id); await reload(); if (selected?.id === id) setSelected(null); setMessage('Đã xóa tài khoản.') }
    catch (failure) { setError(getApiError(failure)) }
    finally { setPending(false) }
  }

  if (String(levelId) !== '1') return <p>Bạn không có quyền quản lý tài khoản.</p>
  return <section className="account-page">
    <h1>Tài khoản</h1>
    <Button type="primary" onClick={() => setCreating(true)}>Thêm tài khoản</Button>
    <Button onClick={() => reload().catch((failure) => setError(getApiError(failure)))}>Tải lại</Button>
    <Input.Search placeholder="Tìm tên, tên đăng nhập hoặc email" aria-label="Tìm tài khoản" allowClear
      onSearch={(value) => { setUsers(null); setSearch(value.trim()) }} />
    {error && <p role="alert" className="account-error">{error}</p>}
    {message && <p role="status">{message}</p>}
    {!users && !error && <p>Đang tải tài khoản...</p>}
    {users?.length === 0 && <p>Chưa có tài khoản.</p>}
    {users && <ul>{users.map((user) => <li key={user.id}>
      <button type="button" onClick={() => selectUser(user.id)}>{user.fullName} ({user.userName})</button>
      <Popconfirm title="Xóa tài khoản này?" onConfirm={() => remove(user.id)}>
        <Button danger disabled={pending}>Xóa</Button>
      </Popconfirm>
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
      <Button htmlType="button" disabled={pending} onClick={async () => {
        setError(''); setMessage('')
        try { await resendVerification(selected.email); setMessage('Nếu tài khoản chưa xác minh, email mới sẽ được gửi.') }
        catch (failure) { setError(getApiError(failure)) }
      }}>Gửi lại email xác minh</Button>
    </form>}
    <Modal title="Thêm tài khoản" open={creating} onCancel={() => setCreating(false)}
      onOk={() => form.submit()} confirmLoading={pending} destroyOnHidden>
      <Form form={form} layout="vertical" onFinish={add}>
        {[
          ['fullName', 'Họ tên'], ['userName', 'Tên đăng nhập'], ['email', 'Email'],
          ['phoneNumber', 'Số điện thoại'], ['address', 'Địa chỉ'], ['password', 'Mật khẩu'],
          ['dateOfBirth', 'Ngày sinh'],
        ].map(([key, label]) => <Form.Item key={key} name={key} label={label} rules={[{ required: true, message: `Nhập ${label.toLowerCase()}` }]}>
          <Input type={key === 'password' ? 'password' : key === 'dateOfBirth' ? 'date' : key === 'email' ? 'email' : 'text'} />
        </Form.Item>)}
        <Form.Item name="levelId" label="Cấp tài khoản" rules={[{ required: true, message: 'Chọn cấp tài khoản' }]}>
          <Select options={levels.filter((level) => level.status === 1 && level.id >= 1 && level.id <= 4)
            .map((level) => ({ value: level.id, label: level.name }))} />
        </Form.Item>
      </Form>
    </Modal>
  </section>
}
