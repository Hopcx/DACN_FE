// To-be T10 — Xếp hạng lớp qua Chrome headless: giảng viên mở tab "Xếp hạng" (hạng, Top/Bottom, lịch chưa tính);
// học viên mở "Kết quả của tôi" (chỉ điểm/hạng của mình, không thấy tên bạn khác).
// Runner: DACN_Project/tests/TaskToBeT10RankingFrontendSmoke.ps1 (tạo fixture theo tag, dọn trong finally).
// Biến môi trường: DACN_QA_TEACHER_EMAIL, DACN_QA_STUDENT_EMAIL, DACN_QA_PASSWORD, DACN_QA_TAG, DACN_QA_DATABASE,
// tùy chọn DACN_FE_ORIGIN, DACN_CHROME_PATH.
import { spawn } from 'node:child_process'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

const env = (name) => { const value = process.env[name]; if (!value) throw new Error(`Missing ${name}`); return value }
const teacherEmail = env('DACN_QA_TEACHER_EMAIL')
const studentEmail = env('DACN_QA_STUDENT_EMAIL')
const password = env('DACN_QA_PASSWORD')
const tag = env('DACN_QA_TAG')
if (env('DACN_QA_DATABASE') !== 'ProjectDACN_Task04Task09_Test') throw new Error('Only the named clone is writable')
const origin = process.env.DACN_FE_ORIGIN || 'https://localhost:5173'
const className = `T10 FE ${tag}`

const profile = await mkdtemp(path.join(tmpdir(), 'dacn-t10-ranking-'))
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

  // ---- Giảng viên
  await page.login(teacherEmail, '/teacher/')
  await page.go('/teacher/classes')
  await page.clickInRow(className, 'Quản lý lớp')
  await page.waitText(`Lớp ${className}`)
  await page.clickTab('Xếp hạng')
  await page.waitText('Điểm tổng', 'cột Điểm tổng', '.class-ranking')
  await eventually(() => page.eval(`document.querySelectorAll('.class-ranking .ant-table-tbody tr.ant-table-row').length >= 6`), 'ranking rows')
  const rows = await page.eval(`[...document.querySelectorAll('.class-ranking .ant-table-tbody')][0]
    ? [...document.querySelector('.class-ranking .ant-table-tbody').querySelectorAll('tr.ant-table-row')].map((r) => r.innerText.replace(/\\s+/g, ' ').trim())
    : []`)
  if (rows.length !== 6) throw new Error(`Cần 6 dòng xếp hạng, có ${rows.length}: ${rows.join(' || ')}`)
  if (!/^1 .*T10 FE seed.*10.*Top/.test(rows[0])) throw new Error(`Dòng 1 lệch: ${rows[0]}`)
  if (!/^6 .*T10 FE s5.*5.*Bottom/.test(rows[5])) throw new Error(`Dòng 6 lệch: ${rows[5]}`)
  if (await page.eval(`document.querySelectorAll('.class-ranking tr.ranking-row--top').length`) !== 2) throw new Error('Cần 2 dòng Top tô màu')
  await page.waitText('Lịch chưa tính (1)', 'Lịch chưa tính', '.class-ranking')
  await page.waitText('Chưa kết thúc', 'lý do Chưa kết thúc', '.class-ranking')
  await page.waitText('thang 10', 'dòng giải thích cách tính', '.class-ranking')
  await page.noErrorAlert('teacher ranking')
  await page.shot('t10-teacher-ranking')
  pass('giảng viên: tab Xếp hạng có hạng, điểm thang 10, Top/Bottom tô màu, lịch chưa tính kèm lý do')

  // ---- Học viên
  await page.login(studentEmail, '/student/')
  await page.go('/student/classes')
  await page.clickInRow(className, 'Kết quả của tôi')
  await page.waitText('Hạng 1 / 6 học viên có điểm', 'hạng của tôi', '.ant-modal')
  await page.waitText('Điểm tổng (thang 10): 10', 'điểm tổng', '.ant-modal')
  const modal = await page.eval(`document.querySelector('.ant-modal')?.innerText || ''`)
  for (const leak of ['T10 FE s1', 'T10 FE s5', 'Top', 'Bottom']) if (modal.includes(leak)) throw new Error(`Hộp thoại học viên lộ "${leak}"`)
  await page.noErrorAlert('student ranking')
  await page.shot('t10-student-ranking')
  pass('học viên: "Kết quả của tôi" hiện hạng 1/6, điểm tổng, không lộ tên/nhóm bạn khác')
  console.log(`T10_RANKING_BROWSER_SMOKE=PASS;STEPS=${results.length};TAG=${tag}`)
} catch (error) {
  console.error(`T10_RANKING_BROWSER_SMOKE=FAIL: ${error.message}`)
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
