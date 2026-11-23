import test from 'node:test'
import assert from 'node:assert/strict'
import { answerPayload, draftValue, hasAnswer, isShortAnswer, normalizeShortAnswer, shortAnswerFields, shortAnswerProblem,
  shortAnswerRuleText } from '../src/services/shortAnswerView.js'
import { toDraft, toPayload, paletteState } from '../src/services/practiceView.js'
import { reviewQuestionState } from '../src/services/attemptReview.js'
import { questionBody } from '../src/services/questionMetadata.js'

test('normalizeShortAnswer: NFC, khoảng trắng, hoa/thường, bỏ dấu (đ = d)', () => {
  assert.equal(normalizeShortAnswer('  Hà   NỘI '), 'hà nội')
  assert.equal(normalizeShortAnswer('Ha\u0300 No\u0302\u0323i'), 'hà nội')
  assert.equal(normalizeShortAnswer('Đà Nẵng', true), 'da nang')
  assert.equal(normalizeShortAnswer('   '), '')
  assert.equal(normalizeShortAnswer(null), '')
})

test('shortAnswerProblem: số lượng, độ dài, trùng sau chuẩn hóa, sai số', () => {
  assert.equal(shortAnswerProblem({ answers: [{ content: 'Hà Nội' }] }), null)
  assert.match(shortAnswerProblem({ answers: [] }), /1–10/)
  assert.match(shortAnswerProblem({ answers: Array.from({ length: 11 }, (_, i) => ({ content: `a${i}` })) }), /1–10/)
  assert.match(shortAnswerProblem({ answers: [{ content: 'x'.repeat(201) }] }), /1–200/)
  assert.match(shortAnswerProblem({ answers: [{ content: 'Hà Nội' }, { content: 'hà  nội' }] }), /trùng/)
  assert.equal(shortAnswerProblem({ answers: [{ content: 'Hà Nội' }, { content: 'Ha Noi' }] }), null)
  assert.match(shortAnswerProblem({ answers: [{ content: 'Hà Nội' }, { content: 'Ha Noi' }], shortAnswerIgnoreDiacritics: true }), /dấu/)
  assert.match(shortAnswerProblem({ answers: [{ content: '1' }], shortAnswerNumeric: true, shortAnswerTolerance: -1 }), /Sai số/)
  assert.equal(shortAnswerProblem({ answers: [{ content: '1' }], shortAnswerNumeric: true, shortAnswerTolerance: 0.01 }), null)
})

test('shortAnswerFields / questionBody: chỉ loại 4 gửi tùy chọn, mọi đáp án là đáp án chấp nhận', () => {
  assert.deepEqual(shortAnswerFields({ questionTypeId: 2, shortAnswerNumeric: true }),
    { shortAnswerIgnoreDiacritics: null, shortAnswerNumeric: null, shortAnswerTolerance: null })
  assert.deepEqual(shortAnswerFields({ questionTypeId: 4, shortAnswerIgnoreDiacritics: true, shortAnswerTolerance: 5 }),
    { shortAnswerIgnoreDiacritics: true, shortAnswerNumeric: false, shortAnswerTolerance: null })
  const body = questionBody({ questionTypeId: 4, subjectId: 1, content: ' Q ', answers: [{ content: ' 0,5 ', isCorrect: false }],
    shortAnswerNumeric: true, shortAnswerTolerance: 0.01 })
  assert.deepEqual(body.answers, [{ content: '0,5', isCorrect: true }])
  assert.equal(body.shortAnswerTolerance, 0.01)
})

test('draft/payload: loại 4 giữ chuỗi, gửi text; loại khác giữ mảng', () => {
  const qs = [{ id: 'a', questionTypeId: 4 }, { id: 'b', questionTypeId: 2 }, { id: 'c', questionTypeId: 4 }]
  const draft = toDraft([{ questionId: 'a', selectedAnswerIds: [], text: 'Hà Nội' }, { questionId: 'b', selectedAnswerIds: ['x'] },
    { questionId: 'c', selectedAnswerIds: [] }])
  assert.deepEqual(draft, { a: 'Hà Nội', b: ['x'], c: [] })
  assert.deepEqual(toPayload(qs, { a: '  Hà Nội ', b: ['x'], c: '   ' }), [
    { questionId: 'a', selectedAnswerIds: [], text: 'Hà Nội' },
    { questionId: 'b', selectedAnswerIds: ['x'] },
    { questionId: 'c', selectedAnswerIds: [] }])
  assert.equal(answerPayload(qs[0], 'x'.repeat(250)).text.length, 200)
  assert.equal(draftValue(undefined).length, 0)
  assert.equal(hasAnswer('  '), false)
  assert.equal(hasAnswer(' a '), true)
  assert.equal(hasAnswer(['x']), true)
  assert.equal(paletteState('a', { a: '  ' }, {}), 'empty')
  assert.equal(paletteState('a', { a: 'ok' }, {}), 'answered')
  assert.equal(isShortAnswer({ questionTypeId: '4' }), true)
})

test('reviewQuestionState / shortAnswerRuleText', () => {
  assert.equal(reviewQuestionState({ selectedAnswerIds: [], text: 'x' }), 'answered')
  assert.equal(reviewQuestionState({ selectedAnswerIds: [], text: null }), 'empty')
  assert.match(shortAnswerRuleText({ shortAnswerIgnoreDiacritics: true, shortAnswerNumeric: true, shortAnswerTolerance: 0.5 }), /bỏ qua dấu.*±0,5/)
})

test('answersForTypeChange: đổi loại giữ nội dung đáp án (review T16)', async () => {
  const { answersForTypeChange } = await import('../src/services/shortAnswerView.js')
  const choices = [{ content: 'A', isCorrect: true }, { content: 'B', isCorrect: true }, { content: ' ', isCorrect: false }]
  assert.deepEqual(answersForTypeChange(choices, 3, 4), [{ content: 'A', isCorrect: true }, { content: 'B', isCorrect: true }])
  assert.deepEqual(answersForTypeChange([{ content: 'Hà Nội', isCorrect: true }], 4, 2),
    [{ content: 'Hà Nội', isCorrect: false }, { content: '', isCorrect: false }])
  assert.deepEqual(answersForTypeChange([{ content: 'Đúng', isCorrect: true }, { content: 'Sai' }], 1, 4), [{ content: '', isCorrect: true }])
  assert.deepEqual(answersForTypeChange(undefined, undefined, 4), [{ content: '', isCorrect: true }])
  assert.equal(answersForTypeChange(choices, 3, 2), null)   // loại 3 → 2: giữ nguyên, không xóa (lỗi cũ)
  assert.equal(answersForTypeChange(choices, 4, 1), null)   // loại 1 do trang đặt Đúng/Sai
  assert.equal(answersForTypeChange(Array.from({ length: 12 }, (_, i) => ({ content: `a${i}` })), 3, 4).length, 10)
})
