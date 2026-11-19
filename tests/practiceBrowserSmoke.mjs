// To-be T7 — Luyện tập qua Chrome headless: tạo phiên "Cuối phiên" → trả lời → nộp → xem lại (lời giải);
// phiên "Từng câu" → kiểm tra từng câu (Đúng/Sai + lời giải, khóa lựa chọn) → tải lại vẫn thấy → nộp; lịch sử → Làm lại bộ này.
// Runner: DACN_Project/tests/TaskToBeT7PracticeFrontendSmoke.ps1 (tạo fixture theo tag, dọn trong finally).
// Biến môi trường: DACN_QA_EMAIL, DACN_QA_PASSWORD, DACN_QA_TAG, DACN_QA_SUBJECT_NAME, DACN_QA_DATABASE, tùy chọn DACN_FE_ORIGIN, DACN_CHROME_PATH.
import { spawn } from 'node:child_process'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

const env = (name) => { const value = process.env[name]; if (!value) throw new Error(`Missing ${name}`); return value }
const email = env('DACN_QA_EMAIL')
const password = env('DACN_QA_PASSWORD')
const tag = env('DACN_QA_TAG')
const subjectName = env('DACN_QA_SUBJECT_NAME')
if (env('DACN_QA_DATABASE') !== 'ProjectDACN_Task04Task09_Test') throw new Error('Only the named clone is writable')
const origin = process.env.DACN_FE_ORIGIN || 'https://localhost:5173'

