import { Alert } from 'antd'
import { useSelector } from 'react-redux'
import DashboardLayout from '../layout/DashboardLayout'

export default function RequireLevel({ levels }) {
  const level = Number(useSelector((state) => state.auth.user?.levelId))
  return levels.includes(level) ? <DashboardLayout />
    : <Alert type="error" title="Bạn không có quyền xem trang này." showIcon className="m-6" />
}
