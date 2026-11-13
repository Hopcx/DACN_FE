import test from 'node:test'
import assert from 'node:assert/strict'
import { visibleExams } from '../src/services/examList.js'

test('removes deleted exams (status 255)', () => {
  const result = visibleExams([{ id: 1, name: 'A', status: 255 }, { id: 2, name: 'B', status: 1 }])
  assert.deepEqual(result.map((item) => item.id), [2])
})

test('sorts by id descending including numeric strings', () => {
  const result = visibleExams([{ id: 2, name: 'a' }, { id: '10', name: 'b' }, { id: 5, name: 'c' }])
  assert.deepEqual(result.map((item) => Number(item.id)), [10, 5, 2])
})

test('keyword matches case-insensitively with Vietnamese letters', () => {
  const result = visibleExams([{ id: 1, name: 'Đề thi giữa kỳ' }, { id: 2, name: 'Khác' }], 'ĐỀ THI')
  assert.deepEqual(result.map((item) => item.id), [1])
})

test('blank or undefined keyword returns everything except deleted', () => {
  const exams = [{ id: 1, name: 'A' }, { id: 2, name: 'B', status: 255 }, { id: 3, name: 'C' }]
  assert.equal(visibleExams(exams, '   ').length, 2)
  assert.equal(visibleExams(exams, undefined).length, 2)
})

test('null input returns empty array', () => {
  assert.deepEqual(visibleExams(null, 'x'), [])
  assert.deepEqual(visibleExams(undefined), [])
})

test('exam with null name does not throw', () => {
  assert.doesNotThrow(() => visibleExams([{ id: 1, name: null }], 'abc'))
  assert.equal(visibleExams([{ id: 1, name: null }], 'abc').length, 0)
})

test('does not mutate the input array order', () => {
  const exams = [{ id: 1, name: 'a' }, { id: 3, name: 'b' }, { id: 2, name: 'c' }]
  visibleExams(exams)
  assert.deepEqual(exams.map((item) => item.id), [1, 3, 2])
})

test('keyword is trimmed and matches in the middle of the name', () => {
  const exams = [{ id: 1, name: 'Kiểm tra giữa kỳ Toán' }, { id: 2, name: 'Cuối kỳ' }]
  assert.deepEqual(visibleExams(exams, '  giữa kỳ  ').map((item) => item.id), [1])
})

test('keyword does not strip diacritics (plan: no accent folding)', () => {
  assert.equal(visibleExams([{ id: 1, name: 'Đề thi' }], 'de thi').length, 0)
})

test('keyword with no match returns empty array (failure path)', () => {
  assert.deepEqual(visibleExams([{ id: 1, name: 'A' }, { id: 2, name: 'B' }], 'zzz'), [])
})

test('special characters are matched literally, not as regex', () => {
  const exams = [{ id: 1, name: 'Bài (1) [A]+' }, { id: 2, name: 'Bài 1' }]
  assert.deepEqual(visibleExams(exams, '(1)').map((item) => item.id), [1])
  assert.deepEqual(visibleExams(exams, '.*').length, 0)
  assert.deepEqual(visibleExams(exams, '[a]+').map((item) => item.id), [1])
})

test('deleted exam stays hidden even when keyword matches', () => {
  assert.equal(visibleExams([{ id: 1, name: 'Toán', status: 255 }], 'toán').length, 0)
})

test('filter keeps newest-first ordering', () => {
  const exams = [{ id: 1, name: 'Toán 1' }, { id: 7, name: 'Toán 7' }, { id: 3, name: 'Lý' }]
  assert.deepEqual(visibleExams(exams, 'toán').map((item) => item.id), [7, 1])
})

test('empty array, non-array input and null entries are safe', () => {
  assert.deepEqual(visibleExams([], 'x'), [])
  assert.deepEqual(visibleExams({ id: 1 }, 'x'), [])
  assert.deepEqual(visibleExams('abc'), [])
  assert.deepEqual(visibleExams([null, undefined, { id: 1, name: 'A' }]).map((item) => item.id), [1])
})

test('numeric keyword is coerced to string', () => {
  assert.deepEqual(visibleExams([{ id: 1, name: 'Đề 2024' }, { id: 2, name: 'Đề 1' }], 2024).map((item) => item.id), [1])
})

test('returns a new array, not the input reference', () => {
  const exams = [{ id: 1, name: 'A' }]
  assert.notEqual(visibleExams(exams), exams)
})
