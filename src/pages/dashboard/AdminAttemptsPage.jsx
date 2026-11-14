import PageHeader from '../../components/ui/PageHeader'
import AdminAttemptReport from './AdminAttemptReport'
import './adminDashboard.css'

export default function AdminAttemptsPage() {
  return (
    <section className="admin-dashboard">
      <PageHeader title="Báo cáo lượt thi"
        description="Theo dõi lượt thi, lọc theo bài thi, lớp, môn học và hủy kết quả khi cần. Tỷ lệ đạt và phổ điểm chỉ tính lượt DACN đã chốt chưa bị hủy." />
      <AdminAttemptReport />
    </section>
  )
}
