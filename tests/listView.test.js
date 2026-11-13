import test from 'node:test'
import assert from 'node:assert/strict'
import { clampPage, rowNumber, showTotalLabel, statusView } from '../src/services/listView.js'

test('clampPage keeps page within range and at least 1', () => {
  assert.equal(clampPage(3, 10, 21), 3)
  assert.equal(clampPage(3, 10, 20), 2)
  assert.equal(clampPage(5, 10, 0), 1)
  assert.equal(clampPage(0, 10, 50), 1)
  assert.equal(clampPage(NaN, 10, 50), 1)
})

test('rowNumber continues across pages', () => {
  assert.equal(rowNumber(1, 10, 0), 1)
  assert.equal(rowNumber(3, 10, 4), 25)
})

test('showTotalLabel formats range and fallback', () => {
  assert.equal(showTotalLabel('môn học')(25, [11, 20]), 'Hiển thị 11–20 của 25 môn học')
  assert.equal(showTotalLabel('môn học')(25), 'Tổng 25 môn học')
})

test('statusView maps active, inactive and hidden', () => {
  assert.equal(statusView(1).tone, 'success')
  assert.equal(statusView(true).tone, 'success')
  for (const value of [0, false, null, undefined]) {
    assert.equal(statusView(value).tone, 'danger')
    assert.equal(statusView(value).label, 'Ngừng hoạt động')
  }
  assert.equal(statusView(255).label, 'Đã ẩn')
})

test('clampPage edge cases: oversized page, zero total, bad inputs', () => {
  assert.equal(clampPage(99, 10, 25), 3)
  assert.equal(clampPage(1, 10, 0), 1)
  assert.equal(clampPage(2, 10, 10), 1)
  assert.equal(clampPage(2, 10, 11), 2)
  assert.equal(clampPage(-4, 10, 50), 1)
  assert.equal(clampPage(2.9, 10, 50), 2)
  assert.equal(clampPage(null, 10, 50), 1)
  assert.equal(clampPage(undefined, 10, 50), 1)
  assert.equal(clampPage(3, 10, null), 1)
  assert.equal(clampPage(3, 10, undefined), 1)
  assert.equal(clampPage(3, 10, -5), 1)
  assert.equal(clampPage(3, 0, 50), 1)
  assert.equal(clampPage(3, -10, 50), 1)
  assert.equal(clampPage(3, NaN, 50), 1)
  assert.equal(clampPage(Infinity, 10, 50), 1)
})

test('rowNumber is 1-based and increments within a page', () => {
  assert.equal(rowNumber(2, 10, 0), 11)
  assert.equal(rowNumber(2, 10, 9), 20)
  assert.equal(rowNumber(1, 5, 4), 5)
})

test('showTotalLabel handles zero total and non-array range', () => {
  assert.equal(showTotalLabel('phòng thi')(0, [0, 0]), 'Hiển thị 0–0 của 0 phòng thi')
  assert.equal(showTotalLabel('tài khoản')(7, [1, 7]), 'Hiển thị 1–7 của 7 tài khoản')
  assert.equal(showTotalLabel('tài khoản')(7, null), 'Tổng 7 tài khoản')
})

test('statusView edge values: numeric strings, unknown numbers, tones', () => {
  assert.deepEqual(statusView(1), { tone: 'success', label: 'Đang hoạt động' })
  assert.deepEqual(statusView('1'), { tone: 'success', label: 'Đang hoạt động' })
  assert.deepEqual(statusView(255), { tone: 'default', label: 'Đã ẩn' })
  assert.deepEqual(statusView('255'), { tone: 'default', label: 'Đã ẩn' })
  assert.deepEqual(statusView(0), { tone: 'danger', label: 'Ngừng hoạt động' })
  assert.deepEqual(statusView(2), { tone: 'danger', label: 'Ngừng hoạt động' })
  assert.deepEqual(statusView(''), { tone: 'danger', label: 'Ngừng hoạt động' })
  assert.deepEqual(statusView('abc'), { tone: 'danger', label: 'Ngừng hoạt động' })
})
