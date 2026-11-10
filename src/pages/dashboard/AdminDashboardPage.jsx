import { useCallback, useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { Alert, Button, Table } from 'antd'
import {
  ArrowRightOutlined, BookOutlined, CalendarOutlined, CheckCircleFilled, ClockCircleOutlined,
  CloseCircleFilled, FileTextOutlined, QuestionCircleOutlined, ReloadOutlined, TeamOutlined, UserOutlined,
} from '@ant-design/icons'
import PageHeader from '../../components/ui/PageHeader'
import PageCard from '../../components/ui/PageCard'
import StatusTag from '../../components/ui/StatusTag'
import { PassDonutChart, StatusColumnChart } from '../../components/charts'
import { getAdminDashboard } from '../../services/attemptReportService'
import { getUsers } from '../../services/accountService'
import { getClasses } from '../../services/classService'
import { getExams } from '../../services/examService'
import { getQuestions } from '../../services/questionService'
import { subjectsApi } from '../../services/catalogService'
import { getApiError } from '../../api/response'
import { ROUTES } from '../../data/constants'
import './adminDashboard.css'

const rows = (data) => (Array.isArray(data) ? data : data?.items || [])
const total = (data) => (Number.isInteger(data?.totalCount) ? data.totalCount : rows(data).length)
const number = (value) => (value == null ? '–' : new Intl.NumberFormat('vi-VN').format(value))

const timeFmt = new Intl.DateTimeFormat('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
const dateFmt = new Intl.DateTimeFormat('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', day: '2-digit', month: '2-digit', year: 'numeric' })
const range = (row) => {
  const start = new Date(row.startTime); const end = new Date(row.endTime)
  return <span className="dash-time"><strong>{timeFmt.format(start)} – {timeFmt.format(end)}</strong><small>{dateFmt.format(start)}</small></span>
}

const COUNT_ITEMS = [
  { key: 'students', label: 'Học viên', icon: <UserOutlined />, to: ROUTES.users },
  { key: 'teachers', label: 'Giảng viên', icon: <UserOutlined />, to: ROUTES.users },
  { key: 'classes', label: 'Lớp học', icon: <TeamOutlined />, to: ROUTES.classes },
  { key: 'subjects', label: 'Môn học', icon: <BookOutlined />, to: ROUTES.subjects },
  { key: 'exams', label: 'Bài thi', icon: <FileTextOutlined />, to: ROUTES.exams },
  { key: 'questions', label: 'Câu hỏi', icon: <QuestionCircleOutlined />, to: ROUTES.questions },
]

/** Dự phòng khi tài khoản không có quyền API tổng quan (vd. người ra đề): đếm từ API được cấp. */
async function loadFallbackCounts() {
  const jobs = {
    students: getUsers().then((data) => rows(data).filter((item) => Number(item.levelId) === 4).length),
    teachers: getUsers().then((data) => rows(data).filter((item) => Number(item.levelId) === 3).length),
    classes: getClasses().then(total), exams: getExams().then(total),
    questions: getQuestions().then(total), subjects: subjectsApi.list().then(total),
  }
  const entries = await Promise.all(Object.entries(jobs).map(([key, job]) =>
    job.then((value) => [key, value]).catch(() => [key, null])))
  return Object.fromEntries(entries)
}

export default function AdminDashboardPage() {
  const user = useSelector((state) => state.auth.user)
  const [data, setData] = useState(null)
  const [fallback, setFallback] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try { setData(await getAdminDashboard({ upcomingLimit: 8 })); setError(''); setFallback(null) }
    catch (failure) {
      setData(null)
      const status = failure?.response?.status
      if (status === 401 || status === 403) setFallback(await loadFallbackCounts())
      else setError(getApiError(failure))
    } finally { setLoading(false) }
  }, [])
  useEffect(() => { load() }, [load])

  const attempts = data?.attempts
  const counts = data?.counts || fallback || {}
  const kpis = [
    { key: 'today', tone: 'blue', icon: <CalendarOutlined />, label: 'Lịch hôm nay', value: data?.todaySchedules, unit: 'ca thi', to: ROUTES.schedules },
    { key: 'finalized', tone: 'green', icon: <CheckCircleFilled />, label: 'Lượt đã chốt', value: attempts?.finalizedCount, unit: 'lượt thi', to: ROUTES.attempts },
    { key: 'inProgress', tone: 'orange', icon: <ClockCircleOutlined />, label: 'Đang làm', value: attempts?.inProgressCount, unit: 'lượt thi', to: ROUTES.attempts },
    { key: 'voided', tone: 'red', icon: <CloseCircleFilled />, label: 'Đã hủy', value: attempts?.voidedCount, unit: 'lượt thi', to: ROUTES.attempts },
  ]

  return (
    <section className="admin-dashboard">
      <PageHeader title="Tổng quan quản trị"
        description={`Xin chào, ${user?.fullName || user?.userName || 'người dùng'}. Theo dõi tình hình tổ chức thi DACN và hoạt động hệ thống.`}
        extra={<Button icon={<ReloadOutlined />} onClick={load} loading={loading}>Làm mới</Button>} />
      {error && <Alert type="error" showIcon title={error} className="attempt-report__error" />}

      {data && <div className="dash-kpis">
        {kpis.map((kpi) => <Link key={kpi.key} to={kpi.to} className={`dash-kpi dash-kpi--${kpi.tone}`}>
          <span className="dash-kpi__icon" aria-hidden="true">{kpi.icon}</span>
          <span className="dash-kpi__label">{kpi.label}</span>
          <strong className="dash-kpi__value">{number(kpi.value)}</strong>
          <span className="dash-kpi__unit">{kpi.unit}</span>
          <span className="dash-kpi__more">Xem chi tiết <ArrowRightOutlined /></span>
        </Link>)}
      </div>}

      <div className="dash-counts">
        {COUNT_ITEMS.map((item) => <Link key={item.key} to={item.to} className="dash-count">
          <span className="dash-count__icon" aria-hidden="true">{item.icon}</span>
          <span><strong>{loading && counts[item.key] === undefined ? '…' : number(counts[item.key])}</strong>
            <small>{item.label}</small></span>
        </Link>)}
      </div>

      {data && <>
        <div className="dash-charts">
          <PageCard>
            <h2 className="page-section-title">Phân bố lượt thi theo trạng thái</h2>
            <StatusColumnChart data={[
              { key: 'submitted', label: 'Đã chốt', value: attempts.finalizedCount - attempts.timeoutCount },
              { key: 'inProgress', label: 'Đang làm', value: attempts.inProgressCount },
              { key: 'timedOut', label: 'Hết giờ', value: attempts.timeoutCount },
              { key: 'voided', label: 'Đã hủy', value: attempts.voidedCount },
            ]} />
            <p className="dash-note">“Đã chốt” ở đây là lượt nộp đúng hạn; “Hết giờ” là lượt được hệ thống tự chốt.</p>
          </PageCard>
          <PageCard>
            <h2 className="page-section-title">Tỷ lệ kết quả <small>(lượt đã chốt, chưa hủy)</small></h2>
            <PassDonutChart passed={attempts.passedCount} failed={attempts.failedCount} />
            <p className="dash-note">Tỷ lệ đạt: <strong>{attempts.passPercent}%</strong> trên {number(attempts.finalizedCount)} lượt.</p>
          </PageCard>
        </div>

        <PageCard>
          <div className="dash-section-head">
            <h2 className="page-section-title"><CalendarOutlined /> Lịch thi sắp diễn ra</h2>
            <Link to={ROUTES.schedules}>Xem tất cả</Link>
          </div>
          <Table rowKey="scheduleId" size="middle" pagination={false} dataSource={data.upcoming}
            locale={{ emptyText: 'Không có lịch thi sắp tới' }} scroll={{ x: 760 }}
            columns={[
              { title: 'Thời gian', render: (_, row) => range(row), width: 150 },
              { title: 'Lịch / Bài thi', render: (_, row) => <span className="dash-time"><strong>{row.title || row.examName}</strong>
                {row.title && <small>{row.examName}</small>}</span> },
              { title: 'Môn học', dataIndex: 'subjectName', render: (value) => value || '—' },
              { title: 'Lớp', render: (_, row) => row.classes.length ? row.classes.map((item) => item.name).join(', ') : <StatusTag tone="warning">Chưa gán lớp</StatusTag> },
              { title: 'Phòng', dataIndex: 'roomName', render: (value) => value || '—' },
              { title: 'Số thí sinh', dataIndex: 'candidateCount', align: 'right', render: number },
              { title: 'Trạng thái', dataIndex: 'scheduleState', render: (value) => value === 'open'
                ? <StatusTag tone="success">Đang diễn ra</StatusTag> : <StatusTag tone="info">Sắp diễn ra</StatusTag> },
            ]} />
        </PageCard>
      </>}
      {fallback && <Alert type="info" showIcon className="dash-fallback"
        title="Tài khoản của bạn chỉ xem được số liệu danh mục. Số liệu lượt thi và lịch hôm nay dành cho quản trị viên." />}
    </section>
  )
}
