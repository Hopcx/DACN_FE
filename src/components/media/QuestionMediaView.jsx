import { Image } from 'antd'
import { apiBaseURL } from '../../services/mediaService'
import { resolveMediaUrl } from '../../services/mediaView'

// To-be T15 (QT15-3): media của câu (từ snapshot) dưới nội dung — ảnh xem/phóng to, âm thanh nghe không giới hạn.
// onMediaError(mediaId): trang quyết định lấy URL mới (createMediaRetry: mỗi media 1 lần, dùng chung 1 request).
export default function QuestionMediaView({ media, onMediaError }) {
  if (!media?.length) return null
  const base = apiBaseURL()
  return <div className="question-media-view">
    {media.map((m, i) => m.kind === 'image'
      ? <Image key={m.id} src={resolveMediaUrl(m.url, base)} alt={`Hình ${i + 1} của câu hỏi`} className="question-media-view__image"
        onError={() => onMediaError?.(m.id)} />
      : <audio key={m.id} src={resolveMediaUrl(m.url, base)} controls preload="metadata" className="question-media-view__audio"
        aria-label={`Âm thanh ${i + 1} của câu hỏi`} onError={() => onMediaError?.(m.id)} />)}
  </div>
}
