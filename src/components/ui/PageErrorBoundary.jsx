import { Component } from 'react'
import { Button, Result } from 'antd'
import { ReloadOutlined } from '@ant-design/icons'

/** Bắt lỗi render/tải chunk của trang con; fullScreen = dùng ngoài layout. */
export default class PageErrorBoundary extends Component {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  render() {
    if (!this.state.failed) return this.props.children
    return (
      <div className={`page-error ${this.props.fullScreen ? 'page-loading--full' : ''}`} role="alert">
        <Result status="warning" title="Không tải được trang"
          subTitle="Có thể hệ thống vừa được cập nhật hoặc mạng bị gián đoạn. Bấm tải lại để mở phiên bản mới nhất."
          extra={<Button type="primary" icon={<ReloadOutlined />} onClick={() => window.location.reload()}>Tải lại trang</Button>} />
      </div>
    )
  }
}
