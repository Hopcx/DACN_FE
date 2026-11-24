import test from 'node:test'
import assert from 'node:assert/strict'
import { groupFormProblem, groupOf, groupRange, moveItem, practiceOverflowNote, rangeLabel, withWholeGroups } from '../src/services/questionGroupView.js'
import { mergeMedia } from '../src/services/mediaView.js'

test('groupFormProblem: khớp validator BE', () => {
  const ok = { subjectId: 1, title: 'Bài đọc', content: 'Đoạn', questionIds: [1, 2] }
  assert.equal(groupFormProblem(ok), null)
  assert.match(groupFormProblem({ ...ok, subjectId: null }), /môn/)
  assert.match(groupFormProblem({ ...ok, title: ' ' }), /Tiêu đề/)
  assert.match(groupFormProblem({ ...ok, title: 'x'.repeat(201) }), /Tiêu đề/)
  assert.match(groupFormProblem({ ...ok, content: 'x'.repeat(8001) }), /Nội dung/)
  assert.match(groupFormProblem({ ...ok, questionIds: [1] }), /2–10/)
  assert.match(groupFormProblem({ ...ok, questionIds: [1, 1] }), /2–10/)
  assert.match(groupFormProblem({ ...ok, questionIds: Array.from({ length: 11 }, (_, i) => i) }), /2–10/)
})

test('moveItem: lên/xuống, ngoài biên giữ nguyên', () => {
  assert.deepEqual(moveItem(['a', 'b', 'c'], 1, -1), ['b', 'a', 'c'])
  assert.deepEqual(moveItem(['a', 'b', 'c'], 1, 1), ['a', 'c', 'b'])
  const list = ['a', 'b']
  assert.equal(moveItem(list, 0, -1), list)
  assert.equal(moveItem(list, 1, 1), list)
})

test('groupRange / rangeLabel / groupOf', () => {
  const qs = [{ id: 'a' }, { id: 'b', groupId: 'g' }, { id: 'c', groupId: 'g' }, { id: 'd', groupId: 'g' }, { id: 'e' }]
  assert.deepEqual(groupRange(qs, 'g'), { from: 2, to: 4 })
  assert.equal(rangeLabel(groupRange(qs, 'g')), 'Câu 2–4')
  assert.equal(rangeLabel({ from: 3, to: 3 }), 'Câu 3')
  assert.equal(groupRange(qs, null), null)
  assert.equal(groupRange(qs, 'x'), null)
  assert.equal(groupOf([{ id: 'g', title: 'T' }], qs[1]).title, 'T')
  assert.equal(groupOf([{ id: 'g' }], qs[0]), null)
  assert.equal(groupOf(undefined, qs[1]), null)
})

test('withWholeGroups: chọn/bỏ một câu của đoạn là chọn/bỏ cả đoạn', () => {
  const options = [{ id: 1 }, { id: 2, groupId: 9 }, { id: 3, groupId: 9 }, { id: 4, groupId: 9 }, { id: 5 }]
  assert.deepEqual(withWholeGroups(options, [1], [1, 3]), [1, 3, 2, 4])
  assert.deepEqual(withWholeGroups(options, [1, 2, 3, 4], [1, 2, 4]), [1])
  assert.deepEqual(withWholeGroups(options, [1], [1, 5]), [1, 5])
  assert.deepEqual(withWholeGroups(options, [1, 5], [5]), [5])
})

test('mergeMedia thay cả danh sách đoạn khi có; practiceOverflowNote', () => {
  const target = { questions: [{ id: 'a', media: [] }], groups: [{ id: 'g', media: [{ url: 'old' }] }] }
  const merged = mergeMedia(target, [{ id: 'a', media: [{ url: 'q' }] }], [{ id: 'g', media: [{ url: 'new' }] }])
  assert.equal(merged.groups[0].media[0].url, 'new')
  assert.equal(mergeMedia(target, [{ id: 'a', media: [] }]).groups[0].media[0].url, 'old')
  assert.match(practiceOverflowNote(10), /nhiều hơn 10 câu \(tối đa 59\)/)
})
