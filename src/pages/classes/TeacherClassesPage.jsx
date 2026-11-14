import { useCallback, useEffect, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import { Alert, Button, Form, Input, Popconfirm, Table, Tabs } from 'antd'
import { CheckOutlined, CloseOutlined, DeleteOutlined, ReloadOutlined, SearchOutlined, TeamOutlined, UserAddOutlined } from '@ant-design/icons'
import PageHeader from '../../components/ui/PageHeader'
import PageCard from '../../components/ui/PageCard'
import StatusTag from '../../components/ui/StatusTag'
import { LoadError, TableEmpty } from '../../components/ui/PageState'
import { formatScheduleTime } from '../../services/scheduleTime'
import { getApiError, toLoadError } from '../../api/response'
import { showTotalLabel, statusView } from '../../services/listView'
import { addTeacherClassMember, approveTeacherClassMember, getTeacherClasses,
  getTeacherClassMembers, getTeacherClassResults, getTeacherClassSchedules, lookupTeacherStudent, removeTeacherClassMember } from '../../services/classService'

const stt = { title: 'STT', key: 'stt', width: 56, align: 'center', render: (_, __, index) => index + 1 }
const attemptState = {
  inProgress: <StatusTag tone="info">Đang làm</StatusTag>, submitted: <StatusTag tone="success">Đã nộp</StatusTag>,
  timedOut: <StatusTag tone="warning">Hết giờ</StatusTag>, voided: <StatusTag tone="danger">Đã hủy</StatusTag>,
}

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
  const [loadError, setLoadError] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState('')
  const [busy, setBusy] = useState(false)
  const requestRef = useRef(0)
  const detailRequestRef = useRef(0)

  const load = useCallback(async () => {
    if (!isTeacher) return
    const requestId = ++requestRef.current
    setLoading(true); setLoadError(null)
    try {
      const items = await getTeacherClasses()
      if (requestId === requestRef.current) setClasses(items)
    } catch (failure) {
      if (requestId === requestRef.current) setLoadError(toLoadError(failure))
    } finally {
      if (requestId === requestRef.current) setLoading(false)
    }
  }, [isTeacher])

  useEffect(() => { load() }, [load])

  async function choose(item) {
    // Bấm lớp khác nhanh: chỉ phản hồi của lần chọn cuối được ghi
    const requestId = ++detailRequestRef.current
    setSelected(item); setMembers([]); setSchedules([]); setResults([]); setLookup(null); setDetailError(''); setDetailLoading(true)
    try {
      const [memberRows, scheduleRows, resultRows] = await Promise.all([
        getTeacherClassMembers(item.id), getTeacherClassSchedules(item.id), getTeacherClassResults(item.id)])
      if (requestId !== detailRequestRef.current) return
      setMembers(memberRows); setSchedules(scheduleRows); setResults(resultRows)
    } catch (failure) {
      if (requestId === detailRequestRef.current) setDetailError(getApiError(failure))
    } finally {
      if (requestId === detailRequestRef.current) setDetailLoading(false)
    }
  }

  async function write(operation) {
    // Đổi sang lớp khác giữa chừng thì không ghi danh sách thành viên của lớp cũ lên lớp mới
    const requestId = detailRequestRef.current
    const classId = selected.id
    setBusy(true); setDetailError('')
    try {
      await operation()
      const memberRows = await getTeacherClassMembers(classId)
      if (requestId === detailRequestRef.current) { setMembers(memberRows); setLookup(null); form.resetFields() }
      setClasses(await getTeacherClasses())
    } catch (failure) {
      if (requestId === detailRequestRef.current) setDetailError(getApiError(failure))
    } finally { setBusy(false) }
  }

  async function findStudent() {
    try {
      const { email } = await form.validateFields()
      setBusy(true); setDetailError(''); setLookup(null)
      setLookup(await lookupTeacherStudent(selected.id, email.trim()))
    } catch (failure) {
      if (!failure?.errorFields) setDetailError(getApiError(failure))
    } finally { setBusy(false) }
  }

  if (!isTeacher) return <Alert type="error" showIcon title="Bạn không có quyền xem lớp của giảng viên." />
  const statusTag = (value) => { const view = statusView(value); return <StatusTag tone={view.tone}>{view.label}</StatusTag> }
  return <section className="page-body">
    <PageHeader title="Lớp của tôi" description="Quản lý thành viên, xem lịch thi và kết quả của các lớp bạn phụ trách." />
    <LoadError error={loadError} onRetry={load} retrying={loading} />
    <PageCard>
      <div className="page-toolbar">
        <div className="page-toolbar__end">
          <Button icon={<ReloadOutlined />} onClick={load} loading={loading}>Tải lại</Button>
        </div>
      </div>
      <Table rowKey="id" size="middle" loading={loading} dataSource={classes} scroll={{ x: 760 }}
        pagination={{ pageSize: 10, showSizeChanger: false, showTotal: showTotalLabel('lớp') }}
        locale={{ emptyText: <TableEmpty error={Boolean(loadError)} errorLabel="Không tải được dữ liệu." emptyLabel="Chưa có lớp được phân công" /> }}
        columns={[
          stt,
          { title: 'Mã lớp', dataIndex: 'classCode', render: (value) => <strong>{value}</strong> },
          { title: 'Lớp', dataIndex: 'name' },
          { title: 'Môn', dataIndex: 'subjectName', render: (name) => name || '—' },
          { title: 'Sĩ số tối đa', dataIndex: 'capacity', align: 'right', width: 110 },
          { title: 'Trạng thái', dataIndex: 'status', width: 150, render: statusTag },
          // Smoke P1 bấm nút chữ "Quản lý lớp" trong dòng lớp
          { title: 'Thao tác', key: 'actions', width: 150, render: (_, item) => <Button size="small" icon={<TeamOutlined />}
            type={selected?.id === item.id ? 'primary' : 'default'} onClick={() => choose(item)}>Quản lý lớp</Button> },
        ]} />
    </PageCard>
    {/* Smoke P1 tìm dòng thành viên trong .teacher-detail */}
    {selected && <PageCard className="teacher-detail">
      <div className="page-toolbar">
        <h2 className="page-section-title mb-0">Lớp {selected.name}</h2>
        <div className="page-toolbar__end">
          <Button icon={<CloseOutlined />} onClick={() => setSelected(null)}>Đóng</Button>
        </div>
      </div>
      {detailError && <Alert type="error" showIcon title={detailError} className="page-alert" />}
      <Tabs items={[
        { key: 'members', label: `Thành viên (${members.length})`, children: <div>
          <Form form={form} layout="inline" onFinish={findStudent}>
            <Form.Item name="email" rules={[{ required: true, type: 'email', message: 'Nhập email hợp lệ' }]}>
              <Input type="email" placeholder="Email học viên đã xác minh" style={{ minWidth: 260 }}
                onChange={() => setLookup(null)} />
            </Form.Item>
            <Button htmlType="submit" icon={<SearchOutlined />} loading={busy}>Tìm học viên</Button>
          </Form>
          {lookup && <div className="detail-meta mt-4">
            <span><strong>{lookup.fullName}</strong> ({lookup.email})</span>
            <Button type="primary" icon={<UserAddOutlined />} disabled={selected.status !== 1} loading={busy}
              onClick={() => write(() => addTeacherClassMember(selected.id, lookup.email))}>Thêm vào lớp</Button>
          </div>}
          <Table rowKey="id" size="small" dataSource={members} loading={busy || detailLoading} className="mt-4" scroll={{ x: 560 }}
            locale={{ emptyText: 'Chưa có thành viên' }} columns={[
              stt,
              { title: 'Học viên', dataIndex: 'fullName', render: (value, member) => <span className="cell-stack">
                <strong>{value}</strong><small>{member.email}</small></span> },
              { title: 'Trạng thái', dataIndex: 'status', width: 120, render: (status) => status === 1
                ? <StatusTag tone="success">Đã duyệt</StatusTag> : <StatusTag tone="warning">Chờ duyệt</StatusTag> },
              { title: 'Thao tác', key: 'actions', width: 180, render: (_, member) => <div className="page-actions">
                {member.status === 2 && <Button size="small" type="primary" icon={<CheckOutlined />} disabled={busy}
                  onClick={() => write(() => approveTeacherClassMember(selected.id, member.id))}>Duyệt</Button>}
                <Popconfirm title="Xóa học viên khỏi lớp?" onConfirm={() => write(() => removeTeacherClassMember(selected.id, member.id))}>
                  <Button size="small" danger icon={<DeleteOutlined />} disabled={busy}>Xóa</Button>
                </Popconfirm>
              </div> },
            ]} />
        </div> },
        { key: 'schedules', label: `Lịch thi (${schedules.length})`, children: <Table rowKey="id" size="small" dataSource={schedules}
          loading={detailLoading} scroll={{ x: 720 }} locale={{ emptyText: 'Lớp chưa được gán lịch thi' }} columns={[
            stt,
            { title: 'Lịch thi', dataIndex: 'title', render: (value, row) => <span className="cell-stack">
              <strong>{value || row.examName}</strong><small>{row.examName}</small></span> },
            { title: 'Môn', dataIndex: 'subjectName', render: (value) => value || '—' },
            { title: 'Phòng', dataIndex: 'roomName', render: (value) => value || '—' },
            { title: 'Bắt đầu', dataIndex: 'startTime', render: (value, row) => formatScheduleTime(value, row.timeZoneStatus) },
            { title: 'Kết thúc', dataIndex: 'endTime', render: (value, row) => formatScheduleTime(value, row.timeZoneStatus) },
          ]} /> },
        { key: 'results', label: `Kết quả (${results.length})`, children: <Table rowKey="attemptId" size="small" dataSource={results}
          loading={detailLoading} scroll={{ x: 720 }} locale={{ emptyText: 'Chưa có lượt thi của học viên đã duyệt' }} columns={[
            stt,
            { title: 'Học viên', dataIndex: 'studentName', render: (value) => <strong>{value}</strong> },
            { title: 'Bài thi', dataIndex: 'examName' },
            { title: 'Bắt đầu', dataIndex: 'startedAt', render: (value) => formatScheduleTime(value, 'utc') },
            { title: 'Trạng thái', dataIndex: 'state', render: (value) => attemptState[value] || value },
            { title: 'Điểm', dataIndex: 'totalMark', align: 'right', render: (value) => value ?? '—' },
            { title: 'Kết quả', dataIndex: 'isPassed', render: (value) => value == null ? '—'
              : <StatusTag tone={value ? 'success' : 'danger'}>{value ? 'Đạt' : 'Chưa đạt'}</StatusTag> },
          ]} /> },
      ]} />
    </PageCard>}
  </section>
}
