import test from 'node:test'
import assert from 'node:assert/strict'
import { toLoadError } from '../src/api/response.js'

test('403 is flagged forbidden', () => {
  const result = toLoadError({ response: { status: 403 } })
  assert.equal(result.forbidden, true)
  assert.equal(result.message, 'Bạn không có quyền thực hiện thao tác này.')
})

test('500 and network errors are retryable', () => {
  assert.equal(toLoadError({ response: { status: 500 } }).forbidden, false)
  const network = toLoadError({ code: 'ERR_NETWORK' })
  assert.equal(network.forbidden, false)
  assert.match(network.message, /^Không thể kết nối máy chủ/)
})

test('undefined does not throw', () => {
  assert.equal(toLoadError(undefined).forbidden, false)
})

test('401, 404 are not forbidden and map to Vietnamese messages', () => {
  const unauthorized = toLoadError({ response: { status: 401 } })
  assert.equal(unauthorized.forbidden, false)
  assert.equal(unauthorized.message, 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.')
  const missing = toLoadError({ response: { status: 404 } })
  assert.equal(missing.forbidden, false)
  assert.equal(missing.message, 'Không tìm thấy dữ liệu yêu cầu.')
})

test('500 maps to server message', () => {
  assert.equal(toLoadError({ response: { status: 500 } }).message, 'Máy chủ gặp sự cố. Vui lòng thử lại sau.')
})

test('server message in body wins and 403 stays forbidden', () => {
  const result = toLoadError({ response: { status: 403, data: { message: 'Chỉ Admin được xem.' } } })
  assert.equal(result.forbidden, true)
  assert.equal(result.message, 'Chỉ Admin được xem.')
})

test('no response (timeout, null, undefined, empty object) is retryable with a message', () => {
  const timeout = toLoadError({ code: 'ECONNABORTED' })
  assert.equal(timeout.forbidden, false)
  assert.match(timeout.message, /^Máy chủ phản hồi quá chậm/)
  for (const input of [null, undefined, {}, new Error('boom')]) {
    const result = toLoadError(input)
    assert.equal(result.forbidden, false)
    assert.equal(typeof result.message, 'string')
    assert.ok(result.message.length > 0)
  }
})

test('non-403 numeric edge: status 255 is not forbidden', () => {
  assert.equal(toLoadError({ response: { status: 255 } }).forbidden, false)
})
