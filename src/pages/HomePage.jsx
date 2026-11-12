import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import {
  AppstoreOutlined, BarChartOutlined, CalendarOutlined, CheckCircleFilled, ClockCircleOutlined,
  FileDoneOutlined, LockOutlined, QuestionCircleOutlined, SafetyCertificateOutlined, TeamOutlined,
} from '@ant-design/icons'
import { APP_NAME, ROUTES } from '../data/constants'
import './landing.css'

const GOALS = [
  { icon: <FileDoneOutlined />, title: 'Thi trực tuyến linh hoạt', text: 'Học viên làm bài theo lịch của lớp ngay trên trình duyệt, tự động lưu nháp và tiếp tục khi tải lại trang.' },
  { icon: <SafetyCertificateOutlined />, title: 'Công bằng, minh bạch', text: 'Thời gian và chấm điểm do máy chủ quyết định. Đề được chụp lại khi bắt đầu nên không bị thay đổi giữa chừng.' },
  { icon: <BarChartOutlined />, title: 'Báo cáo rõ ràng', text: 'Theo dõi lượt thi, tỷ lệ đạt, phổ điểm theo bài thi, lớp và môn học; hủy kết quả có lý do và lưu vết.' },
  { icon: <QuestionCircleOutlined />, title: 'Ngân hàng câu hỏi', text: 'Quản lý câu hỏi một đáp án, nhiều đáp án, đúng/sai; nhập hàng loạt từ file Excel có kiểm tra từng dòng.' },
  { icon: <CalendarOutlined />, title: 'Lịch thi thông minh', text: 'Gán lịch cho lớp, tự động chặn trùng phòng, trùng lịch học viên và trùng môn trong cùng một lớp.' },
  { icon: <LockOutlined />, title: 'Phân quyền chặt chẽ', text: 'Bốn vai trò Quản trị, Examiner, Giảng viên, Học viên; mỗi người chỉ thấy đúng phần việc của mình.' },
]

const STEPS = [
  { icon: <TeamOutlined />, title: 'Tham gia lớp', text: 'Học viên đăng ký, xác minh email và vào lớp bằng mã lớp; giảng viên duyệt thành viên.' },
  { icon: <CalendarOutlined />, title: 'Nhận lịch thi', text: 'Lịch thi của lớp hiển thị theo trạng thái: sắp diễn ra, đang mở, đã kết thúc.' },
  { icon: <ClockCircleOutlined />, title: 'Làm bài', text: 'Đồng hồ đếm ngược theo máy chủ, bảng số câu, lưu nháp và nộp bài chỉ với một nút.' },
  { icon: <CheckCircleFilled />, title: 'Xem kết quả', text: 'Điểm và kết quả được chấm tự động; xem lại bài khi lịch thi kết thúc theo cấu hình.' },
]

const ROLES = [
  { name: 'Quản trị viên', text: 'Quản lý tài khoản, phân quyền, danh mục, lớp học và báo cáo toàn hệ thống.' },
  { name: 'Examiner', text: 'Xây dựng ngân hàng câu hỏi, bài thi, mã đề và lịch thi theo quyền được cấp.' },
  { name: 'Giảng viên', text: 'Quản lý thành viên lớp mình, xem lịch thi và kết quả của học viên.' },
  { name: 'Học viên', text: 'Tham gia lớp, làm bài thi, xem lịch sử và kết quả của chính mình.' },
]

function useReveal() {
  const ref = useRef(null)
  useEffect(() => {
    const root = ref.current
    if (!root) return undefined
    const items = root.querySelectorAll('.reveal')
    if (typeof IntersectionObserver === 'undefined') {
      items.forEach((item) => item.classList.add('is-visible'))
      return undefined
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target) }
      })
    }, { threshold: 0.15 })
    items.forEach((item) => observer.observe(item))
    return () => observer.disconnect()
  }, [])
  return ref
}

