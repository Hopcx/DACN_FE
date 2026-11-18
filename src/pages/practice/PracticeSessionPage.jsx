import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Alert, Button, Card, Checkbox, Modal, Radio, Space, Tag, Typography } from 'antd'
import { ArrowLeftOutlined, CheckCircleFilled, CheckOutlined, ClockCircleOutlined, LeftOutlined, RedoOutlined,
  ReloadOutlined, RightOutlined, SaveOutlined, SendOutlined } from '@ant-design/icons'
import StatusTag from '../../components/ui/StatusTag'
import { checkPracticeQuestion, finishPractice, getPractice, getPracticeReview, retryPractice, savePractice } from '../../services/practiceService'
import { MODE_LABELS, paletteState, practiceErrorMessage, toCheckedMap, toDraft, toPayload } from '../../services/practiceView'

const LETTERS = 'ABCDEFGHIJ'
const AUTOSAVE_MS = 15000

/** Đáp án của một câu sau khi biết kết quả (đã kiểm tra hoặc xem lại). */
function RevealedOptions({ options, selected, correctIds }) {
  return options.map((option, i) => {
    const picked = selected.includes(option.id)
    const correct = correctIds.includes(option.id)
    return <div key={option.id} className={`review-option ${correct ? 'is-correct' : ''} ${picked && !correct ? 'is-wrong' : ''}`}>
      {LETTERS[i] || i + 1}. {option.content}
      {picked && <Tag color={correct ? 'green' : 'red'} className="ml-2">Câu trả lời của bạn</Tag>}
      {correct && <Tag color="green" className="ml-2">Đáp án đúng</Tag>}
    </div>
  })
}

function Explanation({ text }) {
  return text ? <div className="review-explanation">
    <Typography.Text strong>Lời giải</Typography.Text>
    <Typography.Paragraph className="review-explanation__text">{text}</Typography.Paragraph>
  </div> : null
}

