import { useCallback, useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { Alert, Button, Empty, Spin, Tabs, Tag } from 'antd'
import {
  BankOutlined, CalendarOutlined, CheckCircleFilled, ClockCircleOutlined, InfoCircleFilled,
  PlayCircleFilled, ReloadOutlined, TeamOutlined,
} from '@ant-design/icons'
import PageHeader from '../../components/ui/PageHeader'
import { Link, useNavigate } from 'react-router-dom'
import { getApiError } from '../../api/response'
import { getMySchedules } from '../../services/scheduleService'
import { startAttempt } from '../../services/attemptService'
import { formatScheduleTime } from '../../services/scheduleTime'
import { formatDuration, formatVnMoment, formatVnRange } from '../../utils/duration'

const scheduleStates = {
  upcoming: { label: 'Sắp diễn ra', color: 'blue', icon: <InfoCircleFilled /> },
  open: { label: 'Đang mở', color: 'green', icon: <CheckCircleFilled /> },
  ended: { label: 'Đã kết thúc', color: 'default', icon: null },
  unknown: { label: 'Chưa rõ múi giờ', color: 'orange', icon: null },
}

export default function StudentSchedulesPage() {
  const navigate = useNavigate()
  const isStudent = ['1', '4'].includes(String(useSelector((state) => state.auth.user?.levelId)))
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [starting, setStarting] = useState(null)
  const [tab, setTab] = useState(null)
  // Đồng hồ theo máy chủ: lệch giữa giờ máy chủ và máy khách lúc tải.
  const [clock, setClock] = useState({ offset: 0, now: Date.now() })

  const load = useCallback(async () => {
    if (!isStudent) return
    setLoading(true); setError('')
    try {
      const data = await getMySchedules()
      setRows(data)
      const serverNow = Date.parse(data[0]?.serverNow)
      if (!Number.isNaN(serverNow)) setClock({ offset: serverNow - Date.now(), now: serverNow })
    } catch (failure) { setError(getApiError(failure)) }
    finally { setLoading(false) }
  }, [isStudent])
  useEffect(() => {
    load()
    const refresh = window.setInterval(load, 30000)
    window.addEventListener('focus', load)
    return () => { window.clearInterval(refresh); window.removeEventListener('focus', load) }
  }, [load])
  useEffect(() => {
    const tick = window.setInterval(() => setClock((old) => ({ ...old, now: Date.now() + old.offset })), 30000)
    return () => window.clearInterval(tick)
  }, [])

  if (!isStudent) return <Alert type="error" title="Trang này dành cho học viên." />
  const start = async (row) => {
    setStarting(row.id); setError('')
    try { const attempt = await startAttempt(row.id); navigate(`/student/attempts/${attempt.attemptId}`) }
    catch (failure) { setError(getApiError(failure)) }
    finally { setStarting(null) }
  }
  const groups = {
    upcoming: rows.filter((row) => row.scheduleState === 'upcoming'),
    open: rows.filter((row) => row.scheduleState === 'open'),
    ended: rows.filter((row) => row.scheduleState === 'ended' || row.scheduleState === 'unknown'),
  }
  const activeTab = tab || (groups.open.length ? 'open' : groups.upcoming.length ? 'upcoming' : 'ended')

  const card = (row) => {
    const state = scheduleStates[row.scheduleState] || scheduleStates.unknown
    const remainingAttempts = Math.max(0, (row.numberOfRepeat || 0) - (row.usedAttempts || 0))
    const inProgress = row.latestAttemptState === 'inProgress'
    const range = formatVnRange(row.startTime, row.endTime)
    const secondsLeft = (Date.parse(row.endTime) - clock.now) / 1000
    return <article key={row.id} className={`schedule-card schedule-card--${row.scheduleState || 'unknown'}`}>
      <div className="schedule-card__top">
        <Tag color={state.color} variant="filled" icon={state.icon}>{state.label}</Tag>
        {row.scheduleState !== 'ended' && <span className="schedule-card__quota">
          {inProgress ? 'Đang có bài làm dở' : remainingAttempts > 0 ? `Còn ${remainingAttempts} lượt làm bài` : 'Đã hết lượt làm bài'}
        </span>}
      </div>
      <h3 className="schedule-card__title">{row.examName || row.title || `Lịch #${row.id}`}</h3>
      {row.title && row.examName && <div className="schedule-card__subtitle">{row.title}</div>}
      <ul className="schedule-card__meta">
        <li><TeamOutlined /> Lớp: {row.classNames?.length ? row.classNames.join(', ') : '—'}{row.subjectName ? ` · ${row.subjectName}` : ''}</li>
        <li><BankOutlined /> Phòng thi: {row.roomName || '—'}</li>
        <li><CalendarOutlined /> Thời gian: {range || `${formatScheduleTime(row.startTime, row.timeZoneStatus)} – ${formatScheduleTime(row.endTime, row.timeZoneStatus)}`}</li>
        {row.scheduleState === 'open' && secondsLeft > 0 && <li><ClockCircleOutlined /> Còn lại: {formatDuration(secondsLeft)}</li>}
      </ul>
      {row.scheduleState === 'upcoming' && <div className="schedule-card__notice">
        <ClockCircleOutlined /><div><strong>Chưa đến giờ làm bài</strong>
          <span>Bài thi sẽ mở vào lúc {formatVnMoment(row.startTime)}</span></div>
      </div>}
      <div className="schedule-card__actions">
        {row.scheduleState === 'open' && (inProgress
          ? <Button type="primary" size="large" icon={<PlayCircleFilled />} onClick={() => navigate(`/student/attempts/${row.latestAttemptId}`)}>Tiếp tục làm bài</Button>
          : <Button type="primary" size="large" icon={<PlayCircleFilled />} disabled={remainingAttempts === 0}
              loading={starting === row.id} onClick={() => start(row)}>Vào làm bài</Button>)}
        {row.latestAttemptId && !inProgress && <Link to={`/student/attempts/${row.latestAttemptId}`}>Xem lượt gần nhất</Link>}
      </div>
    </article>
  }

  const panel = (items, emptyText) => loading && rows.length === 0 ? <div className="schedule-empty"><Spin /></div>
    : items.length === 0 ? <div className="page-card schedule-empty"><Empty description={emptyText} /></div>
      : <div className="schedule-grid">{items.map(card)}</div>

  return <section className="page-body">
    <PageHeader title="Lịch thi của tôi" description="Các bài thi thuộc lớp học đã được phê duyệt. Giờ thi theo máy chủ, cập nhật mỗi 30 giây."
      extra={<Button icon={<ReloadOutlined />} onClick={load} loading={loading}>Làm mới</Button>} />
    {error && <Alert type="error" showIcon title={error} className="page-alert" />}
    <Tabs className="schedule-tabs" activeKey={activeTab} onChange={setTab} items={[
      { key: 'upcoming', label: <span>Sắp diễn ra <span className="tab-count">{groups.upcoming.length}</span></span>, children: panel(groups.upcoming, 'Không có lịch thi sắp tới') },
      { key: 'open', label: <span>Đang mở <span className="tab-count">{groups.open.length}</span></span>, children: panel(groups.open, 'Không có bài thi đang mở') },
      { key: 'ended', label: <span>Đã kết thúc <span className="tab-count">{groups.ended.length}</span></span>, children: panel(groups.ended, 'Chưa có lịch thi đã kết thúc') },
    ]} />
  </section>
}
