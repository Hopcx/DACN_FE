import { useCallback, useEffect, useRef, useState } from 'react'
import { Alert, Button, Form, Input, InputNumber, Modal, Popconfirm, Select, Table } from 'antd'
import { DeleteOutlined, EditOutlined, EyeInvisibleOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons'
import PageHeader from '../../components/ui/PageHeader'
import PageCard from '../../components/ui/PageCard'
import StatusTag from '../../components/ui/StatusTag'
import { LoadError, TableEmpty } from '../../components/ui/PageState'
import { getApiError, toLoadError } from '../../api/response'
import { useSelector } from 'react-redux'
import { levelsApi, permissionsApi, subjectsApi, roomsApi } from '../../services/catalogService'
import { clampPage, rowNumber, showTotalLabel, statusView } from '../../services/listView'

const definitions = {
  levels: { title: 'Cấp tài khoản', heading: 'Cấp tài khoản', description: 'Các cấp tài khoản dùng để phân vai trò người dùng.',
    unit: 'cấp tài khoản', api: levelsApi, fields: [
      { key: 'name', label: 'Tên cấp', required: true },
      { key: 'status', label: 'Trạng thái', type: 'status' },
    ] },
  permissions: { title: 'Quyền', heading: 'Danh mục quyền', description: 'Các quyền chức năng có thể gán cho tài khoản.',
    unit: 'quyền', api: permissionsApi, fields: [
      { key: 'name', label: 'Tên quyền', required: true },
      { key: 'description', label: 'Mô tả' },
      { key: 'status', label: 'Trạng thái', type: 'status' },
    ] },
  subjects: { title: 'Môn học', heading: 'Quản lý môn học', description: 'Danh sách các môn học trong hệ thống.',
    unit: 'môn học', placeholder: 'Tìm theo tên môn học', api: subjectsApi, fields: [
      { key: 'name', label: 'Tên môn', required: true },
      { key: 'description', label: 'Mô tả' },
      { key: 'status', label: 'Trạng thái', type: 'status' },
    ] },
  rooms: { title: 'Phòng thi', heading: 'Quản lý phòng thi', description: 'Danh sách các phòng thi và sức chứa.',
    unit: 'phòng thi', placeholder: 'Tìm theo tên phòng', api: roomsApi, fields: [
      { key: 'name', label: 'Tên phòng', required: true },
      { key: 'address', label: 'Địa chỉ', required: true },
      { key: 'capacity', label: 'Sức chứa', type: 'number', required: true },
      { key: 'status', label: 'Trạng thái', type: 'boolean' },
    ] },
}

export default function CatalogPage({ kind }) {
  const user = useSelector((state) => state.auth.user)
  const { title, heading, description, unit, placeholder, api, fields } = definitions[kind]
  const [form] = Form.useForm()
  const [rows, setRows] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [loadError, setLoadError] = useState(null)
  const [editing, setEditing] = useState(null)
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [subjectsActiveOnly, setSubjectsActiveOnly] = useState(true)
  const requestRef = useRef(0)
  const allowed = kind === 'levels' || kind === 'permissions' ? String(user?.levelId) === '1'
    : String(user?.levelId) === '1' || (user?.permissions || []).some((id) => String(id) === (kind === 'subjects' ? '3' : '4'))

  // Chỉ phòng thi phân trang server; bảng khác đổi trang không cần tải lại
  const serverPage = kind === 'rooms' ? page : 1

  const load = useCallback(async () => {
    if (!allowed) return
    const requestId = ++requestRef.current
    setLoading(true); setLoadError(null)
    try {
      const result = await api.list(kind === 'rooms' ? { page: serverPage, pageSize: 10, name: search || undefined }
        : kind === 'subjects' ? { textSearch: search || undefined, isActive: subjectsActiveOnly } : undefined)
      if (requestId !== requestRef.current) return
      setRows(kind === 'rooms' ? result.items : result)
      setTotal(kind === 'rooms' ? result.totalCount : result.length)
    } catch (failure) {
      if (requestId === requestRef.current) setLoadError(toLoadError(failure))
    } finally {
      if (requestId === requestRef.current) setLoading(false)
    }
  }, [allowed, api, kind, serverPage, search, subjectsActiveOnly])

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
    try {
      await api.remove(id)
      // Phòng thi phân trang server: xóa dòng cuối của trang cuối thì lùi một trang (effect tự tải lại)
      if (kind === 'rooms' && rows.length === 1 && page > 1) setPage(page - 1)
      else await load()
    }
    catch (failure) { setError(getApiError(failure)) }
  }

  // Bảng client tự lùi trang khi số dòng giảm; phòng thi phân trang server dùng page trực tiếp
  const currentPage = kind === 'rooms' ? page : clampPage(page, 10, rows.length)

  const columns = [
    { title: 'STT', key: 'stt', width: 64, align: 'center', render: (_, __, index) => rowNumber(currentPage, 10, index) },
    ...(kind === 'levels' || kind === 'permissions' ? [{ title: 'Mã', dataIndex: 'id', key: 'id', width: 72 }] : []),
    ...fields.map(({ key, label }) => {
      const column = { title: label, dataIndex: key, key }
      if (key === 'status') {
        column.render = (value) => { const view = statusView(value); return <StatusTag tone={view.tone}>{view.label}</StatusTag> }
      } else if (key === 'description') {
        column.ellipsis = true
        column.render = (value) => value || '—'
      } else if (key === 'capacity') {
        column.align = 'right'
        column.width = 110
      }
      return column
    }),
    { title: 'Thao tác', key: 'actions', width: 170, render: (_, item) => <div className="page-actions">
      <Button size="small" icon={<EditOutlined />} onClick={() => show(item)}>Sửa</Button>
      {(!['levels', 'permissions'].includes(kind) || item.id > 4) &&
        !(kind === 'subjects' && item.status === 255) &&
        <Popconfirm title={kind === 'subjects' ? 'Ngừng hiển thị môn này?' : 'Xóa mục này?'} onConfirm={() => remove(item.id)}>
          <Button size="small" danger icon={kind === 'subjects' ? <EyeInvisibleOutlined /> : <DeleteOutlined />}>
            {kind === 'subjects' ? 'Ẩn' : 'Xóa'}
          </Button>
        </Popconfirm>}
    </div> },
  ]

  if (!allowed) return <Alert type="error" showIcon title="Bạn không có quyền truy cập mục này." />

  const statusOptions = [{ value: 1, label: 'Đang hoạt động' }, { value: 0, label: 'Ngừng hoạt động' }]
  if (kind === 'subjects' && editing?.status === 255) statusOptions.push({ value: 255, label: 'Đã ẩn', disabled: true })

  return <section className="page-body">
    <PageHeader title={heading} description={description} />
    <LoadError error={loadError} onRetry={load} retrying={loading} />
    {error && <Alert type="error" showIcon title={error} className="page-alert" />}
    <PageCard>
      <div className="page-toolbar">
        {(kind === 'rooms' || kind === 'subjects') && <Input.Search aria-label={`Tìm ${title.toLowerCase()}`}
          placeholder={placeholder} allowClear maxLength={100} onSearch={(value) => { setPage(1); setSearch(value.trim()) }} />}
        {kind === 'subjects' && <Select aria-label="Lọc trạng thái môn học" value={subjectsActiveOnly} style={{ minWidth: 170 }}
          onChange={(value) => { setSubjectsActiveOnly(value); setPage(1) }}
          options={[{ value: true, label: 'Đang hoạt động' }, { value: false, label: 'Tất cả' }]} />}
        <div className="page-toolbar__end">
          <Button icon={<ReloadOutlined />} onClick={load} loading={loading}>Tải lại</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => show(null)}>Thêm {title.toLowerCase()}</Button>
        </div>
      </div>
      <Table rowKey="id" size="middle" loading={loading} dataSource={rows} columns={columns} scroll={{ x: 720 }}
        locale={{ emptyText: <TableEmpty error={Boolean(loadError)} errorLabel="Không tải được dữ liệu." filtered={Boolean(search)}
          emptyLabel={`Chưa có ${unit}`} filteredLabel={`Không có ${unit} khớp từ khóa`} /> }}
        pagination={kind === 'rooms'
          ? { current: page, pageSize: 10, total, showSizeChanger: false, onChange: setPage, showTotal: showTotalLabel(unit) }
          : { current: currentPage, pageSize: 10, showSizeChanger: false, onChange: setPage, showTotal: showTotalLabel(unit) }} />
    </PageCard>
    <Modal title={`${editing ? 'Sửa' : 'Thêm'} ${title.toLowerCase()}`} open={open}
      onCancel={() => setOpen(false)} onOk={() => form.submit()} confirmLoading={saving} destroyOnHidden>
      <Form form={form} layout="vertical" onFinish={save}>
        {fields.map(({ key, label, type, required }) => <Form.Item key={key} name={key} label={label}
          rules={required ? [{ required: true, message: `Nhập ${label.toLowerCase()}` }] : []}>
          {type === 'number' ? <InputNumber min={1} className="w-full" />
            : type === 'boolean' ? <Select options={[{ value: true, label: 'Đang hoạt động' }, { value: false, label: 'Ngừng hoạt động' }]} />
              : type === 'status' ? <Select disabled={Boolean(editing && ['levels', 'permissions'].includes(kind) && editing.id <= 4)}
                options={statusOptions} />
                : key === 'description' ? <Input.TextArea rows={3} maxLength={500} />
                  : <Input maxLength={200} />}
        </Form.Item>)}
      </Form>
    </Modal>
  </section>
}
