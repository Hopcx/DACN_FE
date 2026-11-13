import { useCallback, useEffect, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import { createUser, deleteUser, getUser, getUsers, updateUser } from '../../services/accountService'
import { getApiError, toLoadError } from '../../api/response'
import { Alert, Button, Form, Input, Modal, Popconfirm, Select, Table } from 'antd'
import { DeleteOutlined, DownloadOutlined, FileExcelOutlined, PlusOutlined, ProfileOutlined, ReloadOutlined, UploadOutlined } from '@ant-design/icons'
import PageHeader from '../../components/ui/PageHeader'
import PageCard from '../../components/ui/PageCard'
import StatusTag from '../../components/ui/StatusTag'
import { LoadError, TableEmpty } from '../../components/ui/PageState'
import { clampPage, rowNumber, showTotalLabel, statusView } from '../../services/listView'
import { levelsApi } from '../../services/catalogService'
import { resendVerification } from '../../services/authService'
import { downloadAccountTemplate, exportAccounts } from '../../services/accountExcelService'
import { excelErrorMessage } from '../../services/excelFile'
import AccountExcelImportModal from './AccountExcelImportModal'
import './account.css'

const ROLE_TONES = { 1: 'cyan', 2: 'warning', 3: 'purple', 4: 'info' }

export default function AdminUsersPage() {
  const levelId = useSelector((state) => state.auth.user?.levelId)
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [page, setPage] = useState(1)
  const requestRef = useRef(0)
  const [selected, setSelected] = useState(null)
  const [error, setError] = useState('')
  const [detailError, setDetailError] = useState('')
  const [detailMessage, setDetailMessage] = useState('')
  const [detailLoadingId, setDetailLoadingId] = useState(null)
  const [detailForm] = Form.useForm()
  const [message, setMessage] = useState('')
  const [pending, setPending] = useState(false)
  const [creating, setCreating] = useState(false)
  const [importing, setImporting] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [downloadingTemplate, setDownloadingTemplate] = useState(false)
  const [exportLevel, setExportLevel] = useState()
  const [search, setSearch] = useState('')
  const [form] = Form.useForm()
  const [levels, setLevels] = useState([])

  const load = useCallback(async () => {
    if (String(levelId) !== '1') return
    const requestId = ++requestRef.current
    setLoading(true); setLoadError(null)
    try {
      const data = await getUsers(search)
      if (requestId === requestRef.current) setUsers(data)
    } catch (failure) {
      if (requestId === requestRef.current) setLoadError(toLoadError(failure))
    } finally {
      if (requestId === requestRef.current) setLoading(false)
    }
  }, [levelId, search])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    if (String(levelId) !== '1') return
    let active = true
    levelsApi.list().then((items) => { if (active) setLevels(items) })
      .catch((failure) => { if (active) setError(getApiError(failure)) })
    return () => { active = false }
  }, [levelId])

  async function selectUser(id) {
    setDetailLoadingId(id); setError(''); setMessage('')
    try {
      const user = await getUser(id)
      setDetailError(''); setDetailMessage(''); setSelected(user)
    } catch (failure) { setError(getApiError(failure)) }
    finally { setDetailLoadingId(null) }
  }

  async function saveDetail(values) {
    setPending(true); setDetailError(''); setDetailMessage('')
    try {
      const saved = await updateUser(selected.id, {
        fullName: values.fullName.trim(), userName: values.userName.trim(), email: values.email.trim(),
        phoneNumber: values.phoneNumber.trim(), address: values.address.trim(), avatarUrl: selected.avatarUrl,
      })
      setUsers((current) => current.map((user) => user.id === saved.id ? saved : user))
      setSelected(null)
      setMessage('Đã cập nhật tài khoản.')
    } catch (failure) { setDetailError(getApiError(failure)) }
    finally { setPending(false) }
  }

  async function resend() {
    setDetailError(''); setDetailMessage('')
    try { await resendVerification(selected.email); setDetailMessage('Nếu tài khoản chưa xác minh, email mới sẽ được gửi.') }
    catch (failure) { setDetailError(getApiError(failure)) }
  }

  async function add(values) {
    setPending(true); setError(''); setMessage('')
    try {
      await createUser({ ...values, dateOfBirth: values.dateOfBirth, status: 1, sex: false })
      await load(); setCreating(false); form.resetFields()
      setMessage('Đã tạo tài khoản. Người dùng cần xác minh email trước khi đăng nhập.')
    } catch (failure) { setError(getApiError(failure)) }
    finally { setPending(false) }
  }

  async function downloadTemplate() {
    if (downloadingTemplate) return
    setDownloadingTemplate(true); setError(''); setMessage('')
    try { await downloadAccountTemplate() }
    catch (failure) { setError(excelErrorMessage(failure)) }
    finally { setDownloadingTemplate(false) }
  }

  async function exportExcel() {
    if (exporting) return
    setExporting(true); setError(''); setMessage('')
    try { await exportAccounts(exportLevel) }
    catch (failure) { setError(excelErrorMessage(failure)) }
    finally { setExporting(false) }
  }

  function imported(result) {
    setImporting(false)
    setMessage(`Đã nhập ${result.imported} tài khoản.${result.emailFailed > 0
      ? ` ${result.emailFailed} email xác minh gửi lỗi; người dùng dùng "Gửi lại email xác minh".` : ''}`)
    setError('')
    load()
  }

  async function remove(id) {
    setPending(true); setError(''); setMessage('')
    try { await deleteUser(id); await load(); if (selected?.id === id) setSelected(null); setMessage('Đã xóa tài khoản.') }
    catch (failure) { setError(getApiError(failure)) }
    finally { setPending(false) }
  }

  if (String(levelId) !== '1') return <Alert type="error" showIcon title="Bạn không có quyền quản lý tài khoản." />
  const levelName = (id) => levels.find((level) => level.id === id)?.name || id
  const roleTag = (id) => <StatusTag tone={ROLE_TONES[id] || 'default'}>{levelName(id)}</StatusTag>
  const statusTag = (value) => { const view = statusView(value); return <StatusTag tone={view.tone}>{view.label}</StatusTag> }
  const currentPage = clampPage(page, 10, users.length)
  return <section className="page-body">
    <PageHeader title="Quản lý tài khoản" description="Quản lý tài khoản người dùng trong hệ thống."
      extra={<>
        <Button icon={<DownloadOutlined />} onClick={downloadTemplate} loading={downloadingTemplate} disabled={downloadingTemplate}>Tải mẫu Excel</Button>
        <Button icon={<UploadOutlined />} onClick={() => setImporting(true)}>Nhập từ Excel</Button></>} />
    <LoadError error={loadError} onRetry={load} retrying={loading} />
    {error && <Alert type="error" showIcon title={error} className="page-alert" />}
    {message && <Alert type="success" showIcon title={message} className="page-alert" />}
    <PageCard>
      <div className="page-toolbar">
        <Input.Search placeholder="Tìm tên, tên đăng nhập hoặc email" aria-label="Tìm tài khoản" allowClear maxLength={100}
          onSearch={(value) => { setSearch(value.trim()); setPage(1) }} />
        <Select allowClear placeholder="Vai trò xuất" aria-label="Vai trò xuất" style={{ minWidth: 180 }}
          value={exportLevel} onChange={setExportLevel}
          options={levels.filter((level) => level.id >= 1 && level.id <= 4).map((level) => ({ value: level.id, label: level.name }))} />
        <Button icon={<FileExcelOutlined />} onClick={exportExcel} loading={exporting} disabled={exporting}>Xuất Excel</Button>
        <div className="page-toolbar__end">
          <Button icon={<ReloadOutlined />} onClick={load} loading={loading}>Tải lại</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreating(true)}>Thêm tài khoản</Button>
        </div>
      </div>
      <Table rowKey="id" size="middle" loading={loading} dataSource={users} scroll={{ x: 900 }}
        locale={{ emptyText: <TableEmpty error={Boolean(loadError)} errorLabel="Không tải được dữ liệu." filtered={Boolean(search)}
          emptyLabel="Chưa có tài khoản" filteredLabel="Không có tài khoản khớp từ khóa" /> }}
        pagination={{ current: currentPage, pageSize: 10, showSizeChanger: false, onChange: setPage, showTotal: showTotalLabel('tài khoản') }}
        columns={[
          { title: 'STT', key: 'stt', width: 64, align: 'center', render: (_, __, index) => rowNumber(currentPage, 10, index) },
          { title: 'Họ tên', dataIndex: 'fullName', render: (value) => <strong>{value}</strong> },
          { title: 'Tên đăng nhập', dataIndex: 'userName' },
          { title: 'Email', dataIndex: 'email' },
          { title: 'Vai trò', dataIndex: 'levelId', render: roleTag },
          { title: 'Trạng thái', dataIndex: 'status', render: statusTag },
          { title: 'Thao tác', key: 'actions', render: (_, user) => <div className="page-actions">
            <Button size="small" icon={<ProfileOutlined />} loading={detailLoadingId === user.id} onClick={() => selectUser(user.id)}>Chi tiết</Button>
            <Popconfirm title="Xóa tài khoản này?" onConfirm={() => remove(user.id)}>
              <Button size="small" danger icon={<DeleteOutlined />} disabled={pending}>Xóa</Button>
            </Popconfirm>
          </div> },
        ]} />
    </PageCard>
    <Modal title="Chi tiết tài khoản" open={Boolean(selected)} onCancel={() => { if (!pending) setSelected(null) }} destroyOnHidden
      footer={<>
        <Button onClick={resend} disabled={pending}>Gửi lại email xác minh</Button>
        <Button onClick={() => setSelected(null)} disabled={pending}>Đóng</Button>
        <Button type="primary" loading={pending} onClick={() => detailForm.submit()}>Lưu tài khoản</Button>
      </>}>
      {selected && <>
        <div className="detail-meta">
          <span>Vai trò: {roleTag(selected.levelId)}</span>
          <span>Trạng thái: {statusTag(selected.status)}</span>
        </div>
        {detailError && <Alert type="error" showIcon title={detailError} className="page-alert" />}
        {detailMessage && <Alert type="success" showIcon title={detailMessage} className="page-alert" />}
        <Form key={selected.id} form={detailForm} layout="vertical" onFinish={saveDetail}
          initialValues={{ fullName: selected.fullName, userName: selected.userName, email: selected.email,
            phoneNumber: selected.phoneNumber || '', address: selected.address }}>
          <Form.Item name="fullName" label="Họ tên" rules={[
            { required: true, whitespace: true, message: 'Nhập họ tên' }, { max: 100, message: 'Họ tên tối đa 100 ký tự' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="userName" label="Tên đăng nhập" rules={[
            { required: true, message: 'Nhập tên đăng nhập' }, { min: 6, message: 'Tên đăng nhập tối thiểu 6 ký tự' },
            { max: 100, message: 'Tên đăng nhập tối đa 100 ký tự' },
            { pattern: /^[a-zA-Z0-9_]+$/, message: 'Chỉ gồm chữ không dấu, số và dấu gạch dưới' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="email" label="Email" rules={[
            { required: true, message: 'Nhập email' }, { type: 'email', message: 'Email không hợp lệ' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="phoneNumber" label="Số điện thoại" rules={[
            { required: true, message: 'Số điện thoại gồm 10–11 chữ số' },
            { pattern: /^[0-9]{10,11}$/, message: 'Số điện thoại gồm 10–11 chữ số' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="address" label="Địa chỉ" rules={[
            { required: true, whitespace: true, message: 'Nhập địa chỉ' }, { max: 200, message: 'Địa chỉ tối đa 200 ký tự' }]}>
            <Input />
          </Form.Item>
        </Form>
      </>}
    </Modal>
    {importing && <AccountExcelImportModal open onClose={() => setImporting(false)} onImported={imported} />}
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
