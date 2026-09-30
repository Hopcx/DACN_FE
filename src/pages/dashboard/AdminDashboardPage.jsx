import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { getRooms } from '../../services/roomService'
import { getApiError } from '../../api/response'
import './adminDashboard.css'

export default function AdminDashboardPage() {
  const user = useSelector((state) => state.auth.user)
  const canReadRooms = (user?.permissions || []).some((id) => String(id) === '4')
  const [page, setPage] = useState(1)
  const [rooms, setRooms] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!canReadRooms) return
    let active = true
    getRooms(page)
      .then((result) => { if (active) { setRooms(result); setError('') } })
      .catch((failure) => { if (active) { setRooms(null); setError(getApiError(failure)) } })
    return () => { active = false }
  }, [canReadRooms, page])

  return (
    <section className="admin-dashboard">
      <h1 className="admin-dashboard__title">TỔNG QUAN</h1>
      <p className="admin-dashboard__hint">Xin chào, {user?.userName || 'người dùng'}.</p>
      <h2 className="admin-dashboard__title">Phòng thi</h2>
      {!canReadRooms && <p>Bạn không có quyền xem danh sách phòng thi.</p>}
      {canReadRooms && error && <p role="alert">{error}</p>}
      {canReadRooms && !error && !rooms && <p>Đang tải phòng thi...</p>}
      {canReadRooms && rooms?.items.length === 0 && <p>Chưa có phòng thi.</p>}
      {canReadRooms && rooms?.items.length > 0 && (
        <>
          <ul className="room-list">
            {rooms.items.map((room) => (
              <li key={room.id} className="room-card">
                <strong>{room.name}</strong>
                <span>{room.address}</span>
                <span>Sức chứa: {room.capacity}</span>
              </li>
            ))}
          </ul>
          <div className="room-pagination">
            <button type="button" disabled={page <= 1} onClick={() => setPage(page - 1)}>Trước</button>
            <span>Trang {page} · {rooms.totalCount} phòng</span>
            <button type="button" disabled={page * rooms.pageSize >= rooms.totalCount} onClick={() => setPage(page + 1)}>Sau</button>
          </div>
        </>
      )}
    </section>
  )
}
