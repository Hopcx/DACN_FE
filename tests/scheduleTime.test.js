import test from 'node:test'
import assert from 'node:assert/strict'
import { formatScheduleTime, toVietnamInput, vietnamInputToUtc } from '../src/services/scheduleTime.js'

test('Vietnam wall time becomes UTC Z and reloads to the same wall time', () => {
  const utc = vietnamInputToUtc('2027-02-01T15:30')
  assert.equal(utc, '2027-02-01T08:30:00.000Z')
  assert.equal(toVietnamInput(utc), '2027-02-01T15:30')
})

test('legacy datetime2 stays visibly unknown', () => {
  assert.equal(toVietnamInput('2027-02-01T08:30:00'), '')
  assert.match(formatScheduleTime('2027-02-01T08:30:00', 'unknown'), /chưa rõ múi giờ/)
})

test('invalid Vietnam date is rejected', () => {
  assert.throws(() => vietnamInputToUtc('2027-02-30T15:30'), /không hợp lệ/)
})
