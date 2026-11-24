import test from 'node:test'
import assert from 'node:assert/strict'
import { answeredItems, chooseMatch, hasItems, itemsProblem, itemsToMap, mapToItems, reviewRows } from '../src/services/itemAnswerView.js'
import { answerPayload, answersForTypeChange, draftValue, hasAnswer } from '../src/services/shortAnswerView.js'
import { toDraft, toPayload, paletteState } from '../src/services/practiceView.js'
import { reviewQuestionState } from '../src/services/attemptReview.js'
import { questionBody } from '../src/services/questionMetadata.js'

const matching = { id: 'q5', questionTypeId: 5, options: [{ id: 'a', content: 'Hà Nội' }, { id: 'b', content: 'Tokyo' }],
  matches: [{ id: 'm2', content: 'Nhật Bản' }, { id: 'm1', content: 'Việt Nam' }] }
const statements = { id: 'q6', questionTypeId: 6, options: [{ id: 's1', content: 'P' }, { id: 's2', content: 'Q' }] }

test('itemsProblem: ghép cặp và nhiều mệnh đề (khớp BE)', () => {
  assert.equal(itemsProblem(5, [{ content: 'A', matchContent: '1' }, { content: 'B', matchContent: '2' }]), null)
  assert.match(itemsProblem(5, [{ content: 'A', matchContent: '1' }]), /2–10 cặp/)
  assert.match(itemsProblem(5, [{ content: 'A', matchContent: '1' }, { content: ' a ', matchContent: '2' }]), /Vế trái/)
  assert.match(itemsProblem(5, [{ content: 'A', matchContent: '1' }, { content: 'B', matchContent: ' 1' }]), /Vế phải của các cặp/)
  assert.match(itemsProblem(5, [{ content: 'A', matchContent: '1' }, { content: 'B', matchContent: '' }]), /vế phải từ 1/)
  assert.equal(itemsProblem(6, [{ content: 'P', isCorrect: false }, { content: 'Q', isCorrect: false }]), null)
  assert.match(itemsProblem(6, [{ content: 'P' }, { content: 'p' }]), /mệnh đề không được trùng/)
  assert.match(itemsProblem(6, Array.from({ length: 11 }, (_, i) => ({ content: `m${i}` }))), /2–10 mệnh đề/)
})

test('chooseMatch: mỗi vế phải chỉ dùng một lần; bỏ chọn xóa mục', () => {
  let v = chooseMatch({}, 'a', 'm1')
  v = chooseMatch(v, 'b', 'm1')
  assert.deepEqual(v, { b: 'm1' })
  v = chooseMatch(v, 'a', 'm2')
  assert.deepEqual(v, { b: 'm1', a: 'm2' })
  assert.deepEqual(chooseMatch(v, 'a', undefined), { b: 'm1' })
  assert.equal(answeredItems(v), 2)
})

test('draft/payload loại 5–6: map ↔ items, rỗng không gửi', () => {
  const draft = toDraft([{ questionId: 'q5', selectedAnswerIds: [], items: [{ optionId: 'a', matchId: 'm1' }] },
    { questionId: 'q6', selectedAnswerIds: [], items: [{ optionId: 's1', value: false }] }, { questionId: 'q7', selectedAnswerIds: [] }])
  assert.deepEqual(draft, { q5: { a: 'm1' }, q6: { s1: false }, q7: [] })
  assert.deepEqual(toPayload([matching, statements], { q5: { a: 'm1', zz: 'm2' }, q6: {} }), [
    { questionId: 'q5', selectedAnswerIds: [], items: [{ optionId: 'a', matchId: 'm1' }] },
    { questionId: 'q6', selectedAnswerIds: [] }])
  assert.deepEqual(mapToItems(statements, { s1: true, s2: false }), [{ optionId: 's1', value: true }, { optionId: 's2', value: false }])
  assert.deepEqual(answerPayload(statements, { s2: false }).items, [{ optionId: 's2', value: false }])
  assert.equal(hasAnswer({ s1: false }), true)
  assert.equal(hasAnswer({}), false)
  assert.deepEqual(draftValue({ items: [] }), {})
  assert.equal(paletteState('q6', { q6: { s1: true } }, {}), 'answered')
  assert.equal(hasItems(matching) && hasItems(statements) && !hasItems({ questionTypeId: 4 }), true)
  assert.deepEqual(itemsToMap(null), {})
})

test('reviewRows: câu trả lời, đáp án đúng, đúng/sai từng mục', () => {
  const rows = reviewRows(matching, [{ optionId: 'a', matchId: 'm1' }, { optionId: 'b', matchId: 'm1' }],
    [{ optionId: 'a', matchId: 'm1' }, { optionId: 'b', matchId: 'm2' }])
  assert.deepEqual(rows.map((r) => [r.given, r.expected, r.correct]), [['Việt Nam', 'Việt Nam', true], ['Việt Nam', 'Nhật Bản', false]])
  const st = reviewRows(statements, [{ optionId: 's1', value: false }], [{ optionId: 's1', value: false }, { optionId: 's2', value: true }])
  assert.deepEqual(st.map((r) => [r.given, r.expected, r.correct]), [['Sai', 'Sai', true], [null, 'Đúng', false]])
  assert.equal(reviewQuestionState({ selectedAnswerIds: [], items: [{ optionId: 's1', value: true }] }), 'answered')
})

test('trình soạn: đổi loại giữ nội dung; questionBody gửi matchContent cho loại 5', () => {
  assert.deepEqual(answersForTypeChange([{ content: 'A', isCorrect: true }, { content: 'B' }], 3, 5),
    [{ content: 'A', matchContent: '', isCorrect: true }, { content: 'B', matchContent: '', isCorrect: true }])
  assert.deepEqual(answersForTypeChange([{ content: 'A', matchContent: '1' }], 5, 6),
    [{ content: 'A', isCorrect: false }, { content: '', isCorrect: false }])
  assert.deepEqual(answersForTypeChange([{ content: 'P', isCorrect: true }, { content: 'Q', isCorrect: false }], 6, 3),
    [{ content: 'P', isCorrect: false }, { content: 'Q', isCorrect: false }])
  assert.equal(answersForTypeChange([{ content: 'A' }], 5, 5), null)
  const body = questionBody({ questionTypeId: 5, subjectId: 1, content: 'Q', answers: [{ content: ' A ', matchContent: ' 1 ', isCorrect: false }] })
  assert.deepEqual(body.answers, [{ content: 'A', isCorrect: true, matchContent: '1' }])
  const st = questionBody({ questionTypeId: 6, subjectId: 1, content: 'Q', answers: [{ content: 'P', isCorrect: false, matchContent: 'x' }] })
  assert.deepEqual(st.answers, [{ content: 'P', isCorrect: false }])
})
