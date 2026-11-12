import test from 'node:test'
import assert from 'node:assert/strict'
import { normalizeBlobError } from '../src/api/blob.js'
import {
  XLSX_MAX_BYTES, apiCodeMessage, checkXlsxFile, excelErrorMessage, excelIssues, issueRowLabel,
} from '../src/services/excelFile.js'

test('checkXlsxFile validates presence, extension and size', () => {
  assert.notEqual(checkXlsxFile(null), '')
  assert.equal(checkXlsxFile({ name: 'a.xls', size: 10 }), 'Chỉ nhận file .xlsx.')
  assert.equal(checkXlsxFile({ name: 'A.XLSX', size: 10 }), '')
  assert.notEqual(checkXlsxFile({ name: 'a.xlsx', size: 0 }), '')
  assert.equal(checkXlsxFile({ name: 'a.xlsx', size: XLSX_MAX_BYTES }), '')
  assert.notEqual(checkXlsxFile({ name: 'a.xlsx', size: XLSX_MAX_BYTES + 1 }), '')
})

test('normalizeBlobError parses a JSON blob body', async () => {
  const error = { response: { data: new Blob([JSON.stringify({ success: false, message: 'NO_QUESTIONS', data: null })]) } }
  assert.equal(await normalizeBlobError(error), error)
  assert.equal(error.response.data.message, 'NO_QUESTIONS')
})

test('normalizeBlobError nulls a non-JSON blob and tolerates missing response', async () => {
  const error = { response: { data: new Blob(['not json']) } }
  await normalizeBlobError(error)
  assert.equal(error.response.data, null)
  const plain = new Error('x')
  assert.equal(await normalizeBlobError(plain), plain)
})

test('apiCodeMessage maps known codes only', () => {
  assert.match(apiCodeMessage('EXPORT_TOO_LARGE'), /500/)
  assert.equal(apiCodeMessage('SOMETHING_ELSE'), null)
  assert.equal(apiCodeMessage(undefined), null)
})

test('excelErrorMessage prefers a mapped code', () => {
  assert.equal(excelErrorMessage({ response: { status: 400, data: { message: 'NO_QUESTIONS' } } }),
    'Không có câu hỏi nào khớp bộ lọc để xuất.')
})

test('excelIssues and issueRowLabel', () => {
  const errors = [{ row: 2, column: 'Email', code: 'EMAIL', message: 'x' }]
  assert.deepEqual(excelIssues({ response: { data: { data: { errors } } } }), errors)
  assert.deepEqual(excelIssues({ response: { data: { data: null } } }), [])
  assert.equal(issueRowLabel(0), 'Toàn file')
  assert.equal(issueRowLabel(5), '5')
})
