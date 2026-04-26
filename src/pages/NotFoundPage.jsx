import { Link } from 'react-router-dom'
import { ROUTES } from '../data/constants'

export default function NotFoundPage() {
  return (
    <section className="page not-found">
      <h1>404</h1>
      <p>Không tìm thấy trang.</p>
      <Link to={ROUTES.home}>Về trang chủ</Link>
    </section>
  )
}
