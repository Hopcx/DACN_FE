import test from 'node:test'
import assert from 'node:assert/strict'
import { normalizeBlobError } from '../src/api/blob.js'
import { apiCodeMessage, checkXlsxFile, excelErrorMessage, excelIssues, issueRowLabel } from '../src/services/excelFile.js'
import { buildActivityQuery, buildLogQuery } from '../src/services/auditFilters.js'

const base = { page: 1, pageSize: 20 }

test('409 blob error: message becomes readable and issues survive normalization', async () => {
  const body = { success: false, message: 'EXPORT_TOO_LARGE', data: { errors: [{ row: 0, code: 'X', message: 'm' }] } }
  const error = { response: { status: 409, data: new Blob([JSON.stringify(body)]) } }
  await normalizeBlobError(error)
  assert.equal(excelErrorMessage(error), apiCodeMessage('EXPORT_TOO_LARGE'))
  assert.equal(excelIssues(error).length, 1)
  assert.equal(issueRowLabel(excelIssues(error)[0].row), 'Toàn file')
})

test('non-JSON blob error falls back to status text, never [object Blob]', async () => {
  const error = { response: { status: 404, data: new Blob(['<html>']) } }
  await normalizeBlobError(error)
  const text = excelErrorMessage(error)
  assert.equal(text, 'Không tìm thấy dữ liệu yêu cầu.')
  assert.ok(!text.includes('Blob'))
})

test('apiCodeMessage ignores prototype keys and non-strings', () => {
  for (const key of ['toString', '__proto__', 'constructor', 5, null]) assert.equal(apiCodeMessage(key), null)
})

test('excelIssues tolerates garbage shapes', () => {
  for (const e of [undefined, null, {}, { response: {} }, { response: { data: { data: { errors: 'x' } } } }])
    assert.deepEqual(excelIssues(e), [])
})

test('checkXlsxFile rejects wrong extension variants and missing name', () => {
  assert.notEqual(checkXlsxFile({ name: 'a.xlsx.txt', size: 5 }), '')
  assert.notEqual(checkXlsxFile({ name: 'xlsx', size: 5 }), '')
  assert.notEqual(checkXlsxFile({ size: 5 }), '')
  assert.equal(checkXlsxFile({ name: 'a.xlsx', size: 1 }), '')
})

test('logs: boundary, equal from/to allowed, midnight VN crosses UTC day', () => {
  const q = buildLogQuery({ ...base, from: '2027-03-01T00:00', to: '2027-03-01T00:00' })
  assert.equal(q.fromUtc, '2027-02-28T17:00:00.000Z')
  assert.equal(q.toUtc, q.fromUtc)
})

test('logs: only one bound is allowed; malformed time rejected', () => {
  assert.equal(buildLogQuery({ ...base, to: '2027-03-01T10:00' }).fromUtc, undefined)
  assert.throws(() => buildLogQuery({ ...base, from: '2027-03-01 10:00' }))
  assert.throws(() => buildLogQuery({ ...base, from: '2027-13-01T10:00' }))
  assert.throws(() => buildLogQuery({ ...base, from: '2027-03-01T24:30' }))
})

test('logs: from > to blocked with Vietnamese message', () => {
  assert.throws(() => buildLogQuery({ ...base, from: '2027-03-02T10:00', to: '2027-03-01T10:00' }), /trước thời điểm kết thúc/)
})

test('search: exactly 100 chars ok, 101 after trim rejected, whitespace dropped, action also limited', () => {
  assert.equal(buildLogQuery({ ...base, search: 'a'.repeat(100) }).search.length, 100)
  assert.equal('search' in buildLogQuery({ ...base, search: '   ' }), false)
  assert.throws(() => buildLogQuery({ ...base, action: 'a'.repeat(101) }), /100/)
  assert.throws(() => buildActivityQuery({ ...base, actionType: 'a'.repeat(101) }), /100/)
})

test('activity: no timezone suffix, equal bounds ok, malformed rejected', () => {
  const q = buildActivityQuery({ ...base, from: '2027-03-01T10:05', to: '2027-03-01T10:05' })
  assert.equal(q.from, '2027-03-01T10:05:00')
  assert.ok(!/Z|[+-]\d{2}:\d{2}$/.test(q.to))
  assert.throws(() => buildActivityQuery({ ...base, from: '2027-03-01T10:05:00' }))
  assert.throws(() => buildActivityQuery({ ...base, from: '2027-03-01' }))
})

test('page and pageSize pass through (page 1 after reset)', () => {
  assert.deepEqual(buildLogQuery({ page: 1, pageSize: 50 }), { page: 1, pageSize: 50 })
  assert.equal(buildActivityQuery({ page: 3, pageSize: 10 }).page, 3)
})

test('guid: case-insensitive accepted, empty GUID and padded junk rejected', () => {
  const up = '0B0C3C0E-1C1D-4E5F-8A9B-0C1D2E3F4A5B'
  assert.equal(buildLogQuery({ ...base, actorUserId: up }).actorUserId, up)
  assert.throws(() => buildLogQuery({ ...base, actorUserId: '00000000-0000-0000-0000-000000000000' }))
  assert.throws(() => buildLogQuery({ ...base, actorUserId: 'x'.repeat(36) }))
})

test('exam ids: strings and NaN rejected', () => {
  assert.throws(() => buildActivityQuery({ ...base, examId: '3' }))
  assert.throws(() => buildActivityQuery({ ...base, examId: NaN }))
  assert.equal(buildActivityQuery({ ...base, examId: null, examScheduleId: '' }).examId, undefined)
})

test('contract: logs send fromUtc/toUtc and never from/to; activity sends from/to and never fromUtc/toUtc', () => {
  const logs = buildLogQuery({ ...base, from: '2027-03-01T10:00', to: '2027-03-02T10:00' })
  assert.deepEqual(Object.keys(logs).sort(), ['fromUtc', 'page', 'pageSize', 'toUtc'])
  assert.ok(!('from' in logs) && !('to' in logs))
  const activity = buildActivityQuery({ ...base, from: '2027-03-01T10:00', to: '2027-03-02T10:00' })
  assert.deepEqual(Object.keys(activity).sort(), ['from', 'page', 'pageSize', 'to'])
  assert.ok(!('fromUtc' in activity) && !('toUtc' in activity))
})

test('contract (must fail if broken): logs query with only one bound still has no from/to key', () => {
  assert.ok(!('from' in buildLogQuery({ ...base, from: '2027-03-01T10:00' })))
  assert.ok(!('to' in buildLogQuery({ ...base, to: '2027-03-01T10:00' })))
  assert.ok('fromUtc' in buildLogQuery({ ...base, from: '2027-03-01T10:00' }))
})
