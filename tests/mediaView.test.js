import test from 'node:test'
import assert from 'node:assert/strict'
import { ACCEPT, clientCheck, formatBytes, kindOfName, mediaErrorMessage } from '../src/services/mediaView.js'

test('kindOfName by extension (case-insensitive); others null', () => {
  assert.equal(kindOfName('a.PNG'), 'image')
  assert.equal(kindOfName('b.jpeg'), 'image')
  assert.equal(kindOfName('c.m4a'), 'audio')
  assert.equal(kindOfName('d.svg'), null)
  assert.equal(kindOfName('e.gif'), null)
  assert.equal(kindOfName('noext'), null)
  assert.match(ACCEPT, /\.webp/)
})

test('clientCheck: type, size, count, single audio', () => {
  assert.equal(clientCheck({ name: 'a.png', size: 1000 }, []), null)
  assert.match(clientCheck({ name: 'a.svg', size: 10 }, []), /Chỉ nhận/)
  assert.match(clientCheck({ name: 'a.png', size: 2 * 1024 * 1024 + 1 }, []), /tối đa 2 MB/)
  assert.match(clientCheck({ name: 'a.mp3', size: 10 * 1024 * 1024 + 1 }, []), /tối đa 10 MB/)
  assert.match(clientCheck({ name: 'a.png', size: 1 }, [1, 2, 3, 4, 5].map(() => ({ kind: 'image' }))), /tối đa 5/)
  assert.match(clientCheck({ name: 'a.ogg', size: 1 }, [{ kind: 'audio' }]), /1 âm thanh/)
})

test('formatBytes in Vietnamese decimals', () => {
  assert.equal(formatBytes(500), '500 B')
  assert.equal(formatBytes(1536), '1,5 KB')
  assert.equal(formatBytes(2 * 1024 * 1024), '2,0 MB')
})

test('mediaErrorMessage maps codes and 413', () => {
  const e = (status, message) => ({ response: { status, data: { message } } })
  assert.match(mediaErrorMessage(e(400, 'MEDIA_TYPE_NOT_ALLOWED'), 'x'), /không nhận SVG/)
  assert.match(mediaErrorMessage(e(413, null), 'x'), /quá lớn/)
  assert.match(mediaErrorMessage(e(409, 'QUESTION_LOCKED'), 'x'), /đề thi/)
  assert.equal(mediaErrorMessage(e(500, 'OTHER'), 'fallback'), 'fallback')
})

test('resolveMediaUrl keeps relative URL for same-origin, prefixes API origin otherwise', async () => {
  const { resolveMediaUrl } = await import('../src/services/mediaView.js')
  assert.equal(resolveMediaUrl('/web/media/1?t=a', '/web'), '/web/media/1?t=a')
  assert.equal(resolveMediaUrl('/web/media/1?t=a', 'https://api.example.edu/web'), 'https://api.example.edu/web/media/1?t=a')
  assert.equal(resolveMediaUrl('https://x/y', '/web'), 'https://x/y')
  assert.equal(resolveMediaUrl('', '/web'), '')
})
