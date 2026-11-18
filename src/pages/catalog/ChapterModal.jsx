import { useCallback, useEffect, useRef, useState } from 'react'
import { Alert, Button, Form, Input, InputNumber, Modal, Popconfirm, Select, Space, Switch, Table, Typography } from 'antd'
import { EditOutlined, EyeInvisibleOutlined, PlusOutlined } from '@ant-design/icons'
import StatusTag from '../../components/ui/StatusTag'
import { getApiError } from '../../api/response'
import { createChapter, getChapters, hideChapter, updateChapter } from '../../services/questionService'
import { statusView } from '../../services/listView'

// To-be T3 (QT3-1 a): quản lý chương của một môn, mở từ "Quản lý môn học" (quyền 3 hoặc Admin).
export default function ChapterModal({ subject, onClose }) {
  const [form] = Form.useForm()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(null)
  const [formOpen, setFormOpen] = useState(false)
  const [showHidden, setShowHidden] = useState(false)
  const requestRef = useRef(0)

  const load = useCallback(async () => {
    if (!subject) return
    const requestId = ++requestRef.current
    setLoading(true)
    try {
      const items = await getChapters({ subjectId: subject.id, includeHidden: showHidden })
      if (requestId === requestRef.current) setRows(items)
    } catch (failure) {
      if (requestId === requestRef.current) setError(getApiError(failure))
    } finally {
      if (requestId === requestRef.current) setLoading(false)
    }
  }, [subject, showHidden])

  useEffect(() => { load() }, [load])

  function show(item) {
    setEditing(item || null); setError('')
    form.resetFields()
    form.setFieldsValue(item ? { name: item.name, sortOrder: item.sortOrder, status: item.status }
      : { name: '', sortOrder: rows.reduce((max, x) => Math.max(max, x.sortOrder), 0) + 1, status: 1 })
    setFormOpen(true)
  }

  async function save(values) {
    setSaving(true); setError('')
    try {
      const body = { subjectId: subject.id, name: values.name.trim(), sortOrder: values.sortOrder ?? 0, status: values.status }
      if (editing) await updateChapter(editing.id, body)
      else await createChapter(body)
      setFormOpen(false); await load()
    } catch (failure) { setError(getApiError(failure)) }
    finally { setSaving(false) }
  }

  async function hide(id) {
    setError('')
    try { await hideChapter(id); await load() }
    catch (failure) { setError(getApiError(failure)) }
  }

  return <Modal title={`Chương — ${subject?.name ?? ''}`} open={Boolean(subject)} onCancel={onClose} footer={null} width={720} destroyOnHidden>
    {error && <Alert type="error" showIcon title={error} className="page-alert" />}
    <div className="page-toolbar">
      <Space>
        <Switch size="small" checked={showHidden} onChange={setShowHidden} aria-label="Hiện chương đã ẩn" />
        <Typography.Text>Hiện chương đã ẩn</Typography.Text>
      </Space>
      <div className="page-toolbar__end">
        <Button type="primary" icon={<PlusOutlined />} onClick={() => show(null)}>Thêm chương</Button>
      </div>
    </div>
    <Table rowKey="id" size="small" loading={loading} dataSource={rows} pagination={{ pageSize: 10, showSizeChanger: false }}
      locale={{ emptyText: 'Môn này chưa có chương' }} columns={[
        { title: 'Thứ tự', dataIndex: 'sortOrder', width: 80, align: 'center' },
        { title: 'Tên chương', dataIndex: 'name', ellipsis: { showTitle: true } },
        { title: 'Số câu', dataIndex: 'questionCount', width: 80, align: 'right' },
        { title: 'Trạng thái', dataIndex: 'status', width: 130, render: (value) => {
          const view = statusView(value); return <StatusTag tone={view.tone}>{view.label}</StatusTag>
        } },
        { title: 'Thao tác', key: 'actions', width: 160, render: (_, item) => item.status === 255 ? '—' : <div className="page-actions">
          <Button size="small" icon={<EditOutlined />} onClick={() => show(item)}>Sửa</Button>
          <Popconfirm title="Ẩn chương này? Câu hỏi đang gắn vẫn giữ chương nhưng không gắn mới được." onConfirm={() => hide(item.id)}>
            <Button size="small" danger icon={<EyeInvisibleOutlined />}>Ẩn</Button>
          </Popconfirm>
        </div> },
      ]} />
    <Modal title={editing ? 'Sửa chương' : 'Thêm chương'} open={formOpen} onCancel={() => setFormOpen(false)}
      onOk={() => form.submit()} confirmLoading={saving} destroyOnHidden>
      <Form form={form} layout="vertical" onFinish={save}>
        <Form.Item name="name" label="Tên chương" rules={[{ required: true, whitespace: true, message: 'Nhập tên chương' }]}>
          <Input maxLength={200} />
        </Form.Item>
        <Form.Item name="sortOrder" label="Thứ tự hiển thị"><InputNumber min={0} max={100000} precision={0} className="w-full" /></Form.Item>
        <Form.Item name="status" label="Trạng thái">
          <Select options={[{ value: 1, label: 'Đang hoạt động' }, { value: 0, label: 'Ngừng hoạt động' }]} />
        </Form.Item>
      </Form>
    </Modal>
  </Modal>
}
