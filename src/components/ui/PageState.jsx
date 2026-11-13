import { Alert, Button, Empty, Spin } from 'antd'
import { ReloadOutlined } from '@ant-design/icons'

/** Khung chờ khi tải trang (fallback của Suspense). fullScreen = chiếm cả màn hình (ngoài layout). */
export function PageLoading({ fullScreen = false, label = 'Đang tải trang...' }) {
  return (
    <div className={`page-loading ${fullScreen ? 'page-loading--full' : ''}`} role="status" aria-live="polite">
      <Spin />
      <span>{label}</span>
    </div>
  )
}

/** Nội dung locale.emptyText của Table: phân biệt lỗi tải / lọc không khớp / chưa có dữ liệu. */
export function TableEmpty({
  error = false,
  filtered = false,
  emptyLabel = 'Chưa có dữ liệu',
  filteredLabel = 'Không có bản ghi khớp bộ lọc',
  errorLabel = 'Không tải được dữ liệu. Bấm "Tải lại" để thử lại.',
}) {
  return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={error ? errorLabel : filtered ? filteredLabel : emptyLabel} />
}

/** Thông báo lỗi tải dữ liệu có nút "Thử lại" (ẩn khi 403 hoặc không có onRetry). error = kết quả toLoadError hoặc null. */
export function LoadError({ error, onRetry, retrying = false }) {
  if (!error) return null
  return (
    <Alert type="error" showIcon className="page-alert" title={error.message}
      action={!error.forbidden && onRetry
        ? <Button size="small" icon={<ReloadOutlined />} loading={retrying} onClick={onRetry}>Thử lại</Button>
        : undefined} />
  )
}
