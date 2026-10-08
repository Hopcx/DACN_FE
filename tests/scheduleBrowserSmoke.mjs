// Run with the HTTPS FE dev server and API pointed at ProjectDACN_Task04Task09_Test.
// This test creates only disposable QA rows in that named SQL Server copy.
import { spawn, execFileSync } from 'node:child_process'
import { mkdtemp, readdir, readFile, rm } from 'node:fs/promises'
import { randomBytes, randomUUID } from 'node:crypto'
import { tmpdir } from 'node:os'
import path from 'node:path'

const database = 'ProjectDACN_Task04Task09_Test'
const base = 'https://localhost:5173'
const browserPath = process.env.DACN_CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const profile = await mkdtemp(path.join(tmpdir(), 'dacn-task9-browser-'))
const port = 9300 + Math.floor(Math.random() * 1000)
const chrome = spawn(browserPath, [
  '--headless=new', '--no-first-run', '--no-default-browser-check', '--ignore-certificate-errors',
  '--remote-allow-origins=*', `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, 'about:blank',
], { stdio: 'ignore' })
let socket

const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
async function eventually(fn, label) {
  for (let index = 0; index < 60; index += 1) {
    try { const result = await fn(); if (result) return result } catch { /* wait for service */ }
    await pause(200)
  }
  throw new Error(`${label} timed out`)
}

function sql(query) {
  return execFileSync('sqlcmd', ['-S', '.', '-d', database, '-E', '-No', '-C', '-b', '-W', '-h', '-1',
    '-Q', `SET NOCOUNT ON; IF DB_NAME() <> N'${database}' THROW 51101, 'Wrong database', 1; ${query}`],
  { encoding: 'utf8' }).trim()
}

class Cdp {
  nextId = 1
  pending = new Map()
  constructor(ws) {
    socket = new WebSocket(ws)
    socket.addEventListener('message', ({ data }) => {
      const message = JSON.parse(data)
      const pending = this.pending.get(message.id)
      if (!pending) return
      this.pending.delete(message.id)
      if (message.error) pending.reject(new Error(message.error.message))
      else pending.resolve(message.result)
    })
  }
  async ready() {
    await new Promise((resolve, reject) => {
      socket.addEventListener('open', resolve, { once: true })
      socket.addEventListener('error', reject, { once: true })
    })
  }
  send(method, params = {}) {
    const id = this.nextId++
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject })
      socket.send(JSON.stringify({ id, method, params }))
    })
  }
  async eval(expression) {
    const answer = await this.send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })
    if (answer.exceptionDetails) throw new Error('Browser evaluation failed')
    return answer.result.value
  }
}

try {
  sql('SELECT DB_NAME();')
  const tab = await eventually(async () => {
    const response = await fetch(`http://127.0.0.1:${port}/json/new?${encodeURIComponent(`${base}/auth/login`)}`, { method: 'PUT' })
    return response.ok ? response.json() : null
  }, 'Chrome debugging endpoint')
  const cdp = new Cdp(tab.webSocketDebuggerUrl)
  await cdp.ready()
  await cdp.send('Runtime.enable')
  await eventually(() => cdp.eval(`document.body?.innerText.includes('Đăng Nhập')`), 'FE login page')

  const tag = randomUUID().replaceAll('-', '').slice(0, 10)
  const email = `browserqa${tag}@example.invalid`
  const password = `Qa7${randomBytes(12).toString('hex')}`
  const account = { fullName: 'Task09 Browser QA', userName: `browserqa${tag}`, email, password,
    address: 'Test only', dateOfBirth: '2000-01-01T00:00:00Z', sex: true }
  const registered = await cdp.eval(`(async () => {
    const csrf = await fetch('/web/auth/csrf', { credentials: 'include' });
    window.__task9Csrf = (await csrf.json()).data.csrfToken;
    const result = await fetch('/web/auth/register', { method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': window.__task9Csrf },
      body: JSON.stringify(${JSON.stringify(account)}) });
    return result.status;
  })()`)
  if (registered !== 202) throw new Error(`FE proxy registration failed: ${registered}`)

  const maildrop = path.resolve('..', 'DACN_Project', 'Project.Api', '.maildrop')
  const mail = await eventually(async () => {
    for (const name of await readdir(maildrop)) {
      if (!name.startsWith('verify-')) continue
      const body = await readFile(path.join(maildrop, name), 'utf8')
      if (body.includes(`To: ${email}`)) return body
    }
    return null
  }, 'Development verification mail')
  const token = /#token=([^\s]+)/.exec(mail)?.[1]
  if (!token) throw new Error('Verification token missing')
  const verified = await cdp.eval(`(async () => {
    const result = await fetch('/web/auth/verify-email', { method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': window.__task9Csrf },
      body: JSON.stringify({ token: ${JSON.stringify(decodeURIComponent(token))} }) });
    return result.status;
  })()`)
  if (verified !== 200) throw new Error(`Verification failed: ${verified}`)

  const unauthorized = await cdp.eval(`(async () => {
    const { login } = await import('/src/services/authService.js');
    await login(${JSON.stringify(email)}, ${JSON.stringify(password)});
    const service = await import('/src/services/scheduleService.js');
    try { await service.getSchedules(); return 200 } catch (error) { return error.response?.status }
  })()`)
  if (unauthorized !== 403) throw new Error(`FE service permission check failed: ${unauthorized}`)

  const fixture = sql(`
    DECLARE @userId uniqueidentifier = (SELECT Id FROM dbo.Users WHERE Email=N'${email}');
    IF @userId IS NULL THROW 51102, 'QA user missing', 1;
    INSERT INTO dbo.UserPermissions (UserId,PermissionId) VALUES (@userId,4);
    DECLARE @subjectId int=(SELECT TOP (1) Id FROM dbo.Subjects ORDER BY Id);
    INSERT INTO dbo.Rooms (Name,Capacity,Address,Status) VALUES (N'Browser QA ${tag}',30,N'Test only',1);
    DECLARE @roomId int=CONVERT(int,SCOPE_IDENTITY());
    INSERT INTO dbo.Classes (Name,ClassCode,Capacity,TeacherId,SubjectId,Status)
      VALUES (N'Browser QA ${tag}',N'BQA-${tag}',30,@userId,@subjectId,1);
    DECLARE @classId int=CONVERT(int,SCOPE_IDENTITY());
    INSERT INTO dbo.Classes (Name,ClassCode,Capacity,TeacherId,SubjectId,Status)
      VALUES (N'Browser QA extra ${tag}',N'BQB-${tag}',30,@userId,@subjectId,1);
    DECLARE @classId2 int=CONVERT(int,SCOPE_IDENTITY());
    INSERT INTO dbo.ClassUsers (ClassId,UserId,Status) VALUES (@classId,@userId,1);
    SELECT CONCAT(@userId,',',@roomId,',',@classId,',',@classId2);
  `).split(',')
  if (fixture.length !== 4) throw new Error('SQL browser fixture failed')
  const [userId, roomId, classId, classId2] = fixture

  const integration = await cdp.eval(`(async () => {
    const { login } = await import('/src/services/authService.js');
    const user = await login(${JSON.stringify(email)}, ${JSON.stringify(password)});
    const svc = await import('/src/services/scheduleService.js');
    const time = await import('/src/services/scheduleTime.js');
    const exams = await svc.getScheduleExamOptions();
    const rooms = await svc.getScheduleRoomOptions();
    const classes = await svc.getScheduleClassOptions();
    const exam = exams.find(item => item.status !== 255);
    if (!exam || !rooms.some(item => item.id === ${Number(roomId)}) ||
        !classes.some(item => item.id === ${Number(classId)})) return { stage: 'options' };
    const body = { title: 'Browser QA ${tag}', examId: exam.id, subjectId: exam.subjectId,
      roomId: ${Number(roomId)}, status: 1,
      startTime: time.vietnamInputToUtc('2026-11-01T15:00'),
      endTime: time.vietnamInputToUtc('2026-11-01T16:00') };
    const created = await svc.createSchedule(body);
    const reloaded = (await svc.getSchedules()).find(item => item.id === created.id);
    let conflict = 0;
    try { await svc.createSchedule(body) } catch (error) { conflict = error.response?.status }
    const updated = await svc.updateSchedule(created.id, { ...body,
      startTime: time.vietnamInputToUtc('2026-11-01T16:00'),
      endTime: time.vietnamInputToUtc('2026-11-01T17:00') });
    const afterUpdate = (await svc.getSchedules()).find(item => item.id === created.id);
    const link = await svc.assignScheduleClass(created.id, ${Number(classId)});
    const assigned = (await svc.getScheduleAssignments()).some(item => item.id === link.id);
    await svc.unassignScheduleClass(link.id);
    const unassigned = !(await svc.getScheduleAssignments()).some(item => item.id === link.id);
    const newLink = await svc.assignScheduleClass(created.id, ${Number(classId)});
    window.__task9BrowserSchedule = created.id;
    window.history.pushState({}, '', '/admin/schedules');
    window.dispatchEvent(new PopStateEvent('popstate'));
    return { stage: 'done', permission: user.permissions?.includes('4'), id: created.id,
      initialUtc: reloaded?.timeZoneStatus === 'utc' && reloaded?.startTime?.endsWith('Z'),
      shownVietnamTime: time.formatScheduleTime(afterUpdate?.startTime, afterUpdate?.timeZoneStatus).includes('16:00'),
      updated: updated?.id === created.id && afterUpdate?.startTime === '2026-11-01T09:00:00Z',
      conflict, assigned, unassigned, relinked: newLink.examScheduleId === created.id };
  })()`)
  if (integration.stage !== 'done' || !integration.permission || !integration.initialUtc ||
      !integration.shownVietnamTime || !integration.updated || integration.conflict !== 409 ||
      !integration.assigned || !integration.unassigned || !integration.relinked) {
    throw new Error(`FE service integration failed at ${integration.stage}`)
  }
  console.log('FE_PROXY_AUTH_OPTIONS_CREATE_UPDATE_409_ASSIGN_UNASSIGN_UTC=PASS')

  await eventually(() => cdp.eval(`document.body?.innerText.includes('Quản lý lịch thi')`), 'Schedule page')
  await cdp.eval(`window.__task9FindRow = title => [...document.querySelectorAll('tr[data-row-key]')]
    .find(row => row.querySelector('td')?.innerText.trim() === title)`)
  async function showRow(title) {
    await cdp.eval(`document.querySelector('.ant-pagination-item-1 button, .ant-pagination-item-1 a')?.click()`)
    await pause(150)
    for (let index = 0; index < 20; index += 1) {
      if (await cdp.eval(`Boolean(window.__task9FindRow(${JSON.stringify(title)}))`)) return
      const advanced = await cdp.eval(`(() => {
        const next = document.querySelector('.ant-pagination-next');
        if (!next || next.classList.contains('ant-pagination-disabled')) return false;
        next.querySelector('button')?.click(); return true;
      })()`)
      if (!advanced) break
      await pause(150)
    }
    throw new Error(`Schedule row not rendered: ${title}`)
  }
  await cdp.eval(`(() => {
    [...document.querySelectorAll('button')].find(item => item.innerText === 'Tạo lịch').click();
  })()`)
  await eventually(() => cdp.eval(`Boolean(document.querySelector('.ant-modal input[type="datetime-local"]'))`), 'Create form')
  await cdp.eval(`(() => {
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    const fields = [...document.querySelectorAll('.ant-modal .ant-form-item')];
    const title = fields.find(item => item.querySelector('label')?.innerText === 'Tên lịch').querySelector('input');
    setter.call(title, 'Browser form ${tag}'); title.dispatchEvent(new Event('input', { bubbles: true }));
    const dates = [...document.querySelectorAll('.ant-modal input[type="datetime-local"]')];
    for (const [index, value] of ['2026-11-03T15:00', '2026-11-03T16:00'].entries()) {
      setter.call(dates[index], value); dates[index].dispatchEvent(new Event('input', { bubbles: true }));
    }
  })()`)
  async function selectOption(label, text) {
    const opened = await cdp.eval(`(() => {
      const item = [...document.querySelectorAll('.ant-modal .ant-form-item')]
        .find(node => node.querySelector('label')?.innerText.includes(${JSON.stringify(label)}));
      const selector = item?.querySelector('.ant-select-selector') || item?.querySelector('.ant-select');
      selector?.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
      selector?.click(); return { found: Boolean(selector),
        labels: [...document.querySelectorAll('.ant-modal .ant-form-item label')].map(node => node.innerText) };
    })()`)
    if (!opened.found) throw new Error(`Form select ${label} missing: ${opened.labels.join(', ')}`)
    await eventually(() => cdp.eval(`Boolean(document.querySelector('.ant-select-dropdown:not(.ant-select-dropdown-hidden) .ant-select-item-option'))`), `${label} options`)
    const selected = await cdp.eval(`(() => {
      const items = [...document.querySelectorAll('.ant-select-dropdown:not(.ant-select-dropdown-hidden) .ant-select-item-option')];
      const option = ${text ? `items.find(item => item.innerText.includes(${JSON.stringify(text)}))` : 'items[0]'};
      option?.click(); return Boolean(option);
    })()`)
    if (!selected) throw new Error(`Form select ${label} option missing`)
  }
  await selectOption('Bài thi')
  await selectOption('Phòng thi', `Browser QA ${tag}`)
  await selectOption('Trạng thái', 'Hoạt động')
  await cdp.eval(`document.querySelector('.ant-modal-footer button.ant-btn-primary').click()`)
  const formQuery = `SELECT COUNT(*) FROM dbo.ExamSchedules WHERE Title=N'Browser form ${tag}'
    AND RoomId=${Number(roomId)} AND Status=1 AND IsTimeUtc=1 AND StartTime='2026-11-03T08:00:00';`
  await eventually(() => sql(formQuery) === '1', 'Create form SQL save')
  await showRow(`Browser form ${tag}`)
  await pause(400)
  console.log('FE_CREATE_FORM_TO_SQL=PASS')

  await showRow(`Browser QA ${tag}`)
  await cdp.eval(`(() => {
    const row = window.__task9FindRow('Browser QA ${tag}');
    [...row.querySelectorAll('button')].find(button => button.innerText === 'Xem lớp').click();
  })()`)
  try {
    await eventually(() => cdp.eval(`Boolean([...document.querySelectorAll('.ant-modal')]
      .find(item => item.querySelector('.ant-modal-title')?.innerText.startsWith('Lớp của lịch'))
      ?.querySelector('form .ant-select'))`), 'Class assignment form')
  } catch {
    const state = await cdp.eval(`({ text: document.querySelector('.ant-modal')?.innerText.slice(0, 300),
      forms: document.querySelectorAll('.ant-modal form').length,
      selects: document.querySelectorAll('.ant-modal .ant-select').length })`)
    throw new Error(`Class assignment form missing: ${JSON.stringify(state)}`)
  }
  const classSearch = await cdp.eval(`(() => {
    const modal = [...document.querySelectorAll('.ant-modal')]
      .find(item => item.querySelector('.ant-modal-title')?.innerText.startsWith('Lớp của lịch'));
    const selector = modal.querySelector('form .ant-select-selector') || modal.querySelector('form .ant-select');
    selector.dispatchEvent(new MouseEvent('mousedown', { bubbles: true })); selector.click();
    const input = modal.querySelector('form input.ant-select-input');
    if (!input) return { found: false, inputs: [...modal.querySelectorAll('form input')].map(item => item.className) };
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    setter.call(input, 'extra ${tag}'); input.dispatchEvent(new Event('input', { bubbles: true }));
    return { found: true };
  })()`)
  if (!classSearch.found) throw new Error(`Class search input missing: ${JSON.stringify(classSearch)}`)
  await eventually(() => cdp.eval(`Boolean([...document.querySelectorAll('.ant-select-dropdown:not(.ant-select-dropdown-hidden) .ant-select-item-option')].find(item => item.innerText.includes('extra ${tag}')))`), 'Class option')
  await cdp.eval(`(() => {
    [...document.querySelectorAll('.ant-select-dropdown:not(.ant-select-dropdown-hidden) .ant-select-item-option')]
      .find(item => item.innerText.includes('extra ${tag}')).click();
    [...document.querySelectorAll('.ant-modal form button')].find(button => button.innerText === 'Gán lớp').click();
  })()`)
  await eventually(() => sql(`SELECT COUNT(*) FROM dbo.ClassExamSchedule WHERE ExamScheduleId=${integration.id} AND ClassId=${Number(classId2)};`) === '1', 'UI class assignment persisted')
  await eventually(() => cdp.eval(`Boolean([...document.querySelectorAll('.ant-modal tr')].find(row => row.innerText.includes('extra ${tag}')))`), 'Assigned class rendered')
  await cdp.eval(`(() => {
    const row = [...document.querySelectorAll('.ant-modal tr')].find(item => item.innerText.includes('extra ${tag}'));
    [...row.querySelectorAll('button')].find(button => button.innerText === 'Hủy gán').click();
  })()`)
  await eventually(() => cdp.eval(`Boolean(document.querySelector('.ant-popconfirm-buttons .ant-btn-primary'))`), 'Unassign confirmation')
  await cdp.eval(`document.querySelector('.ant-popconfirm-buttons .ant-btn-primary').click()`)
  await eventually(() => sql(`SELECT COUNT(*) FROM dbo.ClassExamSchedule WHERE ExamScheduleId=${integration.id} AND ClassId=${Number(classId2)};`) === '0', 'UI class unassignment persisted')
  await cdp.eval(`[...document.querySelectorAll('.ant-modal')]
    .find(item => item.querySelector('.ant-modal-title')?.innerText.startsWith('Lớp của lịch'))
    ?.querySelector('.ant-modal-close')?.click()`)
  await pause(350)
  console.log('FE_CLASS_ASSIGN_UNASSIGN_FORM_TO_SQL=PASS')

  await cdp.eval(`(async () => {
    const svc = await import('/src/services/scheduleService.js');
    const time = await import('/src/services/scheduleTime.js');
    const exam = (await svc.getScheduleExamOptions()).find(item => item.status !== 255);
    await svc.createSchedule({ title: 'Browser conflict ${tag}', examId: exam.id,
      subjectId: exam.subjectId, roomId: ${Number(roomId)}, status: 1,
      startTime: time.vietnamInputToUtc('2026-11-01T18:00'),
      endTime: time.vietnamInputToUtc('2026-11-01T19:00') });
  })()`)
  await showRow(`Browser QA ${tag}`)
  const beforeLock = await cdp.eval(`(() => {
    const row = window.__task9FindRow('Browser QA ${tag}');
    return row && [...row.querySelectorAll('button')].some(button => button.innerText === 'Sửa' && !button.disabled);
  })()`)
  if (!beforeLock) {
    const state = await cdp.eval(`(() => {
      const row = window.__task9FindRow('Browser QA ${tag}');
      return { row: row?.innerText.slice(0, 300),
        buttons: [...(row?.querySelectorAll('button') || [])].map(button => ({ text: button.innerText, disabled: button.disabled })),
        openModals: [...document.querySelectorAll('.ant-modal')].filter(item => item.offsetParent).map(item => item.innerText.slice(0, 80)) };
    })()`)
    throw new Error(`Editable schedule was not enabled in UI: ${JSON.stringify(state)}`)
  }

  await cdp.eval(`(() => {
    const row = window.__task9FindRow('Browser QA ${tag}');
    [...row.querySelectorAll('button')].find(button => button.innerText === 'Sửa').click();
  })()`)
  await eventually(() => cdp.eval(`document.querySelector('.ant-modal input[type="datetime-local"]')?.value === '2026-11-01T16:00'`), 'Edit form Vietnam time')
  await cdp.eval(`(() => {
    const inputs = [...document.querySelectorAll('.ant-modal input[type="datetime-local"]')];
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    for (const [index, value] of ['2026-11-01T18:00', '2026-11-01T19:00'].entries()) {
      setter.call(inputs[index], value);
      inputs[index].dispatchEvent(new Event('input', { bubbles: true }));
      inputs[index].dispatchEvent(new Event('change', { bubbles: true }));
    }
    document.querySelector('.ant-modal-footer button.ant-btn-primary').click();
  })()`)
  await eventually(() => cdp.eval(`document.querySelector('.ant-modal .ant-alert-error')?.innerText.includes('Phòng')`), 'Visible 409 room conflict in edit modal')
  await cdp.eval(`document.querySelector('.ant-modal .ant-modal-close')?.click()`)
  await pause(350)
  console.log('FE_EDIT_PREFILL_VIETNAM_TIME_AND_VISIBLE_409=PASS')

  sql(`INSERT INTO dbo.DoingExams (UserId,ExamId,ExamScheduleId,StartTime)
    SELECT '${userId}',ExamId,Id,'2026-11-01T09:00:00' FROM dbo.ExamSchedules
    WHERE Id=${integration.id} AND IsTimeUtc=1;`)
  await cdp.eval(`(() => {
    const button = [...document.querySelectorAll('button')].find(item => item.innerText === 'Tải lại');
    button?.click(); return Boolean(button);
  })()`)
  await showRow(`Browser QA ${tag}`)
  const locked = await eventually(() => cdp.eval(`(() => {
    const row = window.__task9FindRow('Browser QA ${tag}');
    if (!row) return false;
    const edit = [...row.querySelectorAll('button')].find(button => button.innerText === 'Sửa');
    const remove = [...row.querySelectorAll('button')].find(button => button.innerText === 'Xóa');
    return Boolean(edit?.disabled && remove?.disabled);
  })()`), 'Locked schedule buttons')
  if (!locked) throw new Error('Attempted schedule actions were not disabled in UI')
  await cdp.eval(`(() => {
    const row = window.__task9FindRow('Browser QA ${tag}');
    [...row.querySelectorAll('button')].find(button => button.innerText === 'Xem lớp').click();
  })()`)
  await eventually(() => cdp.eval(`Boolean([...document.querySelectorAll('.ant-modal')]
    .find(item => item.querySelector('.ant-modal-title')?.innerText.startsWith('Lớp của lịch')))`), 'Class modal')
  const assignmentLocked = await cdp.eval(`(() => {
    const modal = [...document.querySelectorAll('.ant-modal')]
      .find(item => item.querySelector('.ant-modal-title')?.innerText.startsWith('Lớp của lịch'));
    return Boolean(modal && ![...modal.querySelectorAll('button')].some(button => button.innerText === 'Gán lớp'));
  })()`)
  if (!assignmentLocked) throw new Error('Class assignment form stayed open for attempted schedule')
  const refused = await cdp.eval(`(async () => {
    const svc = await import('/src/services/scheduleService.js');
    try { await svc.deleteSchedule(${integration.id}); return 200 } catch (error) { return error.response?.status }
  })()`)
  if (refused !== 409) throw new Error('Direct FE service write bypassed BE lock')
  console.log('FE_RENDERED_SCHEDULE_LOCK_AND_DIRECT_409=PASS')
} finally {
  socket?.close()
  chrome.kill()
  await pause(500)
  const safeRoot = path.resolve(tmpdir()) + path.sep
  if (path.resolve(profile).startsWith(safeRoot)) {
    try { await rm(profile, { recursive: true, force: true }) } catch { /* Chrome may still be exiting */ }
  }
}