// To-be T7: làm bài luyện tập (tự lưu, "Kiểm tra câu này" ở chế độ Từng câu, nộp) và xem lại sau khi nộp.
export default function PracticeSessionPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [session, setSession] = useState(null)
  const [review, setReview] = useState(null)
  const [choices, setChoices] = useState({})
  const [dirty, setDirty] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [current, setCurrent] = useState(0)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const saveRef = useRef(null)

  const load = useCallback(async () => {
    setError('')
    try {
      const data = await getPractice(id)
      setSession(data); setChoices(toDraft(data.answers)); setDirty(false)
      setReview(data.state === 'finished' ? await getPracticeReview(id) : null)
    } catch (failure) { setError(practiceErrorMessage(failure)) }
  }, [id])
  // Đổi phiên (vd. sau "Làm lại bộ này"): xóa trạng thái phiên cũ trước khi tải
  useEffect(() => { setCurrent(0); setSession(null); setReview(null); setChoices({}); setDirty(false); load() }, [load])
  // Rời trang/tải lại khi còn thay đổi chưa lưu: trình duyệt hỏi xác nhận
  useEffect(() => {
    if (!dirty) return undefined
    const warn = (event) => { event.preventDefault(); event.returnValue = '' }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

  // Trạng thái trên máy chủ đã khác (revision, câu đã chốt, phiên đã nộp ở tab khác): tải lại để không ghi đè
  const RELOAD_CODES = ['CONCURRENCY_CONFLICT', 'PRACTICE_QUESTION_LOCKED', 'PRACTICE_CLOSED']
  const fail = async (failure) => {
    const message = practiceErrorMessage(failure)
    if (RELOAD_CODES.includes(failure?.response?.data?.message)) await load()
    setError(message)
  }

  const save = async () => {
    if (!session || busy || !dirty || session.state !== 'inProgress') return session
    setBusy(true)
    try {
      const saved = await savePractice(id, session.revision, toPayload(session.questions, choices))
      const next = { ...session, revision: saved.revision, answers: saved.answers }
      setSession(next); setDirty(false); setError('')
      return next
    } catch (failure) { await fail(failure); return null }
    finally { setBusy(false) }
  }
  saveRef.current = save
  useEffect(() => {
    if (!dirty || session?.state !== 'inProgress') return undefined
    const timer = window.setTimeout(() => saveRef.current?.(), AUTOSAVE_MS)
    return () => window.clearTimeout(timer)
  }, [dirty, choices, session?.state])

  const go = async (index) => { if (dirty) await saveRef.current?.(); setCurrent(index) }

  const check = async (question) => {
    if (busy) return
    const selected = choices[question.id] || []
    if (!selected.length) { setError('Hãy chọn đáp án trước khi kiểm tra.'); return }
    setBusy(true); setError('')
    let base = session
    try {
      // Có thay đổi chưa lưu: lưu cả nháp trước (cập nhật revision ngay để lỗi check sau đó không để lại revision cũ),
      // rồi kiểm tra câu này với lựa chọn hiện tại
      if (dirty) {
        const saved = await savePractice(id, session.revision, toPayload(session.questions, choices))
        base = { ...session, revision: saved.revision, answers: saved.answers }
        setSession(base); setDirty(false)
      }
      const outcome = await checkPracticeQuestion(id, question.id, base.revision, selected)
      const answers = [...base.answers.filter((x) => x.questionId !== question.id),
        { questionId: question.id, selectedAnswerIds: outcome.result.selectedAnswerIds }]
      setSession({ ...base, revision: outcome.revision, answers,
        checked: [...(base.checked || []).filter((x) => x.questionId !== question.id), outcome.result] })
      setChoices((old) => ({ ...old, [question.id]: outcome.result.selectedAnswerIds }))
      setDirty(false)
      // Revision nhảy khác +1: câu đã được chốt ở tab khác (kết quả cũ) hoặc có ghi khác → lấy lại trạng thái máy chủ
      if (outcome.revision !== base.revision + 1) await load()
    } catch (failure) { await fail(failure) }
    finally { setBusy(false) }
  }

  const finish = async () => {
    if (busy) return
    setConfirmOpen(false)
    const latest = dirty ? await save() : session
    if (!latest) return
    setBusy(true)
    try {
      await finishPractice(id, latest.revision)
      await load()
    } catch (failure) { await fail(failure) }
    finally { setBusy(false) }
  }

  const retry = async () => {
    setBusy(true); setError('')
    try { const created = await retryPractice(id); navigate(`/student/practice/${created.id}`) }
    catch (failure) { setError(practiceErrorMessage(failure)) }
    finally { setBusy(false) }
  }

  const choose = (question, values) => { setChoices((old) => ({ ...old, [question.id]: values })); setDirty(true) }

  const finished = session?.state === 'finished'
  const items = finished ? review?.questions || [] : session?.questions || []
  const index = Math.min(current, Math.max(0, items.length - 1))
  const checkedMap = toCheckedMap(session?.checked)
  const reviewMap = Object.fromEntries((review?.questions || []).map((x) => [x.id, { isCorrect: x.isCorrect }]))
  const question = items[index]
  const answered = (session?.questions || []).filter((q) => (choices[q.id] || []).length > 0).length
  const perQuestion = session?.revealMode === 'perQuestion'
  const result = question && !finished ? checkedMap[question.id] : null

  return <section className="page-body attempt-page">
    <div className="attempt-topbar">
      <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate('/student/practice')}>Luyện tập</Button>
      <Button icon={<ReloadOutlined />} onClick={load} disabled={busy}>Tải lại từ máy chủ</Button>
    </div>
    {error && <Alert type="error" showIcon title={error} className="page-alert" closable onClose={() => setError('')} />}
    {session && <>
      <div className="attempt-head page-card">
        <h2 className="attempt-head__title">Luyện tập: {session.subjectName || 'Môn học'}</h2>
        <div className="attempt-head__meta">
          Chế độ hiện đáp án: {MODE_LABELS[session.revealMode] || session.revealMode}  |  {session.questionCount} câu
        </div>
        <div className="attempt-head__stats">
          {finished
            ? <span>Kết quả: <strong className="practice-score">{session.correctCount}/{session.questionCount}</strong> câu đúng</span>
            : <span>Bản nháp #{session.revision}{dirty ? ' · chưa lưu' : ' · đã lưu'}</span>}
          <StatusTag tone={finished ? 'success' : 'info'}>{finished ? 'Đã nộp' : 'Đang làm'}</StatusTag>
        </div>
      </div>

      {question && <div className="attempt-layout">
        <aside className="attempt-palette page-card">
          <h3 className="attempt-palette__title">Danh sách câu hỏi <small>({items.length} câu)</small></h3>
          <div className="attempt-palette__legend">
            {(perQuestion || finished) && <><span><i className="dot dot--right" />Đúng</span><span><i className="dot dot--wrong" />Sai</span></>}
            {!finished && <span><i className="dot dot--pending" />Đã trả lời</span>}
            <span><i className="dot" />Chưa trả lời</span>
          </div>
          <div className="attempt-palette__grid">{items.map((item, i) => {
            const state = finished
              ? (reviewMap[item.id]?.isCorrect ? 'right' : item.selectedAnswerIds?.length ? 'wrong' : 'empty')
              : paletteState(item.id, choices, checkedMap)
            const classes = ['palette-item', state === 'answered' && 'is-pending', state === 'right' && 'is-right',
              state === 'wrong' && 'is-wrong', i === index && 'is-current']
            return <button type="button" key={item.id} className={classes.filter(Boolean).join(' ')}
              aria-label={`Câu ${i + 1}`} onClick={() => go(i)}>{i + 1}</button>
          })}</div>
          {!finished && <div className="attempt-palette__summary">Đã trả lời {answered}/{items.length} câu</div>}
        </aside>

        <Card className={`attempt-question ${finished || result ? 'review-question' : ''}`}
          title={<span>Câu <strong className="attempt-question__no">{index + 1}/{items.length}</strong>
            {question.questionTypeId === 3 && <Tag className="ml-2" color="blue">Chọn nhiều đáp án</Tag>}
            {(result || finished) && <Tag className="ml-2" color={(result || reviewMap[question.id])?.isCorrect ? 'green' : 'red'}>
              {(result || reviewMap[question.id])?.isCorrect ? 'Đúng' : 'Sai'}</Tag>}</span>}>
          <Typography.Paragraph className="attempt-question__content">{question.content}</Typography.Paragraph>
          {finished
            ? <>
              <RevealedOptions options={question.options} selected={question.selectedAnswerIds}
                correctIds={question.options.filter((x) => x.isCorrect).map((x) => x.id)} />
              {!question.selectedAnswerIds.length && <Typography.Text type="secondary">Bạn chưa trả lời câu này.</Typography.Text>}
              <Explanation text={question.explanation} />
            </>
            : result
              ? <>
                <RevealedOptions options={question.options} selected={result.selectedAnswerIds} correctIds={result.correctAnswerIds} />
                <Explanation text={result.explanation} />
              </>
              : question.questionTypeId === 3
                ? <Checkbox.Group disabled={busy} value={choices[question.id] || []} className="attempt-options"
                  onChange={(values) => choose(question, values)}
                  options={question.options.map((option, i) => ({ label: `${LETTERS[i] || i + 1}. ${option.content}`, value: option.id }))} />
                : <Radio.Group disabled={busy} value={choices[question.id]?.[0]} className="attempt-options"
                  onChange={(event) => choose(question, [event.target.value])}>
                  <Space orientation="vertical">{question.options.map((option, i) =>
                    <Radio key={option.id} value={option.id}>{LETTERS[i] || i + 1}. {option.content}</Radio>)}</Space>
                </Radio.Group>}
          <div className="attempt-question__footer">
            {!finished && !result && perQuestion
              ? <Button type="primary" ghost icon={<CheckOutlined />} loading={busy}
                disabled={!(choices[question.id] || []).length} onClick={() => check(question)}>Kiểm tra câu này</Button>
              : <span />}
            <Space>
              <Button icon={<LeftOutlined />} disabled={index === 0} onClick={() => go(index - 1)}>Câu trước</Button>
              <Button disabled={index >= items.length - 1} onClick={() => go(index + 1)}>Câu sau <RightOutlined /></Button>
            </Space>
          </div>
        </Card>
      </div>}

      {finished
        ? <div className="attempt-actions">
          <Link to="/student/practice">← Về Luyện tập</Link>
          <Button size="large" type="primary" icon={<RedoOutlined />} loading={busy} onClick={retry}>Làm lại bộ này</Button>
        </div>
        : <div className="attempt-actions">
          <span className={`attempt-save-state ${dirty ? 'is-dirty' : ''}`}>
            {dirty ? <><ClockCircleOutlined /> Có thay đổi chưa lưu (tự lưu sau {AUTOSAVE_MS / 1000} giây)</>
              : <><CheckCircleFilled /> Đã lưu bản nháp</>}
          </span>
          <Space>
            <Button size="large" icon={<SaveOutlined />} onClick={save} loading={busy} disabled={!dirty}>Lưu</Button>
            <Button size="large" type="primary" icon={<SendOutlined />} onClick={() => setConfirmOpen(true)} loading={busy}>Nộp bài</Button>
          </Space>
        </div>}
      <Modal title="Nộp bài luyện tập" open={confirmOpen} okText="Nộp bài" cancelText="Làm tiếp"
        onOk={finish} onCancel={() => setConfirmOpen(false)} okButtonProps={{ loading: busy }}>
        <p>Bạn đã trả lời <strong>{answered}/{items.length}</strong> câu.
          {items.length - answered > 0 && <> Còn <strong>{items.length - answered}</strong> câu chưa trả lời.</>}</p>
        <p>Sau khi nộp sẽ xem được đáp án và lời giải của tất cả các câu.</p>
      </Modal>
    </>}
  </section>
}
