import test from 'node:test'
import assert from 'node:assert/strict'
import { memberSummary, visibleClasses } from '../src/services/classList.js'

const classes = [
  { id: 1, subjectId: 10, status: 1 },
  { id: 2, subjectId: 20, status: 0 },
  { id: 3, subjectId: 10, status: 255 },
  { id: 4, subjectId: null, status: 1 },
  { id: 5, subjectId: 20, status: 1 },
]
const ids = (items) => items.map((item) => item.id)

test('default keeps only active classes in API order', () => {
  assert.deepEqual(ids(visibleClasses(classes)), [1, 4, 5])
})

test('activeOnly false keeps paused and hidden classes', () => {
  assert.deepEqual(ids(visibleClasses(classes, { activeOnly: false })), [1, 2, 3, 4, 5])
})

test('subject filter accepts numbers and numeric strings', () => {
  assert.deepEqual(ids(visibleClasses(classes, { subjectId: 20 })), [5])
  assert.deepEqual(ids(visibleClasses(classes, { subjectId: '10', activeOnly: false })), [1, 3])
})

test('classes without subject are excluded when filtering by subject', () => {
  assert.ok(!ids(visibleClasses(classes, { subjectId: 0, activeOnly: false })).includes(4))
})

test('does not mutate input and tolerates bad input', () => {
  const copy = structuredClone(classes)
  visibleClasses(classes, { subjectId: 10 })
  assert.deepEqual(classes, copy)
  assert.deepEqual(visibleClasses(null), [])
  assert.deepEqual(visibleClasses([null, { id: 9, status: 1 }]).map((item) => item.id), [9])
})

test('memberSummary counts approved and pending only', () => {
  assert.deepEqual(memberSummary([{ status: 1 }, { status: '1' }, { status: 2 }, { status: 0 }, null]), { approved: 2, pending: 1 })
  assert.deepEqual(memberSummary(null), { approved: 0, pending: 0 })
  assert.deepEqual(memberSummary([]), { approved: 0, pending: 0 })
})
