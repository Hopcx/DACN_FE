import test from 'node:test'
import assert from 'node:assert/strict'
import { formatPercent, hardEmptyText, rateTone, reportNotes, scopeText } from '../src/services/classReport.js'

const thresholds = { weakBelow: 50, minQuestions: 5, hardBelow: 40, hardMinAnswers: 10 }

test('formatPercent and rateTone', () => {
  assert.equal(formatPercent(51.7), '51,7%')
  assert.equal(formatPercent(null), '—')
  assert.equal(rateTone(49.9, thresholds), 'danger')
  assert.equal(rateTone(50, thresholds), 'success')
  assert.equal(rateTone(null, thresholds), 'default')
})

test('scopeText describes counted data', () => {
  const text = scopeText({ scheduleCount: 2, notCountedCount: 1, attemptCount: 20, studentCount: 10 })
  assert.match(text, /2 lịch.*1 lịch chưa tính.*20 lượt.*10 học viên/)
  assert.equal(scopeText(null), '')
})

test('reportNotes mentions pending backfill and current classification', () => {
  assert.deepEqual(reportNotes({ attemptsWithoutOutcomes: 0, currentClassificationCount: 0 }), [])
  const notes = reportNotes({ attemptsWithoutOutcomes: 2, currentClassificationCount: 3 })
  assert.equal(notes.length, 2)
  assert.match(notes[0], /2 lượt/)
})

test('hardEmptyText explains small classes vs no hard question', () => {
  assert.match(hardEmptyText({ thresholds, maxAnswersPerQuestion: 6 }), /đủ 10 lượt.*nhiều nhất hiện có: 6/)
  assert.match(hardEmptyText({ thresholds, maxAnswersPerQuestion: 12 }), /dưới 40%/)
  assert.equal(hardEmptyText(null), 'Chưa có dữ liệu')
})

test('fileNameFromDisposition prefers server name, sanitizes, falls back', async () => {
  const { fileNameFromDisposition } = await import('../src/services/classReport.js')
  assert.equal(fileNameFromDisposition('attachment; filename=bao-cao-lop-A1-20261122-1000.xlsx; filename*=UTF-8\'\'bao-cao-lop-A1-20261122-1000.xlsx'),
    'bao-cao-lop-A1-20261122-1000.xlsx')
  assert.equal(fileNameFromDisposition('attachment; filename="a/b.xlsx"'), 'a-b.xlsx')
  assert.equal(fileNameFromDisposition('attachment; filename=x.exe', 'f.xlsx'), 'f.xlsx')
  assert.equal(fileNameFromDisposition(undefined, 'f.xlsx'), 'f.xlsx')
})

test('fileNameFromDisposition strips backslashes too', async () => {
  const { fileNameFromDisposition } = await import('../src/services/classReport.js')
  assert.equal(fileNameFromDisposition('attachment; filename="a\\b.xlsx"'), 'a-b.xlsx')
})
