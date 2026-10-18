import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Alert, Button, Card, Checkbox, Radio, Space, Typography } from 'antd'
import { getApiError } from '../../api/response'
import { getAttempt, saveAttempt, submitAttempt } from '../../services/attemptService'

const toDraft = (answers = []) => Object.fromEntries(answers.map((x) => [x.questionId, x.selectedAnswerIds]))
const payload = (questions, choices) => questions.map((q) => ({ questionId: q.id, selectedAnswerIds: choices[q.id] || [] }))

export default function StudentAttemptPage() {
  const { id } = useParams()
  const [attempt, setAttempt] = useState(null)
  const [choices, setChoices] = useState({})
  const [dirty, setDirty] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [, setTick] = useState(0)
  const [serverClock, setServerClock] = useState(null)

  const load = useCallback(async () => {
    setError('')
    try {
      const data = await getAttempt(id)
      setAttempt(data)
      setChoices(toDraft(data.savedAnswers))
      setDirty(false)
      setServerClock({ now: Date.parse(data.serverNow), at: performance.now() })
    } catch (failure) { setError(getApiError(failure)) }
  }, [id])
  useEffect(() => { load() }, [load])
  useEffect(() => {
    const timer = window.setInterval(() => setTick((x) => x + 1), 1000)
    return () => window.clearInterval(timer)
  }, [])
  const remaining = attempt && serverClock
    ? Math.max(0, Math.ceil((Date.parse(attempt.deadline) - serverClock.now - (performance.now() - serverClock.at)) / 1000))
    : 0

  const save = async () => {
    if (!attempt || busy || remaining === 0) return
    setBusy(true); setError('')
    try {
      const updated = await saveAttempt(id, attempt.revision, payload(attempt.questions, choices))
      setAttempt(updated); setDirty(false)
      setServerClock({ now: Date.parse(updated.serverNow), at: performance.now() })
    } catch (failure) { setError(`${getApiError(failure)}. Tải lại để xem bản nháp trên máy chủ trước khi sửa tiếp.`) }
    finally { setBusy(false) }
  }
  const submit = async () => {
    if (!attempt || busy) return
    setBusy(true); setError('')
    try {
      let current = attempt
      if (dirty && remaining > 0) current = await saveAttempt(id, current.revision, payload(current.questions, choices))
      const updated = await submitAttempt(id, current.revision)
      setAttempt(updated); setDirty(false)
      setServerClock({ now: Date.parse(updated.serverNow), at: performance.now() })
    } catch (failure) { setError(`${getApiError(failure)}. Tải lại để xác nhận trạng thái trên máy chủ.`) }
    finally { setBusy(false) }
  }
  const choose = (question, values) => {
    setChoices((old) => ({ ...old, [question.id]: values }))
    setDirty(true)
  }

  return <section className="p-6">
    <Typography.Title level={2}>Bài làm</Typography.Title>
    <Link to="/student/schedules">Lịch thi của tôi</Link>
    <span> · </span><Link to="/student/attempts">Lịch sử làm bài</Link>
    {error && <Alert type="error" showIcon title={error} className="my-4" />}
    <div className="my-4"><Button onClick={load} disabled={busy}>Tải lại từ máy chủ</Button></div>
    {attempt && <>
      <Typography.Paragraph>Trạng thái: {attempt.state} · Còn {Math.floor(remaining / 60)}:{String(remaining % 60).padStart(2, '0')} · Bản nháp #{attempt.revision}{dirty ? ' (chưa lưu)' : ''}</Typography.Paragraph>
      {attempt.state === 'inProgress' ? <>
        {attempt.questions.map((question, index) => <Card key={question.id} title={`Câu ${index + 1}`} className="mb-4">
          <Typography.Paragraph>{question.content}</Typography.Paragraph>
          {question.questionTypeId === 3
            ? <Checkbox.Group disabled={busy || remaining === 0} value={choices[question.id] || []}
                onChange={(values) => choose(question, values)} options={question.options.map((option) => ({ label: option.content, value: option.id }))} />
            : <Radio.Group disabled={busy || remaining === 0} value={choices[question.id]?.[0]}
                onChange={(event) => choose(question, [event.target.value])}>
                <Space orientation="vertical">{question.options.map((option) => <Radio key={option.id} value={option.id}>{option.content}</Radio>)}</Space>
              </Radio.Group>}
          <div><Button type="link" disabled={busy || remaining === 0} onClick={() => choose(question, [])}>Bỏ chọn</Button></div>
        </Card>)}
        <Space><Button onClick={save} loading={busy} disabled={!dirty || remaining === 0}>Lưu đáp án</Button>
          <Button type="primary" onClick={submit} loading={busy}>Nộp bài</Button></Space>
      </> : <Alert type="info" showIcon title={attempt.state === 'timedOut' ? 'Đã hết thời gian làm bài' : 'Đã nộp bài'}
        description={attempt.result ? `Điểm: ${attempt.result.totalMark} · ${attempt.result.isPassed ? 'Đạt' : 'Chưa đạt'}${attempt.result.timeTakenSeconds == null ? '' : ` · Thời lượng: ${attempt.result.timeTakenSeconds} giây`}` : 'Kết quả chưa được phép xem.'} />}
    </>}
  </section>
}
