// P1/A05 — hồi quy giao diện 4 role qua Chrome headless → Vite (HTTPS) → API → SQL bản sao.
// Được gọi bởi DACN_Project/tests/TaskP1RoleRegressionSmoke.ps1 khi fixture ngắn hạn đang tồn tại.
// Mỗi role chạy trong một browser context riêng (cookie/phiên tách biệt), đăng nhập qua form thật.
import { execFileSync, spawn } from 'node:child_process'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

const env = (name) => { const value = process.env[name]; if (!value) throw new Error(`Missing ${name}`); return value }
const password = env('DACN_QA_PASSWORD')
const tag = env('DACN_QA_TAG')
const accounts = { admin: env('DACN_QA_ADMIN'), examiner: env('DACN_QA_EXAMINER'), teacher: env('DACN_QA_TEACHER'), student: env('DACN_QA_STUDENT') }
const examName = env('DACN_QA_EXAM')
const className = env('DACN_QA_CLASS')
const hiddenExamName = env('DACN_QA_HIDDEN_EXAM')
const examId = Number(env('DACN_QA_EXAM_ID'))
const teacherName = env('DACN_QA_TEACHER_NAME')
const database = env('DACN_QA_DATABASE')
if (database !== 'ProjectDACN_Task04Task09_Test') throw new Error('Only the named clone is writable')
const origin = process.env.DACN_FE_ORIGIN || 'https://localhost:5173'
const forbidden = 'Bạn không có quyền xem trang này.'

const profile = await mkdtemp(path.join(tmpdir(), 'dacn-p1-roles-'))
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

