import test from 'node:test'
import assert from 'node:assert/strict'
import { buildCreateBody, maxSelectable, paletteState, practiceErrorMessage, resultLabel, toCheckedMap,
  toDraft, toPayload } from '../src/services/practiceView.js'

const error = (status, data) => ({ response: { status, data } })

test('practiceErrorMessage maps practice codes and not-enough details', () => {
  assert.match(practiceErrorMessage(error(409, { message: 'PRACTICE_NOT_ENOUGH_QUESTIONS', data: { available: 3, requested: 10 } })), /Chỉ có 3 câu.*10 câu/)
  assert.match(practiceErrorMessage(error(409, { message: 'PRACTICE_NOT_ENOUGH_QUESTIONS', data: { available: 0, requested: 2 } })), /Không còn câu/)
  assert.match(practiceErrorMessage(error(409, { message: 'PRACTICE_TOO_MANY_OPEN' })), /3 phiên chưa nộp/)
  assert.match(practiceErrorMessage(error(409, { message: 'PRACTICE_HAS_CHECKED' })), /không bỏ được/)
  assert.equal(practiceErrorMessage(error(400, { message: 'Số câu phải từ 1 đến 50.' })), 'Số câu phải từ 1 đến 50.')
})

test('buildCreateBody normalizes ids, count and mode', () => {
  assert.deepEqual(buildCreateBody({ subjectId: '3', chapterIds: [2, '2', 0, 5], tagIds: undefined, questionCount: '7', revealMode: 'x' }),
    { subjectId: 3, chapterIds: [2, 5], questionLevelIds: [], tagIds: [], questionCount: 7, revealMode: 'end', kind: 'practice' })
  assert.equal(buildCreateBody({ subjectId: 1, questionCount: 1, revealMode: 'perQuestion' }).revealMode, 'perQuestion')
})

test('maxSelectable is the smallest group sum, capped by subject and 50', () => {
  const subject = { questionCount: 80, chapters: [{ id: 1, questionCount: 6 }, { id: 2, questionCount: 9 }],
    levels: [{ id: 1, questionCount: 40 }], tags: [{ id: 7, questionCount: 3 }] }
  assert.equal(maxSelectable(subject, {}), 50)
  assert.equal(maxSelectable({ ...subject, questionCount: 12 }, {}), 12)
  assert.equal(maxSelectable(subject, { chapterIds: [1, 2] }), 15)
  assert.equal(maxSelectable(subject, { chapterIds: [1, 2], tagIds: [7] }), 3)
  assert.equal(maxSelectable(null, {}), 0)
})

test('draft/payload helpers, palette state, result label', () => {
  const questions = [{ id: 'a' }, { id: 'b' }, { id: 'c' }]
  const choices = toDraft([{ questionId: 'a', selectedAnswerIds: ['x'] }, { questionId: 'b', selectedAnswerIds: [] }])
  assert.deepEqual(toPayload(questions, choices).map((x) => x.selectedAnswerIds.length), [1, 0, 0])
  const checked = toCheckedMap([{ questionId: 'a', isCorrect: true }, { questionId: 'c', isCorrect: false }])
  assert.deepEqual(questions.map((q) => paletteState(q.id, choices, checked)), ['right', 'empty', 'wrong'])
  assert.equal(paletteState('b', { b: ['y'] }, {}), 'answered')
  assert.equal(resultLabel({ state: 'finished', correctCount: 4, questionCount: 5 }), '4/5')
  assert.equal(resultLabel({ state: 'inProgress', correctCount: null, questionCount: 5 }), '—')
})

test('asUtc adds Z only when the timestamp has no offset', async () => {
  const { asUtc } = await import('../src/services/practiceView.js')
  assert.equal(asUtc('2026-11-18T07:05:00.123'), '2026-11-18T07:05:00.123Z')
  assert.equal(asUtc('2026-11-18T07:05:00Z'), '2026-11-18T07:05:00Z')
  assert.equal(asUtc('2026-11-18T14:05:00+07:00'), '2026-11-18T14:05:00+07:00')
  assert.equal(asUtc(null), null)
})

test('mock exam helpers: create body, suggested duration, remaining seconds', async () => {
  const { buildCreateBody, remainingSeconds, suggestedMinutes } = await import('../src/services/practiceView.js')
  const mock = buildCreateBody({ subjectId: 1, questionCount: 10, kind: 'mock', durationMinutes: '15', revealMode: 'perQuestion' })
  assert.equal(mock.kind, 'mock'); assert.equal(mock.durationMinutes, 15); assert.equal(mock.revealMode, 'end')
  const practice = buildCreateBody({ subjectId: 1, questionCount: 10, revealMode: 'perQuestion', durationMinutes: 15 })
  assert.equal(practice.kind, 'practice'); assert.equal('durationMinutes' in practice, false); assert.equal(practice.revealMode, 'perQuestion')
  assert.deepEqual([1, 7, 10, 50, 200].map(suggestedMinutes), [5, 15, 15, 75, 180])
  assert.equal(remainingSeconds('2026-11-19T01:10:00Z', '2026-11-19T01:00:00Z', 1500), 599)
  assert.equal(remainingSeconds('2026-11-19T01:00:00Z', '2026-11-19T01:00:10Z', 0), 0)
  assert.equal(remainingSeconds(null, '2026-11-19T01:00:00Z', 0), null)
})
