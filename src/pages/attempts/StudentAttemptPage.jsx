import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Alert, Button, Card, Checkbox, Modal, Radio, Space, Tag, Typography } from 'antd'
import {
  ArrowLeftOutlined, CheckCircleFilled, ClockCircleOutlined, EyeOutlined, FlagFilled, FlagOutlined, InfoCircleOutlined,
  LeftOutlined, LockOutlined, ReloadOutlined, RightOutlined, SaveOutlined, SendOutlined,
} from '@ant-design/icons'
import { getApiError } from '../../api/response'
import StatusTag from '../../components/ui/StatusTag'
import { formatDuration, reviewErrorMessage, reviewQuestionState } from '../../services/attemptReview'
import { getAttempt, getAttemptReview, getVisibilityCount, recordVisibilityHidden,
  saveAttempt, submitAttempt } from '../../services/attemptService'
import { getMySchedules } from '../../services/scheduleService'
import { formatClock, formatVnMoment, formatVnSeconds } from '../../utils/duration'

const toDraft = (answers = []) => Object.fromEntries(answers.map((x) => [x.questionId, x.selectedAnswerIds]))
const payload = (questions, choices) => questions.map((q) => ({ questionId: q.id, selectedAnswerIds: choices[q.id] || [] }))
const LETTERS = 'ABCDEFGHIJ'
const AUTOSAVE_MS = 15000
const finishedTitle = { voided: 'Đã hủy', timedOut: 'Đã hết thời gian làm bài', submitted: 'Đã nộp bài' }

/** Đánh dấu câu chỉ lưu ở trình duyệt (sessionStorage), không gửi lên máy chủ. */
function useFlags(id) {
  const key = `attempt-flags:${id}`
  const [flags, setFlags] = useState(() => {
    try { return new Set(JSON.parse(sessionStorage.getItem(key) || '[]')) } catch { return new Set() }
  })
  const toggle = (questionId) => setFlags((old) => {
    const next = new Set(old)
    if (next.has(questionId)) next.delete(questionId); else next.add(questionId)
    sessionStorage.setItem(key, JSON.stringify([...next]))
    return next
  })
  return [flags, toggle]
}

