import { Link } from 'react-router-dom'
import { APP_NAME, ROUTES } from '../../data/constants'

export default function Header() {
  return (
    <header className="app-header">
      <Link to={ROUTES.home} className="app-header__brand">
        {APP_NAME}
      </Link>
      <nav className="app-header__nav">
        <Link to={ROUTES.home}>Trang chủ</Link>
      </nav>
    </header>
  )
}
