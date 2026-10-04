import { useCallback, useEffect, useState } from 'react'
import { Alert, Button, Form, Input, InputNumber, Modal, Popconfirm, Select, Space, Table, Typography } from 'antd'
import { getApiError } from '../../api/response'
import { useSelector } from 'react-redux'
import { levelsApi, permissionsApi, subjectsApi, roomsApi } from '../../services/catalogService'

const definitions = {
  levels: { title: 'Cấp tài khoản', api: levelsApi, fields: [
    { key: 'name', label: 'Tên cấp', required: true },
    { key: 'status', label: 'Trạng thái', type: 'status' },
  ] },
  permissions: { title: 'Quyền', api: permissionsApi, fields: [
    { key: 'name', label: 'Tên quyền', required: true },
    { key: 'description', label: 'Mô tả' },
    { key: 'status', label: 'Trạng thái', type: 'status' },
  ] },
  subjects: { title: 'Môn học', api: subjectsApi, fields: [
    { key: 'name', label: 'Tên môn', required: true },
    { key: 'description', label: 'Mô tả' },
    { key: 'status', label: 'Trạng thái', type: 'status' },
  ] },
  rooms: { title: 'Phòng thi', api: roomsApi, fields: [
    { key: 'name', label: 'Tên phòng', required: true },
    { key: 'address', label: 'Địa chỉ', required: true },
    { key: 'capacity', label: 'Sức chứa', type: 'number', required: true },
    { key: 'status', label: 'Đang hoạt động', type: 'boolean' },
  ] },
}

export default function CatalogPage({ kind }) {
  const user = useSelector((state) => state.auth.user)
  const { title, api, fields } = definitions[kind]
  const [form] = Form.useForm()
  const [rows, setRows] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(null)
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [subjectsActiveOnly, setSubjectsActiveOnly] = useState(true)
  const allowed = kind === 'levels' || kind === 'permissions' ? String(user?.levelId) === '1'
    : (user?.permissions || []).some((id) => String(id) === (kind === 'subjects' ? '3' : '4'))

  const load = useCallback(async () => {
    if (!allowed) return
    setLoading(true); setError('')
    try {
      const result = await api.list(kind === 'rooms' ? { page, pageSize: 10, name: search || undefined }
        : kind === 'subjects' ? { textSearch: search || undefined, isActive: subjectsActiveOnly } : undefined)
      setRows(kind === 'rooms' ? result.items : result)
      setTotal(kind === 'rooms' ? result.totalCount : result.length)
    } catch (failure) { setError(getApiError(failure)) }
    finally { setLoading(false) }
  }, [allowed, api, kind, page, search, subjectsActiveOnly])

  useEffect(() => { load() }, [load])

  function show(item) {
    setEditing(item || null)
    form.resetFields()
    form.setFieldsValue(item ? { ...item, status: ['levels', 'permissions'].includes(kind) && item.id <= 4 ? 1 : item.status }
      : { status: kind === 'rooms' ? true : 1 })
    setOpen(true)
  }

  async function save(values) {
    setSaving(true); setError('')
    try {
      if (editing) await api.update(editing.id, values)
      else await api.create(values)
      setOpen(false); form.resetFields(); await load()
    } catch (failure) { setError(getApiError(failure)) }
    finally { setSaving(false) }
  }

  async function remove(id) {
    setError('')
    try { await api.remove(id); await load() }
    catch (failure) { setError(getApiError(failure)) }
  }

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
    ...fields.map(({ key, label }) => ({ title: label, dataIndex: key, key,
      render: (value) => key === 'status' ? (value === true || value === 1 ? 'Hoạt động' : 'Không hoạt động') : value })),
    { title: 'Thao tác', key: 'actions', render: (_, item) => <Space>
      <Button onClick={() => show(item)}>Sửa</Button>
      {(!['levels', 'permissions'].includes(kind) || item.id > 4) &&
        !(kind === 'subjects' && item.status === 255) &&
        <Popconfirm title={kind === 'subjects' ? 'Ngừng hiển thị môn này?' : 'Xóa mục này?'} onConfirm={() => remove(item.id)}>
          <Button danger>{kind === 'subjects' ? 'Ẩn' : 'Xóa'}</Button>
        </Popconfirm>}
    </Space> },
  ]

  if (!allowed) return <Alert type="error" message="Bạn không có quyền truy cập mục này." />

  return <section className="p-6">
    <Typography.Title level={2}>{title}</Typography.Title>
    {error && <Alert type="error" showIcon message={error} className="mb-4" />}
    <Space className="mb-4">
      {(kind === 'rooms' || kind === 'subjects') && <Input.Search aria-label={`Tìm ${title.toLowerCase()}`}
        placeholder="Tìm theo tên" allowClear onSearch={(value) => { setPage(1); setSearch(value.trim()) }} />}
      {kind === 'subjects' && <Select aria-label="Lọc trạng thái môn học" value={subjectsActiveOnly}
        onChange={setSubjectsActiveOnly} options={[{ value: true, label: 'Đang hoạt động' }, { value: false, label: 'Tất cả' }]} />}
      <Button type="primary" onClick={() => show(null)}>Thêm {title.toLowerCase()}</Button>
      <Button onClick={load}>Tải lại</Button>
    </Space>
    <Table rowKey="id" loading={loading} dataSource={rows} columns={columns}
      locale={{ emptyText: 'Chưa có dữ liệu' }}
      pagination={kind === 'rooms' ? { current: page, pageSize: 10, total, onChange: setPage }
        : { pageSize: 10 }} />
    <Modal title={`${editing ? 'Sửa' : 'Thêm'} ${title.toLowerCase()}`} open={open}
      onCancel={() => setOpen(false)} onOk={() => form.submit()} confirmLoading={saving} destroyOnHidden>
      <Form form={form} layout="vertical" onFinish={save}>
        {fields.map(({ key, label, type, required }) => <Form.Item key={key} name={key} label={label}
          rules={required ? [{ required: true, message: `Nhập ${label.toLowerCase()}` }] : []}>
          {type === 'number' ? <InputNumber min={1} className="w-full" />
            : type === 'boolean' ? <Select options={[{ value: true, label: 'Hoạt động' }, { value: false, label: 'Ngừng hoạt động' }]} />
              : type === 'status' ? <Select disabled={Boolean(editing && ['levels', 'permissions'].includes(kind) && editing.id <= 4)}
                options={[{ value: 1, label: 'Hoạt động' }, { value: 0, label: 'Không hoạt động' }]} />
                : <Input maxLength={key === 'description' ? 500 : 200} />}
        </Form.Item>)}
      </Form>
    </Modal>
  </section>
}
