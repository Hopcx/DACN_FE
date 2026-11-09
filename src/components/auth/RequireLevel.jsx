import { Alert } from 'antd'
import { useSelector } from 'react-redux'
import DashboardLayout from '../layout/DashboardLayout'

// Admin (levelId = 1) là quyền cao nhất: vào được mọi khu vực, mọi màn hình.
export default function RequireLevel({ levels }) {
  const level = Number(useSelector((state) => state.auth.user?.levelId))
  return level === 1 || levels.includes(level) ? <DashboardLayout />
    : <Alert type="error" title="Bạn không có quyền xem trang này." showIcon className="m-6" />
}
