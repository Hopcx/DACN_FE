export function saveBlob(blob, fileName) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fileName
  anchor.click()
  URL.revokeObjectURL(url)
}

// Với responseType 'blob', lỗi 400/404/409 của BE đến FE dưới dạng Blob nên getApiError không đọc được.
export async function normalizeBlobError(error) {
  const data = error?.response?.data
  if (typeof Blob !== 'undefined' && data instanceof Blob) {
    try { error.response.data = JSON.parse(await data.text()) }
    catch { error.response.data = null }
  }
  return error
}
