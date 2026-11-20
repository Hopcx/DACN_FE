import test from 'node:test'
import assert from 'node:assert/strict'
import { formatScore, groupView, myRankText, notCountedLabel, rankingErrorMessage, rankingRule } from '../src/services/classRanking.js'

test('formatScore uses Vietnamese decimals and dashes for missing', () => {
  assert.equal(formatScore(8.75), '8,75')
  assert.equal(formatScore(9), '9')
  assert.equal(formatScore(0), '0')
  assert.equal(formatScore(null), '—')
  assert.equal(formatScore(undefined), '—')
  assert.equal(formatScore('abc'), '—')
})

test('groupView maps top/bottom only', () => {
  assert.deepEqual(groupView('top'), { label: 'Top', tone: 'success' })
  assert.deepEqual(groupView('bottom'), { label: 'Bottom', tone: 'danger' })
  assert.equal(groupView(null), null)
  assert.equal(groupView('other'), null)
})

test('notCountedLabel explains each reason', () => {
  assert.equal(notCountedLabel('notEnded'), 'Chưa kết thúc')
  assert.equal(notCountedLabel('resultNotReleased'), 'Chưa cho xem kết quả')
  assert.equal(notCountedLabel('x'), 'Không tính')
})

test('myRankText covers rank, small class and no score', () => {
  assert.equal(myRankText({ rank: 2, scoredCount: 6, total: 8 }), 'Hạng 2 / 6 học viên có điểm')
  assert.match(myRankText({ rank: null, scoredCount: 4, total: 8, minScoredForRanking: 5, rankHiddenReason: 'CLASS_TOO_SMALL' }), /chưa đủ 5 .*hiện có 4/)
  assert.match(myRankText({ rank: null, scoredCount: 6, total: null, rankHiddenReason: 'NO_SCORE' }), /chưa có điểm/)
  assert.equal(myRankText(null), '')
})

test('rankingRule states the counted schedule count', () => {
  assert.match(rankingRule({ schedules: [{}, {}] }), /trung bình 2 lịch/)
  assert.match(rankingRule(null), /trung bình 0 lịch/)
})

test('rankingErrorMessage maps ranking codes, else fallback', () => {
  const error = (message) => ({ response: { data: { message } } })
  assert.match(rankingErrorMessage(error('CLASS_TOO_LARGE'), 'x'), /500 học viên/)
  assert.match(rankingErrorMessage(error('CLASS_NOT_FOUND'), 'x'), /không còn là thành viên/)
  assert.equal(rankingErrorMessage(error('OTHER'), 'fallback'), 'fallback')
  assert.equal(rankingErrorMessage(null, 'fallback'), 'fallback')
})

test('rankingRule explains boundary ties', () => {
  assert.match(rankingRule({ schedules: [] }), /đồng điểm ở ranh giới vào cùng nhóm/)
})
