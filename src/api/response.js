export function readPayload(response) {
  const envelope = response?.data
  if (envelope?.success !== true || envelope.data == null) {
    throw new Error(envelope?.message || 'Phản hồi từ máy chủ không hợp lệ.')
  }
  return envelope.data
}

const HAS_VIETNAMESE = /[ạảãàáâấầẩẫậắằẳẵặẹẻẽèéêếềểễệỉĩịọỏõòóôốồổỗộơớờởỡợụủũùúưứừửữựỳỷỹýđă]/i

function networkMessage(error) {
  if (error?.code === 'ERR_NETWORK') return 'Không thể kết nối máy chủ. Vui lòng kiểm tra mạng hoặc thử lại sau.'
  if (error?.code === 'ECONNABORTED') return 'Máy chủ phản hồi quá chậm. Vui lòng thử lại.'
  return null
}

export function getApiError(error) {
  const body = error?.response?.data
  if (typeof body?.message === 'string' && body.message.trim()) return body.message
  if (typeof body?.title === 'string' && body.title.trim() && HAS_VIETNAMESE.test(body.title)) return body.title
  if (body?.errors && typeof body.errors === 'object') {
    const first = Object.values(body.errors).flat().find((value) => typeof value === 'string' && HAS_VIETNAMESE.test(value))
    if (first) return first
  }
  const status = error?.response?.status
  if (status === 401) return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'
  if (status === 403) return 'Bạn không có quyền thực hiện thao tác này.'
  if (status === 404) return 'Không tìm thấy dữ liệu yêu cầu.'
  if (status === 409) return 'Dữ liệu bị trùng hoặc xung đột với dữ liệu hiện có.'
  if (status === 429) return 'Bạn thao tác quá nhanh. Vui lòng đợi một lát rồi thử lại.'
  if (status === 400) return 'Dữ liệu gửi lên không hợp lệ.'
  if (status >= 500) return 'Máy chủ gặp sự cố. Vui lòng thử lại sau.'
  const network = networkMessage(error)
  if (network) return network
  const text = error?.message
  return text && HAS_VIETNAMESE.test(text) ? text : 'Đã xảy ra lỗi không xác định. Vui lòng thử lại.'
}

/** Mức độ hiển thị: 'warning' (vàng) = người dùng có thể tự sửa; 'error' (đỏ) = lỗi nghiêm trọng. */
export function getApiErrorLevel(error) {
  const status = error?.response?.status
  if (status === 401 && /\/auth\/(login|register|verify-email|resend)/.test(error?.config?.url || '')) return 'warning'
  if (status === 400 || status === 404 || status === 409 || status === 422 || status === 429) return 'warning'
  return 'error'
}

/** Các dòng lỗi chi tiết (nếu BE trả danh sách lỗi validation trong data). */
export function getApiErrorDetails(error) {
  const data = error?.response?.data?.data
  return Array.isArray(data) ? data.filter((item) => typeof item === 'string') : []
}

/** Lỗi tải dữ liệu để hiển thị bằng <LoadError>: forbidden = 403 (ẩn nút "Thử lại" vì thử lại vô ích). */
export function toLoadError(error) {
  return { message: getApiError(error), forbidden: error?.response?.status === 403 }
}
