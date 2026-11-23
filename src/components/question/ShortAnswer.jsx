import { Input, Tag, Typography } from 'antd'
import { MAX_TEXT } from '../../services/shortAnswerView'

// To-be T16: ô nhập câu điền ngắn (một dòng, tối đa 200 ký tự) khi làm bài
export function ShortAnswerInput({ value, disabled, onChange, onBlur }) {
  return <Input className="short-answer-input" value={typeof value === 'string' ? value : ''} disabled={disabled}
    maxLength={MAX_TEXT} showCount placeholder="Nhập câu trả lời" aria-label="Câu trả lời"
    onChange={(event) => onChange?.(event.target.value)} onBlur={onBlur} />
}

// To-be T16: xem lại câu điền ngắn — bài làm (đúng/sai) và các đáp án chấp nhận
export function ShortAnswerReview({ text, isCorrect, acceptedAnswers = [] }) {
  const answered = typeof text === 'string' && text.trim().length > 0
  return <div className="short-answer-review">
    <div className={`review-option ${answered ? (isCorrect ? 'is-correct' : 'is-wrong') : ''}`}>
      <Typography.Text type="secondary">Bạn trả lời: </Typography.Text>
      {answered ? <strong>{text}</strong> : <Typography.Text type="secondary">(bỏ trống)</Typography.Text>}
      {answered && <Tag color={isCorrect ? 'green' : 'red'} className="ml-2">{isCorrect ? 'Đúng' : 'Sai'}</Tag>}
    </div>
    {acceptedAnswers?.length > 0 && <div className="review-option is-correct">
      <Typography.Text type="secondary">Đáp án chấp nhận: </Typography.Text>
      {acceptedAnswers.map((x, i) => <Tag key={i} color="green">{x}</Tag>)}
    </div>}
  </div>
}
