import { useCallback, useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { Alert, Button, Empty, Table } from 'antd'
import { ArrowRightOutlined, CalendarOutlined, CheckCircleFilled, ClockCircleOutlined, ReloadOutlined, TeamOutlined } from '@ant-design/icons'
import PageHeader from '../../components/ui/PageHeader'
import PageCard from '../../components/ui/PageCard'
import StatusTag from '../../components/ui/StatusTag'
import { getTeacherOverview } from '../../services/classService'
import { excelErrorMessage } from '../../services/excelFile'
import { formatScheduleTime } from '../../services/scheduleTime'
import { ROUTES } from '../../data/constants'
import './adminDashboard.css'

const number = (value) => (value == null ? '–' : new Intl.NumberFormat('vi-VN').format(value))

const timeFmt = new Intl.DateTimeFormat('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
const dateFmt = new Intl.DateTimeFormat('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', day: '2-digit', month: '2-digit', year: 'numeric' })
const range = (row) => {
  const start = new Date(row.startTime); const end = new Date(row.endTime)
  return <span className="dash-time"><strong>{timeFmt.format(start)} – {timeFmt.format(end)}</strong><small>{dateFmt.format(start)}</small></span>
}

export default function TeacherOverviewPage() {
  const levelId = useSelector((state) => state.auth.user?.levelId)
  const allowed = ['1', '3'].includes(String(levelId))
  const isAdmin = String(levelId) === '1'
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [status, setStatus] = useState(0)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!allowed) return
    setLoading(true)
    try { setData(await getTeacherOverview({ upcomingLimit: 8 })); setError(''); setStatus(0) }
    catch (failure) { setData(null); setError(excelErrorMessage(failure)); setStatus(failure?.response?.status || 0) }
    finally { setLoading(false) }
  }, [allowed])
  useEffect(() => { load() }, [load])

  if (!allowed) return <Alert type="error" showIcon title="Bạn không có quyền xem tổng quan giảng viên." />

  const kpis = data && [
    { key: 'classes', tone: 'blue', icon: <TeamOutlined />, label: 'Lớp phụ trách', value: data.classes.total,
      unit: `${number(data.classes.active)} đang hoạt động`, to: ROUTES.teacherClasses },
    { key: 'students', tone: 'green', icon: <CheckCircleFilled />, label: 'Học viên đã duyệt', value: data.members.approvedStudents,
      unit: 'học viên', to: ROUTES.teacherClasses },
    { key: 'pending', tone: 'orange', icon: <ClockCircleOutlined />, label: 'Yêu cầu chờ duyệt', value: data.members.pendingRequests,
      unit: 'yêu cầu', to: ROUTES.teacherClasses },
    { key: 'schedules', tone: 'blue', icon: <CalendarOutlined />, label: 'Lịch thi', value: data.schedules.openCount,
      unit: `đang mở, ${number(data.schedules.upcomingCount)} sắp diễn ra` },
  ]
  const attempts = data?.attempts

  return (
    <section className="admin-dashboard">
      <PageHeader title="Tổng quan giảng viên"
        description={isAdmin ? 'Quản trị viên: số liệu của mọi lớp.' : 'Số liệu các lớp bạn phụ trách.'}
        extra={<Button icon={<ReloadOutlined />} onClick={load} loading={loading}>Làm mới</Button>} />
      {error && <Alert type="error" showIcon title={error} className="attempt-report__error"
        action={status === 403 ? undefined : <Button size="small" onClick={load}>Thử lại</Button>} />}

      {data && <p className="dash-note">Chỉ tính lượt thi DACN mới. Cập nhật lúc {formatScheduleTime(data.serverNow, 'utc')}</p>}

      {data && data.classes.total === 0 && <PageCard><Empty description="Bạn chưa được phân công lớp nào." /></PageCard>}

      {data && data.classes.total > 0 && <>
        <div className="dash-kpis">
          {kpis.map((kpi) => {
            const body = <>
              <span className="dash-kpi__icon" aria-hidden="true">{kpi.icon}</span>
              <span className="dash-kpi__label">{kpi.label}</span>
              <strong className="dash-kpi__value">{number(kpi.value)}</strong>
              <span className="dash-kpi__unit">{kpi.unit}</span>
              {kpi.to && <span className="dash-kpi__more">Xem chi tiết <ArrowRightOutlined /></span>}
            </>
            return kpi.to
              ? <Link key={kpi.key} to={kpi.to} className={`dash-kpi dash-kpi--${kpi.tone}`}>{body}</Link>
              : <div key={kpi.key} className={`dash-kpi dash-kpi--${kpi.tone}`}>{body}</div>
          })}
        </div>

        {data.schedules.unknownTimeZoneCount > 0 && <Alert type="info" showIcon className="page-alert"
          title={`Có ${number(data.schedules.unknownTimeZoneCount)} lịch chưa rõ múi giờ, không được tính vào lịch sắp tới/đang mở.`} />}

        <PageCard>
          <h2 className="page-section-title">Lượt thi</h2>
          <div className="admin-stats-grid">
            {[
              ['Tổng lượt', number(attempts.totalAttempts)], ['Đang làm', number(attempts.inProgressCount)],
              ['Đã chốt', number(attempts.finalizedCount)], ['Đạt', number(attempts.passedCount)],
              ['Chưa đạt', number(attempts.failedCount)], ['Đã hủy', number(attempts.voidedCount)],
              ['Điểm TB', attempts.averageScore], ['Tỷ lệ đạt', `${attempts.passPercent}%`],
            ].map(([label, value]) => <div key={label} className="admin-stat-card">
              <div className="admin-stat-card__body"><div className="admin-stat-card__value">{value}</div>
                <div className="admin-stat-card__label">{label}</div></div>
            </div>)}
          </div>
          <p className="dash-note">Tỷ lệ đạt và điểm TB tính trên lượt đã chốt, chưa hủy.</p>
        </PageCard>

        <PageCard>
          <h2 className="page-section-title"><TeamOutlined /> Theo lớp</h2>
          <Table rowKey="classId" size="middle" pagination={false} dataSource={data.perClass}
            locale={{ emptyText: 'Chưa có lớp' }} scroll={{ x: 700 }}
            columns={[
              { title: 'Lớp', render: (_, row) => <span className="dash-time"><strong>{row.name}</strong>
                {row.classCode && <small>{row.classCode}</small>}</span> },
              { title: 'Trạng thái', dataIndex: 'status', render: (value) => value === 1
                ? <StatusTag tone="success">Hoạt động</StatusTag> : <StatusTag>Tạm ngừng</StatusTag> },
              { title: 'Học viên đã duyệt', dataIndex: 'approvedStudents', align: 'right', render: number },
              { title: 'Chờ duyệt', dataIndex: 'pendingRequests', align: 'right', render: number },
              { title: 'Lượt đã chốt', dataIndex: 'finalizedCount', align: 'right', render: number },
              { title: 'Đạt', dataIndex: 'passedCount', align: 'right', render: number },
              { title: 'Điểm TB', dataIndex: 'averageScore', align: 'right' },
            ]} />
          <p className="dash-note">Một lượt có thể được tính ở mọi lớp của học viên, nên tổng theo lớp có thể lớn hơn tổng lượt thi.</p>
        </PageCard>

        <PageCard>
          <h2 className="page-section-title"><CalendarOutlined /> Lịch thi sắp diễn ra</h2>
          <Table rowKey="scheduleId" size="middle" pagination={false} dataSource={data.upcoming}
            locale={{ emptyText: 'Không có lịch thi sắp tới' }} scroll={{ x: 700 }}
            columns={[
              { title: 'Thời gian', render: (_, row) => range(row), width: 150 },
              { title: 'Lịch / Bài thi', render: (_, row) => <span className="dash-time"><strong>{row.title || row.examName}</strong>
                {row.title && <small>{row.examName}</small>}</span> },
              { title: 'Lớp', render: (_, row) => row.classes.map((item) => item.name).join(', ') || '—' },
              { title: 'Trạng thái', dataIndex: 'scheduleState', render: (value) => value === 'open'
                ? <StatusTag tone="success">Đang diễn ra</StatusTag> : <StatusTag tone="info">Sắp diễn ra</StatusTag> },
            ]} />
        </PageCard>
      </>}
    </section>
  )
}
