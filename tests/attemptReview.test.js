import test from 'node:test'
import assert from 'node:assert/strict'
import { formatDuration, reviewErrorMessage, reviewQuestionState, voidErrorMessage } from '../src/services/attemptReview.js'
import { getApiError } from '../src/api/response.js'

const failure = (status, message) => ({ response: { status, data: { success: false, message } } })

test('maps the four review error codes to Vietnamese messages', () => {
  assert.equal(reviewErrorMessage(failure(403, 'ATTEMPT_VOIDED')), 'Kết quả của lượt thi này đã bị hủy.')
  assert.equal(reviewErrorMessage(failure(409, 'ATTEMPT_NOT_FINALIZED')), 'Lượt thi chưa kết thúc nên chưa thể xem lại.')
  assert.equal(reviewErrorMessage(failure(403, 'RESULT_NOT_RELEASED')), 'Giảng viên chưa cho phép xem kết quả bài thi này.')
  assert.equal(reviewErrorMessage(failure(403, 'REVIEW_NOT_RELEASED')), 'Đáp án chỉ được mở sau khi lịch thi kết thúc.')
})

test('falls back to getApiError for other errors', () => {
  const other = failure(404, 'ATTEMPT_NOT_FOUND')
  assert.equal(reviewErrorMessage(other), getApiError(other))
  const network = { code: 'ERR_NETWORK' }
  assert.equal(reviewErrorMessage(network), getApiError(network))
  assert.equal(reviewErrorMessage(undefined), getApiError(undefined))
})

test('formatDuration renders minutes and seconds', () => {
  assert.equal(formatDuration(5280), '88 phút')
  assert.equal(formatDuration(65), '1 phút 5 giây')
  assert.equal(formatDuration(45), '45 giây')
  assert.equal(formatDuration(0), '0 giây')
  assert.equal(formatDuration(59.6), '1 phút')
})

test('formatDuration rejects missing, negative and non-numeric input', () => {
  for (const value of [null, undefined, -1, 'x', '', NaN, true]) assert.equal(formatDuration(value), '—')
})

test('reviewQuestionState reads selectedAnswerIds', () => {
  assert.equal(reviewQuestionState({ selectedAnswerIds: ['a'] }), 'answered')
  assert.equal(reviewQuestionState({ selectedAnswerIds: [] }), 'empty')
  assert.equal(reviewQuestionState({}), 'empty')
  assert.equal(reviewQuestionState(null), 'empty')
})

test('maps the four void error codes to Vietnamese messages', () => {
  assert.equal(voidErrorMessage(failure(400, 'VOID_REASON_REQUIRED')), 'Nhập lý do hủy kết quả (tối đa 1000 ký tự).')
  assert.equal(voidErrorMessage(failure(404, 'ATTEMPT_NOT_FOUND')), 'Không tìm thấy lượt thi.')
  assert.equal(voidErrorMessage(failure(409, 'ATTEMPT_ALREADY_VOIDED')), 'Lượt thi này đã bị hủy trước đó.')
  assert.equal(voidErrorMessage(failure(409, 'ATTEMPT_NOT_FINALIZED')), 'Lượt thi chưa kết thúc nên chưa thể hủy kết quả.')
})

test('void errors fall back to getApiError for other codes', () => {
  const other = failure(500, 'SOMETHING_ELSE')
  assert.equal(voidErrorMessage(other), getApiError(other))
  assert.equal(voidErrorMessage(undefined), getApiError(undefined))
})
