import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { createUser, deleteUser, getUser, getUsers, updateUser } from '../../services/accountService'
import { getApiError } from '../../api/response'
import { Alert, Button, Form, Input, Modal, Popconfirm, Select, Table } from 'antd'
import PageHeader from '../../components/ui/PageHeader'
import PageCard from '../../components/ui/PageCard'
import StatusTag from '../../components/ui/StatusTag'
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
  const levelName = (id) => levels.find((level) => level.id === id)?.name || id
  return <section className="page-body">
    <PageHeader title="Tài khoản" description="Quản lý tài khoản người dùng trong hệ thống."
      extra={<><Button onClick={() => reload().catch((failure) => setError(getApiError(failure)))}>Tải lại</Button>
        <Button type="primary" onClick={() => setCreating(true)}>Thêm tài khoản</Button></>} />
    {error && <Alert type="error" showIcon title={error} className="page-alert" />}
    {message && <Alert type="success" showIcon title={message} className="page-alert" />}
    <PageCard>
      <div className="page-toolbar">
        <Input.Search placeholder="Tìm tên, tên đăng nhập hoặc email" aria-label="Tìm tài khoản" allowClear style={{ maxWidth: 380 }}
          onSearch={(value) => { setUsers(null); setSearch(value.trim()) }} />
      </div>
      <Table rowKey="id" loading={!users && !error} dataSource={users || []} locale={{ emptyText: 'Chưa có tài khoản' }}
        pagination={{ pageSize: 10, showSizeChanger: false }} columns={[
          { title: 'Họ tên', dataIndex: 'fullName' },
          { title: 'Tên đăng nhập', dataIndex: 'userName' },
          { title: 'Email', dataIndex: 'email' },
          { title: 'Vai trò', dataIndex: 'levelId', render: (id) => levelName(id) },
          { title: 'Trạng thái', dataIndex: 'status', render: (status) => status === 1 ? <StatusTag tone="success">Hoạt động</StatusTag> : <StatusTag>Không hoạt động</StatusTag> },
          { title: 'Thao tác', render: (_, user) => <div className="page-actions">
            <Button size="small" onClick={() => selectUser(user.id)}>Chi tiết</Button>
            <Popconfirm title="Xóa tài khoản này?" onConfirm={() => remove(user.id)}>
              <Button size="small" danger disabled={pending}>Xóa</Button>
            </Popconfirm>
          </div> },
        ]} />
    </PageCard>
    {selected && <form onSubmit={save} className="account-form page-card">
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
