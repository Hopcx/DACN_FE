import test from 'node:test'
import assert from 'node:assert/strict'
import { buildActivityQuery, buildLogQuery } from '../src/services/auditFilters.js'

test('only page and pageSize leaves no extra keys', () => {
  assert.deepEqual(buildLogQuery({ page: 1, pageSize: 20, search: '  ', from: '' }), { page: 1, pageSize: 20 })
  assert.deepEqual(buildActivityQuery({ page: 2, pageSize: 10 }), { page: 2, pageSize: 10 })
})

test('search is trimmed and limited to 100 characters', () => {
  assert.equal(buildLogQuery({ page: 1, pageSize: 20, search: '  abc  ' }).search, 'abc')
  assert.throws(() => buildLogQuery({ page: 1, pageSize: 20, search: 'a'.repeat(101) }), /100/)
})

test('log time range converts Vietnam wall time to UTC and checks order', () => {
  const query = buildLogQuery({ page: 1, pageSize: 20, from: '2027-02-01T15:30', to: '2027-02-02T15:30' })
  assert.equal(query.fromUtc, '2027-02-01T08:30:00.000Z')
  assert.equal(query.toUtc, '2027-02-02T08:30:00.000Z')
  assert.throws(() => buildLogQuery({ page: 1, pageSize: 20, from: '2027-02-02T10:00', to: '2027-02-01T10:00' }))
  assert.throws(() => buildLogQuery({ page: 1, pageSize: 20, from: '2027-02-30T10:00' }))
})

test('activity time is sent without time zone', () => {
  const query = buildActivityQuery({ page: 1, pageSize: 20, from: '2027-02-01T15:30' })
  assert.equal(query.from, '2027-02-01T15:30:00')
  assert.throws(() => buildActivityQuery({ page: 1, pageSize: 20, from: '2027-02-02T10:00', to: '2027-02-01T10:00' }))
})

test('user ids must be non-empty GUIDs', () => {
  const good = '0b0c3c0e-1c1d-4e5f-8a9b-0c1d2e3f4a5b'
  assert.equal(buildLogQuery({ page: 1, pageSize: 20, actorUserId: good }).actorUserId, good)
  assert.equal(buildActivityQuery({ page: 1, pageSize: 20, userId: good }).userId, good)
  assert.throws(() => buildLogQuery({ page: 1, pageSize: 20, actorUserId: 'abc' }), /Mã người dùng/)
  assert.throws(() => buildActivityQuery({ page: 1, pageSize: 20, userId: '00000000-0000-0000-0000-000000000000' }))
})

test('exam and schedule ids must be positive integers', () => {
  for (const bad of [0, -1, 1.5]) {
    assert.throws(() => buildActivityQuery({ page: 1, pageSize: 20, examId: bad }), /Bộ lọc/)
    assert.throws(() => buildActivityQuery({ page: 1, pageSize: 20, examScheduleId: bad }))
  }
  assert.equal(buildActivityQuery({ page: 1, pageSize: 20, examId: 3 }).examId, 3)
})
