import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import {
  BookOutlined, CalendarOutlined, FileTextOutlined, QuestionCircleOutlined, TeamOutlined, UserOutlined,
} from '@ant-design/icons'
import PageHeader from '../../components/ui/PageHeader'
import { getUsers } from '../../services/accountService'
import { getClasses } from '../../services/classService'
import { getExams } from '../../services/examService'
import { getSchedules } from '../../services/scheduleService'
import { getQuestions } from '../../services/questionService'
import { subjectsApi } from '../../services/catalogService'
import { ROUTES } from '../../data/constants'
import './adminDashboard.css'

const rows = (data) => (Array.isArray(data) ? data : data?.items || [])
const total = (data) => (Number.isInteger(data?.totalCount) ? data.totalCount : rows(data).length)

const CARDS = [
  { key: 'students', label: 'Tổng số học viên', icon: <UserOutlined />, color: '#ffa726', to: ROUTES.users },
  { key: 'classes', label: 'Tổng số lớp học', icon: <TeamOutlined />, color: '#c29b6e', to: ROUTES.classes },
  { key: 'exams', label: 'Tổng số bài thi', icon: <FileTextOutlined />, color: '#26c6a0', to: ROUTES.exams },
  { key: 'schedules', label: 'Tổng số lịch thi', icon: <CalendarOutlined />, color: '#ff4d5a', to: ROUTES.schedules },
  { key: 'questions', label: 'Tổng số câu hỏi', icon: <QuestionCircleOutlined />, color: '#e88fc0', to: ROUTES.questions },
  { key: 'subjects', label: 'Tổng số môn học', icon: <BookOutlined />, color: '#8ec9f5', to: ROUTES.subjects },
]

export default function AdminDashboardPage() {
  const user = useSelector((state) => state.auth.user)
  const [stats, setStats] = useState({})

  useEffect(() => {
    let active = true
    const jobs = {
      students: getUsers().then((data) => rows(data).filter((item) => Number(item.levelId) === 4).length),
      classes: getClasses().then((data) => total(data)),
      exams: getExams().then((data) => total(data)),
      schedules: getSchedules().then((data) => total(data)),
      questions: getQuestions().then((data) => total(data)),
      subjects: subjectsApi.list().then((data) => total(data)),
    }
    Object.entries(jobs).forEach(([key, job]) => {
      // Mỗi thẻ độc lập: một API lỗi hoặc không có quyền chỉ làm thẻ đó hiện "–".
      job.then((value) => active && setStats((current) => ({ ...current, [key]: value })))
        .catch(() => active && setStats((current) => ({ ...current, [key]: null })))
    })
    return () => { active = false }
  }, [])

  return (
    <section className="admin-dashboard">
      <PageHeader title="Tổng quan"
        description={`Xin chào, ${user?.fullName || user?.userName || 'người dùng'}. Đây là số liệu chung của hệ thống.`} />
      <div className="overview-grid">
        {CARDS.map((card) => (
          <Link key={card.key} to={card.to} className="admin-stat-card">
            <span className="admin-stat-card__icon" style={{ background: card.color }} aria-hidden="true">{card.icon}</span>
            <span>
              <strong className="admin-stat-card__value">{stats[card.key] === undefined ? '…' : stats[card.key] ?? '–'}</strong>
              <span className="admin-stat-card__label">{card.label}</span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  )
}
