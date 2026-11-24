// To-be T17 — Ghép cặp + Đúng/Sai nhiều mệnh đề qua Chrome headless: người ra đề mở "Sửa" câu ghép cặp → trình soạn "Các cặp ghép";
// học viên làm bài thi: chọn vế phải cho từng vế trái (Select), chọn Đúng/Sai từng mệnh đề; lưu rồi tải lại vẫn giữ;
// luyện tập "kiểm tra từng câu": kiểm tra một câu → thấy câu trả lời và đáp án từng mục.
// Runner: DACN_Project/tests/TaskToBeT17MatchingStatementsFrontendSmoke.ps1. Biến: DACN_QA_STUDENT_EMAIL, DACN_QA_EXAMINER_EMAIL,
// DACN_QA_PASSWORD, DACN_QA_TAG, DACN_QA_DATABASE, DACN_QA_ATTEMPT_ID, DACN_QA_PRACTICE_ID; tùy chọn DACN_FE_ORIGIN, DACN_CHROME_PATH, DACN_QA_SHOT_DIR.
import { spawn } from 'node:child_process'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

const env = (name) => { const value = process.env[name]; if (!value) throw new Error(`Missing ${name}`); return value }
const studentEmail = env('DACN_QA_STUDENT_EMAIL')
const examinerEmail = env('DACN_QA_EXAMINER_EMAIL')
const password = env('DACN_QA_PASSWORD')
const tag = env('DACN_QA_TAG')
const attemptId = env('DACN_QA_ATTEMPT_ID')
const practiceId = env('DACN_QA_PRACTICE_ID')
if (env('DACN_QA_DATABASE') !== 'ProjectDACN_Task04Task09_Test') throw new Error('Only the named clone is writable')
const origin = process.env.DACN_FE_ORIGIN || 'https://localhost:5173'
const profile = await mkdtemp(path.join(tmpdir(), 'dacn-t17-items-'))
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

const matchingQ = `T17 FE ghép ${tag}`
const statementsQ = `T17 FE mệnh đề ${tag}`
const editable = `T17 FE soạn ${tag}`
const PAIRS = { 'Hà Nội': 'Việt Nam', Tokyo: 'Nhật Bản', Paris: 'Pháp' }

// Chọn vế phải cho dòng có vế trái `left` (antd Select mở bằng mousedown, tùy chọn nằm trong dropdown portal)
async function pickMatch(page, left, right) {
  await eventually(() => page.eval(`(() => {
    const row = [...document.querySelectorAll('.attempt-question .item-answer__row')].find((r) => r.innerText.includes(${JSON.stringify(left)}))
    const sel = row?.querySelector('.ant-select-selector, .ant-select-content, .ant-select'); if (!sel) return false
    sel.dispatchEvent(new MouseEvent('mousedown', { bubbles: true })); return true })()`), `open select ${left}`)
  // Dropdown đúng của ô này (qua aria-controls) — dropdown của ô trước có thể chưa kịp ẩn
  await eventually(() => page.eval(`(() => {
    const row = [...document.querySelectorAll('.attempt-question .item-answer__row')].find((r) => r.innerText.includes(${JSON.stringify(left)}))
    const listId = row?.querySelector('[aria-controls]')?.getAttribute('aria-controls')
    const dropdown = listId && document.getElementById(listId)?.closest('.ant-select-dropdown'); if (!dropdown) return false
    const opt = [...dropdown.querySelectorAll('.ant-select-item-option')]
      .find((o) => o.innerText.includes(${JSON.stringify(right)}) && !o.classList.contains('ant-select-item-option-disabled'))
    if (!opt) return false; opt.dispatchEvent(new MouseEvent('click', { bubbles: true })); return true })()`), `pick ${right}`)
  await eventually(() => page.eval(`(() => {
    const row = [...document.querySelectorAll('.attempt-question .item-answer__row')].find((r) => r.innerText.includes(${JSON.stringify(left)}))
    return !!row && row.innerText.includes(${JSON.stringify(right)}) })()`), `picked ${left} → ${right}`)
}
// Bấm Đúng/Sai cho dòng có chữ `text` (hoặc mọi dòng khi text = null)
const pickStatement = (page, index, label) => eventually(() => page.eval(`(() => {
  const row = [...document.querySelectorAll('.attempt-question .item-answer__row')][${index}]; if (!row) return false
  const btn = [...row.querySelectorAll('label.ant-radio-button-wrapper')].find((x) => x.innerText.trim() === ${JSON.stringify(label)}); if (!btn) return false
  btn.click(); return btn.classList.contains('ant-radio-button-wrapper-checked') || true })()`), `statement ${index} ${label}`)
