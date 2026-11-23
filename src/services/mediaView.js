// To-be T14: hàm thuần cho media câu hỏi (không axios để chạy bằng node --test). Server vẫn kiểm lại bằng magic bytes.

export const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp']
export const AUDIO_EXTENSIONS = ['.mp3', '.m4a', '.ogg']
export const ACCEPT = [...IMAGE_EXTENSIONS, ...AUDIO_EXTENSIONS].join(',')
export const MAX_IMAGE_BYTES = 2 * 1024 * 1024
export const MAX_AUDIO_BYTES = 10 * 1024 * 1024
export const MAX_PER_QUESTION = 5

const extensionOf = (name) => { const m = /\.[^.]+$/.exec(String(name || '').toLowerCase()); return m ? m[0] : '' }

export function kindOfName(name) {
  const ext = extensionOf(name)
  return IMAGE_EXTENSIONS.includes(ext) ? 'image' : AUDIO_EXTENSIONS.includes(ext) ? 'audio' : null
}

export function formatBytes(bytes) {
  const n = Number(bytes) || 0
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1).replace('.', ',')} KB`
  return `${(n / 1024 / 1024).toFixed(1).replace('.', ',')} MB`
}

/** Kiểm sớm phía trình duyệt (đuôi, dung lượng, số lượng); trả câu lỗi tiếng Việt hoặc null. */
export function clientCheck(file, current = []) {
  const kind = kindOfName(file?.name)
  if (!kind) return 'Chỉ nhận ảnh JPEG, PNG, WebP hoặc âm thanh MP3, M4A, OGG.'
  if (kind === 'image' && file.size > MAX_IMAGE_BYTES) return `Ảnh quá lớn (${formatBytes(file.size)}); tối đa 2 MB.`
  if (kind === 'audio' && file.size > MAX_AUDIO_BYTES) return `Âm thanh quá lớn (${formatBytes(file.size)}); tối đa 10 MB.`
  if (current.length >= MAX_PER_QUESTION) return `Mỗi câu tối đa ${MAX_PER_QUESTION} media.`
  if (kind === 'audio' && current.some((x) => x.kind === 'audio')) return 'Mỗi câu chỉ có 1 âm thanh.'
  return null
}

const ERRORS = {
  MEDIA_EMPTY: 'File rỗng.',
  MEDIA_TYPE_NOT_ALLOWED: 'Nội dung file không phải ảnh JPEG/PNG/WebP hoặc âm thanh MP3/M4A/OGG (không nhận SVG, GIF).',
  MEDIA_TOO_LARGE: 'File quá lớn (ảnh ≤ 2 MB, âm thanh ≤ 10 MB).',
  MEDIA_DIMENSIONS_TOO_LARGE: 'Ảnh quá lớn về kích thước (tối đa 4096 × 4096 px).',
  MEDIA_CORRUPT: 'File ảnh bị hỏng hoặc không đọc được kích thước.',
  MEDIA_LIMIT_REACHED: 'Câu hỏi đã đủ 5 media.',
  MEDIA_AUDIO_LIMIT_REACHED: 'Câu hỏi đã có 1 âm thanh.',
  MEDIA_ALREADY_ATTACHED: 'Media này đã gắn vào câu hỏi.',
  QUESTION_LOCKED: 'Câu hỏi đã nằm trong đề thi hoặc đã có bài làm nên không đổi media được.',
  MEDIA_NOT_FOUND: 'Không tìm thấy media.',
}
export function mediaErrorMessage(failure, fallback) {
  const status = failure?.response?.status
  if (status === 413) return ERRORS.MEDIA_TOO_LARGE
  return ERRORS[failure?.response?.data?.message] || fallback
}

// Review T14: URL media từ API là đường dẫn tương đối (/web/media/…). Nếu baseURL của axios là URL tuyệt đối (API khác origin)
// thì ghép origin của API; ngược lại giữ nguyên (cùng origin qua proxy).
export function resolveMediaUrl(url, baseURL) {
  if (!url || /^https?:\/\//i.test(url)) return url
  try {
    if (/^https?:\/\//i.test(String(baseURL || ''))) return new URL(url, new URL(baseURL).origin).toString()
  } catch { /* baseURL hỏng → giữ đường dẫn tương đối */ }
  return url
}

// To-be T15: thay media (URL ký mới) của các câu theo Id, giữ nguyên phần còn lại của state (đáp án đang chọn…)
export function mergeMedia(target, freshQuestions) {
  if (!target?.questions || !Array.isArray(freshQuestions)) return target
  const byId = new Map(freshQuestions.map((q) => [q.id, q.media || []]))
  return { ...target, questions: target.questions.map((q) => byId.has(q.id) ? { ...q, media: byId.get(q.id) } : q) }
}

const ORPHAN_ERRORS = {
  MEDIA_IN_USE: 'Media đang được câu hỏi hoặc bài làm dùng nên không xóa được.',
  MEDIA_TOO_RECENT: 'Media mới tải lên chưa đủ 24 giờ nên chưa được xóa.',
  MEDIA_NOT_FOUND: 'Media không còn (có thể đã bị xóa).',
}
export const orphanErrorMessage = (failure, fallback) => ORPHAN_ERRORS[failure?.response?.data?.message] || fallback

// To-be T15 (review): media lỗi → lấy URL mới, nhưng mỗi media id chỉ thử lại 1 lần cho cả trang
// và các lỗi cùng lúc dùng chung một lần gọi API — media hỏng thật (404) không gây vòng lặp.
export function createMediaRetry(run) {
  const tried = new Set()
  let pending = null
  return (mediaId) => {
    if (!mediaId || tried.has(mediaId)) return pending || Promise.resolve(false)
    tried.add(mediaId)
    if (!pending) pending = Promise.resolve().then(run).then(() => true, () => false).finally(() => { pending = null })
    return pending
  }
}
