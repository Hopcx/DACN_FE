import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { ROUTES } from '../../data/constants'

export default function RequireAuth() {
  const hasSession = useSelector((state) => Boolean(state.auth.accessToken && state.auth.user))
  const location = useLocation()
  return hasSession ? <Outlet /> : <Navigate to={ROUTES.login} state={{ from: location }} replace />
}
