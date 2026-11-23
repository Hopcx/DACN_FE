// To-be T15 — Media phía học viên qua Chrome headless: học viên mở bài thi và phiên luyện tập có câu kèm ảnh + âm thanh →
// ảnh hiển thị (tải qua URL ký tạm của chính học viên), có thanh phát âm thanh; Admin mở "Media mồ côi" → xóa media mồ côi.
// Runner: DACN_Project/tests/TaskToBeT15StudentMediaFrontendSmoke.ps1. Biến: DACN_QA_STUDENT_EMAIL, DACN_QA_ADMIN_EMAIL,
// DACN_QA_PASSWORD, DACN_QA_TAG, DACN_QA_DATABASE, DACN_QA_ATTEMPT_ID, DACN_QA_PRACTICE_ID, DACN_QA_ORPHAN_NAME;
// tùy chọn DACN_FE_ORIGIN, DACN_CHROME_PATH, DACN_QA_SHOT_DIR.
import { spawn } from 'node:child_process'
import { mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

const env = (name) => { const value = process.env[name]; if (!value) throw new Error(`Missing ${name}`); return value }
const studentEmail = env('DACN_QA_STUDENT_EMAIL')
const adminEmail = env('DACN_QA_ADMIN_EMAIL')
const password = env('DACN_QA_PASSWORD')
const tag = env('DACN_QA_TAG')
const attemptId = env('DACN_QA_ATTEMPT_ID')
const practiceId = env('DACN_QA_PRACTICE_ID')
const orphanName = env('DACN_QA_ORPHAN_NAME')
if (env('DACN_QA_DATABASE') !== 'ProjectDACN_Task04Task09_Test') throw new Error('Only the named clone is writable')
const origin = process.env.DACN_FE_ORIGIN || 'https://localhost:5173'
const profile = await mkdtemp(path.join(tmpdir(), 'dacn-t15-media-'))
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

const imageLoaded = (page) => eventually(() => page.eval(`(() => { const img = document.querySelector('.question-media-view img')
  return !!img && img.complete && img.naturalWidth > 0 && img.getAttribute('src').startsWith('/web/media/') && img.getAttribute('src').includes('?t=') })()`),
  'student image rendered via signed URL')
const hasAudio = (page) => eventually(() => page.eval(`!!document.querySelector('.question-media-view audio[src*="/web/media/"]')`), 'student audio player')

const results = []
const pass = (step) => { results.push(step); console.log(`  PASS ${step}`) }
let page
try {
  const target = await eventually(async () => {
    const response = await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' })
    return response.ok ? response.json() : null
  }, 'Chrome endpoint')
  page = new Page(target.webSocketDebuggerUrl)
  await page.ready(); await page.call('Runtime.enable'); await page.call('Page.enable'); await page.call('Network.enable')

  await page.login(studentEmail, '/student/')
  await page.go(`/student/attempts/${attemptId}`)
  await page.waitText(`T15 FE câu ${tag}`, 'exam question', '.attempt-question')
  await imageLoaded(page); await hasAudio(page)
  await page.noErrorAlert('student exam media')
  await page.shot('t15-student-exam-media')
  pass('bài thi: câu có ảnh (tải qua URL ký của học viên) và thanh phát âm thanh')

  await page.go(`/student/practice/${practiceId}`)
  await page.waitText(`T15 FE câu ${tag}`, 'practice question', '.attempt-question')
  await imageLoaded(page); await hasAudio(page)
  await page.noErrorAlert('student practice media')
  pass('luyện tập: câu có ảnh và âm thanh')

  await page.login(adminEmail, '/admin/')
  await eventually(() => page.eval(`(() => { const el = [...document.querySelectorAll('a')].find((a) => a.innerText.trim().toLocaleLowerCase('vi') === 'media mồ côi')
    if (!el) return false; el.click(); return true })()`), 'menu Media mồ côi')
  await eventually(() => page.eval(`location.pathname === '/admin/media-orphans'`), 'open orphans page')
  await page.waitText(orphanName, 'orphan listed')
  await page.shot('t15-admin-orphans')
  await page.clickInRow(orphanName, 'Xóa')
  await eventually(() => page.eval(`(() => { const ok = [...document.querySelectorAll('.ant-popconfirm .ant-btn-primary, .ant-popover .ant-btn-primary')].pop()
    if (!ok) return false; ok.click(); return true })()`), 'confirm delete')
  await page.waitText('Đã xóa 1 media', 'delete message')
  await eventually(async () => !(await page.body()).includes(orphanName), 'orphan gone from list')
  pass('Admin: menu "Media mồ côi" liệt kê media mồ côi và xóa được')
  console.log(`T15_STUDENT_MEDIA_BROWSER_SMOKE=PASS;STEPS=${results.length};TAG=${tag}`)
} catch (error) {
  console.error(`T15_STUDENT_MEDIA_BROWSER_SMOKE=FAIL: ${error.message}`)
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
