import { Outlet } from 'react-router-dom'
import { FileDoneOutlined, SafetyCertificateOutlined, BarChartOutlined, AppstoreOutlined } from '@ant-design/icons'
import './AuthLayout.css'

const FEATURES = [
  { icon: <FileDoneOutlined />, title: 'Thi trực tuyến linh hoạt', text: 'Làm bài theo lịch của lớp, lưu nháp và nộp bài ngay trên trình duyệt.' },
  { icon: <SafetyCertificateOutlined />, title: 'Bảo mật, công bằng', text: 'Thời gian và chấm điểm do máy chủ quyết định, đề được chụp lại khi bắt đầu.' },
  { icon: <BarChartOutlined />, title: 'Quản lý hiệu quả', text: 'Theo dõi lớp học, lịch thi, kết quả và báo cáo tại một nơi.' },
]

export default function AuthLayout() {
  return (
    <div className="auth-layout">
      <aside className="auth-intro">
        <div className="auth-intro__brand">
          <span className="auth-intro__mark"><AppstoreOutlined /></span>
          <span>DACN</span>
        </div>
        <p className="auth-intro__eyebrow">HỆ THỐNG QUẢN LÝ THI TRẮC NGHIỆM</p>
        <h2 className="auth-intro__title">Thi trực tuyến an toàn, rõ ràng, hiệu quả.</h2>
        <ul className="auth-intro__list">
          {FEATURES.map((item) => (
            <li key={item.title}>
              <span className="auth-intro__icon">{item.icon}</span>
              <div><strong>{item.title}</strong><span>{item.text}</span></div>
            </li>
          ))}
        </ul>
      </aside>
      <main className="auth-panel"><Outlet /></main>
    </div>
  )
}