export default function HomePage() {
  const user = useSelector((state) => state.auth.user)
  const hasSession = useSelector((state) => Boolean(state.auth.accessToken && state.auth.user))
  const workspace = String(user?.levelId) === '4' ? ROUTES.myClasses
    : String(user?.levelId) === '3' ? ROUTES.teacherOverview : ROUTES.adminDashboard
  const rootRef = useReveal()

  return (
    <div className="landing" ref={rootRef}>
      <header className="landing-nav">
        <a href="#top" className="landing-brand"><span className="landing-brand__mark"><AppstoreOutlined /></span>{APP_NAME}</a>
        <nav className="landing-nav__links" aria-label="Điều hướng trang giới thiệu">
          <a href="#muc-tieu">Mục tiêu</a>
          <a href="#quy-trinh">Quy trình</a>
          <a href="#vai-tro">Vai trò</a>
        </nav>
        <div className="landing-nav__actions">
          {hasSession
            ? <Link to={workspace} className="landing-btn landing-btn--primary">Vào trang làm việc</Link>
            : <>
              <Link to={ROUTES.login} className="landing-btn landing-btn--ghost">Đăng nhập</Link>
              <Link to={ROUTES.register} className="landing-btn landing-btn--primary">Đăng ký</Link>
            </>}
        </div>
      </header>

      <section className="landing-hero" id="top">
        <div className="landing-hero__text">
          <p className="landing-eyebrow">HỆ THỐNG QUẢN LÝ THI TRẮC NGHIỆM TRỰC TUYẾN</p>
          <h1 className="landing-hero__title">Tổ chức kỳ thi <span>an toàn, công bằng</span> và hiệu quả.</h1>
          <p className="landing-hero__lead">
            {APP_NAME} giúp nhà trường và giảng viên xây dựng ngân hàng câu hỏi, lên lịch thi cho từng lớp,
            tự động chấm điểm và theo dõi kết quả — còn học viên chỉ cần đăng nhập và làm bài.
          </p>
          <div className="landing-hero__cta">
            {hasSession
              ? <Link to={workspace} className="landing-btn landing-btn--primary landing-btn--lg">Vào trang làm việc</Link>
              : <>
                <Link to={ROUTES.login} className="landing-btn landing-btn--primary landing-btn--lg">Đăng nhập</Link>
                <Link to={ROUTES.register} className="landing-btn landing-btn--outline landing-btn--lg">Đăng ký tài khoản</Link>
              </>}
          </div>
          <ul className="landing-hero__points">
            <li><CheckCircleFilled /> Chấm điểm tự động bởi máy chủ</li>
            <li><CheckCircleFilled /> Đề thi được chụp lại khi bắt đầu làm bài</li>
            <li><CheckCircleFilled /> Hoạt động ngay trên trình duyệt</li>
          </ul>
        </div>

        <div className="landing-hero__visual" aria-hidden="true">
          <div className="mock mock--main">
            <div className="mock__bar"><span /><span /><span /></div>
            <div className="mock__timer"><small>Thời gian còn lại</small><strong>01:12:30</strong></div>
            <div className="mock__question">
              <b>Câu 4 / 20</b>
              <p>Trong mô hình client-server, thành phần nào chịu trách nhiệm lưu trữ dữ liệu?</p>
              <div className="mock__option">A. Trình duyệt</div>
              <div className="mock__option is-picked">B. Máy chủ</div>
              <div className="mock__option">C. Giao thức HTTP</div>
            </div>
            <div className="mock__nav">{Array.from({ length: 10 }, (_, index) => <i key={index} className={index < 4 ? 'is-done' : ''}>{index + 1}</i>)}</div>
          </div>
          <div className="mock mock--float mock--score"><small>Kết quả</small><strong>8.5</strong><em>Đạt</em></div>
          <div className="mock mock--float mock--class"><TeamOutlined /> Lớp CNTT K66<br /><small>42 học viên</small></div>
        </div>
      </section>

      <section className="landing-section" id="muc-tieu">
        <div className="landing-section__head reveal">
          <p className="landing-eyebrow">MỤC TIÊU QUAN TRỌNG</p>
          <h2>Mọi thứ cần cho một kỳ thi trực tuyến</h2>
        </div>
        <div className="landing-grid">
          {GOALS.map((item, index) => (
            <article key={item.title} className="landing-card reveal" style={{ transitionDelay: `${(index % 3) * 90}ms` }}>
              <span className="landing-card__icon">{item.icon}</span>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-section landing-section--tint" id="quy-trinh">
        <div className="landing-section__head reveal">
          <p className="landing-eyebrow">QUY TRÌNH</p>
          <h2>Từ tham gia lớp đến nhận kết quả</h2>
        </div>
        <ol className="landing-steps">
          {STEPS.map((item, index) => (
            <li key={item.title} className="landing-step reveal" style={{ transitionDelay: `${index * 100}ms` }}>
              <span className="landing-step__no">{index + 1}</span>
              <span className="landing-step__icon">{item.icon}</span>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="landing-section" id="vai-tro">
        <div className="landing-section__head reveal">
          <p className="landing-eyebrow">VAI TRÒ</p>
          <h2>Mỗi người một việc, rõ ràng và an toàn</h2>
        </div>
        <div className="landing-roles">
          {ROLES.map((role, index) => (
            <article key={role.name} className="landing-role reveal" style={{ transitionDelay: `${index * 80}ms` }}>
              <h3>{role.name}</h3>
              <p>{role.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-cta reveal">
        <h2>Sẵn sàng bắt đầu?</h2>
        <p>Đăng nhập để vào kỳ thi của bạn hoặc tạo tài khoản học viên chỉ trong vài phút.</p>
        <div className="landing-hero__cta landing-hero__cta--center">
          {hasSession
            ? <Link to={workspace} className="landing-btn landing-btn--light landing-btn--lg">Vào trang làm việc</Link>
            : <>
              <Link to={ROUTES.login} className="landing-btn landing-btn--light landing-btn--lg">Đăng nhập</Link>
              <Link to={ROUTES.register} className="landing-btn landing-btn--ghost-light landing-btn--lg">Đăng ký</Link>
            </>}
        </div>
      </section>

      <footer className="landing-footer">
        <span>© {new Date().getFullYear()} {APP_NAME} — Hệ thống quản lý thi trắc nghiệm trực tuyến</span>
        <a href="#top">Lên đầu trang ↑</a>
      </footer>
    </div>
  )
}
