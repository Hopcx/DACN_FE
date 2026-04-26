import { useNavigate } from 'react-router-dom'
import { ROUTES } from '../../data/constants'
import './auth.css'

export default function SelectRolePage() {
  const navigate = useNavigate()

  function handleSelectRole(role) {
    // Placeholder: sau này tạo flow đăng ký theo role.
    navigate(ROUTES.adminDashboard, { state: { role } })
  }

  return (
    <section className="role-page">
      <h2 className="role-heading">ĐĂNG KÝ TÀI KHOẢN MỚI</h2>
      <div className="role-subtitle">Chọn vai trò để tiếp tục</div>

      <div className="role-grid">
        <button
          type="button"
          className="role-card"
          onClick={() => handleSelectRole('Admin')}
        >
          <div className="role-card__img role-card__img--admin" />
          <div className="role-card__label">Tôi là Admin</div>
        </button>

        <button
          type="button"
          className="role-card"
          onClick={() => handleSelectRole('Examiner')}
        >
          <div className="role-card__img role-card__img--examiner" />
          <div className="role-card__label">Tôi là giám khảo</div>
        </button>

        <button
          type="button"
          className="role-card"
          onClick={() => handleSelectRole('Teacher')}
        >
          <div className="role-card__img role-card__img--teacher" />
          <div className="role-card__label">Tôi là giáo viên</div>
        </button>

        <button
          type="button"
          className="role-card"
          onClick={() => handleSelectRole('Student')}
        >
          <div className="role-card__img role-card__img--student" />
          <div className="role-card__label">Tôi là học sinh</div>
        </button>
      </div>
    </section>
  )
}

