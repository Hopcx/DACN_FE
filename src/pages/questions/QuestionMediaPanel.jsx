import { useCallback, useEffect, useRef, useState } from 'react'
import { Alert, Button, Popconfirm, Space, Typography, Upload } from 'antd'
import { DeleteOutlined, PaperClipOutlined, ReloadOutlined } from '@ant-design/icons'
import { getApiError } from '../../api/response'
import { apiBaseURL, attachQuestionMedia, detachQuestionMedia, getQuestionMedia, uploadMedia } from '../../services/mediaService'
import { ACCEPT, clientCheck, formatBytes, MAX_PER_QUESTION, mediaErrorMessage, resolveMediaUrl } from '../../services/mediaView'

// To-be T14 (QT14-3): ảnh/âm thanh đính kèm câu hỏi — tải lên (server kiểm magic bytes), xem trước bằng URL ký tạm, gỡ.
// Thay đổi lưu ngay (không chờ nút Lưu của câu hỏi). onChanged: để trang tải lại số media trong danh sách.
// Review T14: câu bị khóa (đã trong đề/đã có bài làm) → chỉ xem, không tải lên (tránh file mồ côi); URL hết hạn → tự tải lại 1 lần.
export default function QuestionMediaPanel({ questionId, onChanged }) {
  const [data, setData] = useState({ locked: false, items: [] })
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const requestRef = useRef(0)
  const refreshedRef = useRef(false)

  const load = useCallback(async () => {
    const requestId = ++requestRef.current
    setLoading(true); setError('')
    try {
      const result = await getQuestionMedia(questionId)
      if (requestId === requestRef.current) setData(result)
    } catch (failure) {
      if (requestId === requestRef.current) setError(mediaErrorMessage(failure, getApiError(failure)))
    } finally {
      if (requestId === requestRef.current) setLoading(false)
    }
  }, [questionId])
  useEffect(() => { load() }, [load])

  async function run(operation) {
    const requestId = ++requestRef.current
    setBusy(true); setError('')
    try {
      const result = await operation()
      if (requestId === requestRef.current) { setData(result); refreshedRef.current = false }
      onChanged?.()
      return true
    } catch (failure) {
      if (requestId === requestRef.current) setError(mediaErrorMessage(failure, getApiError(failure)))
      return false
    } finally { setBusy(false) }
  }

  const items = data.items || []
  async function upload({ file, onSuccess, onError }) {
    const problem = clientCheck(file, items)
    if (problem) { setError(problem); onError?.(new Error(problem)); return }
    const ok = await run(async () => {
      const media = await uploadMedia(file)
      return attachQuestionMedia(questionId, media.id)
    })
    if (ok) onSuccess?.({}); else onError?.(new Error('upload failed'))
  }

  // URL ký tạm hết hạn (modal mở lâu) → ảnh/âm thanh lỗi: tải lại danh sách một lần để lấy URL mới
  function mediaFailed() {
    if (refreshedRef.current || loading) return
    refreshedRef.current = true
    load()
  }

  const base = apiBaseURL()
  const disabled = busy || loading || data.locked
  return <div className="question-media">
    <Space className="question-media__toolbar" wrap>
      <Typography.Text strong>Hình ảnh / Âm thanh ({items.length}/{MAX_PER_QUESTION})</Typography.Text>
      <Upload accept={ACCEPT} showUploadList={false} customRequest={upload} disabled={disabled}>
        <Button icon={<PaperClipOutlined />} loading={busy} disabled={disabled}>Thêm ảnh/âm thanh</Button>
      </Upload>
      <Button icon={<ReloadOutlined />} onClick={load} disabled={busy} aria-label="Tải lại media">Làm mới</Button>
    </Space>
    {data.locked
      ? <Alert type="info" showIcon className="page-alert"
        title="Câu hỏi đã nằm trong đề thi hoặc đã có bài làm nên không thêm/gỡ ảnh, âm thanh được (chỉ xem)." />
      : <Typography.Paragraph type="secondary" className="question-media__hint">
        Ảnh JPEG/PNG/WebP ≤ 2 MB (tối đa 4096 × 4096 px, không nhận ảnh động), âm thanh MP3/M4A/OGG ≤ 10 MB; tối đa {MAX_PER_QUESTION} file, 1 âm thanh.
        Ảnh có thể chứa thông tin vị trí (EXIF) — hãy xóa trước khi tải lên. Thay đổi được lưu ngay.
      </Typography.Paragraph>}
    {error && <Alert type="error" showIcon title={error} className="page-alert" closable onClose={() => setError('')} />}
    <div className="question-media__list">
      {items.map((item) => <div key={item.id} className="question-media__item">
        {item.kind === 'image'
          ? <img src={resolveMediaUrl(item.url, base)} alt={item.originalName} className="question-media__image" loading="lazy" onError={mediaFailed} />
          : <audio src={resolveMediaUrl(item.url, base)} controls preload="none" className="question-media__audio" onError={mediaFailed} />}
        <div className="question-media__meta">
          <span title={item.originalName}>{item.originalName}</span>
          <small className="muted">{item.kind === 'image' && item.width ? `${item.width}×${item.height} · ` : ''}{formatBytes(item.sizeBytes)}</small>
        </div>
        {!data.locked && <Popconfirm title="Gỡ media khỏi câu hỏi?" onConfirm={() => run(() => detachQuestionMedia(questionId, item.id))}>
          <Button size="small" danger icon={<DeleteOutlined />} disabled={busy}>Gỡ</Button>
        </Popconfirm>}
      </div>)}
      {!loading && items.length === 0 && <span className="muted">Chưa có media.</span>}
    </div>
  </div>
}
