import { useCallback, useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { Alert, Button, Empty, Segmented, Spin, Tag } from 'antd'
import { CalendarOutlined, ClockCircleOutlined, BankOutlined, BookOutlined } from '@ant-design/icons'
import PageHeader from '../../components/ui/PageHeader'
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
  const isStudent = ['1', '4'].includes(String(useSelector((state) => state.auth.user?.levelId)))
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [starting, setStarting] = useState(null)
  const [filter, setFilter] = useState('all')
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
  const counts = rows.reduce((acc, row) => ({ ...acc, [row.scheduleState]: (acc[row.scheduleState] || 0) + 1 }), {})
  const visible = rows.filter((row) => filter === 'all' || row.scheduleState === filter)
  return <section className="page-body">
    <PageHeader title="Lịch thi của tôi" description="Các bài thi thuộc lớp học bạn đã được duyệt. Trạng thái giờ thi được cập nhật từ máy chủ mỗi 30 giây."
      extra={<Button onClick={load} loading={loading}>Tải lại</Button>} />
    {error && <Alert type="error" showIcon title={error} className="page-alert" />}
    <Segmented className="schedule-filter" value={filter} onChange={setFilter} options={[
      { value: 'all', label: `Tất cả (${rows.length})` },
      { value: 'open', label: `Đang mở (${counts.open || 0})` },
      { value: 'upcoming', label: `Sắp diễn ra (${counts.upcoming || 0})` },
      { value: 'ended', label: `Đã kết thúc (${counts.ended || 0})` },
    ]} />
    {loading && rows.length === 0 ? <div className="schedule-empty"><Spin /></div>
      : visible.length === 0 ? <div className="page-card schedule-empty"><Empty description="Không có lịch thi" /></div>
      : <div className="schedule-grid">{visible.map((row) => {
        const state = scheduleStates[row.scheduleState] || scheduleStates.unknown
        return <article key={row.id} className={`schedule-card schedule-card--${row.scheduleState || 'unknown'}`}>
          <div className="schedule-card__top"><Tag color={state.color} variant="filled">{state.label}</Tag></div>
          <h3 className="schedule-card__title">{row.title || `Lịch #${row.id}`}</h3>
          <ul className="schedule-card__meta">
            <li><BookOutlined /> {row.subjectName || '—'}</li>
            <li><BankOutlined /> {row.roomName || '—'}</li>
            <li><CalendarOutlined /> Bắt đầu: {formatScheduleTime(row.startTime, row.timeZoneStatus)}</li>
            <li><ClockCircleOutlined /> Kết thúc: {formatScheduleTime(row.endTime, row.timeZoneStatus)}</li>
          </ul>
          <div className="schedule-card__actions">
            <Button type="primary" disabled={row.scheduleState !== 'open' || row.latestAttemptState === 'inProgress'}
              loading={starting === row.id} onClick={() => start(row)}>Vào làm bài</Button>
            {row.latestAttemptId && <Link to={`/student/attempts/${row.latestAttemptId}`}>
              {row.latestAttemptState === 'inProgress' ? 'Tiếp tục bài đang làm' : 'Xem lượt gần nhất'}
            </Link>}
          </div>
        </article>
      })}</div>}
  </section>
}
