import test from 'node:test'
import assert from 'node:assert/strict'
import { keptAfterToggle, legacyFlagIds, toggled, visibleQuestions } from '../src/services/reviewFlags.js'

test('legacyFlagIds reads old sessionStorage flags safely', () => {
  assert.deepEqual(legacyFlagIds('["a","b","a",3,""]'), ['a', 'b'])
  assert.deepEqual(legacyFlagIds('{"a":1}'), [])
  assert.deepEqual(legacyFlagIds('not json'), [])
  assert.deepEqual(legacyFlagIds(null), [])
})

test('toggled returns a new set', () => {
  const flags = new Set(['a'])
  const on = toggled(flags, 'b'); const off = toggled(flags, 'a')
  assert.deepEqual([...on].sort(), ['a', 'b']); assert.deepEqual([...off], []); assert.deepEqual([...flags], ['a'])
})

test('visibleQuestions keeps original numbers and filters flagged', () => {
  const questions = [{ id: 'a' }, { id: 'b' }, { id: 'c' }]
  assert.deepEqual(visibleQuestions(questions, new Set(['c', 'a']), true).map((x) => [x.question.id, x.number]), [['a', 1], ['c', 3]])
  assert.equal(visibleQuestions(questions, new Set(), false).length, 3)
  assert.deepEqual(visibleQuestions(null, new Set(), true), [])
})

test('applyIntents overlays pending user intents on the server list', async () => {
  const { applyIntents } = await import('../src/services/reviewFlags.js')
  const intents = new Map([['b', false], ['c', true]])
  assert.deepEqual([...applyIntents(['a', 'b'], intents)].sort(), ['a', 'c'])
  assert.deepEqual([...applyIntents(null, null)], [])
})

test('T19 L3: unflagging while filtering keeps the question visible until the filter is toggled', () => {
  const questions = [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }]
  let flags = new Set(['a', 'b', 'd'])
  let kept = new Set()
  // đang xem câu b (chỉ số 1 trong danh sách lọc), bỏ đánh dấu
  kept = keptAfterToggle(kept, flags, 'b', true)
  flags = toggled(flags, 'b')
  const list = visibleQuestions(questions, flags, true, kept).map((x) => [x.question.id, x.number])
  assert.deepEqual(list, [['a', 1], ['b', 2], ['d', 4]], 'b stays at the same position, numbers unchanged')
  // đánh dấu lại b: không cần giữ thêm, vẫn hiện
  const again = keptAfterToggle(kept, flags, 'b', true)
  assert.equal(again, kept, 'flagging does not change kept')
  assert.deepEqual(visibleQuestions(questions, toggled(flags, 'b'), true, again).map((x) => x.question.id), ['a', 'b', 'd'])
  // tắt bộ lọc → trang xóa kept; bật lại → b (đã bỏ) không còn
  assert.deepEqual(visibleQuestions(questions, flags, true, new Set()).map((x) => x.question.id), ['a', 'd'])
})

test('T19 L3: keptAfterToggle ignores toggles when not filtering and never mutates', () => {
  const kept = new Set(['x'])
  const flags = new Set(['a'])
  assert.equal(keptAfterToggle(kept, flags, 'a', false), kept, 'not filtering')
  assert.equal(keptAfterToggle(kept, flags, 'z', true), kept, 'flagging an unflagged question')
  const next = keptAfterToggle(kept, flags, 'a', true)
  assert.deepEqual([...next].sort(), ['a', 'x'])
  assert.deepEqual([...kept], ['x'], 'original set untouched')
  assert.deepEqual([...keptAfterToggle(undefined, flags, 'a', true)], ['a'])
  // không lọc: kept không ảnh hưởng
  assert.equal(visibleQuestions([{ id: 'a' }, { id: 'b' }], new Set(), false, new Set(['b'])).length, 2)
})
