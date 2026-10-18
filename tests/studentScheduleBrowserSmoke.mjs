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
let fixtureIds

const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
async function eventually(fn, label) {
  for (let index = 0; index < 60; index += 1) {
    try { const result = await fn(); if (result) return result } catch { /* wait for service */ }
    await pause(200)
  }
  throw new Error(`${label} timed out`)
}

function sql(query) {
  return execFileSync('sqlcmd', ['-S', '.', '-d', database, '-E', '-No', '-C', '-b', '-I', '-W', '-h', '-1',
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

  fixtureIds = sql(`
    DECLARE @actor uniqueidentifier=(SELECT Id FROM dbo.Users WHERE Email=N'${email}');
    DECLARE @subject int=(SELECT TOP (1) Id FROM dbo.Subjects ORDER BY Id);
    INSERT INTO dbo.Exams (Name,SubjectId,NumberOfQuestions,NumberOfRepeat,Status,MaximmumMark,PassMark,Duration)
    VALUES (N'QA student states ${tag}',@subject,1,1,2,10,5,30);
    DECLARE @exam int=CONVERT(int,SCOPE_IDENTITY());
    INSERT INTO dbo.Classes (Name,ClassCode,Capacity,TeacherId,SubjectId,Status)
    VALUES (N'QA states ${tag}',N'ST-${tag}',2,@actor,@subject,1);
    DECLARE @approved int=CONVERT(int,SCOPE_IDENTITY());
    INSERT INTO dbo.Classes (Name,ClassCode,Capacity,TeacherId,SubjectId,Status)
    VALUES (N'QA pending ${tag}',N'SP-${tag}',2,@actor,@subject,1);
    DECLARE @pending int=CONVERT(int,SCOPE_IDENTITY());
    INSERT INTO dbo.Classes (Name,ClassCode,Capacity,TeacherId,SubjectId,Status)
    VALUES (N'QA other ${tag}',N'SO-${tag}',2,@actor,@subject,1);
    DECLARE @other int=CONVERT(int,SCOPE_IDENTITY());
    INSERT INTO dbo.ClassUsers (ClassId,UserId,Status) VALUES (@approved,@actor,1),(@pending,@actor,2);
    DECLARE @now datetime2=SYSUTCDATETIME();
    INSERT INTO dbo.ExamSchedules (ExamId,Title,StartTime,EndTime,Status,IsTimeUtc)
    VALUES (@exam,N'upcoming ${tag}',DATEADD(hour,1,@now),DATEADD(hour,2,@now),1,1),
           (@exam,N'open ${tag}',DATEADD(hour,-1,@now),DATEADD(hour,1,@now),1,1),
           (@exam,N'ended ${tag}',DATEADD(hour,-2,@now),DATEADD(hour,-1,@now),1,1),
           (@exam,N'unknown ${tag}',DATEADD(hour,-1,@now),DATEADD(hour,1,@now),1,0),
           (@exam,N'pending ${tag}',DATEADD(hour,-1,@now),DATEADD(hour,1,@now),1,1),
           (@exam,N'other ${tag}',DATEADD(hour,-1,@now),DATEADD(hour,1,@now),1,1);
    INSERT INTO dbo.ClassExamSchedule (ClassId,ExamScheduleId)
    SELECT CASE WHEN Title LIKE N'pending %' THEN @pending WHEN Title LIKE N'other %' THEN @other ELSE @approved END,Id
    FROM dbo.ExamSchedules WHERE ExamId=@exam;
    SELECT CONCAT(@exam,',',@approved,',',@pending,',',@other);
  `).split(',').map(Number)
  if (fixtureIds.length !== 4 || fixtureIds.some(id => !Number.isSafeInteger(id) || id <= 0)) throw new Error('Fixture IDs missing')

  const stateCheck = await cdp.eval(`(async () => {
    const { getMySchedules } = await import('/src/services/scheduleService.js');
    const rows = await getMySchedules();
    if (rows.length !== 4) return { count: rows.length };
    return { count: rows.length, states: rows.map(row => row.scheduleState).sort().join(','),
      valid: rows.every(row => row.title === row.scheduleState + ' ${tag}' && row.serverNow.endsWith('Z') &&
        (row.scheduleState === 'unknown' ? row.timeZoneStatus === 'unknown' && !row.startTime.endsWith('Z') :
          row.timeZoneStatus === 'utc' && row.startTime.endsWith('Z'))),
      noAnswers: !JSON.stringify(rows).toLowerCase().includes('iscorrect') };
  })()`)
  if (stateCheck.count !== 4 || stateCheck.states !== 'ended,open,unknown,upcoming' || !stateCheck.valid || !stateCheck.noAnswers)
    throw new Error(`Student schedule state contract failed: ${JSON.stringify(stateCheck)}`)
  console.log('SQL_API_STATES_UPCOMING_OPEN_ENDED_UNKNOWN=PASS;PENDING_AND_NONMEMBER_HIDDEN=PASS')

  // Spoof the browser wall clock; server-provided states must still render correctly.
  await cdp.eval(`Date.now = () => 0; window.history.pushState({}, '', '/student/schedules'); window.dispatchEvent(new PopStateEvent('popstate'));`)
  await eventually(() => cdp.eval(`document.body.innerText.includes('Lịch thi của tôi') && document.querySelectorAll('tr[data-row-key]').length === 4`), 'Student schedule rows')
  const visible = await cdp.eval(`(() => {
    const labels = { upcoming: 'Chưa đến giờ', open: 'Trong giờ thi', ended: 'Đã hết giờ', unknown: 'Chưa rõ múi giờ' };
    return Object.entries(labels).every(([state, label]) => [...document.querySelectorAll('tr[data-row-key]')]
      .some(row => row.innerText.includes(state + ' ${tag}') && row.innerText.includes(label)));
  })()`)
  if (!visible) throw new Error('Student schedule labels disagree with API')
  console.log('FE_SERVER_STATES_WITH_SPOOFED_CLIENT_CLOCK=PASS;UNKNOWN_LABEL=PASS')

  // Shift the open fixture past its end and confirm the reload reads SQL/API state.
  sql(`UPDATE dbo.ExamSchedules SET StartTime=DATEADD(hour,-2,SYSUTCDATETIME()),EndTime=DATEADD(hour,-1,SYSUTCDATETIME()) WHERE ExamId=${fixtureIds[0]} AND Title=N'open ${tag}';`)
  await cdp.eval(`[...document.querySelectorAll('button')].find(item => item.innerText === 'Tải lại').click()`)
  await eventually(() => cdp.eval(`[...document.querySelectorAll('tr[data-row-key]')].some(row => row.innerText.includes('open ${tag}') && row.innerText.includes('Đã hết giờ'))`), 'Reload ended schedule')
  console.log('FE_SQL_STATE_RELOAD=PASS')
} finally {
  if (fixtureIds?.length === 4 && fixtureIds.every(id => Number.isSafeInteger(id) && id > 0)) {
    sql(`DELETE FROM dbo.ClassUsers WHERE ClassId IN (${fixtureIds.slice(1).join(',')});
      DELETE FROM dbo.ClassExamSchedule WHERE ExamScheduleId IN (SELECT Id FROM dbo.ExamSchedules WHERE ExamId=${fixtureIds[0]});
      DELETE FROM dbo.ExamSchedules WHERE ExamId=${fixtureIds[0]};
      DELETE FROM dbo.Classes WHERE Id IN (${fixtureIds.slice(1).join(',')});
      DELETE FROM dbo.Exams WHERE Id=${fixtureIds[0]};`)
    console.log('STUDENT_STATE_FIXTURE_CLEANUP=PASS')
  }
  socket?.close()
  chrome.kill()
  await pause(500)
  const safeRoot = path.resolve(tmpdir()) + path.sep
  if (path.resolve(profile).startsWith(safeRoot)) {
    try { await rm(profile, { recursive: true, force: true }) } catch { /* Chrome may still be exiting */ }
  }
}
