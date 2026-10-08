import test from 'node:test'
import assert from 'node:assert/strict'
import { canChangeSchedule, scheduleChangeReason } from '../src/services/schedulePolicy.js'

test('only a known UTC schedule without attempts permits management actions', () => {
  assert.equal(canChangeSchedule({ timeZoneStatus: 'utc', hasAttempts: false }), true)
  assert.equal(canChangeSchedule({ timeZoneStatus: 'utc', hasAttempts: true }), false)
  assert.equal(canChangeSchedule({ timeZoneStatus: 'unknown', hasAttempts: false }), false)
  assert.equal(canChangeSchedule({ timeZoneStatus: 'utc' }), false)
  assert.match(scheduleChangeReason({ timeZoneStatus: 'utc', hasAttempts: true }), /bài nộp/)
  assert.match(scheduleChangeReason({ timeZoneStatus: 'unknown', hasAttempts: false }), /múi giờ/)
})
