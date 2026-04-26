import './adminDashboard.css'

export default function AdminDashboardPage() {
  const roleDisplay = 'Admin'

  const stats = [
    { value: 36, label: 'Tổng số học sinh', iconClass: 'blue', iconText: 'S' },
    {
      value: 13,
      label: 'Tổng số học hộp học',
      iconClass: 'green',
      iconText: 'H',
    },
    {
      value: 12,
      label: 'Tổng số bài thi',
      iconClass: 'orange',
      iconText: 'B',
    },
    { value: 1, label: 'Tổng số lịch thi', iconClass: 'red', iconText: 'L' },
    { value: 108, label: 'Tổng số câu hỏi', iconClass: 'purple', iconText: 'Q' },
    {
      value: 13,
      label: 'Tổng số môn học',
      iconClass: 'blue',
      iconText: 'M',
    },
  ]

  return (
    <section className="admin-dashboard">
      <h1 className="admin-dashboard__title">TỔNG QUAN</h1>
      <div className="admin-dashboard__hint">
        Chế độ: {roleDisplay}
      </div>

      <div className="admin-stats-grid">
        {stats.map((s) => {
          const iconCls = `admin-stat-card__icon--${s.iconClass}`
          return (
            <div key={s.label} className="admin-stat-card">
              <div className={`admin-stat-card__icon ${iconCls}`}>
                {s.iconText}
              </div>
              <div className="admin-stat-card__body">
                <div className="admin-stat-card__value">{s.value}</div>
                <div className="admin-stat-card__label">{s.label}</div>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

