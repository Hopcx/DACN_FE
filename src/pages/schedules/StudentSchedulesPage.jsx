import { useCallback, useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { Alert, Button, Table, Tag, Typography } from 'antd'
import { Link, useNavigate } from 'react-router-dom'
import { getApiError } from '../../api/response'
import { getMySchedules } from '../../services/scheduleService'
import { startAttempt } from '../../services/attemptService'
import { formatScheduleTime } from '../../services/scheduleTime'

const scheduleStates = {
  upcoming: { label: 'Chưa đến giờ', color: 'blue' },
  open: { label: 'Trong giờ thi', color: 'green' },
  ended: { label: 'Đã hết giờ', color: 'default' },
  unknown: { label: 'Chưa rõ múi giờ', color: 'orange' },
}

export default function StudentSchedulesPage() {
  const navigate = useNavigate()
  const isStudent = String(useSelector((state) => state.auth.user?.levelId)) === '4'
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [starting, setStarting] = useState(null)
  const load = useCallback(async () => {
    if (!isStudent) return
    setLoading(true); setError('')
    try { setRows(await getMySchedules()) }
    catch (failure) { setError(getApiError(failure)) }
    finally { setLoading(false) }
  }, [isStudent])
  useEffect(() => {
    load()
    const timer = window.setInterval(load, 30000)
    window.addEventListener('focus', load)
    return () => {
      window.clearInterval(timer)
      window.removeEventListener('focus', load)
    }
  }, [load])
  if (!isStudent) return <Alert type="error" title="Trang này dành cho học viên." />
  const start = async (row) => {
    setStarting(row.id); setError('')
    try { const attempt = await startAttempt(row.id); navigate(`/student/attempts/${attempt.attemptId}`) }
    catch (failure) { setError(getApiError(failure)) }
    finally { setStarting(null) }
  }
  return <section className="p-6">
    <Typography.Title level={2}>Lịch thi của tôi</Typography.Title>
    <Typography.Paragraph>Trạng thái giờ thi được cập nhật từ máy chủ mỗi 30 giây.</Typography.Paragraph>
    {error && <Alert type="error" showIcon title={error} className="mb-4" />}
    <Button onClick={load} className="mb-4">Tải lại</Button>
    <Table rowKey="id" loading={loading} dataSource={rows} pagination={{ pageSize: 10 }}
      locale={{ emptyText: 'Bạn chưa có lịch thi' }} columns={[
        { title: 'Lịch thi', dataIndex: 'title', render: (value, item) => value || `#${item.id}` },
        { title: 'Môn', dataIndex: 'subjectName', render: (value) => value || '—' },
        { title: 'Bắt đầu', dataIndex: 'startTime', render: (value, item) => formatScheduleTime(value, item.timeZoneStatus) },
        { title: 'Kết thúc', dataIndex: 'endTime', render: (value, item) => formatScheduleTime(value, item.timeZoneStatus) },
        { title: 'Phòng', dataIndex: 'roomName', render: (value) => value || '—' },
        { title: 'Trạng thái giờ thi', dataIndex: 'scheduleState', render: (value) => {
          const state = scheduleStates[value] || scheduleStates.unknown
          return <Tag color={state.color}>{state.label}</Tag>
        } },
        { title: 'Bài làm', render: (_, row) => <div className="flex gap-2">
          {row.latestAttemptId && <Link to={`/student/attempts/${row.latestAttemptId}`}>
            {row.latestAttemptState === 'inProgress' ? 'Tiếp tục' : 'Xem lượt gần nhất'}
          </Link>}
          <Button disabled={row.scheduleState !== 'open' || row.latestAttemptState === 'inProgress'}
            loading={starting === row.id} onClick={() => start(row)}>Vào bài</Button>
        </div> },
      ]} />
  </section>
}