export default function StudentAttemptPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const wantsReview = searchParams.get('review') === '1'
  const [attempt, setAttempt] = useState(null)
  const [schedule, setSchedule] = useState(null)
  const [review, setReview] = useState(null)
  const [reviewIndex, setReviewIndex] = useState(0)
  const [choices, setChoices] = useState({})
  const [dirty, setDirty] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [, setTick] = useState(0)
  const [serverClock, setServerClock] = useState(null)
  const [visibilityCount, setVisibilityCount] = useState(null)
  const [current, setCurrent] = useState(0)
  const [lastSavedAt, setLastSavedAt] = useState(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [guideOpen, setGuideOpen] = useState(false)
  const [flags, toggleFlag] = useFlags(id)
  const saveRef = useRef(null)

  const load = useCallback(async () => {
    setError('')
    try {
      const data = await getAttempt(id)
      setAttempt(data)
      if (data.state !== 'inProgress') sessionStorage.removeItem(`attempt-visibility-pending:${id}`)
      setReview(null)
      setChoices(toDraft(data.savedAnswers))
      setDirty(false)
      setServerClock({ now: Date.parse(data.serverNow), at: performance.now() })
      setVisibilityCount((await getVisibilityCount(id)).count)
      // Thông tin lớp/phòng/giờ kết thúc lấy từ lịch của chính học viên (không bắt buộc).
      getMySchedules().then((rows) => setSchedule(rows.find((row) => row.id === data.scheduleId) || null)).catch(() => {})
    } catch (failure) { setError(getApiError(failure)) }
  }, [id])
  useEffect(() => { load() }, [load])
  useEffect(() => {
    if (attempt?.state !== 'inProgress') return undefined
    const key = `attempt-visibility-pending:${id}`
    let sending = false
    const pendingEvents = () => {
      try { return JSON.parse(sessionStorage.getItem(key) || '[]') }
      catch { return [] }
    }
    async function flush() {
      if (sending) return
      sending = true
      try {
        let pending = pendingEvents()
        while (pending.length > 0) {
          const result = await recordVisibilityHidden(id, pending[0])
          pending = pendingEvents().filter((eventId) => eventId !== pending[0])
          sessionStorage.setItem(key, JSON.stringify(pending))
          setVisibilityCount(result.count)
        }
      } catch { /* Retry on return or reload; a closed attempt rejects late events. */ }
      finally { sending = false }
    }
    function onVisibility() {
      if (document.visibilityState === 'hidden') {
        sessionStorage.setItem(key, JSON.stringify([...pendingEvents(), crypto.randomUUID()]))
        void flush()
      } else void flush()
    }
    document.addEventListener('visibilitychange', onVisibility)
    void flush()
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [id, attempt?.state])
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
      setLastSavedAt(updated.serverNow)
      setServerClock({ now: Date.parse(updated.serverNow), at: performance.now() })
    } catch (failure) { setError(`${getApiError(failure)}. Tải lại để xem bản nháp trên máy chủ trước khi sửa tiếp.`) }
    finally { setBusy(false) }
  }
  saveRef.current = save
  // Tự lưu bản nháp sau mỗi lần thay đổi (15 giây không thao tác thêm).
  useEffect(() => {
    if (!dirty || attempt?.state !== 'inProgress') return undefined
    const timer = window.setTimeout(() => saveRef.current?.(), AUTOSAVE_MS)
    return () => window.clearTimeout(timer)
  }, [dirty, choices, attempt?.state])

  const submit = async () => {
    if (!attempt || busy) return
    setBusy(true); setError(''); setConfirmOpen(false)
    try {
      let latest = attempt
      if (dirty && remaining > 0) latest = await saveAttempt(id, latest.revision, payload(latest.questions, choices))
      const updated = await submitAttempt(id, latest.revision)
      setAttempt(updated); setDirty(false)
      setReview(null)
      sessionStorage.removeItem(`attempt-flags:${id}`)
      setServerClock({ now: Date.parse(updated.serverNow), at: performance.now() })
    } catch (failure) { setError(`${getApiError(failure)}. Tải lại để xác nhận trạng thái trên máy chủ.`) }
    finally { setBusy(false) }
  }
  const choose = (question, values) => {
    setChoices((old) => ({ ...old, [question.id]: values }))
    setDirty(true)
  }
  const loadReview = async () => {
    if (!attempt?.result || busy) return
    setBusy(true); setError('')
    try { setReview(await getAttemptReview(id)); setReviewIndex(0) }
    catch (failure) { setReview(null); setError(reviewErrorMessage(failure)) }
    finally { setBusy(false) }
  }

  // Mở thẳng phần xem lại khi đến từ nút "Xem lại bài" ở trang lịch sử.
  const autoReviewed = useRef(false)
  useEffect(() => {
    if (!wantsReview || autoReviewed.current || !attempt?.result) return
    autoReviewed.current = true
    getAttemptReview(id).then((data) => { setReview(data); setReviewIndex(0) })
      .catch((failure) => setError(reviewErrorMessage(failure)))
  }, [wantsReview, attempt?.result, id])

  const questions = attempt?.questions || []
  const reviewQuestions = review?.questions || []
  const reviewCurrent = Math.min(reviewIndex, Math.max(0, reviewQuestions.length - 1))
  const reviewQuestion = reviewQuestions[reviewCurrent]
  const question = questions[Math.min(current, Math.max(0, questions.length - 1))]
  const answeredCount = questions.filter((q) => (choices[q.id] || []).length > 0).length
  const locked = busy || remaining === 0
  const meta = [
    schedule?.classNames?.length ? `Lớp: ${schedule.classNames.join(', ')}` : null,
    schedule?.roomName ? `Phòng thi: ${schedule.roomName}` : null,
  ].filter(Boolean)

  return <section className="page-body attempt-page">
    <div className="attempt-topbar">
      <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate('/student/schedules')}>Làm bài thi</Button>
      <Space>
        <Button icon={<InfoCircleOutlined />} onClick={() => setGuideOpen(true)}>Hướng dẫn</Button>
        <Button icon={<ReloadOutlined />} onClick={load} disabled={busy}>Tải lại từ máy chủ</Button>
      </Space>
    </div>
    {error && <Alert type="error" showIcon title={error} className="page-alert" />}
    {attempt && <>
      <div className="attempt-head page-card">
        <h2 className="attempt-head__title">{attempt.examName || schedule?.examName || 'Bài thi'}</h2>
        {meta.length > 0 && <div className="attempt-head__meta">{meta.join('  |  ')}</div>}
        {attempt.state === 'inProgress' && <div className={`attempt-clock ${remaining <= 300 ? 'attempt-clock--warn' : ''}`}>
          <div>
            <div className="attempt-clock__label"><ClockCircleOutlined /> Thời gian còn lại (đồng bộ theo máy chủ)</div>
            <div className="attempt-clock__sub">Hạn nộp: {formatVnMoment(attempt.deadline)} (GMT+7 - Việt Nam)</div>
          </div>
          <div className="attempt-clock__value">{formatClock(remaining)}</div>
        </div>}
        <div className="attempt-head__stats">
          {attempt.state === 'inProgress' && <span>Bản nháp #{attempt.revision}{dirty ? ' · chưa lưu' : ' · đã lưu'}</span>}
          <span>Số lần rời tab đã ghi nhận: {visibilityCount ?? 'đang tải'}</span>
        </div>
      </div>

      {attempt.state === 'inProgress' ? <>
        <div className="attempt-layout">
          <aside className="attempt-palette page-card">
            <h3 className="attempt-palette__title">Danh sách câu hỏi <small>({questions.length} câu)</small></h3>
            <div className="attempt-palette__legend">
              <span><i className="dot dot--answered" />Đã trả lời</span>
              <span><i className="dot dot--current" />Đang xem</span>
              <span><i className="dot" />Chưa trả lời</span>
              <span><FlagFilled className="legend-flag" />Đánh dấu</span>
            </div>
            <div className="attempt-palette__grid">{questions.map((item, index) => {
              const answered = (choices[item.id] || []).length > 0
              const classes = ['palette-item', answered && 'is-answered', index === current && 'is-current', flags.has(item.id) && 'is-flagged']
              return <button type="button" key={item.id} className={classes.filter(Boolean).join(' ')}
                aria-label={`Câu ${index + 1}${answered ? ', đã trả lời' : ''}`} onClick={() => setCurrent(index)}>{index + 1}</button>
            })}</div>
            <div className="attempt-palette__summary">Đã trả lời {answeredCount}/{questions.length} câu</div>
          </aside>

          {question && <Card className="attempt-question" id={`question-${question.id}`}
            title={<span>Câu <strong className="attempt-question__no">{current + 1}/{questions.length}</strong>
              {question.questionTypeId === 3 && <Tag className="ml-2" color="blue">Chọn nhiều đáp án</Tag>}</span>}
            extra={<Button type="text" icon={flags.has(question.id) ? <FlagFilled className="legend-flag" /> : <FlagOutlined />}
              onClick={() => toggleFlag(question.id)}>{flags.has(question.id) ? 'Bỏ đánh dấu' : 'Đánh dấu'}</Button>}>
            <Typography.Paragraph className="attempt-question__content">{question.content}</Typography.Paragraph>
            {question.questionTypeId === 3
              ? <Checkbox.Group disabled={locked} value={choices[question.id] || []} className="attempt-options"
                  onChange={(values) => choose(question, values)}
                  options={question.options.map((option, i) => ({ label: `${LETTERS[i] || i + 1}. ${option.content}`, value: option.id }))} />
              : <Radio.Group disabled={locked} value={choices[question.id]?.[0]} className="attempt-options"
                  onChange={(event) => choose(question, [event.target.value])}>
                  <Space orientation="vertical">{question.options.map((option, i) =>
                    <Radio key={option.id} value={option.id}>{LETTERS[i] || i + 1}. {option.content}</Radio>)}</Space>
                </Radio.Group>}
            <div className="attempt-question__footer">
              <Button type="link" disabled={locked || !(choices[question.id] || []).length} onClick={() => choose(question, [])}>Bỏ chọn</Button>
              <Space>
                <Button icon={<LeftOutlined />} disabled={current === 0} onClick={() => setCurrent((x) => x - 1)}>Câu trước</Button>
                <Button disabled={current >= questions.length - 1} onClick={() => setCurrent((x) => x + 1)}>Câu sau <RightOutlined /></Button>
              </Space>
            </div>
          </Card>}
        </div>

        <div className="attempt-actions">
          <span className={`attempt-save-state ${dirty ? 'is-dirty' : ''}`}>
            {dirty ? <><ClockCircleOutlined /> Có thay đổi chưa lưu (tự lưu sau {AUTOSAVE_MS / 1000} giây)</>
              : <><CheckCircleFilled /> Đã lưu bản nháp{lastSavedAt && <small>Lần lưu gần nhất: {formatVnSeconds(lastSavedAt)}</small>}</>}
          </span>
          <Space>
            <Button size="large" icon={<SaveOutlined />} onClick={save} loading={busy} disabled={!dirty || remaining === 0}>Lưu đáp án</Button>
            <Button size="large" type="primary" icon={<SendOutlined />} onClick={() => setConfirmOpen(true)} loading={busy}>Nộp bài</Button>
          </Space>
        </div>
        <Modal title="Xác nhận nộp bài" open={confirmOpen} okText="Nộp bài" cancelText="Làm tiếp"
          onOk={submit} onCancel={() => setConfirmOpen(false)} okButtonProps={{ loading: busy }}>
          <p>Bạn đã trả lời <strong>{answeredCount}/{questions.length}</strong> câu.
            {questions.length - answeredCount > 0 && <> Còn <strong>{questions.length - answeredCount}</strong> câu chưa trả lời.</>}</p>
          {flags.size > 0 && <p>Có {flags.size} câu đang được đánh dấu để xem lại.</p>}
          <p>Sau khi nộp, bạn không thể sửa bài làm.</p>
        </Modal>
      </> : <>
        {attempt.state === 'voided'
          ? <Alert type="warning" showIcon title={finishedTitle.voided} description="Kết quả của lượt thi này đã bị hủy." className="page-alert" />
          // Smoke P1 chờ đúng chữ "Kết quả chưa được phép xem." và tên trạng thái kết thúc
          : !attempt.result && <Alert type="info" showIcon icon={<LockOutlined />} title={finishedTitle[attempt.state] || 'Đã nộp bài'} className="page-alert"
            description="Kết quả chưa được phép xem. Bạn sẽ xem được điểm và đáp án khi giảng viên cho phép xem kết quả." />}
        {attempt.result && <div className="page-card review-summary">
          <div className="review-summary__item">
            {/* Smoke P1 chờ chữ "Điểm:" sau khi nộp bài */}
            <span className="review-summary__label">Điểm:</span>
            <strong className="review-summary__score">{attempt.result.totalMark}</strong>
          </div>
          <div className="review-summary__item">
            <span className="review-summary__label">Kết quả</span>
            <span><StatusTag tone={attempt.result.isPassed ? 'success' : 'danger'}>{attempt.result.isPassed ? 'Đạt' : 'Chưa đạt'}</StatusTag></span>
          </div>
          <div className="review-summary__item">
            <span className="review-summary__label">Thời gian làm bài</span>
            <strong>{formatDuration(attempt.result.timeTakenSeconds)}</strong>
            <small>Nộp lúc: {formatVnMoment(attempt.result.submittedAt)}</small>
          </div>
          <div className="review-summary__item">
            <span className="review-summary__label">{finishedTitle[attempt.state] || 'Đã nộp bài'}</span>
            {review?.reviewedFrom === 'attemptSnapshot' && <>
              <span><StatusTag tone="info">Bài làm là ảnh chụp</StatusTag></span>
              <small>Câu hỏi và đáp án hiển thị theo đúng lúc bạn làm bài.</small>
            </>}
          </div>
        </div>}
        {attempt.result && !review && <div className="my-4"><Button icon={<EyeOutlined />} onClick={loadReview} loading={busy}>Xem lại bài</Button>
          <Typography.Text className="ml-2">Đáp án chỉ được mở sau khi lịch thi kết thúc.</Typography.Text></div>}
        {reviewQuestion && <div className="attempt-layout">
          <aside className="attempt-palette page-card">
            <h3 className="attempt-palette__title">Danh sách câu hỏi <small>({reviewQuestions.length} câu)</small></h3>
            <div className="attempt-palette__legend">
              <span><i className="dot dot--answered" />Đã trả lời</span>
              <span><i className="dot" />Chưa trả lời</span>
              <span><i className="dot dot--current" />Đang xem</span>
            </div>
            <div className="attempt-palette__grid">{reviewQuestions.map((item, index) => {
              const answered = reviewQuestionState(item) === 'answered'
              const classes = ['palette-item', answered && 'is-answered', index === reviewCurrent && 'is-current']
              return <button type="button" key={item.id} className={classes.filter(Boolean).join(' ')}
                aria-label={`Câu ${index + 1}${answered ? ', đã trả lời' : ''}`} onClick={() => setReviewIndex(index)}>{index + 1}</button>
            })}</div>
          </aside>
          <Card className="attempt-question review-question"
            title={<span>Câu <strong className="attempt-question__no">{reviewCurrent + 1}/{reviewQuestions.length}</strong></span>}>
            <Typography.Paragraph className="attempt-question__content">{reviewQuestion.content}</Typography.Paragraph>
            {reviewQuestion.options.map((option, i) => {
              const picked = reviewQuestion.selectedAnswerIds.includes(option.id)
              return <div key={option.id} className={`review-option ${option.isCorrect ? 'is-correct' : ''} ${picked && !option.isCorrect ? 'is-wrong' : ''}`}>
                {LETTERS[i] || i + 1}. {option.content}
                {picked && <Tag color={option.isCorrect ? 'green' : 'red'} className="ml-2">Câu trả lời của bạn</Tag>}
                {option.isCorrect && <Tag color="green" className="ml-2">Đáp án đúng</Tag>}
              </div>
            })}
            {reviewQuestionState(reviewQuestion) === 'empty' && <Typography.Text type="secondary">Bạn chưa trả lời câu này.</Typography.Text>}
            <div className="attempt-question__footer">
              <span />
              <Space>
                <Button icon={<LeftOutlined />} disabled={reviewCurrent === 0} onClick={() => setReviewIndex(reviewCurrent - 1)}>Câu trước</Button>
                <Button type="primary" disabled={reviewCurrent >= reviewQuestions.length - 1}
                  onClick={() => setReviewIndex(reviewCurrent + 1)}>Câu tiếp theo <RightOutlined /></Button>
              </Space>
            </div>
          </Card>
        </div>}
        <div className="attempt-links"><Link to="/student/attempts">Xem lịch sử lượt thi →</Link></div>
      </>}
    </>}
    <Modal title="Hướng dẫn làm bài" open={guideOpen} footer={null} onCancel={() => setGuideOpen(false)}>
      <ul className="attempt-guide">
        <li>Chọn số câu ở bảng bên trái để chuyển nhanh giữa các câu.</li>
        <li>Bài làm được tự lưu sau 15 giây kể từ lần chọn cuối; bạn cũng có thể bấm “Lưu đáp án”.</li>
        <li>“Đánh dấu” chỉ giúp bạn nhớ câu cần xem lại, không ảnh hưởng điểm.</li>
        <li>Đồng hồ chạy theo máy chủ. Hết giờ hệ thống sẽ tự chốt bản nháp đã lưu.</li>
        <li>Mỗi lần rời khỏi tab làm bài đều được ghi nhận.</li>
      </ul>
    </Modal>
  </section>
}
