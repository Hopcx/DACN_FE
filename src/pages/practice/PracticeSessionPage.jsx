import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Alert, Button, Card, Checkbox, Modal, Radio, Space, Switch, Tag, Typography } from 'antd'
import { ArrowLeftOutlined, CheckCircleFilled, CheckOutlined, ClockCircleOutlined, FlagFilled, FlagOutlined, LeftOutlined, RedoOutlined,
  ReloadOutlined, RightOutlined, SaveOutlined, SendOutlined } from '@ant-design/icons'
import StatusTag from '../../components/ui/StatusTag'
import { checkPracticeQuestion, finishPractice, getPractice, getPracticeReview, retryPractice, savePractice } from '../../services/practiceService'
import { KIND_LABELS, MODE_LABELS, paletteState, practiceErrorMessage, remainingSeconds, toCheckedMap, toDraft,
  toPayload } from '../../services/practiceView'
import { formatClock } from '../../utils/duration'
import useReviewFlags from '../../hooks/useReviewFlags'
import { visibleQuestions } from '../../services/reviewFlags'
import QuestionMediaView from '../../components/media/QuestionMediaView'
import { createMediaRetry, mergeMedia } from '../../services/mediaView'
import { hasAnswer, isShortAnswer } from '../../services/shortAnswerView'
import { answeredItems, hasItems, isMatching, isStatements, itemsToMap, mapToItems } from '../../services/itemAnswerView'
import { ItemAnswerInput, ItemAnswerReview } from '../../components/question/ItemAnswer'
import { ShortAnswerInput, ShortAnswerReview } from '../../components/question/ShortAnswer'

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
  // To-be T8: đánh dấu câu lưu ở server (khi làm bài và khi xem lại); xem lại có thể chỉ hiện câu đã đánh dấu
  const [flags, toggleFlag] = useReviewFlags('practice', id, { onError: setError })
  const [onlyFlagged, setOnlyFlagged] = useState(false)
  const saveRef = useRef(null)
  // To-be T9: đồng hồ Thi thử theo máy chủ (giờ máy chủ lúc tải + thời gian đã trôi trên máy học viên)
  const [clock, setClock] = useState(null)
  const [tick, setTick] = useState(0)
  const finishRef = useRef(null)
  const autoFinishRef = useRef(false)

  const load = useCallback(async () => {
    setError('')
    try {
      const data = await getPractice(id)
      setSession(data); setChoices(toDraft(data.answers)); setDirty(false)
      setClock({ serverNow: data.serverNow, at: performance.now() }); setTick(performance.now())
      setReview(data.state === 'finished' ? await getPracticeReview(id) : null)
    } catch (failure) { setError(practiceErrorMessage(failure)) }
  }, [id])
  // To-be T15: URL media hết hạn → lấy URL mới, chỉ thay media (không đụng đáp án đang chọn)
  const refreshMedia = useCallback(async () => {
    try {
      const data = await getPractice(id)
      setSession((prev) => mergeMedia(prev, data.questions))
      if (data.state === 'finished') { const fresh = await getPracticeReview(id); setReview((prev) => mergeMedia(prev, fresh.questions)) }
    } catch { /* giữ nguyên */ }
  }, [id])
  const retryMedia = useMemo(() => createMediaRetry(refreshMedia), [refreshMedia])
  // Đổi phiên (vd. sau "Làm lại bộ này"): xóa trạng thái phiên cũ trước khi tải
  useEffect(() => { setCurrent(0); setSession(null); setReview(null); setChoices({}); setDirty(false); setOnlyFlagged(false); load() }, [load])
  // Rời trang/tải lại khi còn thay đổi chưa lưu: trình duyệt hỏi xác nhận
  useEffect(() => {
    if (!dirty) return undefined
    const warn = (event) => { event.preventDefault(); event.returnValue = '' }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

  // Trạng thái trên máy chủ đã khác (revision, câu đã chốt, phiên đã nộp ở tab khác): tải lại để không ghi đè
  const RELOAD_CODES = ['CONCURRENCY_CONFLICT', 'PRACTICE_QUESTION_LOCKED', 'PRACTICE_CLOSED', 'PRACTICE_EXPIRED']
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
    // To-be T16: câu điền ngắn gửi text, không chọn đáp án
    const shortAnswer = isShortAnswer(question)
    const itemized = hasItems(question)   // To-be T17: ghép cặp / nhiều mệnh đề gửi items
    const selected = choices[question.id] || (shortAnswer ? '' : itemized ? {} : [])
    if (!hasAnswer(selected)) { setError(shortAnswer ? 'Hãy nhập câu trả lời trước khi kiểm tra.' : 'Hãy chọn đáp án trước khi kiểm tra.'); return }
    // Review T17: kiểm tra khi còn mục trống sẽ hiện đáp án và khóa câu — hỏi lại trước
    const total = question.options?.length || 0
    if (itemized && answeredItems(selected) < total) {
      const go = await new Promise((resolve) => Modal.confirm({
        title: 'Còn mục chưa chọn',
        content: `Bạn mới chọn ${answeredItems(selected)}/${total} mục. Kiểm tra bây giờ sẽ hiện đáp án và khóa câu này; mục chưa chọn tính là sai.`,
        okText: 'Vẫn kiểm tra', cancelText: 'Chọn tiếp', onOk: () => resolve(true), onCancel: () => resolve(false),
      }))
      if (!go) return
    }
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
      const outcome = shortAnswer
        ? await checkPracticeQuestion(id, question.id, base.revision, [], selected.trim())
        : itemized ? await checkPracticeQuestion(id, question.id, base.revision, [], undefined, mapToItems(question, selected))
        : await checkPracticeQuestion(id, question.id, base.revision, selected)
      const answers = [...base.answers.filter((x) => x.questionId !== question.id),
        shortAnswer ? { questionId: question.id, selectedAnswerIds: [], text: outcome.result.text }
          : itemized ? { questionId: question.id, selectedAnswerIds: [], items: outcome.result.items }
          : { questionId: question.id, selectedAnswerIds: outcome.result.selectedAnswerIds }]
      setSession({ ...base, revision: outcome.revision, answers,
        checked: [...(base.checked || []).filter((x) => x.questionId !== question.id), outcome.result] })
      setChoices((old) => ({ ...old, [question.id]: shortAnswer ? outcome.result.text ?? ''
        : itemized ? itemsToMap(outcome.result.items) : outcome.result.selectedAnswerIds }))
      setDirty(false)
      // Revision nhảy khác +1: câu đã được chốt ở tab khác (kết quả cũ) hoặc có ghi khác → lấy lại trạng thái máy chủ
      if (outcome.revision !== base.revision + 1) await load()
    } catch (failure) { await fail(failure) }
    finally { setBusy(false) }
  }

  const finish = async () => {
    if (busy) return false
    setConfirmOpen(false)
    const latest = dirty ? await save() : session
    if (!latest) return true
    setBusy(true)
    try {
      await finishPractice(id, latest.revision)
      await load()
    } catch (failure) { await fail(failure) }
    finally { setBusy(false) }
    return true
  }
  finishRef.current = finish
  const loadRef = useRef(load)
  useEffect(() => { loadRef.current = load }, [load])

  // To-be T9: Thi thử — chạy đồng hồ, hết giờ thì tự nộp với lựa chọn hiện tại (máy chủ còn cho trễ 5 giây)
  const isMockOpen = session?.kind === 'mock' && session?.state === 'inProgress'
  const remaining = isMockOpen && clock ? remainingSeconds(session.deadlineUtc, clock.serverNow, Math.max(0, tick - clock.at)) : null
  const timeUp = remaining === 0
  useEffect(() => {
    if (!isMockOpen) return undefined
    const timer = window.setInterval(() => setTick(performance.now()), 1000)
    return () => window.clearInterval(timer)
  }, [isMockOpen])
  useEffect(() => { autoFinishRef.current = false }, [id])
  useEffect(() => {
    if (remaining !== 0 || busy || autoFinishRef.current) return
    autoFinishRef.current = true
    // Nộp lỗi (mạng/409) hoặc đang bận: sau ân hạn 5 giây tải lại từ máy chủ — GET tự chốt bài quá hạn
    void finishRef.current?.().finally(() => window.setTimeout(() => loadRef.current?.(), 6000))
  }, [remaining, busy])

  const retry = async () => {
    setBusy(true); setError('')
    try { const created = await retryPractice(id); navigate(`/student/practice/${created.id}`) }
    catch (failure) { setError(practiceErrorMessage(failure)) }
    finally { setBusy(false) }
  }

  const choose = (question, values) => { setChoices((old) => ({ ...old, [question.id]: values })); setDirty(true) }

  const finished = session?.state === 'finished'
  const allItems = finished ? review?.questions || [] : session?.questions || []
  // Danh sách hiển thị (kèm số gốc); lọc "Chỉ câu đã đánh dấu" chỉ áp khi xem lại
  const items = visibleQuestions(allItems, flags, finished && onlyFlagged)
  const index = Math.min(current, Math.max(0, items.length - 1))
  const checkedMap = toCheckedMap(session?.checked)
  const reviewMap = Object.fromEntries((review?.questions || []).map((x) => [x.id, { isCorrect: x.isCorrect }]))
  const number = items[index]?.number
  const question = items[index]?.question
  const answered = (session?.questions || []).filter((q) => hasAnswer(choices[q.id])).length
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
        <h2 className="attempt-head__title">{KIND_LABELS[session.kind] || 'Luyện tập'}: {session.subjectName || 'Môn học'}</h2>
        <div className="attempt-head__meta">
          {session.kind === 'mock'
            ? <>Thời lượng: {session.durationMinutes} phút  |  {session.questionCount} câu  |  Không tính điểm lớp</>
            : <>Chế độ hiện đáp án: {MODE_LABELS[session.revealMode] || session.revealMode}  |  {session.questionCount} câu</>}
        </div>
        {remaining != null && <div className={`attempt-clock ${remaining <= 300 ? 'attempt-clock--warn' : ''}`}>
          <div>
            <div className="attempt-clock__label"><ClockCircleOutlined /> Thời gian còn lại (đồng bộ theo máy chủ)</div>
            <div className="attempt-clock__sub">Hết giờ bài tự nộp theo đáp án đã lưu.</div>
          </div>
          <div className="attempt-clock__value" aria-label="Thời gian còn lại">{formatClock(remaining)}</div>
        </div>}
        <div className="attempt-head__stats">
          {finished
            ? <span>Kết quả: <strong className="practice-score">{session.correctCount}/{session.questionCount}</strong> câu đúng</span>
            : <span>Bản nháp #{session.revision}{dirty ? ' · chưa lưu' : ' · đã lưu'}</span>}
          <StatusTag tone={finished ? 'success' : timeUp ? 'warning' : 'info'}>{finished ? 'Đã nộp' : timeUp ? 'Hết giờ' : 'Đang làm'}</StatusTag>
        </div>
      </div>

      {allItems.length > 0 && <div className="attempt-layout">
        <aside className="attempt-palette page-card">
          <h3 className="attempt-palette__title">Danh sách câu hỏi <small>({allItems.length} câu)</small></h3>
          <div className="attempt-palette__legend">
            {(perQuestion || finished) && <><span><i className="dot dot--right" />Đúng</span><span><i className="dot dot--wrong" />Sai</span></>}
            {!finished && <span><i className="dot dot--pending" />Đã trả lời</span>}
            <span><i className="dot" />Chưa trả lời</span>
            <span><FlagFilled className="legend-flag" />Đánh dấu</span>
          </div>
          {finished && <label className="review-flag-filter">
            <Switch size="small" checked={onlyFlagged} aria-label="Chỉ câu đã đánh dấu"
              onChange={(value) => { setOnlyFlagged(value); setCurrent(0) }} /> Chỉ câu đã đánh dấu ({flags.size})
          </label>}
          <div className="attempt-palette__grid">{items.map(({ question: item, number: no }, i) => {
            const state = finished
              ? (reviewMap[item.id]?.isCorrect ? 'right' : (item.selectedAnswerIds?.length || item.text?.trim() || item.items?.length) ? 'wrong' : 'empty')
              : paletteState(item.id, choices, checkedMap)
            const classes = ['palette-item', state === 'answered' && 'is-pending', state === 'right' && 'is-right',
              state === 'wrong' && 'is-wrong', i === index && 'is-current', flags.has(item.id) && 'is-flagged']
            return <button type="button" key={item.id} className={classes.filter(Boolean).join(' ')}
              aria-label={`Câu ${no}`} onClick={() => go(i)}>{no}</button>
          })}</div>
          {finished && onlyFlagged && items.length === 0 && <Typography.Text type="secondary">Chưa đánh dấu câu nào.</Typography.Text>}
          {!finished && <div className="attempt-palette__summary">Đã trả lời {answered}/{allItems.length} câu</div>}
        </aside>

        {question && <Card className={`attempt-question ${finished || result ? 'review-question' : ''}`}
          extra={<Button type="text" icon={flags.has(question.id) ? <FlagFilled className="legend-flag" /> : <FlagOutlined />}
            onClick={() => toggleFlag(question.id)}>{flags.has(question.id) ? 'Bỏ đánh dấu' : 'Đánh dấu'}</Button>}
          title={<span>Câu <strong className="attempt-question__no">{number}/{allItems.length}</strong>
            {question.questionTypeId === 3 && <Tag className="ml-2" color="blue">Chọn nhiều đáp án</Tag>}
            {isShortAnswer(question) && <Tag className="ml-2" color="purple">Điền ngắn</Tag>}
            {isMatching(question) && <Tag className="ml-2" color="geekblue">Ghép cặp</Tag>}
            {isStatements(question) && <Tag className="ml-2" color="cyan">Đúng/Sai từng mệnh đề</Tag>}
            {(result || finished) && <Tag className="ml-2" color={(result || reviewMap[question.id])?.isCorrect ? 'green' : 'red'}>
              {(result || reviewMap[question.id])?.isCorrect ? 'Đúng' : 'Sai'}</Tag>}</span>}>
          <Typography.Paragraph className="attempt-question__content">{question.content}</Typography.Paragraph>
          <QuestionMediaView media={question.media} onMediaError={retryMedia} />
          {finished && isShortAnswer(question)
            ? <>
              <ShortAnswerReview text={question.text} isCorrect={question.isCorrect} acceptedAnswers={question.acceptedAnswers} />
              <Explanation text={question.explanation} />
            </>
            : finished && hasItems(question)
            ? <>
              <ItemAnswerReview question={question} items={question.items} correctItems={question.correctItems} />
              <Explanation text={question.explanation} />
            </>
            : finished
            ? <>
              <RevealedOptions options={question.options} selected={question.selectedAnswerIds}
                correctIds={question.options.filter((x) => x.isCorrect).map((x) => x.id)} />
              {!question.selectedAnswerIds.length && <Typography.Text type="secondary">Bạn chưa trả lời câu này.</Typography.Text>}
              <Explanation text={question.explanation} />
            </>
            : result && isShortAnswer(question)
              ? <>
                <ShortAnswerReview text={result.text} isCorrect={result.isCorrect} acceptedAnswers={result.acceptedAnswers} />
                <Explanation text={result.explanation} />
              </>
            : result && hasItems(question)
              ? <>
                <ItemAnswerReview question={question} items={result.items} correctItems={result.correctItems} />
                <Explanation text={result.explanation} />
              </>
            : result
              ? <>
                <RevealedOptions options={question.options} selected={result.selectedAnswerIds} correctIds={result.correctAnswerIds} />
                <Explanation text={result.explanation} />
              </>
              : hasItems(question)
                ? <ItemAnswerInput question={question} disabled={busy || timeUp} value={choices[question.id]} onChange={(next) => choose(question, next)} />
              : isShortAnswer(question)
                ? <ShortAnswerInput disabled={busy || timeUp} value={choices[question.id]} onChange={(text) => choose(question, text)} />
              : question.questionTypeId === 3
                ? <Checkbox.Group disabled={busy || timeUp} value={choices[question.id] || []} className="attempt-options"
                  onChange={(values) => choose(question, values)}
                  options={question.options.map((option, i) => ({ label: `${LETTERS[i] || i + 1}. ${option.content}`, value: option.id }))} />
                : <Radio.Group disabled={busy || timeUp} value={choices[question.id]?.[0]} className="attempt-options"
                  onChange={(event) => choose(question, [event.target.value])}>
                  <Space orientation="vertical">{question.options.map((option, i) =>
                    <Radio key={option.id} value={option.id}>{LETTERS[i] || i + 1}. {option.content}</Radio>)}</Space>
                </Radio.Group>}
          <div className="attempt-question__footer">
            {!finished && !result && perQuestion
              ? <Button type="primary" ghost icon={<CheckOutlined />} loading={busy}
                disabled={!hasAnswer(choices[question.id])} onClick={() => check(question)}>Kiểm tra câu này</Button>
              : <span />}
            <Space>
              <Button icon={<LeftOutlined />} disabled={index === 0} onClick={() => go(index - 1)}>Câu trước</Button>
              <Button disabled={index >= items.length - 1} onClick={() => go(index + 1)}>Câu sau <RightOutlined /></Button>
            </Space>
          </div>
        </Card>}
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
      <Modal title={session.kind === 'mock' ? 'Nộp bài thi thử' : 'Nộp bài luyện tập'} open={confirmOpen} okText="Nộp bài" cancelText="Làm tiếp"
        onOk={finish} onCancel={() => setConfirmOpen(false)} okButtonProps={{ loading: busy }}>
        <p>Bạn đã trả lời <strong>{answered}/{allItems.length}</strong> câu.
          {allItems.length - answered > 0 && <> Còn <strong>{allItems.length - answered}</strong> câu chưa trả lời.</>}</p>
        <p>Sau khi nộp sẽ xem được đáp án và lời giải của tất cả các câu.</p>
      </Modal>
    </>}
  </section>
}
