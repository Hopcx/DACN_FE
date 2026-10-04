import { useCallback, useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { Alert, Button, Form, Input, InputNumber, Modal, Popconfirm, Select, Space, Table, Typography } from 'antd'
import { getApiError } from '../../api/response'
import { getUsers } from '../../services/accountService'
import { addClassMember, approveClassMember, createClass, deleteClass, getClassMembers,
  getClassOptions, getClasses, removeClassMember, updateClass } from '../../services/classService'

export default function AdminClassesPage() {
  const isAdmin = String(useSelector((state) => state.auth.user?.levelId)) === '1'
  const [form] = Form.useForm()
  const [memberForm] = Form.useForm()
  const [classes, setClasses] = useState([])
  const [options, setOptions] = useState({ teachers: [], subjects: [] })
  const [users, setUsers] = useState([])
  const [members, setMembers] = useState([])
  const [selectedClass, setSelectedClass] = useState(null)
  const [editing, setEditing] = useState(null)
  const [formOpen, setFormOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [showAll, setShowAll] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    if (!isAdmin) return
    setLoading(true); setError('')
    try {
      const [list, lookups, accounts] = await Promise.all([getClasses(search), getClassOptions(), getUsers()])
      setClasses(list); setOptions(lookups); setUsers(accounts)
    } catch (failure) { setError(getApiError(failure)) }
    finally { setLoading(false) }
  }, [isAdmin, search])

  useEffect(() => { load() }, [load])

  async function openMembers(item) {
    setError(''); setSelectedClass(item)
    try { setMembers(await getClassMembers(item.id)) }
    catch (failure) { setError(getApiError(failure)) }
  }

  async function refreshMembers() {
    if (selectedClass) setMembers(await getClassMembers(selectedClass.id))
  }

  function showForm(item) {
    setEditing(item || null); form.resetFields()
    form.setFieldsValue(item || { status: 1 })
    setFormOpen(true)
  }

  async function save(values) {
    setSaving(true); setError('')
    try {
      if (editing) await updateClass(editing.id, values)
      else await createClass(values)
      setFormOpen(false); await load()
    } catch (failure) { setError(getApiError(failure)) }
    finally { setSaving(false) }
  }

  async function removeClass(id) {
    setError('')
    try { await deleteClass(id); await load() }
    catch (failure) { setError(getApiError(failure)) }
  }

  async function changeMember(operation) {
    setSaving(true); setError('')
    try { await operation(); await refreshMembers(); await load(); memberForm.resetFields() }
    catch (failure) { setError(getApiError(failure)) }
    finally { setSaving(false) }
  }

  if (!isAdmin) return <Alert type="error" message="Bạn không có quyền quản lý lớp." />
  const userName = (id) => users.find((user) => user.id === id)?.fullName || id
  return <section className="p-6">
    <Typography.Title level={2}>Quản lý lớp học</Typography.Title>
    {error && <Alert type="error" showIcon message={error} className="mb-4" />}
    <Space className="mb-4" wrap>
      <Input.Search placeholder="Tìm tên hoặc mã lớp" allowClear onSearch={(value) => setSearch(value.trim())} />
      <Select value={showAll} onChange={setShowAll} options={[{ value: false, label: 'Đang hoạt động' }, { value: true, label: 'Tất cả' }]} />
      <Button type="primary" onClick={() => showForm(null)}>Thêm lớp</Button>
      <Button onClick={load}>Tải lại</Button>
    </Space>
    <Table rowKey="id" loading={loading} dataSource={classes.filter((item) => showAll || item.status === 1)}
      locale={{ emptyText: 'Chưa có lớp học' }} pagination={{ pageSize: 10 }} columns={[
        { title: 'Tên lớp', dataIndex: 'name' }, { title: 'Mã lớp', dataIndex: 'classCode' },
        { title: 'Giảng viên', dataIndex: 'teacherId', render: userName },
        { title: 'Môn học', dataIndex: 'subjectId', render: (id) => options.subjects.find((subject) => subject.id === id)?.name || '—' },
        { title: 'Sức chứa', dataIndex: 'capacity' },
        { title: 'Thao tác', render: (_, item) => <Space>
          <Button onClick={() => openMembers(item)}>Thành viên</Button>
          <Button onClick={() => showForm(item)}>Sửa</Button>
          {item.status !== 255 && <Popconfirm title="Ẩn lớp này?" onConfirm={() => removeClass(item.id)}>
            <Button danger>Ẩn</Button></Popconfirm>}
        </Space> },
      ]} />
    <Modal title={editing ? 'Sửa lớp' : 'Thêm lớp'} open={formOpen} onCancel={() => setFormOpen(false)}
      onOk={() => form.submit()} confirmLoading={saving} destroyOnHidden>
      <Form form={form} layout="vertical" onFinish={save}>
        <Form.Item name="name" label="Tên lớp" rules={[{ required: true }]}><Input maxLength={200} /></Form.Item>
        <Form.Item name="classCode" label="Mã lớp" rules={[{ required: true }]}><Input maxLength={100} /></Form.Item>
        <Form.Item name="description" label="Mô tả"><Input.TextArea /></Form.Item>
        <Form.Item name="capacity" label="Sức chứa" rules={[{ required: true }]}><InputNumber min={1} className="w-full" /></Form.Item>
        <Form.Item name="teacherId" label="Giảng viên" rules={[{ required: true }]}>
          <Select showSearch optionFilterProp="label" options={options.teachers.map((item) => ({ value: item.id, label: item.fullName }))} />
        </Form.Item>
        <Form.Item name="subjectId" label="Môn học"><Select allowClear options={options.subjects.map((item) => ({ value: item.id, label: item.name }))} /></Form.Item>
        <Form.Item name="status" label="Trạng thái"><Select options={[{ value: 1, label: 'Hoạt động' }, { value: 0, label: 'Tạm ngừng' }]} /></Form.Item>
      </Form>
    </Modal>
    <Modal title={`Thành viên · ${selectedClass?.name || ''}`} open={Boolean(selectedClass)}
      onCancel={() => setSelectedClass(null)} footer={null} width={750} destroyOnHidden>
      <Form form={memberForm} layout="inline" onFinish={({ userId }) => changeMember(() => addClassMember(selectedClass.id, userId))}>
        <Form.Item name="userId" rules={[{ required: true, message: 'Chọn học viên' }]}>
          <Select showSearch optionFilterProp="label" placeholder="Chọn học viên" style={{ minWidth: 270 }}
            options={users.filter((user) => user.levelId === 4 && user.status === 1)
              .map((user) => ({ value: user.id, label: `${user.fullName} (${user.userName})` }))} />
        </Form.Item>
        <Button htmlType="submit" type="primary" loading={saving}>Thêm học viên</Button>
      </Form>
      <Table rowKey="id" dataSource={members} locale={{ emptyText: 'Chưa có thành viên' }} pagination={{ pageSize: 8 }}
        columns={[
          { title: 'Học viên', dataIndex: 'userId', render: userName },
          { title: 'Trạng thái', dataIndex: 'status', render: (status) => status === 1 ? 'Đã duyệt' : 'Chờ duyệt' },
          { title: 'Thao tác', render: (_, member) => <Space>
            {member.status === 2 && <Button onClick={() => changeMember(() => approveClassMember(member))}>Duyệt</Button>}
            <Popconfirm title="Xóa thành viên khỏi lớp?" onConfirm={() => changeMember(() => removeClassMember(member.id))}>
              <Button danger>Xóa</Button></Popconfirm>
          </Space> },
        ]} />
    </Modal>
  </section>
}
