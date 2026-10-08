import { useCallback, useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { Alert, Button, Form, Input, Modal, Popconfirm, Select, Space, Table, Typography } from 'antd'
import { getApiError } from '../../api/response'
import {
  assignScheduleClass, createSchedule, deleteSchedule, getScheduleAssignments,
  getScheduleClassOptions, getScheduleExamOptions, getScheduleRoomOptions,
  getSchedules, unassignScheduleClass, updateSchedule,
} from '../../services/scheduleService'
import { formatScheduleTime, toVietnamInput, vietnamInputToUtc } from '../../services/scheduleTime'
import { canChangeSchedule, scheduleChangeReason } from '../../services/schedulePolicy'

const statusOptions = [{ value: 2, label: 'Nháp' }, { value: 1, label: 'Hoạt động' }]
const canChange = canChangeSchedule

export default function AdminSchedulesPage() {
  const allowed = (useSelector((state) => state.auth.user?.permissions) || []).some((id) => String(id) === '4')
  const [form] = Form.useForm()
  const [assignmentForm] = Form.useForm()
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
  const [formError, setFormError] = useState('')
  const [assignmentError, setAssignmentError] = useState('')
  const [notice, setNotice] = useState('')

  const load = useCallback(async () => {
    if (!allowed) return false
    setLoading(true); setError('')
    try {
      const [schedules, links, classOptions, examOptions, roomOptions] = await Promise.all([
        getSchedules(), getScheduleAssignments(), getScheduleClassOptions(),
        getScheduleExamOptions(), getScheduleRoomOptions(),
      ])
      setRows(schedules.filter((item) => item.status !== 255))
      setAssignments(links)
      setClasses(classOptions)
      setExams(examOptions)
      setRooms(roomOptions)
      return true
    } catch (failure) { setError(getApiError(failure)); return false }
    finally { setLoading(false) }
  }, [allowed])

  useEffect(() => { load() }, [load])
  if (!allowed) return <Alert type="error" title="Bạn không có quyền quản lý lịch thi." />

  const selected = rows.find((item) => item.id === selectedId)
  const selectedLinks = assignments.filter((link) => link.examScheduleId === selectedId)
  const className = (id) => classes.find((item) => item.id === id)?.name || `#${id}`
  const examName = (id) => exams.find((item) => item.id === id)?.name || `#${id}`
  const roomName = (id) => rooms.find((item) => item.id === id)?.name || (id ? `#${id}` : '—')

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
      assignmentForm.resetFields()
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

  return <section className="p-6">
    <Typography.Title level={2}>Quản lý lịch thi</Typography.Title>
    <Typography.Paragraph>Nhập và xem giờ theo Asia/Ho_Chi_Minh. Máy chủ lưu lịch mới theo UTC.</Typography.Paragraph>
    {error && <Alert type="error" showIcon title={error} className="mb-4" />}
    {notice && <Alert type="success" showIcon title={notice} className="mb-4" />}
    <Space className="mb-4"><Button type="primary" onClick={() => openForm(null)}>Tạo lịch</Button><Button onClick={load}>Tải lại</Button></Space>
    <Table rowKey="id" loading={loading} dataSource={rows} pagination={{ pageSize: 10 }}
      locale={{ emptyText: 'Chưa có lịch thi' }} columns={[
        { title: 'Lịch thi', dataIndex: 'title', render: (value, item) => value || `#${item.id}` },
        { title: 'Bài thi', dataIndex: 'examId', render: examName },
        { title: 'Bắt đầu', dataIndex: 'startTime', render: (value, item) => formatScheduleTime(value, item.timeZoneStatus) },
        { title: 'Kết thúc', dataIndex: 'endTime', render: (value, item) => formatScheduleTime(value, item.timeZoneStatus) },
        { title: 'Phòng', dataIndex: 'roomId', render: roomName },
        { title: 'Trạng thái', dataIndex: 'status', render: (value) => value === 1 ? 'Hoạt động' : 'Nháp' },
        { title: 'Lớp đã gán', render: (_, item) => assignments.filter((link) => link.examScheduleId === item.id)
          .map((link) => className(link.classId)).join(', ') || '—' },
        { title: 'Thao tác', render: (_, item) => <Space wrap>
          <Button onClick={() => { setAssignmentError(''); setSelectedId(item.id) }}>Xem lớp</Button>
          <Button disabled={!canChange(item)} title={changeReason(item)} onClick={() => openForm(item)}>Sửa</Button>
          <Popconfirm title="Xóa mềm lịch thi này?" onConfirm={() => removeSchedule(item)} disabled={!canChange(item)}>
            <Button danger disabled={!canChange(item)} title={changeReason(item)}>Xóa</Button>
          </Popconfirm>
        </Space> },
      ]} />
    <Modal title={editing ? 'Sửa lịch thi' : 'Tạo lịch thi'} open={formOpen}
      onCancel={() => setFormOpen(false)} onOk={() => form.submit()} confirmLoading={saving} forceRender>
      {formError && <Alert type="error" showIcon title={formError} className="mb-4" />}
      <Form form={form} layout="vertical" onFinish={saveSchedule}>
        <Form.Item name="title" label="Tên lịch" rules={[{ required: true, whitespace: true }]}><Input /></Form.Item>
        <Form.Item name="examId" label="Bài thi" rules={[{ required: true }]}>
          <Select showSearch optionFilterProp="label" options={exams.map((item) => ({ value: item.id, label: item.name }))} />
        </Form.Item>
        <Form.Item name="roomId" label="Phòng thi"><Select allowClear showSearch optionFilterProp="label"
          options={rooms.map((item) => ({ value: item.id, label: `${item.name} (${item.capacity} chỗ)` }))} /></Form.Item>
        <Form.Item name="startTime" label="Bắt đầu (giờ Việt Nam)" rules={[{ required: true }]}><Input type="datetime-local" /></Form.Item>
        <Form.Item name="endTime" label="Kết thúc (giờ Việt Nam)" rules={[{ required: true }]}><Input type="datetime-local" /></Form.Item>
        <Form.Item name="status" label="Trạng thái" rules={[{ required: true }]}><Select options={statusOptions} /></Form.Item>
        <Form.Item name="description" label="Mô tả"><Input.TextArea /></Form.Item>
      </Form>
    </Modal>
    <Modal title={`Lớp của lịch: ${selected?.title || selected?.id || ''}`} open={selectedId !== null}
      onCancel={() => setSelectedId(null)} footer={<Button onClick={() => setSelectedId(null)}>Đóng</Button>} destroyOnHidden>
      {assignmentError && <Alert type="error" showIcon title={assignmentError} className="mb-4" />}
      {selected && changeReason(selected) && <Alert type="warning" showIcon title={changeReason(selected)} className="mb-4" />}
      <Table rowKey="id" dataSource={selectedLinks} pagination={false} size="small"
        locale={{ emptyText: 'Chưa gán lớp' }} columns={[
          { title: 'Lớp', dataIndex: 'classId', render: className },
          { title: 'Thao tác', render: (_, link) => <Popconfirm title="Hủy gán lớp này?" onConfirm={() => unassign(link)} disabled={!canChange(selected)}>
            <Button danger disabled={!canChange(selected) || saving}>Hủy gán</Button>
          </Popconfirm> },
        ]} />
      {canChange(selected) && <Form form={assignmentForm} layout="inline" onFinish={assignClass} className="mt-4">
        <Form.Item name="classId" rules={[{ required: true, message: 'Chọn lớp cần gán.' }]}>
          <Select placeholder="Chọn lớp" showSearch optionFilterProp="label" style={{ minWidth: 220 }}
            options={classes.filter((item) => !selectedLinks.some((link) => link.classId === item.id))
              .map((item) => ({ value: item.id, label: `${item.name} (${item.classCode})` }))} />
        </Form.Item>
        <Button type="primary" htmlType="submit" loading={saving}>Gán lớp</Button>
      </Form>}
    </Modal>
  </section>
}
