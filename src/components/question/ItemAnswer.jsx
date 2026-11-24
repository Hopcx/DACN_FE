import { Button, Radio, Select, Tag, Typography } from 'antd'
import { chooseMatch, isMatching, reviewRows } from '../../services/itemAnswerView'

const LETTERS = 'ABCDEFGHIJ'
const asMap = (value) => (value && typeof value === 'object' && !Array.isArray(value) ? value : {})

// To-be T17: làm câu ghép cặp (chọn vế phải cho từng vế trái; mỗi vế phải dùng một lần) và nhiều mệnh đề (Đúng/Sai từng mệnh đề)
export function ItemAnswerInput({ question, value, disabled, onChange }) {
  const current = asMap(value)
  if (isMatching(question)) {
    const used = new Set(Object.values(current))
    return <div className="item-answer">
      {question.options.map((option, i) => <div key={option.id} className="item-answer__row">
        <span className="item-answer__label">{LETTERS[i] || i + 1}. {option.content}</span>
        <Select className="item-answer__select" allowClear placeholder="Chọn vế ghép" disabled={disabled} value={current[option.id]}
          aria-label={`Ghép với ${option.content}`} virtual={false}
          onChange={(matchId) => onChange?.(chooseMatch(current, option.id, matchId))}
          // Review T17: vế phải đang ghép ở dòng khác vẫn chọn được — chọn sẽ chuyển nó sang dòng này (chooseMatch bỏ ở dòng cũ)
          options={(question.matches || []).map((match, j) => ({ value: match.id,
            label: `${j + 1}. ${match.content}${used.has(match.id) && current[option.id] !== match.id ? ' · đang dùng' : ''}` }))} />
      </div>)}
    </div>
  }
  return <div className="item-answer">
    {question.options.map((option, i) => <div key={option.id} className="item-answer__row">
      <span className="item-answer__label">{LETTERS[i] || i + 1}. {option.content}</span>
      <Radio.Group disabled={disabled} value={current[option.id]} optionType="button" buttonStyle="solid" aria-label={`Mệnh đề ${i + 1}`}
        onChange={(event) => onChange?.({ ...current, [option.id]: event.target.value })}
        options={[{ value: true, label: 'Đúng' }, { value: false, label: 'Sai' }]} />
      {/* Review T17: bỏ chọn từng mệnh đề */}
      {current[option.id] !== undefined && !disabled && <Button type="link" size="small" aria-label={`Bỏ chọn mệnh đề ${i + 1}`}
        onClick={() => { const next = { ...current }; delete next[option.id]; onChange?.(next) }}>Bỏ chọn</Button>}
    </div>)}
  </div>
}

// To-be T17: xem lại từng mục — câu trả lời của học viên, đáp án đúng, đúng/sai từng mục
export function ItemAnswerReview({ question, items, correctItems }) {
  const rows = reviewRows(question, items, correctItems)
  return <div className="item-answer item-answer--review">
    {rows.map((row, i) => <div key={row.id} className={`review-option item-answer__row ${row.correct ? 'is-correct' : row.given ? 'is-wrong' : ''}`}>
      <span className="item-answer__label">{LETTERS[i] || i + 1}. {row.content}</span>
      <span>
        <Typography.Text type="secondary">Bạn chọn: </Typography.Text>
        {row.given ? <strong>{row.given}</strong> : <Typography.Text type="secondary">(bỏ trống)</Typography.Text>}
        {row.given && <Tag color={row.correct ? 'green' : 'red'} className="ml-2">{row.correct ? 'Đúng' : 'Sai'}</Tag>}
        {!row.correct && row.expected && <Tag color="green" className="ml-2">Đáp án: {row.expected}</Tag>}
      </span>
    </div>)}
  </div>
}
