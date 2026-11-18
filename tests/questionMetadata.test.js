import test from 'node:test'
import assert from 'node:assert/strict'
import { chapterProblem, duplicateTagId, metadataOptions, questionBody, restoreBody, tagKey, tagProblem, tagSummary,
  uniqueTagIds } from '../src/services/questionMetadata.js'

const base = {
  subjectId: 5, questionTypeId: 2, questionLevelId: 1, status: 1, content: '  Câu 1  ',
  answers: [{ content: ' A ', isCorrect: true }, { content: 'B' }],
}

test('questionBody always sends chapterId, explanation, tagIds, documentPath (PUT replaces the whole question)', () => {
  const body = questionBody(base)
  for (const key of ['chapterId', 'explanation', 'tagIds', 'documentPath', 'questionLevelId'])
    assert.ok(Object.hasOwn(body, key), key)
  assert.equal(body.chapterId, null)
  assert.equal(body.explanation, null)
  assert.deepEqual(body.tagIds, [])
  assert.equal(body.content, 'Câu 1')
  assert.deepEqual(body.answers, [{ content: 'A', isCorrect: true }, { content: 'B', isCorrect: false }])
})

test('questionBody trims explanation, dedupes tags, keeps documentPath of the edited question', () => {
  const body = questionBody({ ...base, chapterId: 7, explanation: '  Vì A đúng  ', tagIds: [3, 3, '4', 0, -1, null] },
    { documentPath: 'files/a.pdf' })
  assert.equal(body.chapterId, 7)
  assert.equal(body.explanation, 'Vì A đúng')
  assert.deepEqual(body.tagIds, [3, 4])
  assert.equal(body.documentPath, 'files/a.pdf')
  assert.equal(questionBody({ ...base, explanation: '   ' }).explanation, null)
})

test('restoreBody keeps metadata and status 1; drops a hidden chapter', () => {
  const item = { ...base, id: 9, status: 255, chapterId: 7, explanation: 'x', tagIds: [2], documentPath: null }
  const kept = restoreBody(item, [{ id: 7, status: 1 }])
  assert.equal(kept.droppedChapter, false)
  assert.equal(kept.body.status, 1)
  assert.equal(kept.body.chapterId, 7)
  assert.deepEqual(kept.body.tagIds, [2])
  assert.equal(kept.body.explanation, 'x')
  const dropped = restoreBody(item, [{ id: 7, status: 255 }])
  assert.equal(dropped.droppedChapter, true)
  assert.equal(dropped.body.chapterId, null)
  assert.deepEqual(dropped.body.tagIds, [2])
})

test('chapterProblem only flags hidden chapters; tagProblem caps at 10 distinct tags', () => {
  const chapters = [{ id: 1, status: 1 }, { id: 2, status: 0 }, { id: 3, status: 255 }]
  assert.equal(chapterProblem(1, chapters), null)
  assert.equal(chapterProblem(2, chapters), null)
  assert.match(chapterProblem(3, chapters), /đã bị ẩn/)
  assert.equal(chapterProblem(null, chapters), null)
  assert.equal(tagProblem([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 10]), null)
  assert.match(tagProblem([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]), /10/)
  assert.deepEqual(uniqueTagIds(undefined), [])
})

test('metadataOptions hides hidden items unless selected, labels and disables inactive ones', () => {
  const items = [{ id: 1, name: 'A', status: 1 }, { id: 2, name: 'B', status: 0 }, { id: 3, name: 'C', status: 255 }]
  assert.deepEqual(metadataOptions(items).map((x) => x.value), [1, 2])
  const selected = metadataOptions(items, [3, 2])
  assert.deepEqual(selected.map((x) => [x.value, x.label, x.disabled]),
    [[1, 'A', false], [2, 'B (ngừng)', false], [3, 'C (đã ẩn)', false]])
  assert.equal(metadataOptions(items, []).find((x) => x.value === 2).disabled, true)
  assert.equal(metadataOptions(items, 3).length, 3)
})

test('tagSummary shows up to 3 names and counts the rest; unknown ids fall back to #id', () => {
  const tags = [1, 2, 3, 4].map((id) => ({ id, name: `t${id}` }))
  assert.deepEqual(tagSummary([1, 2, 3, 4, 9], tags), { shown: ['t1', 't2', 't3'], more: 2, all: ['t1', 't2', 't3', 't4', '#9'] })
  assert.deepEqual(tagSummary(null, tags), { shown: [], more: 0, all: [] })
})

test('tagKey matches BE normalization (case, diacritics, đ, spaces; hyphen kept); duplicateTagId parses 409', () => {
  assert.equal(tagKey('  Đại   SỐ '), tagKey('dai so'))
  assert.notEqual(tagKey('Hình-học'), tagKey('hinh hoc'))
  assert.equal(duplicateTagId('Tag đã tồn tại (id 42).'), 42)
  assert.equal(duplicateTagId('khác'), null)
})
