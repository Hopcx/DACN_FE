// P4 — duyệt giao diện Admin (tài khoản Excel, export câu hỏi, nhật ký) và Giảng viên (tổng quan) qua Chrome headless.
// KHÔNG có runner ở repo FE: cần script PowerShell tạo fixture ở repo BE (DACN_Project/tests, việc riêng) gọi file này.
// Chưa có runner thì coi như "browser smoke chưa chạy", không báo pass.
// Biến môi trường: DACN_QA_PASSWORD, DACN_QA_TAG, DACN_QA_ADMIN, DACN_QA_TEACHER, DACN_QA_DATABASE (ProjectDACN_Task04Task09_Test),
// DACN_QA_SUBJECT_NAME, DACN_QA_CLASS, DACN_QA_BAD_ACCOUNTS_FILE (file .xlsx có lỗi, do runner tạo), tùy chọn DACN_QA_BAD_ACCOUNTS_EMAIL
// (email nằm trong file lỗi, dùng để xác nhận không tạo user), DACN_FE_ORIGIN, DACN_CHROME_PATH.
import { execFileSync, spawn } from 'node:child_process'
import { mkdtemp, readdir, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

const env = (name) => { const value = process.env[name]; if (!value) throw new Error(`Missing ${name}`); return value }
const password = env('DACN_QA_PASSWORD')
const tag = env('DACN_QA_TAG')
const accounts = { admin: env('DACN_QA_ADMIN'), teacher: env('DACN_QA_TEACHER') }
const subjectName = env('DACN_QA_SUBJECT_NAME')
const className = env('DACN_QA_CLASS')
const badAccountsFile = env('DACN_QA_BAD_ACCOUNTS_FILE')
const badAccountsEmail = process.env.DACN_QA_BAD_ACCOUNTS_EMAIL
const database = env('DACN_QA_DATABASE')
if (database !== 'ProjectDACN_Task04Task09_Test') throw new Error('Only the named clone is writable')
const origin = process.env.DACN_FE_ORIGIN || 'https://localhost:5173'
const forbidden = 'Bạn không có quyền xem trang này.'

const profile = await mkdtemp(path.join(tmpdir(), 'dacn-p4-admin-'))
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

/** Kết nối CDP cấp trình duyệt; mỗi tab được gắn qua session (flatten). */
class Browser {
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
  send(method, params = {}, sessionId) {
    const id = this.nextId++
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject })
      this.socket.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }))
    })
  }
  async page() {
    const { browserContextId } = await this.send('Target.createBrowserContext', { disposeOnDetach: true })
    const { targetId } = await this.send('Target.createTarget', { url: 'about:blank', browserContextId })
    const { sessionId } = await this.send('Target.attachToTarget', { targetId, flatten: true })
    const page = new Page(this, sessionId, browserContextId)
    await page.call('Runtime.enable'); await page.call('Page.enable')
    return page
  }
}
class Page {
  constructor(browser, sessionId, contextId) { this.browser = browser; this.sessionId = sessionId; this.contextId = contextId }
  call(method, params) { return this.browser.send(method, params, this.sessionId) }
  async eval(expression) {
    lastPage = this
    const answer = await this.call('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })
    if (answer.exceptionDetails) throw new Error(`eval failed: ${answer.exceptionDetails.exception?.description || expression.slice(0, 80)}`)
    return answer.result.value
  }
  async go(route) {
    // Khi ứng dụng đã chạy thì chuyển trang phía client như người dùng bấm menu. Tải lại toàn trang sẽ gọi
    // /auth/refresh mỗi lần, mà API giới hạn 20 lần/phút/IP cho cả 4 role chạy chung máy.
    const running = await this.eval(`location.origin === ${JSON.stringify(origin)} && !!document.querySelector('#root > *')`).catch(() => false)
    // DACN_QA_FULL_RELOAD=1: luôn tải lại toàn trang (mỗi lần gọi /auth/refresh) để kiểm hạn mức refresh theo phiên.
    if (running && !route.startsWith('/auth/') && process.env.DACN_QA_FULL_RELOAD !== '1') {
      await this.eval(`window.history.pushState({}, '', ${JSON.stringify(route)}); window.dispatchEvent(new PopStateEvent('popstate'))`)
    } else await this.call('Page.navigate', { url: `${origin}${route}` })
    await eventually(() => this.eval(`location.pathname === ${JSON.stringify(route.split('?')[0])} && document.readyState === 'complete'`), `navigate ${route}`)
  }
  body() { return this.eval('document.body?.innerText || ""') }
  // Không phân biệt hoa/thường: tiêu đề trang dùng text-transform: uppercase nên innerText trả chữ in hoa.
  waitText(text, label = text) {
    const needle = text.toLocaleLowerCase('vi')
    return eventually(async () => (await this.body()).toLocaleLowerCase('vi').includes(needle), `text "${label}"`)
  }
  // Bấm phần tử khớp chữ (button/a/tab); scope tùy chọn theo CSS selector.
  click(text, scope = 'body') {
    return eventually(() => this.eval(`(() => {
      const root = document.querySelector(${JSON.stringify(scope)}); if (!root) return false
      const el = [...root.querySelectorAll('button, a, [role=tab], .ant-tabs-tab-btn')]
        .find((node) => node.innerText.trim() === ${JSON.stringify(text)} && !node.disabled)
      if (!el) return false; el.click(); return true })()`), `click "${text}"`)
  }
  fill(selector, value) {
    return eventually(() => this.eval(`(() => {
      const el = document.querySelector(${JSON.stringify(selector)}); if (!el) return false
      const proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype
      Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, ${JSON.stringify(value)})
      el.dispatchEvent(new Event('input', { bubbles: true })); return true })()`), `fill ${selector}`)
  }
  async login(email, expectedPath) {
    // API giới hạn tần suất đăng nhập; khi FE báo "thao tác quá nhanh" thì chờ rồi thử lại.
    for (let attempt = 0; attempt < 6; attempt += 1) {
      await this.go('/auth/login')
      await this.fill('input.auth-input[type=text]', email)
      await this.fill('input.auth-input[type=password]', password)
      await this.eval(`document.querySelector('button.auth-submit').click()`)
      const outcome = await eventually(() => this.eval(`location.pathname === ${JSON.stringify(expectedPath)} ? 'ok'
        : document.body.innerText.includes('quá nhanh') ? 'limited' : ''`), `login landing ${expectedPath}`)
      if (outcome === 'ok') return
      await pause(15000)
    }
    throw new Error(`login rate limit persisted for ${expectedPath}`)
  }
  // Bấm nút trong phần tử đầu tiên (thẻ, dòng bảng) có chứa chữ đã cho.
  clickIn(containerSelector, containsText, buttonText) {
    return eventually(() => this.eval(`(() => {
      const box = [...document.querySelectorAll(${JSON.stringify(containerSelector)})]
        .find((node) => node.innerText.includes(${JSON.stringify(containsText)})); if (!box) return false
      const el = [...box.querySelectorAll('button, a')].find((node) => node.innerText.trim() === ${JSON.stringify(buttonText)} && !node.disabled)
      if (!el) return false; el.click(); return true })()`), `click "${buttonText}" in "${containsText}"`)
  }
  // Ô nhập trong Form.Item của modal đang mở, tìm theo nhãn.
  fillField(label, value) {
    return eventually(() => this.eval(`(() => {
      const item = [...document.querySelectorAll('.ant-modal-wrap:not([style*="display: none"]) .ant-form-item')]
        .find((node) => node.querySelector('label')?.innerText.trim() === ${JSON.stringify(label)}); if (!item) return false
      const el = item.querySelector('textarea, input:not([type=search])'); if (!el) return false
      const proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype
      Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, ${JSON.stringify(String(value))})
      el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); return true })()`), `fill field ${label}`)
  }
  // Ant Design Select: mở bằng mousedown rồi chọn mục theo chữ.
  async chooseField(label, optionText) {
    await eventually(() => this.eval(`(() => {
      const item = [...document.querySelectorAll('.ant-modal-wrap:not([style*="display: none"]) .ant-form-item')]
        .find((node) => node.querySelector('label')?.innerText.trim() === ${JSON.stringify(label)}); if (!item) return false
      const selector = item.querySelector('.ant-select-selector, .ant-select'); if (!selector) return false
      selector.dispatchEvent(new MouseEvent('mousedown', { bubbles: true })); return true })()`), `open select ${label}`)
    await eventually(() => this.eval(`(() => {
      const option = [...document.querySelectorAll('.ant-select-dropdown:not(.ant-select-dropdown-hidden) .ant-select-item-option')]
        .find((node) => ${JSON.stringify(optionText)} === null || node.innerText.trim() === ${JSON.stringify(optionText)}); if (!option) return false
      option.click(); return true })()`), `choose ${optionText}`)
  }
  modalOk() {
    return eventually(() => this.eval(`(() => {
      const button = [...document.querySelectorAll('.ant-modal-wrap:not([style*="display: none"]) .ant-modal-footer .ant-btn-primary')].pop()
      if (!button || button.disabled) return false; button.click(); return true })()`), 'modal OK')
  }
  popconfirmOk() {
    return eventually(() => this.eval(`(() => {
      const button = [...document.querySelectorAll('.ant-popover:not(.ant-popover-hidden) .ant-btn-primary')].pop()
      if (!button) return false; button.click(); return true })()`), 'popconfirm OK')
  }
  async noErrorAlert(label) {
    const errors = await this.eval(`[...document.querySelectorAll('.ant-alert-error')].map((x) => x.innerText.trim()).filter(Boolean)`)
    if (errors.length) throw new Error(`${label}: error alert ${errors.join(' | ')}`)
  }
  close() { return this.browser.send('Target.disposeBrowserContext', { browserContextId: this.contextId }) }
}
// Chỉ dùng để dời giờ fixture (hết hạn lượt thi, kết thúc lịch); mọi thao tác nghiệp vụ đi qua giao diện.
function sql(query) {
  return execFileSync('sqlcmd', ['-S', '.', '-d', database, '-E', '-No', '-C', '-b', '-I', '-W', '-h', '-1',
    '-Q', `SET NOCOUNT ON; IF DB_NAME() <> N'${database}' THROW 51211, 'Wrong database', 1; ${query}`], { encoding: 'utf8' }).trim()
}
let lastPage
const results = []
const pass = (role, step) => { results.push(`${role}: ${step}`); console.log(`  PASS [${role}] ${step}`) }

// Cho phép tải file về thư mục riêng của context rồi chờ file xuất hiện.
async function allowDownloads(page) {
  const downloadPath = await mkdtemp(path.join(tmpdir(), 'dacn-p4-dl-'))
  await page.browser.send('Browser.setDownloadBehavior', { behavior: 'allow', downloadPath, browserContextId: page.contextId, eventsEnabled: false })
  return downloadPath
}
async function waitDownload(dir, pattern, label) {
  return eventually(async () => (await readdir(dir)).find((name) => pattern.test(name) && !name.endsWith('.crdownload')), `download ${label}`, 150)
}
// Ant Design Select (ngoài Form.Item): mở bộ chọn chứa chữ rồi chọn mục theo chữ.
async function chooseSelect(page, selectText, optionText) {
  // antd 6 (@rc-component/select): việc mở nằm ở onInternalMouseDown của SelectInput; mousedown chỉ bubble lên,
  // nên gửi vào phần tử con (nội dung/selector) rồi gửi lại nếu dropdown chưa hiện (chỉ gửi khi đang đóng, tránh bật/tắt).
  await eventually(() => page.eval(`(() => {
    const visibleDropdown = () => document.querySelector('.ant-select-dropdown:not(.ant-select-dropdown-hidden) .ant-select-item-option')
    if (visibleDropdown()) return true
    const select = [...document.querySelectorAll('.ant-select')].find((node) => node.innerText.includes(${JSON.stringify(selectText)})); if (!select) return false
    const target = select.querySelector('.ant-select-selector') || select.querySelector('.ant-select-content') || select.firstElementChild || select
    target.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, button: 0 })); return false })()`), `open select ${selectText}`, 40)
  await eventually(() => page.eval(`(() => {
    const option = [...document.querySelectorAll('.ant-select-dropdown:not(.ant-select-dropdown-hidden) .ant-select-item-option')]
      .find((node) => node.innerText.trim() === ${JSON.stringify(optionText)}); if (!option) return false; option.click(); return true })()`), `choose ${optionText}`)
}

let browser
const downloadDirs = []
try {
  const version = await eventually(async () => {
    const response = await fetch(`http://127.0.0.1:${port}/json/version`); return response.ok ? response.json() : null
  }, 'Chrome endpoint')
  browser = new Browser(version.webSocketDebuggerUrl)
  await browser.ready()

  // ---- Admin: tài khoản Excel
  const admin = await browser.page()
  const dir = await allowDownloads(admin); downloadDirs.push(dir)
  await admin.login(accounts.admin, '/admin/dashboard')
  await admin.go('/admin/users')
  await admin.click('Tải mẫu Excel')
  await waitDownload(dir, /^dacn-accounts-v1\.xlsx$/, 'account template'); pass('Admin', 'tải mẫu Excel tài khoản')
  await admin.click('Xuất Excel')
  await waitDownload(dir, /^dacn-accounts\.xlsx$/, 'account export'); pass('Admin', 'xuất Excel tài khoản')
  await admin.click('Nhập từ Excel')
  await admin.waitText('Nhập tài khoản từ Excel')
  await chooseSelect(admin, 'Vai trò cho cả file', 'Học viên')
  const { root } = await admin.call('DOM.getDocument', { depth: 0 })
  const { nodeId } = await admin.call('DOM.querySelector', { nodeId: root.nodeId, selector: 'input[type=file][aria-label="Chọn file tài khoản Excel"]' })
  await admin.call('DOM.setFileInputFiles', { files: [path.resolve(badAccountsFile)], nodeId })
  await eventually(() => admin.eval(`[...document.querySelectorAll('.ant-modal-footer .ant-btn-primary')].some((b) => b.innerText.includes('Nhập tài khoản') && !b.disabled)`), 'import enabled')
  await admin.click('Nhập tài khoản', '.ant-modal-footer'); await admin.popconfirmOk()
  await admin.waitText('Mã lỗi')
  if (badAccountsEmail) {
    const count = sql(`SELECT COUNT(*) FROM dbo.Users WHERE Email = N'${badAccountsEmail.replace(/'/g, "''")}';`)
    if (count !== '0') throw new Error(`file lỗi đã tạo ${count} user`)
  }
  pass('Admin', 'nhập file lỗi: hiện bảng "Mã lỗi", không tạo user')

  // ---- Admin: export câu hỏi
  await admin.go('/admin/questions')
  await chooseSelect(admin, 'Môn học', subjectName)
  await admin.click('Xuất Excel v1'); await admin.popconfirmOk()
  await waitDownload(dir, /^dacn-questions-v1-subject-\d+\.xlsx$/, 'question export'); await admin.noErrorAlert('Admin question export')
  pass('Admin', 'xuất Excel v1 theo môn đã chọn')

  // ---- Admin: nhật ký
  await admin.go('/admin/audit')
  await admin.waitText('Xuất câu hỏi'); await admin.waitText('Xuất tài khoản'); await admin.noErrorAlert('Admin audit')
  await chooseSelect(admin, 'Hành động', 'Xuất câu hỏi')
  await admin.click('Lọc')
  await eventually(() => admin.eval(`(() => {
    const rows = [...document.querySelectorAll('.ant-table-tbody tr.ant-table-row')]
    return rows.length > 0 && rows.every((row) => row.innerText.includes('Xuất câu hỏi')) })()`), 'filtered logs')
  pass('Admin', 'nhật ký: thấy hai hành động xuất và lọc còn "Xuất câu hỏi"')
  // Lọc theo khoảng giờ: BE nhật ký hệ thống nhận fromUtc/toUtc (không phải from/to).
  await admin.eval('performance.clearResourceTimings()')
  await admin.fill('input[aria-label="Từ"]', '2020-01-01T00:00')
  await admin.fill('input[aria-label="Đến"]', '2099-01-01T00:00')
  await admin.click('Lọc')
  await eventually(() => admin.eval(`performance.getEntriesByType('resource').some((entry) =>
    entry.name.includes('/audit/logs') && /[?&]fromUtc=/.test(entry.name) && /[?&]toUtc=/.test(entry.name)
    && !/[?&](from|to)=/.test(entry.name))`), 'logs request with fromUtc/toUtc')
  pass('Admin', 'nhật ký: lọc theo khoảng giờ gửi fromUtc/toUtc')

  // ---- Giảng viên: tổng quan, không vào được nhật ký
  const teacher = await browser.page()
  await teacher.login(accounts.teacher, '/teacher/overview')
  await teacher.waitText('Theo lớp'); await teacher.waitText(className); await teacher.noErrorAlert('Teacher overview')
  pass('Teacher', 'đăng nhập vào tổng quan, thấy lớp trong bảng "Theo lớp"')
  await teacher.go('/admin/audit'); await teacher.waitText(forbidden)
  pass('Teacher', '/admin/audit bị chặn')

  for (const page of [admin, teacher]) await page.close()
  console.log(`P4_FE_BROWSER_SMOKE=PASS;STEPS=${results.length};TAG=${tag}`)
} catch (error) {
  console.error(`P4_FE_BROWSER_SMOKE=FAIL: ${error.message}`)
  try {
    const state = await lastPage?.eval(`({ path: location.pathname, modal: [...document.querySelectorAll('.ant-modal-wrap')].map((x) => x.innerText).join(' || ').slice(0, 800),
      alerts: [...document.querySelectorAll('.ant-alert, .ant-notification-notice, .ant-form-item-explain-error')].map((x) => x.innerText).join(' | ') })`)
    console.error(JSON.stringify(state))
  } catch { /* trang đã đóng */ }
  process.exitCode = 1
} finally {
  browser?.socket.close()
  chrome.kill()
  await pause(500)
  for (const target of [profile, ...downloadDirs]) await rm(target, { recursive: true, force: true }).catch(() => {})
}
