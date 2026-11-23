// To-be T14 — Media câu hỏi qua Chrome headless: người ra đề mở "Sửa" câu hỏi → tải ảnh PNG thật (server kiểm magic bytes)
// → ảnh hiển thị qua URL ký tạm; tải file HTML giả đuôi .png → báo lỗi tiếng Việt; danh sách có dấu kẹp giấy.
// Runner: DACN_Project/tests/TaskToBeT14MediaFrontendSmoke.ps1. Biến: DACN_QA_EXAMINER_EMAIL, DACN_QA_PASSWORD, DACN_QA_TAG,
// DACN_QA_DATABASE, DACN_QA_PNG, DACN_QA_FAKE_PNG; tùy chọn DACN_FE_ORIGIN, DACN_CHROME_PATH, DACN_QA_SHOT_DIR.
import { spawn } from 'node:child_process'
import { mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

const env = (name) => { const value = process.env[name]; if (!value) throw new Error(`Missing ${name}`); return value }
const examinerEmail = env('DACN_QA_EXAMINER_EMAIL')
const password = env('DACN_QA_PASSWORD')
const tag = env('DACN_QA_TAG')
const pngPath = env('DACN_QA_PNG')
const fakePath = env('DACN_QA_FAKE_PNG')
if (env('DACN_QA_DATABASE') !== 'ProjectDACN_Task04Task09_Test') throw new Error('Only the named clone is writable')
const origin = process.env.DACN_FE_ORIGIN || 'https://localhost:5173'
const questionText = `T14 FE câu ${tag}`
const profile = await mkdtemp(path.join(tmpdir(), 'dacn-t14-media-'))
const port = 9300 + Math.floor(Math.random() * 1000)
const chromePath = process.env.DACN_CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const chrome = spawn(chromePath, ['--headless=new', '--no-first-run', '--no-default-browser-check', '--ignore-certificate-errors',
  '--remote-allow-origins=*', `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, '--window-size=1366,900', 'about:blank'], { stdio: 'ignore' })
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
async function eventually(fn, label, tries = 100) {
  let last
  for (let i = 0; i < tries; i += 1) {
    try { const value = await fn(); if (value) return value } catch (error) { last = error }
    await pause(200)
  }
  throw new Error(`${label} timed out${last ? `: ${last.message}` : ''}`)
}

class Page {
  nextId = 1
  pending = new Map()
  constructor(url) {
    this.socket = new WebSocket(url)
    this.socket.addEventListener('message', ({ data }) => {
      const message = JSON.parse(data)
      const waiter = this.pending.get(message.id)
      if (!waiter) return
      this.pending.delete(message.id)
      if (message.error) waiter.reject(new Error(message.error.message)); else waiter.resolve(message.result)
    })
  }
  ready() { return new Promise((resolve, reject) => { this.socket.addEventListener('open', resolve, { once: true }); this.socket.addEventListener('error', reject, { once: true }) }) }
  call(method, params = {}) {
    const id = this.nextId++
    return new Promise((resolve, reject) => { this.pending.set(id, { resolve, reject }); this.socket.send(JSON.stringify({ id, method, params })) })
  }
  async eval(expression) {
    const answer = await this.call('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })
    if (answer.exceptionDetails) throw new Error(`eval failed: ${answer.exceptionDetails.exception?.description || expression.slice(0, 80)}`)
    return answer.result.value
  }
  async go(route) {
    await this.call('Page.navigate', { url: `${origin}${route}` })
    await eventually(() => this.eval(`location.pathname === ${JSON.stringify(route)} && document.readyState === 'complete'`), `navigate ${route}`)
  }
  body() { return this.eval('document.body?.innerText || ""') }
  waitText(text, label = text, scope = 'body') {
    const needle = text.toLocaleLowerCase('vi')
    return eventually(async () => (await this.eval(`document.querySelector(${JSON.stringify(scope)})?.innerText || ''`))
      .toLocaleLowerCase('vi').includes(needle), `text "${label}"`)
  }
  fill(selector, value) {
    return eventually(() => this.eval(`(() => {
      const el = document.querySelector(${JSON.stringify(selector)}); if (!el) return false
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, ${JSON.stringify(String(value))})
      el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); return true })()`), `fill ${selector}`)
  }
  // Bấm nút có chữ `text` trong dòng bảng chứa `rowText`
  clickInRow(rowText, text) {
    return eventually(() => this.eval(`(() => {
      const row = [...document.querySelectorAll('tr')].find((node) => node.innerText.includes(${JSON.stringify(rowText)})); if (!row) return false
      const el = [...row.querySelectorAll('button')].find((node) => node.innerText.trim() === ${JSON.stringify(text)} && !node.disabled)
      if (!el) return false; el.click(); return true })()`), `click "${text}" in row ${rowText}`)
  }
  click(text, scope = 'body') {
    return eventually(() => this.eval(`(() => {
      const root = document.querySelector(${JSON.stringify(scope)}); if (!root) return false
      const el = [...root.querySelectorAll('button')].find((node) => node.innerText.trim() === ${JSON.stringify(text)} && !node.disabled)
      if (!el) return false; el.click(); return true })()`), `click "${text}"`)
  }
  clickTab(text) {
    return eventually(() => this.eval(`(() => {
      const el = [...document.querySelectorAll('[role=tab]')].find((node) => node.innerText.trim() === ${JSON.stringify(text)})
      if (!el) return false; el.click(); return true })()`), `tab ${text}`)
  }
  async login(email, prefix) {
    await this.call('Network.clearBrowserCookies')
    await this.go('/auth/login')
    await this.eval('localStorage.clear(); sessionStorage.clear(); true')
    for (let attempt = 0; attempt < 6; attempt += 1) {
      await this.go('/auth/login')
      await this.fill('input.auth-input[type=text]', email)
      await this.fill('input.auth-input[type=password]', password)
      await this.eval(`document.querySelector('button.auth-submit').click()`)
      const outcome = await eventually(() => this.eval(`location.pathname.startsWith(${JSON.stringify(prefix)}) ? 'ok'
        : document.body.innerText.includes('quá nhanh') ? 'limited' : ''`), 'login landing')
      if (outcome === 'ok') return
      await pause(15000)
    }
    throw new Error('login rate limited')
  }
  // Tùy chọn DACN_QA_SHOT_DIR: lưu ảnh màn hình để kiểm bằng mắt
  async shot(name) {
    if (!process.env.DACN_QA_SHOT_DIR) return
    const { data } = await this.call('Page.captureScreenshot', { format: 'png' })
    await writeFile(path.join(process.env.DACN_QA_SHOT_DIR, `${name}.png`), Buffer.from(data, 'base64'))
  }
  async noErrorAlert(label) {
    const errors = await this.eval(`[...document.querySelectorAll('.ant-alert-error')].map((x) => x.innerText.trim()).filter(Boolean)`)
    if (errors.length) throw new Error(`${label}: error alert ${errors.join(' | ')}`)
  }
}

async function setFile(page, selector, file) {
  const { root } = await page.call('DOM.getDocument', { depth: -1, pierce: true })
  const { nodeId } = await page.call('DOM.querySelector', { nodeId: root.nodeId, selector })
  if (!nodeId) throw new Error(`file input not found: ${selector}`)
  await page.call('DOM.setFileInputFiles', { files: [file], nodeId })
}

const results = []
const pass = (step) => { results.push(step); console.log(`  PASS ${step}`) }
let page
try {
  const target = await eventually(async () => {
    const response = await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' })
    return response.ok ? response.json() : null
  }, 'Chrome endpoint')
  page = new Page(target.webSocketDebuggerUrl)
  await page.ready(); await page.call('Runtime.enable'); await page.call('Page.enable'); await page.call('Network.enable'); await page.call('DOM.enable')

  await page.login(examinerEmail, '/admin/')
  await page.go('/admin/questions')
  await page.clickInRow(questionText, 'Sửa')
  await page.waitText('Hình ảnh / Âm thanh (0/5)', 'media panel', '.ant-modal')
  await setFile(page, '.question-media input[type=file]', pngPath)
  await page.waitText('Hình ảnh / Âm thanh (1/5)', 'uploaded + attached', '.ant-modal')
  await eventually(() => page.eval(`(() => { const img = document.querySelector('.question-media img'); return !!img && img.complete && img.naturalWidth > 0
    && img.getAttribute('src').startsWith('/web/media/') && img.getAttribute('src').includes('?t=') })()`), 'image rendered via signed URL')
  await page.noErrorAlert('media upload')
  await page.shot('t14-question-media')
  pass('tải ảnh PNG → gắn vào câu → hiển thị qua URL ký tạm (/web/media/{id}?t=…)')

  await setFile(page, '.question-media input[type=file]', fakePath)
  await page.waitText('không nhận SVG', 'server rejects fake png', '.ant-modal')
  await page.waitText('Hình ảnh / Âm thanh (1/5)', 'still 1 media', '.ant-modal')
  pass('file HTML đặt đuôi .png bị server từ chối, báo lỗi tiếng Việt')

  await page.eval(`document.querySelector('.ant-modal-close')?.click(); true`)
  await eventually(() => page.eval(`(() => { const row = [...document.querySelectorAll('tr')].find((r) => r.innerText.includes(${JSON.stringify(questionText)}))
    return !!row?.querySelector('[aria-label="1 media"]') })()`), 'list shows media mark')
  pass('danh sách câu hỏi hiện dấu media')
  console.log(`T14_MEDIA_BROWSER_SMOKE=PASS;STEPS=${results.length};TAG=${tag}`)
} catch (error) {
  console.error(`T14_MEDIA_BROWSER_SMOKE=FAIL: ${error.message}`)
  try {
    const state = await page?.eval(`({ path: location.pathname, alerts: [...document.querySelectorAll('.ant-alert')].map((x) => x.innerText).join(' | '),
      text: document.body.innerText.slice(0, 800) })`)
    console.error(JSON.stringify(state))
  } catch { /* trang đã đóng */ }
  process.exitCode = 1
} finally {
  page?.socket.close()
  chrome.kill()
  await pause(500)
  await rm(profile, { recursive: true, force: true }).catch(() => {})
}