const profile = await mkdtemp(path.join(tmpdir(), 'dacn-t7-practice-'))
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
  async go(route, full = false) {
    const running = await this.eval(`location.origin === ${JSON.stringify(origin)} && !!document.querySelector('#root > *')`).catch(() => false)
    if (running && !full && !route.startsWith('/auth/'))
      await this.eval(`window.history.pushState({}, '', ${JSON.stringify(route)}); window.dispatchEvent(new PopStateEvent('popstate'))`)
    else await this.call('Page.navigate', { url: `${origin}${route}` })
    await eventually(() => this.eval(`location.pathname === ${JSON.stringify(route)} && document.readyState === 'complete'`), `navigate ${route}`)
  }
  body() { return this.eval('document.body?.innerText || ""') }
  waitText(text, label = text) {
    const needle = text.toLocaleLowerCase('vi')
    return eventually(async () => (await this.body()).toLocaleLowerCase('vi').includes(needle), `text "${label}"`)
  }
  click(text, scope = 'body') {
    return eventually(() => this.eval(`(() => {
      const root = document.querySelector(${JSON.stringify(scope)}); if (!root) return false
      const el = [...root.querySelectorAll('button, a')].find((node) => node.innerText.trim() === ${JSON.stringify(text)} && !node.disabled)
      if (!el) return false; el.click(); return true })()`), `click "${text}"`)
  }
  // Ô chọn đáp án / radio theo chữ nhãn (antd Radio/Checkbox: bấm input bên trong label)
  choose(labelText) {
    return eventually(() => this.eval(`(() => {
      const label = [...document.querySelectorAll('label')].find((node) => node.innerText.trim() === ${JSON.stringify(labelText)})
      const input = label?.querySelector('input'); if (!input || input.disabled) return false; input.click(); return true })()`), `choose "${labelText}"`)
  }
  async select(ariaLabel, optionText) {
    await eventually(() => this.eval(`(() => {
      if (document.querySelector('.ant-select-dropdown:not(.ant-select-dropdown-hidden) .ant-select-item-option')) return true
      const select = document.querySelector('[aria-label=${JSON.stringify(ariaLabel)}]')?.closest('.ant-select'); if (!select) return false
      const target = select.querySelector('.ant-select-selector') || select.querySelector('.ant-select-content') || select.firstElementChild || select
      target.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, button: 0 })); return false })()`), `open ${ariaLabel}`, 40)
    await eventually(() => this.eval(`(() => {
      const option = [...document.querySelectorAll('.ant-select-dropdown:not(.ant-select-dropdown-hidden) .ant-select-item-option')]
        .find((node) => node.innerText.trim().startsWith(${JSON.stringify(optionText)})); if (!option) return false
      option.click(); return true })()`), `choose ${optionText}`)
  }
  fill(selector, value) {
    return eventually(() => this.eval(`(() => {
      const el = document.querySelector(${JSON.stringify(selector)}); if (!el) return false
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, ${JSON.stringify(String(value))})
      el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true }))
      el.dispatchEvent(new Event('blur', { bubbles: true })); return true })()`), `fill ${selector}`)
  }
  modalOk() {
    return eventually(() => this.eval(`(() => {
      const button = [...document.querySelectorAll('.ant-modal-wrap:not([style*="display: none"]) .ant-modal-footer .ant-btn-primary')].pop()
      if (!button || button.disabled) return false; button.click(); return true })()`), 'modal OK')
  }
  async noErrorAlert(label) {
    const errors = await this.eval(`[...document.querySelectorAll('.ant-alert-error')].map((x) => x.innerText.trim()).filter(Boolean)`)
    if (errors.length) throw new Error(`${label}: error alert ${errors.join(' | ')}`)
  }
  currentQuestion() { return this.eval(`document.querySelector('.attempt-question .attempt-question__content')?.innerText.trim() || ''`) }
  sessionPath() { return this.eval(`location.pathname`) }
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
  await page.ready(); await page.call('Runtime.enable'); await page.call('Page.enable')

  for (let attempt = 0; attempt < 6; attempt += 1) {
    await page.go('/auth/login')
    await page.fill('input.auth-input[type=text]', email)
    await page.fill('input.auth-input[type=password]', password)
    await page.eval(`document.querySelector('button.auth-submit').click()`)
    const outcome = await eventually(() => page.eval(`location.pathname.startsWith('/student/') ? 'ok'
      : document.body.innerText.includes('quá nhanh') ? 'limited' : ''`), 'login landing')
    if (outcome === 'ok') break
    await pause(15000)
  }
  await page.waitText('Luyện tập', 'menu Luyện tập')
  await page.click('Luyện tập', '.ant-layout-sider, nav, aside, header')
    .catch(() => page.go('/student/practice'))
  await eventually(() => page.eval(`location.pathname === '/student/practice'`), 'open practice page')
  await page.waitText('Tạo phiên luyện tập'); await page.waitText('Lịch sử luyện tập')
  pass('menu Luyện tập mở trang tạo phiên + lịch sử')

  // ---- Phiên "Cuối phiên": 2 câu, trả lời đúng cả hai, nộp → 2/2, xem lại có lời giải
  async function createSession(mode) {
    await page.select('Môn luyện tập', subjectName)
    await page.fill('input[aria-label="Số câu"]', 2)
    if (mode === 'perQuestion') await page.choose('Từng câu (bấm “Kiểm tra câu này”)')
    await page.click('Bắt đầu luyện tập')
    await eventually(async () => /^\/student\/practice\/[0-9a-f-]{36}$/.test(await page.sessionPath()), `start ${mode}`)
    await page.waitText(`Luyện tập: ${subjectName}`)
    await page.noErrorAlert(`session ${mode}`)
    return page.sessionPath()
  }
  const endPath = await createSession('end')
  await page.waitText('Cuối phiên')
  if ((await page.body()).includes('Kiểm tra câu này')) throw new Error('Phiên Cuối phiên không được có nút Kiểm tra câu này.')
  await page.choose('A. OK'); await page.click('Câu sau')
  await eventually(async () => (await page.currentQuestion()).length > 0, 'question 2')
  await page.choose('A. OK')
  if ((await page.body()).includes(`EXPL-${tag}`)) throw new Error('Lộ lời giải trước khi nộp.')
  await page.click('Nộp bài', '.attempt-actions'); await page.modalOk()
  await eventually(() => page.eval(`document.querySelector('.practice-score')?.innerText.trim() === '2/2'`), 'kết quả 2/2')
  await page.waitText(`EXPL-${tag}`, 'lời giải sau khi nộp')
  await page.waitText('Đáp án đúng'); await page.noErrorAlert('review end')
  pass('Cuối phiên: trả lời 2 câu, nộp, xem lại 2/2 có đáp án đúng và lời giải')

  // To-be T8: bấm nhanh liên tiếp (xếp hàng theo câu) — server phải khớp lần bấm cuối
  const endId = endPath.split('/').pop()
  const serverFlags = () => page.eval(`(async () => { const client = (await import('/src/api/axiosClient.js')).default
    return (await client.get('/review-flags', { params: { sourceKind: 'practice', sourceId: ${JSON.stringify(endId)} } })).data.data.questionIds.length })()`)
  const clickFlagButton = (times) => page.eval(`(() => { for (let i = 0; i < ${times}; i += 1) {
    const button = [...document.querySelectorAll('.attempt-question button')].find((x) => ['Đánh dấu', 'Bỏ đánh dấu'].includes(x.innerText.trim()))
    button.click() } return true })()`)
  await clickFlagButton(2)
  await page.waitText('Đánh dấu')
  await pause(1500)
  if ((await serverFlags()) !== 0) throw new Error('Đánh dấu → bỏ nhanh: server vẫn còn cờ.')
  await clickFlagButton(3)
  await eventually(async () => (await serverFlags()) === 1, 'three fast clicks end flagged')
  await page.waitText('Bỏ đánh dấu')
  pass('T8: bấm đánh dấu nhanh liên tiếp, server khớp lần bấm cuối')

  // ---- Phiên "Từng câu": câu 1 đúng, tải lại vẫn thấy, câu 2 sai, nộp → 1/2
  await page.go('/student/practice')
  await page.waitText('Tạo phiên luyện tập')
  const pqPath = await createSession('perQuestion')
  await page.waitText('Kiểm tra câu này')
  const first = await page.currentQuestion()
  await page.choose('A. OK'); await page.click('Kiểm tra câu này')
  await page.waitText(`EXPL-${tag} ${first.split(' ').pop()}`, 'lời giải câu 1 sau kiểm tra')
  await eventually(() => page.eval(`[...document.querySelectorAll('.attempt-question .ant-tag')].some((x) => x.innerText.trim() === 'Đúng')`), 'tag Đúng')
  if (await page.eval(`!!document.querySelector('.attempt-question .ant-radio-wrapper')`)) throw new Error('Câu đã kiểm tra vẫn chọn lại được.')
  pass('Từng câu: kiểm tra câu 1 → Đúng, đáp án đúng, lời giải, khóa lựa chọn')
  // To-be T8: đánh dấu câu 1 (lưu ở server) trước khi tải lại
  await page.click('Đánh dấu', '.attempt-question')
  await page.waitText('Bỏ đánh dấu')
  // Chờ server xác nhận (không dùng khoảng chờ cố định) rồi mới tải lại trang
  await eventually(() => page.eval(`(async () => { const client = (await import('/src/api/axiosClient.js')).default
    const data = (await client.get('/review-flags', { params: { sourceKind: 'practice', sourceId: ${JSON.stringify(pqPath.split('/').pop())} } })).data.data
    return data.questionIds.length === 1 })()`), 'flag saved on server')
  await page.go(pqPath, true)
  await page.waitText('Bỏ đánh dấu', 'đánh dấu còn sau khi tải lại')
  if (!(await page.eval(`!!document.querySelector('.palette-item.is-flagged')`))) throw new Error('Bảng câu không hiện cờ đánh dấu.')
  pass('T8: đánh dấu câu lưu ở server, còn sau khi tải lại')
  await page.waitText(`EXPL-${tag} ${first.split(' ').pop()}`, 'lời giải còn sau khi tải lại')
  pass('tải lại trang vẫn thấy kết quả câu đã kiểm tra')
  await page.click('Câu sau')
  const second = await eventually(async () => { const text = await page.currentQuestion(); return text && text !== first ? text : '' }, 'question 2')
  if ((await page.body()).includes(`EXPL-${tag} ${second.split(' ').pop()}`)) throw new Error('Lộ lời giải câu chưa kiểm tra.')
  await page.choose('B. NO'); await page.click('Kiểm tra câu này')
  await eventually(() => page.eval(`[...document.querySelectorAll('.attempt-question .ant-tag')].some((x) => x.innerText.trim() === 'Sai')`), 'tag Sai')
  await page.click('Nộp bài', '.attempt-actions'); await page.modalOk()
  await eventually(() => page.eval(`document.querySelector('.practice-score')?.innerText.trim() === '1/2'`), 'kết quả 1/2')
  await page.noErrorAlert('review perQuestion')
  // To-be T8: xem lại → "Chỉ câu đã đánh dấu" chỉ còn 1 ô, đúng câu đã đánh dấu
  await page.eval(`document.querySelector('[aria-label="Chỉ câu đã đánh dấu"]').click()`)
  await eventually(() => page.eval(`document.querySelectorAll('.attempt-palette__grid .palette-item').length === 1`), 'filter flagged')
  if ((await page.currentQuestion()) !== first) throw new Error('Lọc đánh dấu hiện sai câu.')
  pass('T8: xem lại lọc "Chỉ câu đã đánh dấu"')
  pass('Từng câu: câu 2 → Sai, nộp, kết quả 1/2')

  // ---- Lịch sử + Làm lại bộ này
  await page.go('/student/practice')
  await eventually(() => page.eval(`[...document.querySelectorAll('.ant-table-row')].filter((r) => r.innerText.includes('Đã nộp')).length >= 2`), 'history rows')
  await page.waitText('2/2'); await page.waitText('1/2')
  await page.click('Làm lại bộ này', '.ant-table-tbody')
  await eventually(async () => { const now = await page.sessionPath(); return /^\/student\/practice\/[0-9a-f-]{36}$/.test(now) && now !== endPath && now !== pqPath }, 'retry session')
  await page.waitText('Đang làm'); await page.noErrorAlert('retry')
  pass('lịch sử có 2 phiên đã nộp; "Làm lại bộ này" mở phiên mới')
  console.log(`T7_PRACTICE_BROWSER_SMOKE=PASS;STEPS=${results.length};TAG=${tag}`)
} catch (error) {
  console.error(`T7_PRACTICE_BROWSER_SMOKE=FAIL: ${error.message}`)
  try {
    const state = await page?.eval(`({ path: location.pathname, alerts: [...document.querySelectorAll('.ant-alert, .ant-form-item-explain-error')].map((x) => x.innerText).join(' | '),
      text: document.body.innerText.slice(0, 600) })`)
    console.error(JSON.stringify(state))
  } catch { /* trang đã đóng */ }
  process.exitCode = 1
} finally {
  page?.socket.close()
  chrome.kill()
  await pause(500)
  await rm(profile, { recursive: true, force: true }).catch(() => {})
}