let browser
try {
  const version = await eventually(async () => {
    const response = await fetch(`http://127.0.0.1:${port}/json/version`); return response.ok ? response.json() : null
  }, 'Chrome endpoint')
  browser = new Browser(version.webSocketDebuggerUrl)
  await browser.ready()

  // ---- Student: lịch → làm bài → lưu → tải lại → nộp → lịch sử
  const student = await browser.page()
  await student.login(accounts.student, '/student/classes')
  await student.waitText(className); pass('Student', 'đăng nhập vào "Lớp", thấy lớp đã duyệt')
  await student.go('/student/schedules')
  await student.waitText(examName); await student.waitText('Còn 2 lượt làm bài')
  pass('Student', 'lịch thi dạng thẻ: tên bài, "Còn 2 lượt làm bài"')
  await student.clickIn('.schedule-card', examName, 'Vào làm bài')
  await eventually(() => student.eval(`location.pathname.startsWith('/student/attempts/')`), 'attempt route')
  await student.waitText('Thời gian còn lại')
  await student.eval(`document.querySelector('.attempt-options input[type=radio]').click()`)
  await student.click('Lưu đáp án', '.attempt-actions')
  await student.waitText('Bản nháp #1'); pass('Student', 'chọn đáp án, lưu bản nháp #1')
  await student.call('Page.reload')
  await eventually(() => student.eval(`document.body.innerText.includes('Bản nháp #1') && !!document.querySelector('.attempt-options input[type=radio]:checked')`), 'restore after reload')
  await eventually(() => student.eval(`document.querySelectorAll('.palette-item')[0]?.className.includes('is-answered')`), 'palette answered after reload')
  pass('Student', 'tải lại trang: khôi phục đáp án, bảng số câu đánh dấu đã trả lời')
  await student.click('Nộp bài', '.attempt-actions')
  await student.click('Nộp bài', '.ant-modal')
  await student.waitText('Đã nộp bài'); await student.waitText('Điểm:')
  pass('Student', 'nộp bài qua hộp xác nhận, thấy điểm')
  await student.go('/student/attempts')
  await student.waitText(examName); await student.waitText('Lần 1/2')
  pass('Student', 'lịch sử lượt thi có "Lần 1/2"')
  await student.go('/admin/users'); await student.waitText(forbidden)
  pass('Student', 'URL quản trị bị chặn ở FE')

  // Bài thi không cho xem kết quả (AllowViewResult=false)
  await student.go('/student/schedules')
  await student.clickIn('.schedule-card', hiddenExamName, 'Vào làm bài')
  await eventually(() => student.eval(`location.pathname.startsWith('/student/attempts/')`), 'hidden attempt route')
  await student.waitText('Thời gian còn lại')
  await student.eval(`document.querySelector('.attempt-options input[type=radio]').click()`)
  await student.click('Nộp bài', '.attempt-actions'); await student.click('Nộp bài', '.ant-modal')
  await student.waitText('Kết quả chưa được phép xem.')
  if ((await student.eval(`document.querySelector('section')?.innerText || ''`)).includes('Điểm:')) throw new Error('hidden result leaked a score')
  await student.go('/student/attempts')
  await eventually(() => student.eval(`[...document.querySelectorAll('tr')].some((row) => row.innerText.includes(${JSON.stringify(hiddenExamName)})
    && row.innerText.includes('Chưa công bố kết quả') && !/Đạt|Xem lại bài/.test(row.innerText))`), 'hidden history row')
  pass('Student', 'bài ẩn kết quả: nộp xong không thấy điểm; lịch sử "Chưa công bố kết quả"')

  // Hết giờ: bản nháp đã lưu được hệ thống tự chốt
  await student.go('/student/schedules')
  await student.waitText('Còn 1 lượt làm bài')
  await student.clickIn('.schedule-card', examName, 'Vào làm bài')
  await eventually(() => student.eval(`location.pathname.startsWith('/student/attempts/')`), 'second attempt route')
  await student.waitText('Thời gian còn lại')
  await student.eval(`document.querySelector('.attempt-options input[type=radio]').click()`)
  await student.click('Lưu đáp án', '.attempt-actions'); await student.waitText('Bản nháp #1')
  sql(`UPDATE dbo.ExamAttempts SET DeadlineUtc=DATEADD(second,-2,SYSUTCDATETIME()) WHERE ExamId=${examId} AND State=N'inProgress';`)
  await student.call('Page.reload')
  await student.waitText('Đã hết thời gian làm bài'); await student.waitText('Điểm:')
  pass('Student', 'hết giờ: tải lại thấy "Đã hết thời gian làm bài", bản nháp được chấm')

  // Lịch đã kết thúc: mở xem lại đáp án từ lịch sử
  sql(`UPDATE dbo.ExamSchedules SET StartTime=DATEADD(hour,-2,SYSUTCDATETIME()), EndTime=DATEADD(minute,-1,SYSUTCDATETIME()) WHERE ExamId=${examId};`)
  await student.go('/student/attempts')
  await student.clickIn('tr', 'Lần 1/2', 'Xem lại bài')
  await eventually(() => student.eval(`location.search.includes('review=1')`), 'review route')
  await student.waitText('Đáp án đúng'); await student.noErrorAlert('Student review')
  pass('Student', 'sau giờ kết thúc: "Xem lại bài" mở đáp án đúng từ snapshot')

  // ---- Teacher: lớp của tôi → kết quả lớp
  const teacher = await browser.page()
  await teacher.login(accounts.teacher, '/teacher/overview')
  await teacher.go('/teacher/classes')
  await teacher.waitText(className)
  await teacher.eval(`[...document.querySelectorAll('tr')].find((row) => row.innerText.includes(${JSON.stringify(className)})).querySelector('button').click()`)
  await eventually(() => teacher.eval(`(() => { const tab = [...document.querySelectorAll('.ant-tabs-tab-btn')].find((x) => x.innerText.startsWith('Kết quả (')); if (!tab) return false; tab.click(); return true })()`), 'results tab')
  await teacher.waitText('Đã nộp'); await teacher.noErrorAlert('Teacher results')
  pass('Teacher', 'mở lớp, tab Kết quả có lượt đã nộp')
  await teacher.go('/admin/schedules'); await teacher.waitText(forbidden)
  pass('Teacher', 'URL quản trị bị chặn ở FE')

  // ---- Examiner (level 2, chỉ quyền câu hỏi): ngân hàng câu hỏi
  const examiner = await browser.page()
  await examiner.login(accounts.examiner, '/admin/dashboard')
  await examiner.waitText('Quản lý câu hỏi')
  const nav = await examiner.eval(`document.querySelector('aside, nav')?.innerText || document.body.innerText`)
  if (nav.includes('Quản lý tài khoản')) throw new Error('Examiner sees account management menu')
  await examiner.waitText('chỉ xem được số liệu danh mục')
  pass('Examiner', 'tổng quan dạng dự phòng, menu chỉ có mục được cấp quyền')
  await examiner.go('/admin/questions'); await examiner.waitText('Tải mẫu Excel v1', 'trang câu hỏi'); await examiner.noErrorAlert('Examiner questions')
  pass('Examiner', 'mở ngân hàng câu hỏi không lỗi')
  await examiner.go('/student/schedules'); await examiner.waitText(forbidden)
  pass('Examiner', 'URL học viên bị chặn ở FE')

  // ---- Admin: tổng quan → báo cáo → hủy kết quả; vào được mọi khu vực
  const admin = await browser.page()
  await admin.login(accounts.admin, '/admin/dashboard')
  await admin.waitText('Tổng quan quản trị'); await admin.waitText('Lượt đã chốt'); await admin.noErrorAlert('Admin dashboard')
  pass('Admin', 'tổng quan có KPI lượt thi')
  await admin.go('/admin/attempts'); await admin.waitText(examName)
  await admin.eval(`[...document.querySelectorAll('tr')].find((row) => row.innerText.includes(${JSON.stringify(examName)}) && row.innerText.includes('Hủy kết quả')).querySelector('button').click()`)
  await admin.fill('.ant-modal textarea', `P1 hồi quy ${tag}`)
  await admin.click('Xác nhận hủy', '.ant-modal')
  await eventually(() => admin.eval(`[...document.querySelectorAll('tr')].some((row) => row.innerText.includes(${JSON.stringify(examName)}) && row.innerText.includes('Đã hủy'))`), 'voided row')
  pass('Admin', 'hủy kết quả có lý do trong báo cáo lượt thi')
  for (const route of ['/teacher/classes', '/student/schedules', '/admin/users']) {
    await admin.go(route); await pause(800)
    if ((await admin.body()).includes(forbidden)) throw new Error(`Admin blocked at ${route}`)
  }
  pass('Admin', 'toàn quyền: vào được khu vực giảng viên, học viên, tài khoản')

  // ---- Student thấy lượt đã hủy
  await student.go('/student/attempts'); await student.waitText('Đã hủy')
  pass('Student', 'lịch sử hiển thị "Đã hủy", không còn điểm')

  // ---- Admin CRUD qua giao diện: môn học (thêm/sửa/ẩn), lớp, bài thi
  const subjectName = `P1 môn UI ${tag}`
  await admin.go('/admin/subjects')
  await admin.click('Thêm môn học'); await admin.fillField('Tên môn', subjectName); await admin.modalOk()
  await admin.waitText(subjectName)
  await admin.clickIn('tr', subjectName, 'Sửa'); await admin.fillField('Tên môn', `${subjectName} sửa`); await admin.modalOk()
  await admin.waitText(`${subjectName} sửa`)
  await admin.clickIn('tr', `${subjectName} sửa`, 'Ẩn'); await admin.popconfirmOk()
  await eventually(async () => !(await admin.body()).includes(`${subjectName} sửa`), 'subject hidden from active list')
  await admin.noErrorAlert('Admin subjects')
  pass('Admin', 'môn học: thêm, sửa, ẩn qua giao diện')
  const uiClass = `P1 lớp UI ${tag}`; const uiCode = `P1UI-${tag}`
  await admin.go('/admin/classes')
  await admin.click('Thêm lớp')
  await admin.fillField('Tên lớp', uiClass); await admin.fillField('Mã lớp', uiCode); await admin.fillField('Sức chứa', 5)
  await admin.chooseField('Giảng viên', teacherName); await admin.modalOk()
  // Bảng có nhiều trang: tìm theo mã lớp vừa tạo.
  await eventually(() => admin.eval(`!document.querySelector('.ant-modal-wrap:not([style*="display: none"]) .ant-modal')`), 'class modal closed')
  await admin.fill('input[placeholder="Tìm tên hoặc mã lớp"]', uiCode)
  await admin.eval(`document.querySelector('.ant-input-search-button, .ant-input-search .ant-btn').click()`)
  await admin.waitText(uiClass); await admin.noErrorAlert('Admin classes')
  pass('Admin', 'lớp học: thêm lớp có mã và giảng viên')
  const uiExam = `P1 bài UI ${tag}`
  await admin.go('/admin/exams')
  await admin.click('Tạo bài thi')
  await admin.fillField('Tên bài thi', uiExam); await admin.chooseField('Môn học', null)
  await admin.fillField('Số câu', 1); await admin.fillField('Điểm tối đa', 10); await admin.fillField('Điểm đạt', 5); await admin.fillField('Thời gian (phút)', 15)
  await admin.modalOk()
  // Bảng bài thi không có ô tìm kiếm: bài mới nằm ở trang cuối.
  await eventually(() => admin.eval(`(() => { const rows = [...document.querySelectorAll('tr')]
    if (rows.some((row) => row.innerText.includes(${JSON.stringify(uiExam)}) && row.innerText.includes('Nháp'))) return true
    const pages = [...document.querySelectorAll('.ant-pagination-item')]; pages.at(-1)?.click(); return false })()`), 'exam row')
  await admin.noErrorAlert('Admin exams')
  pass('Admin', 'bài thi: tạo bài thi ở trạng thái Nháp')

  // ---- Vào lớp bằng mã → giảng viên duyệt
  await student.go('/student/classes')
  await student.fill('input[placeholder="Mã lớp học"]', uiCode); await student.click('Tham gia lớp')
  await student.waitText('Đã gửi yêu cầu tham gia')
  await eventually(() => student.eval(`[...document.querySelectorAll('tr')].some((row) => row.innerText.includes(${JSON.stringify(uiClass)}) && row.innerText.includes('Chờ duyệt'))`), 'pending membership')
  pass('Student', 'vào lớp bằng mã: yêu cầu ở trạng thái "Chờ duyệt"')
  await teacher.go('/teacher/classes')
  await teacher.clickIn('tr', uiClass, 'Quản lý lớp')
  await teacher.clickIn('.teacher-detail tr', 'Chờ duyệt', 'Duyệt')
  await eventually(() => teacher.eval(`[...document.querySelectorAll('.teacher-detail tr')].some((row) => row.innerText.includes('Đã duyệt'))`), 'approved membership')
  pass('Teacher', 'duyệt học viên xin vào lớp')
  await student.click('Tải lại')
  await eventually(() => student.eval(`[...document.querySelectorAll('tr')].some((row) => row.innerText.includes(${JSON.stringify(uiClass)}) && row.innerText.includes('Đã tham gia'))`), 'joined membership')
  pass('Student', 'lớp mới chuyển sang "Đã tham gia"')
  for (const page of [student, teacher, examiner, admin]) await page.close()
  console.log(`P1_ROLE_BROWSER_SMOKE=PASS;STEPS=${results.length};TAG=${tag}`)
} catch (error) {
  console.error(`P1_ROLE_BROWSER_SMOKE=FAIL: ${error.message}`)
  // Chẩn đoán: đường dẫn, modal đang mở, thông báo lỗi trên trang cuối cùng được thao tác.
  try {
    const state = await lastPage?.eval(`({ path: location.pathname, modal: [...document.querySelectorAll('.ant-modal-wrap')].map((x) => x.innerText).join(' || ').slice(0, 800),
      alerts: [...document.querySelectorAll('.ant-alert, .ant-notification-notice, .ant-form-item-explain-error')].map((x) => x.innerText).join(' | ') })`)
    console.error(JSON.stringify(state))
    console.error('SQL classes:', sql(`SELECT CONCAT(Name,'|',ISNULL(CONVERT(varchar(5),Status),'NULL'),'|',Capacity) FROM dbo.Classes WHERE ClassCode LIKE N'P1UI-${tag}';`))
  } catch { /* trang đã đóng */ }
  process.exitCode = 1
} finally {
  browser?.socket.close()
  chrome.kill()
  await pause(500)
  await rm(profile, { recursive: true, force: true }).catch(() => {})
}
