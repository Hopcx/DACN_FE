import { useEffect, useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { ROUTES } from '../../data/constants'
import { resumeSession } from '../../services/authService'

export default function RequireAuth() {
  const hasSession = useSelector((state) => Boolean(state.auth.accessToken && state.auth.user))
  const location = useLocation()
  const [checking, setChecking] = useState(!hasSession)
  useEffect(() => {
    if (hasSession) return
    let active = true
    resumeSession().catch(() => {}).finally(() => { if (active) setChecking(false) })
    return () => { active = false }
  }, [hasSession])
  if (checking && !hasSession) return <p>Đang kiểm tra phiên...</p>
  return hasSession ? <Outlet /> : <Navigate to={ROUTES.login} state={{ from: location }} replace />
}
