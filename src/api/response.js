export function readPayload(response) {
  const envelope = response?.data
  if (envelope?.success !== true || envelope.data == null) {
    throw new Error(envelope?.message || 'Phản hồi từ máy chủ không hợp lệ.')
  }
  return envelope.data
}

export function getApiError(error) {
  const body = error?.response?.data
  if (typeof body?.message === 'string' && body.message.trim()) return body.message
  if (typeof body?.title === 'string' && body.title.trim()) return body.title
  if (body?.errors && typeof body.errors === 'object') {
    const first = Object.values(body.errors).flat().find((value) => typeof value === 'string')
    if (first) return first
  }
  if (error?.response?.status === 401) return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'
  if (error?.response?.status === 403) return 'Bạn không có quyền thực hiện thao tác này.'
  if (error?.response?.status === 400) return 'Dữ liệu gửi lên không hợp lệ.'
  return error?.message || 'Không thể kết nối máy chủ.'
}
