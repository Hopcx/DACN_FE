import PageHeader from '../../components/ui/PageHeader'
import AdminAttemptReport from './AdminAttemptReport'
import './adminDashboard.css'

export default function AdminAttemptsPage() {
  return (
    <section className="admin-dashboard">
      <PageHeader title="Danh sách bài làm" description="Theo dõi lượt thi, lọc theo lịch thi, lớp, học viên và hủy lượt thi khi cần." />
      <AdminAttemptReport />
    </section>
  )
}
