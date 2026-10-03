import { Navigate } from 'react-router-dom'
import { ROUTES } from '../../data/constants'

export default function SelectRolePage() {
  return <Navigate to={ROUTES.register} replace />
}
