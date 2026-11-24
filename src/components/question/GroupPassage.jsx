import { Typography } from 'antd'
import QuestionMediaView from '../media/QuestionMediaView'
import { rangeLabel } from '../../services/questionGroupView'

// To-be T18 (QT18-4): đoạn dùng chung phía trên câu con — tiêu đề, nhãn khoảng câu, chữ và media (URL ký tạm của học viên).
export default function GroupPassage({ group, range, onMediaError }) {
  if (!group) return null
  return <section className="group-passage" aria-label={`Đoạn dùng chung: ${group.title}`}>
    <div className="group-passage__head">
      <Typography.Text strong>{group.title}</Typography.Text>
      {range && <Typography.Text type="secondary" className="group-passage__range">{rangeLabel(range)} dùng chung đoạn này</Typography.Text>}
    </div>
    <Typography.Paragraph className="group-passage__content">{group.content}</Typography.Paragraph>
    <QuestionMediaView media={group.media} onMediaError={onMediaError} />
  </section>
}
