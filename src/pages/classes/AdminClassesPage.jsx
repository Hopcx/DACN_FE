import { useCallback, useEffect, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import { Alert, Button, Form, Input, InputNumber, Modal, Popconfirm, Select, Table, Tabs } from 'antd'
import { CheckOutlined, DeleteOutlined, EditOutlined, EyeInvisibleOutlined, PlusOutlined, ReloadOutlined,
  TeamOutlined, UserAddOutlined } from '@ant-design/icons'
import PageHeader from '../../components/ui/PageHeader'
import PageCard from '../../components/ui/PageCard'
import StatusTag from '../../components/ui/StatusTag'
import { LoadError, TableEmpty } from '../../components/ui/PageState'
import { getApiError, toLoadError } from '../../api/response'
import { getUsers } from '../../services/accountService'
import { addClassMember, approveClassMember, createClass, deleteClass, getClassMembers,
  getClassOptions, getClasses, removeClassMember, updateClass } from '../../services/classService'
import { clampPage, rowNumber, showTotalLabel, statusView } from '../../services/listView'
import { memberSummary, visibleClasses } from '../../services/classList'

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
  const [subjectFilter, setSubjectFilter] = useState()
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [loadError, setLoadError] = useState(null)
  const [formError, setFormError] = useState('')
  const [memberError, setMemberError] = useState('')
  const [membersLoading, setMembersLoading] = useState(false)
  const [membersLoadFailed, setMembersLoadFailed] = useState(false)
  const requestRef = useRef(0)
  const memberRequestRef = useRef(0)

  const load = useCallback(async () => {
    if (!isAdmin) return
    const requestId = ++requestRef.current
    setLoading(true); setLoadError(null)
    try {
      const [list, lookups, accounts] = await Promise.all([getClasses(search), getClassOptions(), getUsers()])
      if (requestId !== requestRef.current) return
      setClasses(list); setOptions(lookups); setUsers(accounts)
    } catch (failure) {
      if (requestId === requestRef.current) setLoadError(toLoadError(failure))
    } finally {
      if (requestId === requestRef.current) setLoading(false)
    }
  }, [isAdmin, search])

  useEffect(() => { load() }, [load])

  async function openMembers(item) {
    // Đổi lớp nhanh: chỉ phản hồi của lần mở cuối được ghi
    const requestId = ++memberRequestRef.current
    setSelectedClass(item); setMembers([]); setMemberError(''); setMembersLoadFailed(false); setMembersLoading(true)
    try {
      const items = await getClassMembers(item.id)
      if (requestId === memberRequestRef.current) setMembers(items)
    } catch (failure) {
      if (requestId === memberRequestRef.current) { setMemberError(getApiError(failure)); setMembersLoadFailed(true) }
    } finally {
      if (requestId === memberRequestRef.current) setMembersLoading(false)
    }
  }

  async function refreshMembers() {
    if (!selectedClass) return
    const requestId = ++memberRequestRef.current
    const items = await getClassMembers(selectedClass.id)
    if (requestId === memberRequestRef.current) { setMembers(items); setMembersLoadFailed(false) }
  }

  function showForm(item) {
    setEditing(item || null); setFormError(''); form.resetFields()
    form.setFieldsValue(item || { status: 1 })
    setFormOpen(true)
  }

  async function save(values) {
    setSaving(true); setFormError('')
    try {
      if (editing) await updateClass(editing.id, values)
      else await createClass(values)
      setFormOpen(false); await load()
    } catch (failure) { setFormError(getApiError(failure)) }
    finally { setSaving(false) }
  }

  async function removeClass(id) {
    setError('')
    try { await deleteClass(id); await load() }
    catch (failure) { setError(getApiError(failure)) }
  }

  async function changeMember(operation) {
    setSaving(true); setMemberError('')
    try { await operation(); await refreshMembers(); await load(); memberForm.resetFields() }
    catch (failure) { setMemberError(getApiError(failure)) }
    finally { setSaving(false) }
  }

  if (!isAdmin) return <Alert type="error" showIcon title="Bạn không có quyền quản lý lớp." />
  const userName = (id) => users.find((user) => user.id === id)?.fullName || id
  const subjectName = (id) => options.subjects.find((subject) => subject.id === id)?.name || '—'
  const statusTag = (value) => { const view = statusView(value); return <StatusTag tone={view.tone}>{view.label}</StatusTag> }
  const shown = visibleClasses(classes, { subjectId: subjectFilter, activeOnly: !showAll })
  const currentPage = clampPage(page, 10, shown.length)
  const summary = memberSummary(members)
  const classStatusOptions = [{ value: 1, label: 'Đang hoạt động' }, { value: 0, label: 'Ngừng hoạt động' }]
  if (editing?.status === 255) classStatusOptions.push({ value: 255, label: 'Đã ẩn', disabled: true })

  const memberColumns = [
    { title: 'STT', key: 'stt', width: 56, align: 'center', render: (_, __, index) => index + 1 },
    { title: 'Học viên', dataIndex: 'userId', render: (id) => {
      const user = users.find((item) => item.id === id)
      return user ? <span className="cell-stack"><strong>{user.fullName}</strong><small>{user.userName}</small></span> : id
    } },
    { title: 'Trạng thái', dataIndex: 'status', width: 120, render: (status) => Number(status) === 2
      ? <StatusTag tone="warning">Chờ duyệt</StatusTag> : <StatusTag tone="success">Đã duyệt</StatusTag> },
    { title: 'Thao tác', key: 'actions', width: 170, render: (_, member) => <div className="page-actions">
      {Number(member.status) === 2 && <Button size="small" type="primary" icon={<CheckOutlined />} disabled={saving}
        onClick={() => changeMember(() => approveClassMember(member))}>Duyệt</Button>}
      <Popconfirm title="Xóa thành viên khỏi lớp?" onConfirm={() => changeMember(() => removeClassMember(member.id))}>
        <Button size="small" danger icon={<DeleteOutlined />} disabled={saving}>Xóa</Button>
      </Popconfirm>
    </div> },
  ]
  const memberTable = (rows, emptyLabel) => <Table rowKey="id" size="small" loading={membersLoading} dataSource={rows}
    columns={memberColumns} pagination={{ pageSize: 8, showSizeChanger: false }}
    locale={{ emptyText: <TableEmpty error={membersLoadFailed} errorLabel="Không tải được dữ liệu." emptyLabel={emptyLabel} /> }} />

  return <section className="page-body">
    <PageHeader title="Quản lý lớp học" description="Theo dõi và duyệt thành viên các lớp học." />
    <LoadError error={loadError} onRetry={load} retrying={loading} />
    {error && <Alert type="error" showIcon title={error} className="page-alert" />}
    <PageCard>
      <div className="page-toolbar">
        {/* Smoke P1 dùng placeholder này và nút tìm đầu tiên của trang */}
        <Input.Search placeholder="Tìm tên hoặc mã lớp" aria-label="Tìm lớp học" allowClear maxLength={100}
          onSearch={(value) => { setSearch(value.trim()); setPage(1) }} />
        <Select allowClear placeholder="Tất cả môn học" aria-label="Lọc lớp theo môn học" style={{ minWidth: 200 }}
          popupMatchSelectWidth={false} showSearch={{ optionFilterProp: 'label' }} virtual={false} value={subjectFilter}
          options={options.subjects.map((subject) => ({ value: subject.id, label: subject.name }))}
          onChange={(value) => { setSubjectFilter(value); setPage(1) }} />
        <Select aria-label="Lọc trạng thái lớp" value={showAll} style={{ minWidth: 170 }}
          onChange={(value) => { setShowAll(value); setPage(1) }}
          options={[{ value: false, label: 'Đang hoạt động' }, { value: true, label: 'Tất cả' }]} />
        <div className="page-toolbar__end">
          <Button icon={<ReloadOutlined />} onClick={load} loading={loading}>Tải lại</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => showForm(null)}>Thêm lớp</Button>
        </div>
      </div>
      <Table rowKey="id" size="middle" loading={loading} dataSource={shown} scroll={{ x: 900 }}
        locale={{ emptyText: <TableEmpty error={Boolean(loadError)} errorLabel="Không tải được dữ liệu."
          filtered={Boolean(search || subjectFilter || !showAll)} emptyLabel="Chưa có lớp học" filteredLabel="Không có lớp khớp bộ lọc" /> }}
        pagination={{ current: currentPage, pageSize: 10, showSizeChanger: false, onChange: setPage, showTotal: showTotalLabel('lớp học') }}
        columns={[
          { title: 'STT', key: 'stt', width: 64, align: 'center', render: (_, __, index) => rowNumber(currentPage, 10, index) },
          { title: 'Mã lớp', dataIndex: 'classCode', render: (value) => <strong>{value}</strong> },
          { title: 'Tên lớp', dataIndex: 'name' },
          { title: 'Môn học', dataIndex: 'subjectId', render: subjectName },
          { title: 'Giảng viên', dataIndex: 'teacherId', render: userName },
          { title: 'Sức chứa', dataIndex: 'capacity', align: 'right', width: 100 },
          { title: 'Trạng thái', dataIndex: 'status', width: 150, render: statusTag },
          { title: 'Thao tác', key: 'actions', width: 260, render: (_, item) => <div className="page-actions">
            <Button size="small" icon={<TeamOutlined />} onClick={() => openMembers(item)}>Thành viên</Button>
            <Button size="small" icon={<EditOutlined />} onClick={() => showForm(item)}>Sửa</Button>
            {item.status !== 255 && <Popconfirm title="Ẩn lớp này?" onConfirm={() => removeClass(item.id)}>
              <Button size="small" danger icon={<EyeInvisibleOutlined />}>Ẩn</Button></Popconfirm>}
          </div> },
        ]} />
    </PageCard>
    <Modal title={editing ? 'Sửa lớp' : 'Thêm lớp'} open={formOpen} onCancel={() => setFormOpen(false)}
      onOk={() => form.submit()} confirmLoading={saving} destroyOnHidden>
      {formError && <Alert type="error" showIcon title={formError} className="page-alert" />}
      <Form form={form} layout="vertical" onFinish={save}>
        <Form.Item name="name" label="Tên lớp" rules={[{ required: true, message: 'Nhập tên lớp' }]}><Input maxLength={200} /></Form.Item>
        <Form.Item name="classCode" label="Mã lớp" rules={[{ required: true, message: 'Nhập mã lớp' }]}><Input maxLength={100} /></Form.Item>
        <Form.Item name="description" label="Mô tả"><Input.TextArea rows={3} maxLength={500} /></Form.Item>
        <Form.Item name="capacity" label="Sức chứa" rules={[{ required: true, message: 'Nhập sức chứa' }]}><InputNumber min={1} className="w-full" /></Form.Item>
        <Form.Item name="teacherId" label="Giảng viên" rules={[{ required: true, message: 'Chọn giảng viên' }]}>
          <Select showSearch={{ optionFilterProp: 'label' }} options={options.teachers.map((item) => ({ value: item.id, label: item.fullName }))} />
        </Form.Item>
        <Form.Item name="subjectId" label="Môn học">
          <Select allowClear showSearch={{ optionFilterProp: 'label' }} virtual={false}
            options={options.subjects.map((item) => ({ value: item.id, label: item.name }))} />
        </Form.Item>
        <Form.Item name="status" label="Trạng thái"><Select options={classStatusOptions} /></Form.Item>
      </Form>
    </Modal>
    <Modal title={`Thành viên · ${selectedClass?.name || ''}`} open={Boolean(selectedClass)}
      onCancel={() => setSelectedClass(null)} footer={null} width={760} destroyOnHidden>
      {selectedClass && <div className="detail-meta">
        <span>Mã lớp: <strong>{selectedClass.classCode}</strong></span>
        {statusTag(selectedClass.status)}
        <span>Môn học: {subjectName(selectedClass.subjectId)}</span>
        <span>Đã duyệt: {summary.approved}/{selectedClass.capacity}</span>
        <span>Đang chờ: {summary.pending}</span>
      </div>}
      {memberError && <Alert type="error" showIcon title={memberError} className="page-alert" />}
      <Form form={memberForm} layout="inline" className="mb-4"
        onFinish={({ userId }) => changeMember(() => addClassMember(selectedClass.id, userId))}>
        <Form.Item name="userId" rules={[{ required: true, message: 'Chọn học viên' }]}>
          <Select showSearch={{ optionFilterProp: 'label' }} placeholder="Chọn học viên" style={{ minWidth: 270 }}
            options={users.filter((user) => user.levelId === 4 && user.status === 1)
              .map((user) => ({ value: user.id, label: `${user.fullName} (${user.userName})` }))} />
        </Form.Item>
        <Button htmlType="submit" type="primary" icon={<UserAddOutlined />} loading={saving}>Thêm học viên</Button>
      </Form>
      <Tabs items={[
        { key: 'members', label: `Thành viên (${summary.approved})`,
          children: memberTable(members.filter((member) => Number(member.status) !== 2), 'Chưa có thành viên') },
        { key: 'pending', label: `Yêu cầu đang chờ (${summary.pending})`,
          children: memberTable(members.filter((member) => Number(member.status) === 2), 'Không có yêu cầu đang chờ') },
      ]} />
    </Modal>
  </section>
}
