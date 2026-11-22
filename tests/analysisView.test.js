import test from 'node:test'
import assert from 'node:assert/strict'
import { dataNotes, formatRate, levelView, practiceLink, thresholdText } from '../src/services/analysisView.js'
import { prefillFromQuery } from '../src/services/practiceView.js'

test('levelView maps levels with tones; unknown → insufficient', () => {
  assert.deepEqual(levelView('weak'), { label: 'Yếu', tone: 'danger' })
  assert.deepEqual(levelView('needsImprovement'), { label: 'Cần cải thiện', tone: 'warning' })
  assert.deepEqual(levelView('fair'), { label: 'Khá', tone: 'info' })
  assert.deepEqual(levelView('good'), { label: 'Tốt', tone: 'success' })
  assert.equal(levelView('x').label, 'Chưa đủ dữ liệu')
})

test('formatRate uses Vietnamese decimals', () => {
  assert.equal(formatRate(66.7), '66,7%')
  assert.equal(formatRate(100), '100%')
  assert.equal(formatRate(null), '—')
})

test('thresholdText states boundaries and minimum', () => {
  assert.match(thresholdText({ weakBelow: 50, improveBelow: 70, goodFrom: 85, minQuestions: 5 }), /Yếu < 50%.*Tốt ≥ 85%.*ít nhất 5 câu/)
  assert.equal(thresholdText(null), '')
})

test('practiceLink prefills subject and chapter/tag; hidden → null', () => {
  assert.equal(practiceLink(3, { chapterId: 7 }), '/student/practice?subjectId=3&chapterId=7')
  assert.equal(practiceLink(3, { tagId: 9 }), '/student/practice?subjectId=3&tagId=9')
  assert.equal(practiceLink(3, { chapterId: 7, hidden: true }), null)
  assert.equal(practiceLink(null, { chapterId: 7 }), null)
})

test('dataNotes explains current classification, unchaptered and truncation', () => {
  assert.deepEqual(dataNotes(null), [])
  const notes = dataNotes({ totals: {}, currentClassificationCount: 2, unchaptered: { total: 3 }, truncated: true })
  assert.equal(notes.length, 3)
  assert.match(notes[0], /2 câu.*hiện tại/)
  assert.match(notes[1], /3 câu chưa được gán chương/)
  assert.match(notes[2], /20.000 câu gần nhất/)
})

test('prefillFromQuery accepts only ids present in practice options', () => {
  const subjects = [{ id: 3, chapters: [{ id: 7 }], tags: [{ id: 9 }] }]
  const q = (s) => new URLSearchParams(s)
  assert.deepEqual(prefillFromQuery(q('subjectId=3&chapterId=7'), subjects), { subjectId: 3, chapterIds: [7], questionLevelIds: [], tagIds: [] })
  assert.deepEqual(prefillFromQuery(q('subjectId=3&tagId=9&chapterId=8'), subjects), { subjectId: 3, chapterIds: [], questionLevelIds: [], tagIds: [9] })
  assert.equal(prefillFromQuery(q('subjectId=4'), subjects), null)
  assert.equal(prefillFromQuery(q('subjectId=abc'), subjects), null)
  assert.equal(prefillFromQuery(q(''), subjects), null)
})
