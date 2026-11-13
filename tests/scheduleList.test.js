import test from 'node:test'
import assert from 'node:assert/strict'
import { assignableClasses, vietnamDate, visibleSchedules } from '../src/services/scheduleList.js'

test('vietnamDate converts UTC instants to the Vietnam calendar day', () => {
  assert.equal(vietnamDate('2025-06-12T06:30:00Z'), '2025-06-12')
  assert.equal(vietnamDate('2025-06-11T17:30:00Z'), '2025-06-12')
  assert.equal(vietnamDate('2025-06-12T08:00:00'), '')
  assert.equal(vietnamDate(null), '')
})

const schedules = [
  { id: 1, examId: 10, status: 1, startTime: '2025-06-10T01:00:00Z' },
  { id: 2, examId: 20, status: 2, startTime: '2025-06-11T17:30:00Z' },
  { id: 3, examId: 10, status: 1, startTime: '2025-06-12T08:00:00' },
  { id: 4, examId: 10, status: 255, startTime: '2025-06-12T01:00:00Z' },
  { id: 5, examId: 20, status: 1, startTime: '2025-06-15T01:00:00Z' },
]
const links = [{ examScheduleId: 1, classId: 7 }, { examScheduleId: 5, classId: 7 }, { examScheduleId: 2, classId: 8 }]
const ids = (items) => items.map((item) => item.id)

test('without filters keeps everything except deleted, in API order', () => {
  assert.deepEqual(ids(visibleSchedules(schedules, links)), [1, 2, 3, 5])
})

test('date range is inclusive and uses the Vietnam start day', () => {
  assert.deepEqual(ids(visibleSchedules(schedules, links, { from: '2025-06-12', to: '2025-06-15' })), [2, 5])
  assert.deepEqual(ids(visibleSchedules(schedules, links, { from: '2025-06-10', to: '2025-06-10' })), [1])
  assert.deepEqual(ids(visibleSchedules(schedules, links, { to: '2025-06-11' })), [1])
})

test('schedules with unknown time zone drop out only when filtering by date', () => {
  assert.ok(ids(visibleSchedules(schedules, links)).includes(3))
  assert.ok(!ids(visibleSchedules(schedules, links, { from: '2025-01-01' })).includes(3))
})

test('exam and status filters accept numeric strings', () => {
  assert.deepEqual(ids(visibleSchedules(schedules, links, { examId: '10' })), [1, 3])
  assert.deepEqual(ids(visibleSchedules(schedules, links, { status: '2' })), [2])
  assert.deepEqual(ids(visibleSchedules(schedules, links, { status: 255 })), [])
})

test('class filter goes through assignments', () => {
  assert.deepEqual(ids(visibleSchedules(schedules, links, { classId: 7 })), [1, 5])
  assert.deepEqual(ids(visibleSchedules(schedules, null, { classId: 7 })), [])
})

test('does not mutate input and tolerates bad input', () => {
  const copy = structuredClone(schedules)
  visibleSchedules(schedules, links, { from: '2025-06-12', examId: 10 })
  assert.deepEqual(schedules, copy)
  assert.deepEqual(visibleSchedules(null), [])
})

test('assignableClasses removes assigned classes and searches name or code', () => {
  const classes = [
    { id: 1, name: 'Công nghệ thông tin', classCode: 'CNTT_K66A' },
    { id: 2, name: 'Kinh tế', classCode: 'KT_K66' },
    { id: 3, name: 'Luật', classCode: 'LUAT_K66A' },
  ]
  assert.deepEqual(ids(assignableClasses(classes, [{ classId: '2' }], '')), [1, 3])
  assert.deepEqual(ids(assignableClasses(classes, [], 'CÔNG NGHỆ')), [1])
  assert.deepEqual(ids(assignableClasses(classes, [], 'k66a')), [1, 3])
  assert.deepEqual(assignableClasses(null, [], 'x'), [])
})
