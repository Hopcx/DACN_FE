import { useCallback, useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { Alert, Button, Form, Input, Popconfirm, Space, Table, Tabs } from 'antd'
import PageHeader from '../../components/ui/PageHeader'
import PageCard from '../../components/ui/PageCard'
import StatusTag from '../../components/ui/StatusTag'
import { formatScheduleTime } from '../../services/scheduleTime'
import { getApiError } from '../../api/response'
import { addTeacherClassMember, approveTeacherClassMember, getTeacherClasses,
  getTeacherClassMembers, getTeacherClassResults, getTeacherClassSchedules, lookupTeacherStudent, removeTeacherClassMember } from '../../services/classService'

export default function TeacherClassesPage() {
  const isTeacher = ['1', '3'].includes(String(useSelector((state) => state.auth.user?.levelId)))
  const [form] = Form.useForm()
  const [classes, setClasses] = useState([])
  const [selected, setSelected] = useState(null)
  const [members, setMembers] = useState([])
  const [lookup, setLookup] = useState(null)
  const [schedules, setSchedules] = useState([])
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    if (!isTeacher) return
    setLoading(true); setError('')
    try { setClasses(await getTeacherClasses()) }
    catch (failure) { setError(getApiError(failure)) }
    finally { setLoading(false) }
  }, [isTeacher])

  useEffect(() => { load() }, [load])

  async function choose(item) {
    setSelected(item); setMembers([]); setSchedules([]); setResults([]); setLookup(null); setError('')
    try {
      const [memberRows, scheduleRows, resultRows] = await Promise.all([
        getTeacherClassMembers(item.id), getTeacherClassSchedules(item.id), getTeacherClassResults(item.id)])
      setMembers(memberRows); setSchedules(scheduleRows); setResults(resultRows)
    }
    catch (failure) { setError(getApiError(failure)) }
  }

  async function write(operation) {
    setBusy(true); setError('')
    try {
      await operation()
      setMembers(await getTeacherClassMembers(selected.id))
      setClasses(await getTeacherClasses())
      setLookup(null); form.resetFields()
    } catch (failure) { setError(getApiError(failure)) }
    finally { setBusy(false) }
  }

  async function findStudent() {
    try {
      const { email } = await form.validateFields()
      setBusy(true); setError(''); setLookup(null)
      setLookup(await lookupTeacherStudent(selected.id, email.trim()))
    } catch (failure) {
      if (!failure?.errorFields) setError(getApiError(failure))
    } finally { setBusy(false) }
  }

  if (!isTeacher) return <Alert type="error" message="Bạn không có quyền xem lớp của giảng viên." />
  return <section className="page-body">
    <PageHeader title="Lớp của tôi" description="Quản lý thành viên, xem lịch thi và kết quả của các lớp bạn phụ trách." extra={<Button onClick={load}>Tải lại</Button>} />
    {error && <Alert type="error" showIcon message={error} className="mb-4" />}
    <Table rowKey="id" loading={loading} dataSource={classes} locale={{ emptyText: 'Chưa có lớp được phân công' }}
      columns={[
        { title: 'Lớp', dataIndex: 'name' },
        { title: 'Mã lớp', dataIndex: 'classCode' },
        { title: 'Môn', dataIndex: 'subjectName', render: (name) => name || '—' },
        { title: 'Sĩ số tối đa', dataIndex: 'capacity' },
        { title: 'Trạng thái', dataIndex: 'status', render: (status) => status === 1 ? <StatusTag tone="success">Hoạt động</StatusTag> : <StatusTag>Tạm ngừng</StatusTag> },
        { title: 'Thao tác', render: (_, item) => <Button onClick={() => choose(item)}>Quản lý lớp</Button> },
      ]} />
    {selected && <PageCard className="teacher-detail">
      <h2 className="page-section-title">Lớp {selected.name}</h2>
      <Tabs items={[
        { key: 'members', label: `Thành viên (${members.length})`, children: <div>
        <Form form={form} layout="inline" onFinish={findStudent}>
          <Form.Item name="email" rules={[{ required: true, type: 'email', message: 'Nhập email hợp lệ' }]}>
            <Input type="email" placeholder="Email học viên đã xác minh" style={{ minWidth: 280 }}
              onChange={() => setLookup(null)} />
          </Form.Item>
          <Button htmlType="submit" loading={busy}>Tìm học viên</Button>
        </Form>
        {lookup && <Space className="my-4">
          <span>{lookup.fullName} ({lookup.email})</span>
          <Button type="primary" disabled={selected.status !== 1} loading={busy}
            onClick={() => write(() => addTeacherClassMember(selected.id, lookup.email))}>Thêm vào lớp</Button>
        </Space>}
        <Table rowKey="id" dataSource={members} loading={busy} className="mt-4"
          locale={{ emptyText: 'Chưa có thành viên' }} columns={[
            { title: 'Học viên', dataIndex: 'fullName' },
            { title: 'Email', dataIndex: 'email' },
            { title: 'Trạng thái', dataIndex: 'status', render: (status) => status === 1 ? <StatusTag tone="success">Đã duyệt</StatusTag> : <StatusTag tone="warning">Chờ duyệt</StatusTag> },
            { title: 'Thao tác', render: (_, member) => <Space>
              {member.status === 2 && <Button disabled={busy} onClick={() => write(() => approveTeacherClassMember(selected.id, member.id))}>Duyệt</Button>}
              <Popconfirm title="Xóa học viên khỏi lớp?" onConfirm={() => write(() => removeTeacherClassMember(selected.id, member.id))}>
                <Button danger disabled={busy}>Xóa</Button>
              </Popconfirm>
            </Space> },
          ]} />
        </div> },
        { key: 'schedules', label: `Lịch thi (${schedules.length})`, children: <Table rowKey="id" dataSource={schedules}
          locale={{ emptyText: 'Lớp chưa được gán lịch thi' }} columns={[
            { title: 'Lịch thi', dataIndex: 'title', render: (value, row) => value || row.examName },
            { title: 'Bài thi', dataIndex: 'examName' },
            { title: 'Môn', dataIndex: 'subjectName', render: (value) => value || '—' },
            { title: 'Phòng', dataIndex: 'roomName', render: (value) => value || '—' },
            { title: 'Bắt đầu', dataIndex: 'startTime', render: (value, row) => formatScheduleTime(value, row.timeZoneStatus) },
            { title: 'Kết thúc', dataIndex: 'endTime', render: (value, row) => formatScheduleTime(value, row.timeZoneStatus) },
          ]} /> },
        { key: 'results', label: `Kết quả (${results.length})`, children: <Table rowKey="attemptId" dataSource={results}
          locale={{ emptyText: 'Chưa có lượt thi của học viên đã duyệt' }} columns={[
            { title: 'Học viên', dataIndex: 'studentName' },
            { title: 'Bài thi', dataIndex: 'examName' },
            { title: 'Bắt đầu', dataIndex: 'startedAt', render: (value) => formatScheduleTime(value, 'utc') },
            { title: 'Trạng thái', dataIndex: 'state', render: (value) => ({
              inProgress: <StatusTag tone="info">Đang làm</StatusTag>, submitted: <StatusTag tone="success">Đã nộp</StatusTag>,
              timedOut: <StatusTag tone="warning">Hết giờ</StatusTag>, voided: <StatusTag tone="danger">Đã hủy</StatusTag> }[value] || value) },
            { title: 'Điểm', dataIndex: 'totalMark', render: (value) => value ?? '—' },
            { title: 'Kết quả', dataIndex: 'isPassed', render: (value) => value == null ? '—' : value ? 'Đạt' : 'Chưa đạt' },
          ]} /> },
      ]} />
    </PageCard>}
  </section>
}
