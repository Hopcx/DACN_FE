import test from 'node:test'
import assert from 'node:assert/strict'
import { legacyFlagIds, toggled, visibleQuestions } from '../src/services/reviewFlags.js'

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