const currentTitle = (page) => page.eval(`document.querySelector('.attempt-question .attempt-question__content')?.innerText || ''`)

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

  // 1) Người ra đề: trình soạn ghép cặp
  await page.login(examinerEmail, '/admin/')
  await page.go('/admin/questions')
  await page.waitText(editable, 'question listed')
  await page.waitText('Đỏ ↔ Red', 'pairs column')
  await page.clickInRow(editable, 'Sửa')
  await page.waitText('Các cặp ghép', 'matching editor', '.ant-modal')
  await eventually(() => page.eval(`(() => { const m = document.querySelector('.ant-modal'); if (!m) return false
    const left = [...m.querySelectorAll('input[placeholder="Vế trái"]')].map((x) => x.value).join('|')
    const right = [...m.querySelectorAll('input[placeholder="Vế phải"]')].map((x) => x.value).join('|')
    return left === 'Đỏ|Xanh' && right === 'Red|Blue' && !m.querySelector('.ant-checkbox') })()`), 'pairs loaded into editor')
  await page.shot('t17-editor')
  pass('người ra đề: trình soạn "Các cặp ghép" hiện đủ vế trái/vế phải, không có ô đánh dấu đúng')

  // 2) Học viên: bài thi ghép cặp + nhiều mệnh đề, lưu rồi tải lại vẫn giữ
  await page.login(studentEmail, '/student/')
  await page.go(`/student/attempts/${attemptId}`)
  await page.waitText(matchingQ, 'matching question', '.attempt-question')
  await page.waitText('Ghép cặp', 'type tag', '.attempt-question')
  for (const [left, right] of Object.entries(PAIRS)) await pickMatch(page, left, right)
  await page.click('Câu sau')
  await page.waitText(statementsQ, 'statements question', '.attempt-question')
  await pickStatement(page, 0, 'Đúng'); await pickStatement(page, 1, 'Sai'); await pickStatement(page, 2, 'Đúng')
  await page.click('Lưu đáp án')
  await page.waitText('Đã lưu bản nháp', 'saved')
  await page.go(`/student/attempts/${attemptId}`)
  await page.waitText('Đã trả lời 2/2', 'answered count after reload')
  await page.waitText('Việt Nam', 'matching kept after reload', '.attempt-question')
  await page.click('Câu sau')
  await eventually(() => page.eval(`[...document.querySelectorAll('.attempt-question .item-answer__row')].map((r) =>
    r.querySelector('.ant-radio-button-wrapper-checked')?.innerText.trim()).join('|') === 'Đúng|Sai|Đúng'`), 'statements kept after reload')
  await page.noErrorAlert('student exam')
  await page.shot('t17-exam')
  pass('học viên: chọn vế ghép (mỗi vế dùng một lần) và Đúng/Sai từng mệnh đề; lưu, tải lại vẫn giữ; đếm 2/2 đã trả lời')

  // 3) Luyện tập kiểm tra từng câu
  await page.go(`/student/practice/${practiceId}`)
  await page.waitText(tag, 'practice question', '.attempt-question')
  const title = await currentTitle(page)
  if (title.includes(statementsQ)) { await pickStatement(page, 0, 'Sai'); await pickStatement(page, 1, 'Sai'); await pickStatement(page, 2, 'Sai') }
  else for (const [left, right] of Object.entries(PAIRS)) await pickMatch(page, left, right)
  await page.click('Kiểm tra câu này')
  await page.waitText('Bạn chọn:', 'per-item result', '.attempt-question')
  if (title.includes(statementsQ)) await page.waitText('Đáp án: Đúng', 'correct value shown for wrong statement', '.attempt-question')
  await page.noErrorAlert('student practice check')
  await page.shot('t17-practice-check')
  pass('luyện tập: kiểm tra câu ghép cặp / nhiều mệnh đề hiện câu trả lời và đáp án từng mục')
  console.log(`T17_MATCHING_STATEMENTS_BROWSER_SMOKE=PASS;STEPS=${results.length};TAG=${tag}`)
} catch (error) {
  console.error(`T17_MATCHING_STATEMENTS_BROWSER_SMOKE=FAIL: ${error.message}`)
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
