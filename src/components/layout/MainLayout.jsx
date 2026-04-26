import { Outlet } from 'react-router-dom'
import Header from './Header'

export default function MainLayout() {
  return (
    <>
      <Header />
      <main className="main-content">
        <Outlet />
      </main>
    </>
  )
}
