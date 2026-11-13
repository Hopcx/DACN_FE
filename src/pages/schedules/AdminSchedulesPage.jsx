import { useCallback, useEffect, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import { Alert, Button, Col, DatePicker, Form, Input, Modal, Popconfirm, Row, Select, Table } from 'antd'
import { DeleteOutlined, DisconnectOutlined, EditOutlined, PlusOutlined, ReloadOutlined, TeamOutlined } from '@ant-design/icons'
import PageHeader from '../../components/ui/PageHeader'
import PageCard from '../../components/ui/PageCard'
import StatusTag from '../../components/ui/StatusTag'
import { LoadError, TableEmpty } from '../../components/ui/PageState'
import { getApiError, toLoadError } from '../../api/response'
import {
  assignScheduleClass, createSchedule, deleteSchedule, getScheduleAssignments,
  getScheduleClassOptions, getScheduleExamOptions, getScheduleRoomOptions,
  getSchedules, unassignScheduleClass, updateSchedule,
} from '../../services/scheduleService'
import { formatScheduleTime, toVietnamInput, vietnamInputToUtc } from '../../services/scheduleTime'
import { canChangeSchedule, scheduleChangeReason } from '../../services/schedulePolicy'
import { clampPage, rowNumber, showTotalLabel } from '../../services/listView'
import { assignableClasses, visibleSchedules } from '../../services/scheduleList'

const statusOptions = [{ value: 2, label: 'Nháp' }, { value: 1, label: 'Hoạt động' }]
const canChange = canChangeSchedule
const timeHeader = (label) => <span className="cell-stack">{label}<small>Asia/Ho_Chi_Minh</small></span>

export default function AdminSchedulesPage() {
  const authUser = useSelector((state) => state.auth.user)
  const allowed = String(authUser?.levelId) === '1' || (authUser?.permissions || []).some((id) => String(id) === '4')
  const [form] = Form.useForm()
  const [rows, setRows] = useState([])
  const [assignments, setAssignments] = useState([])
  const [classes, setClasses] = useState([])
  const [exams, setExams] = useState([])
  const [rooms, setRooms] = useState([])
  const [editing, setEditing] = useState(null)
  const [formOpen, setFormOpen] = useState(false)
  const [selectedId, setSelectedId] = useState(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [loadError, setLoadError] = useState(null)
  const [formError, setFormError] = useState('')
  const [assignmentError, setAssignmentError] = useState('')
  const [notice, setNotice] = useState('')
  const [filters, setFilters] = useState({})
  const [page, setPage] = useState(1)
  const [classKeyword, setClassKeyword] = useState('')
  const requestRef = useRef(0)

  const load = useCallback(async () => {
    if (!allowed) return false
    const requestId = ++requestRef.current
    setLoading(true); setLoadError(null)
    try {
      const [schedules, links, classOptions, examOptions, roomOptions] = await Promise.all([
        getSchedules(), getScheduleAssignments(), getScheduleClassOptions(),
        getScheduleExamOptions(), getScheduleRoomOptions(),
      ])
      if (requestId !== requestRef.current) return false
      setRows(schedules.filter((item) => item.status !== 255))
      setAssignments(links)
      setClasses(classOptions)
      setExams(examOptions)
      setRooms(roomOptions)
      return true
    } catch (failure) {
      if (requestId === requestRef.current) setLoadError(toLoadError(failure))
      return false
    } finally {
      if (requestId === requestRef.current) setLoading(false)
    }
  }, [allowed])

  useEffect(() => { load() }, [load])
  if (!allowed) return <Alert type="error" showIcon title="Bạn không có quyền quản lý lịch thi." />

  const selected = rows.find((item) => item.id === selectedId)
  const selectedLinks = assignments.filter((link) => link.examScheduleId === selectedId)
  const classOf = (id) => classes.find((item) => item.id === id)
  const className = (id) => classOf(id)?.name || `#${id}`
  const examName = (id) => exams.find((item) => item.id === id)?.name || `#${id}`
  const roomOf = (id) => rooms.find((item) => item.id === id)
  const roomName = (id) => roomOf(id)?.name || (id ? `#${id}` : '—')
  const linkCount = (id) => assignments.filter((link) => link.examScheduleId === id).length

  function changeFilter(patch) {
    setFilters((old) => ({ ...old, ...patch })); setPage(1)
  }

  function openForm(item) {
    if (item && !canChange(item)) return
    setError(''); setFormError(''); setNotice(''); setEditing(item || null)
    form.resetFields()
    form.setFieldsValue(item ? {
      title: item.title, description: item.description, examId: item.examId,
      roomId: item.roomId, startTime: toVietnamInput(item.startTime),
      endTime: toVietnamInput(item.endTime), status: item.status,
    } : { status: 2 })
    setFormOpen(true)
  }

  function openAssignments(item) {
    setAssignmentError(''); setClassKeyword(''); setSelectedId(item.id)
  }

  async function saveSchedule(values) {
    setSaving(true); setError(''); setFormError(''); setNotice('')
    try {
      const startTime = vietnamInputToUtc(values.startTime)
      const endTime = vietnamInputToUtc(values.endTime)
      if (startTime >= endTime) throw new Error('Thời gian kết thúc phải sau thời gian bắt đầu.')
      const exam = exams.find((item) => item.id === values.examId)
      if (!exam) throw new Error('Bài thi không còn trong danh sách chọn.')
      const body = {
        title: values.title.trim(), description: values.description?.trim() || null,
        examId: values.examId, subjectId: exam.subjectId,
        roomId: values.roomId ?? null, startTime, endTime, status: values.status,
      }
      if (editing) await updateSchedule(editing.id, body)
      else await createSchedule(body)
      setFormOpen(false)
      if (await load()) setNotice(editing ? 'Đã cập nhật lịch thi.' : 'Đã tạo lịch thi.')
    } catch (failure) { setFormError(getApiError(failure)) }
    finally { setSaving(false) }
  }

  async function assignClass(values) {
    if (!canChange(selected)) return
    setSaving(true); setAssignmentError(''); setNotice('')
    try {
      await assignScheduleClass(selected.id, values.classId)
      if (await load()) setNotice('Đã gán lớp vào lịch thi.')
    } catch (failure) { setAssignmentError(getApiError(failure)) }
    finally { setSaving(false) }
  }

  async function unassign(link) {
    if (!canChange(selected)) return
    setSaving(true); setAssignmentError(''); setNotice('')
    try {
      await unassignScheduleClass(link.id)
      if (await load()) setNotice('Đã hủy gán lớp.')
    } catch (failure) { setAssignmentError(getApiError(failure)) }
    finally { setSaving(false) }
  }

  async function removeSchedule(item) {
    if (!canChange(item)) return
    setSaving(true); setError(''); setNotice('')
    try {
      await deleteSchedule(item.id)
      if (selectedId === item.id) setSelectedId(null)
      if (await load()) setNotice('Đã xóa mềm lịch thi.')
    } catch (failure) { setError(getApiError(failure)) }
    finally { setSaving(false) }
  }

  const changeReason = scheduleChangeReason
  const statusTags = (item) => <div className="page-actions">
    {Number(item.status) === 1 ? <StatusTag tone="success">Hoạt động</StatusTag> : <StatusTag tone="warning">Nháp</StatusTag>}
    {item.hasAttempts && <StatusTag tone="info">Có lượt thi</StatusTag>}
    {item.timeZoneStatus !== 'utc' && <StatusTag>Chưa rõ múi giờ</StatusTag>}
  </div>
  const shown = visibleSchedules(rows, assignments, {
    from: filters.range?.[0]?.format('YYYY-MM-DD'), to: filters.range?.[1]?.format('YYYY-MM-DD'),
    examId: filters.examId, classId: filters.classId, status: filters.status,
  })
  const currentPage = clampPage(page, 10, shown.length)
  const filtered = Boolean(filters.range || filters.examId || filters.classId || filters.status)
  const assignable = assignableClasses(classes, selectedLinks, classKeyword)
  const selectedRoom = selected ? roomOf(selected.roomId) : null

  return <section className="page-body">
    <PageHeader title="Quản lý lịch thi" description="Tạo, chỉnh sửa và gán lớp cho các lịch thi. Giờ hiển thị theo Asia/Ho_Chi_Minh." />
    <LoadError error={loadError} onRetry={load} retrying={loading} />
    {error && <Alert type="error" showIcon title={error} className="page-alert" />}
    {notice && <Alert type="success" showIcon title={notice} className="page-alert" />}
    <PageCard>
      <div className="page-toolbar">
        <DatePicker.RangePicker aria-label="Lọc theo ngày thi" format="DD/MM/YYYY" placeholder={['Từ ngày', 'Đến ngày']}
          value={filters.range} onChange={(range) => changeFilter({ range: range || undefined })} />
        <Select allowClear placeholder="Tất cả bài thi" aria-label="Lọc theo bài thi" style={{ minWidth: 200 }} popupMatchSelectWidth={false}
          showSearch={{ optionFilterProp: 'label' }} virtual={false} value={filters.examId}
          options={exams.map((item) => ({ value: item.id, label: item.name }))} onChange={(examId) => changeFilter({ examId })} />
        <Select allowClear placeholder="Tất cả lớp" aria-label="Lọc theo lớp" style={{ minWidth: 180 }} popupMatchSelectWidth={false}
          showSearch={{ optionFilterProp: 'label' }} virtual={false} value={filters.classId}
          options={classes.map((item) => ({ value: item.id, label: `${item.name} (${item.classCode})` }))}
          onChange={(classId) => changeFilter({ classId })} />
        <Select allowClear placeholder="Tất cả trạng thái" aria-label="Lọc trạng thái lịch" style={{ minWidth: 160 }}
          value={filters.status} options={statusOptions} onChange={(status) => changeFilter({ status })} />
        <div className="page-toolbar__end">
          <Button icon={<ReloadOutlined />} onClick={load} loading={loading}>Tải lại</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => openForm(null)}>Tạo lịch</Button>
        </div>
      </div>
      <Table rowKey="id" size="middle" loading={loading} dataSource={shown} scroll={{ x: 1100 }}
        pagination={{ current: currentPage, pageSize: 10, showSizeChanger: false, onChange: setPage, showTotal: showTotalLabel('lịch thi') }}
        locale={{ emptyText: <TableEmpty error={Boolean(loadError)} errorLabel="Không tải được dữ liệu." filtered={filtered}
          emptyLabel="Chưa có lịch thi" filteredLabel="Không có lịch thi khớp bộ lọc" /> }} columns={[
          { title: 'STT', key: 'stt', width: 64, align: 'center', render: (_, __, index) => rowNumber(currentPage, 10, index) },
          { title: 'Lịch thi', dataIndex: 'title', render: (value, item) => <span className="cell-stack">
            <strong>{value || `#${item.id}`}</strong><small>{examName(item.examId)}</small></span> },
          { title: 'Phòng thi', dataIndex: 'roomId', width: 120, render: roomName },
          { title: timeHeader('Bắt đầu'), dataIndex: 'startTime', width: 170, render: (value, item) => formatScheduleTime(value, item.timeZoneStatus) },
          { title: timeHeader('Kết thúc'), dataIndex: 'endTime', width: 170, render: (value, item) => formatScheduleTime(value, item.timeZoneStatus) },
          { title: 'Lớp gán', key: 'classes', width: 100, align: 'center', render: (_, item) => `${linkCount(item.id)} lớp` },
          { title: 'Trạng thái', dataIndex: 'status', width: 170, render: (_, item) => statusTags(item) },
          { title: 'Thao tác', key: 'actions', width: 260, render: (_, item) => <div className="page-actions">
            <Button size="small" icon={<EditOutlined />} disabled={!canChange(item)} title={changeReason(item)} onClick={() => openForm(item)}>Sửa</Button>
            <Button size="small" icon={<TeamOutlined />} onClick={() => openAssignments(item)}>Gán lớp</Button>
            <Popconfirm title="Xóa mềm lịch thi này?" onConfirm={() => removeSchedule(item)} disabled={!canChange(item)}>
              <Button size="small" danger icon={<DeleteOutlined />} disabled={!canChange(item)} title={changeReason(item)}>Xóa</Button>
            </Popconfirm>
          </div> },
        ]} />
    </PageCard>
    <Modal title={editing ? 'Sửa lịch thi' : 'Tạo lịch thi'} open={formOpen} width={640}
      onCancel={() => setFormOpen(false)} onOk={() => form.submit()} confirmLoading={saving} forceRender>
      {formError && <Alert type="error" showIcon title={formError} className="page-alert" />}
      <Form form={form} layout="vertical" onFinish={saveSchedule}>
        <Form.Item name="title" label="Tên lịch" rules={[{ required: true, whitespace: true, message: 'Nhập tên lịch' }]}>
          <Input maxLength={200} />
        </Form.Item>
        <Row gutter={12}>
          <Col xs={24} md={14}>
            <Form.Item name="examId" label="Bài thi" rules={[{ required: true, message: 'Chọn bài thi' }]}>
              <Select showSearch={{ optionFilterProp: 'label' }} virtual={false} options={exams.map((item) => ({ value: item.id, label: item.name }))} />
            </Form.Item>
          </Col>
          <Col xs={24} md={10}>
            <Form.Item name="roomId" label="Phòng thi">
              <Select allowClear showSearch={{ optionFilterProp: 'label' }} virtual={false}
                options={rooms.map((item) => ({ value: item.id, label: `${item.name} (Sức chứa: ${item.capacity})` }))} />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={12}>
          <Col xs={24} md={12}>
            <Form.Item name="startTime" label="Thời gian bắt đầu" rules={[{ required: true, message: 'Chọn thời gian bắt đầu' }]}>
              <Input type="datetime-local" />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="endTime" label="Thời gian kết thúc" rules={[{ required: true, message: 'Chọn thời gian kết thúc' }]}>
              <Input type="datetime-local" />
            </Form.Item>
          </Col>
        </Row>
        <Alert type="info" showIcon className="page-alert" title="Múi giờ hiển thị: Asia/Ho_Chi_Minh"
          description="Giờ nhập theo giờ Việt Nam và được máy chủ lưu theo UTC." />
        <Form.Item name="status" label="Trạng thái" rules={[{ required: true, message: 'Chọn trạng thái' }]}
          extra="Lịch ở trạng thái Hoạt động mới được kiểm trùng phòng và trùng lịch học viên khi lưu.">
          <Select options={statusOptions} />
        </Form.Item>
        <Form.Item name="description" label="Mô tả"><Input.TextArea rows={2} maxLength={500} /></Form.Item>
      </Form>
    </Modal>
    <Modal title={`Gán lớp cho lịch: ${selected?.title || selected?.id || ''}`} open={selectedId !== null} width={960}
      onCancel={() => setSelectedId(null)} footer={<Button onClick={() => setSelectedId(null)}>Đóng</Button>} destroyOnHidden>
      {selected && <div className="detail-meta">
        <span>Bài thi: <strong>{examName(selected.examId)}</strong></span>
        <span>Phòng: {roomName(selected.roomId)}{selectedRoom?.capacity ? ` (Sức chứa: ${selectedRoom.capacity})` : ''}</span>
        <span>Thời gian: {formatScheduleTime(selected.startTime, selected.timeZoneStatus)} – {formatScheduleTime(selected.endTime, selected.timeZoneStatus)}</span>
        {statusTags(selected)}
      </div>}
      {selected && changeReason(selected) && <Alert type="warning" showIcon title={changeReason(selected)} className="page-alert" />}
      {assignmentError && <Alert type="error" showIcon title={assignmentError} className="page-alert" />}
      <Row gutter={16}>
        <Col xs={24} lg={12}>
          <h3 className="page-section-title">Lớp đã gán ({selectedLinks.length})</h3>
          <Table rowKey="id" size="small" dataSource={selectedLinks} pagination={{ pageSize: 6, showSizeChanger: false }}
            locale={{ emptyText: 'Chưa gán lớp' }} columns={[
              { title: 'STT', key: 'stt', width: 56, align: 'center', render: (_, __, index) => index + 1 },
              { title: 'Mã lớp', dataIndex: 'classId', render: (id) => classOf(id)?.classCode || '—' },
              { title: 'Tên lớp', dataIndex: 'classId', key: 'name', render: className },
              { title: 'Thao tác', key: 'actions', width: 120, render: (_, link) => <Popconfirm title="Hủy gán lớp này?"
                onConfirm={() => unassign(link)} disabled={!canChange(selected)}>
                <Button size="small" danger icon={<DisconnectOutlined />} disabled={!canChange(selected) || saving}>Hủy gán</Button>
              </Popconfirm> },
            ]} />
        </Col>
        <Col xs={24} lg={12}>
          <h3 className="page-section-title">Lớp có thể gán ({assignable.length})</h3>
          <Input.Search allowClear placeholder="Tìm theo mã lớp, tên lớp" aria-label="Tìm lớp để gán" maxLength={100} className="mb-4"
            onSearch={(value) => setClassKeyword(value)} onChange={(event) => { if (!event.target.value) setClassKeyword('') }} />
          <Table rowKey="id" size="small" dataSource={assignable} pagination={{ pageSize: 6, showSizeChanger: false }}
            locale={{ emptyText: classKeyword ? 'Không có lớp khớp từ khóa' : 'Không còn lớp để gán' }} columns={[
              { title: 'STT', key: 'stt', width: 56, align: 'center', render: (_, __, index) => index + 1 },
              { title: 'Mã lớp', dataIndex: 'classCode' },
              { title: 'Tên lớp', dataIndex: 'name' },
              { title: 'Thao tác', key: 'actions', width: 120, render: (_, item) => <Button size="small" type="primary"
                icon={<PlusOutlined />} disabled={!canChange(selected) || saving} onClick={() => assignClass({ classId: item.id })}>Gán lớp</Button> },
            ]} />
        </Col>
      </Row>
    </Modal>
  </section>
}
