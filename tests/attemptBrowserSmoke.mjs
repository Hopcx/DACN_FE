// Chrome -> Vite HTTPS -> API -> SQL Server COPY. Disposable fixture only.
import { spawn, execFileSync } from 'node:child_process'
import { mkdtemp, readdir, readFile, rm } from 'node:fs/promises'
import { randomBytes, randomUUID } from 'node:crypto'
import { tmpdir } from 'node:os'
import path from 'node:path'

const database = 'ProjectDACN_Task04Task09_Test'
const hiddenResult = process.argv.includes('--hidden-result')
const profile = await mkdtemp(path.join(tmpdir(), 'dacn-task10-browser-'))
const port = 9300 + Math.floor(Math.random() * 1000)
const browserPath = process.env.DACN_CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const chrome = spawn(browserPath, ['--headless=new', '--no-first-run', '--no-default-browser-check',
  '--ignore-certificate-errors', '--remote-allow-origins=*', `--remote-debugging-port=${port}`,
  `--user-data-dir=${profile}`, 'about:blank'], { stdio: 'ignore' })
let socket
let fixture
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
async function eventually(fn, label) {
  for (let i = 0; i < 80; i += 1) {
    try { const value = await fn(); if (value) return value } catch { /* wait */ }
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
  async ready() { await new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, { once: true })
    socket.addEventListener('error', reject, { once: true })
  }) }
  send(method, params = {}) {
    const id = this.nextId++
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject })
      socket.send(JSON.stringify({ id, method, params }))
    })
  }
  async eval(expression) {
    const answer = await this.send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })
    if (answer.exceptionDetails) throw new Error(`Browser evaluation failed: ${expression.slice(0, 80)}`)
    return answer.result.value
  }
}
try {
  if (sql('SELECT DB_NAME();') !== database) throw new Error('Wrong database')
  if (sql("SELECT COUNT(*) FROM dbo.__EFMigrationsHistory WHERE MigrationId='20261018063239_Task10TimeoutAndDuration';") !== '1')
    throw new Error('Task10 timeout migration is missing on the copy')
  const tab = await eventually(async () => {
    const response = await fetch(`http://127.0.0.1:${port}/json/new?${encodeURIComponent('https://localhost:5173/auth/login')}`, { method: 'PUT' })
    return response.ok ? response.json() : null
  }, 'Chrome endpoint')
  const cdp = new Cdp(tab.webSocketDebuggerUrl)
  await cdp.ready()
  await cdp.send('Runtime.enable')
  await eventually(() => cdp.eval(`document.body?.innerText.includes('Đăng Nhập')`), 'FE login')
  const tag = randomUUID().replaceAll('-', '').slice(0, 10)
  const email = `attemptbrowser${tag}@example.invalid`
  const password = `Qa7${randomBytes(12).toString('hex')}`
  const account = { fullName: 'Attempt Browser QA', userName: `attemptbrowser${tag}`, email, password,
    address: 'QA only', dateOfBirth: '2000-01-01T00:00:00Z', sex: true }
  let registered
  for (let retry = 0; retry < 5; retry += 1) {
    registered = await cdp.eval(`(async () => {
    const csrf = await fetch('/web/auth/csrf', { credentials: 'include' });
    window.__qaCsrf = (await csrf.json()).data.csrfToken;
    const result = await fetch('/web/auth/register', { method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': window.__qaCsrf },
      body: JSON.stringify(${JSON.stringify(account)}) }); return result.status;
    })()`)
    if (registered !== 429) break
    await pause(15000)
  }
  if (registered !== 202) throw new Error(`Register ${registered}`)
  const maildrop = path.resolve('..', 'DACN_Project', 'Project.Api', '.maildrop')
  const mail = await eventually(async () => {
    for (const name of await readdir(maildrop)) {
      if (!name.startsWith('verify-')) continue
      const body = await readFile(path.join(maildrop, name), 'utf8')
      if (body.includes(`To: ${email}`)) return body
    }
    return null
  }, 'Verification mail')
  const token = /#token=([^\s]+)/.exec(mail)?.[1]
  if (!token) throw new Error('Missing verification token')
  let verified
  for (let retry = 0; retry < 5; retry += 1) {
    verified = await cdp.eval(`(async () => {
    const result = await fetch('/web/auth/verify-email', { method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': window.__qaCsrf },
      body: JSON.stringify({ token: ${JSON.stringify(decodeURIComponent(token))} }) }); return result.status;
    })()`)
    if (verified !== 429) break
    await pause(15000)
  }
  if (verified !== 200) throw new Error(`Verify ${verified}`)
  let loggedIn = false
  for (let retry = 0; retry < 5 && !loggedIn; retry += 1) {
    try { loggedIn = await cdp.eval(`(async () => { const { login } = await import('/src/services/authService.js');
      await login(${JSON.stringify(email)}, ${JSON.stringify(password)}); return true })()`) }
    catch { await pause(15000) }
  }
  if (!loggedIn) throw new Error('FE login service failed')
  fixture = sql(`
    DECLARE @user uniqueidentifier=(SELECT Id FROM dbo.Users WHERE Email=N'${email}');
    DECLARE @subject int=(SELECT TOP 1 Id FROM dbo.Subjects ORDER BY Id);
    INSERT dbo.Exams(Name,SubjectId,NumberOfQuestions,NumberOfRepeat,Status,MaximmumMark,PassMark,Duration,AllowViewResult)
    VALUES(N'Browser ${tag}',@subject,1,1,1,5,3,20,${hiddenResult ? 0 : 1});
    DECLARE @exam int=SCOPE_IDENTITY();
    INSERT dbo.ExamDetails(ExamId,Code,Status,CreateDate,CreateBy,UpdateDate,UpdateBy)
    VALUES(@exam,N'QA',1,SYSUTCDATETIME(),@user,SYSUTCDATETIME(),@user);
    DECLARE @variant int=SCOPE_IDENTITY();
    INSERT dbo.Questions(Content,CreatedDate,Status,SubjectId,QuestionTypeId)
    VALUES(N'Browser question ${tag}',SYSUTCDATETIME(),1,@subject,2);
    DECLARE @question int=SCOPE_IDENTITY();
    INSERT dbo.Answers(QuestionId,Content,IsCorrect,Status) VALUES(@question,N'Option one',1,1),(@question,N'Option two',0,1);
    INSERT dbo.ExamDetailQuestions(ExamDetailId,QuestionId,Point) VALUES(@variant,@question,5);
    INSERT dbo.Classes(Name,ClassCode,Capacity,TeacherId,SubjectId,Status)
    VALUES(N'Browser ${tag}',N'AB-${tag}',2,@user,@subject,1);
    DECLARE @class int=SCOPE_IDENTITY();
    INSERT dbo.ClassUsers(ClassId,UserId,Status) VALUES(@class,@user,1);
    INSERT dbo.ExamSchedules(ExamId,Title,StartTime,EndTime,Status,IsTimeUtc)
    VALUES(@exam,N'Browser ${tag}',DATEADD(minute,-1,SYSUTCDATETIME()),DATEADD(minute,10,SYSUTCDATETIME()),1,1);
    DECLARE @schedule int=SCOPE_IDENTITY();
    INSERT dbo.ClassExamSchedule(ClassId,ExamScheduleId) VALUES(@class,@schedule);
    SELECT CONCAT(@exam,',',@class,',',@question,',',@schedule);`).split(',').map(Number)
  if (fixture.length !== 4 || fixture.some((x) => !Number.isSafeInteger(x) || x <= 0)) throw new Error('Fixture failed')
  await cdp.eval(`window.history.pushState({}, '', '/student/schedules'); window.dispatchEvent(new PopStateEvent('popstate'))`)
  await eventually(() => cdp.eval(`document.body.innerText.includes('Browser ${tag}') && document.body.innerText.includes('Vào bài')`), 'Schedule UI')
  await cdp.eval(`[...document.querySelectorAll('tr[data-row-key]')].find(x => x.innerText.includes('Browser ${tag}')).querySelector('button').click()`)
  await eventually(() => cdp.eval(`location.pathname.startsWith('/student/attempts/') && document.body.innerText.includes('Browser question ${tag}')`), 'Attempt UI')
  const attemptId = await cdp.eval(`location.pathname.split('/').at(-1)`)
  await cdp.eval(`document.querySelector('input[type=radio]').click()`)
  await cdp.eval(`[...document.querySelectorAll('button')].find(x => x.innerText === 'Lưu đáp án').click()`)
  await eventually(() => cdp.eval(`document.body.innerText.includes('Bản nháp #1')`), 'Saved draft')
  await cdp.send('Page.enable')
  await cdp.send('Page.reload')
  await eventually(() => cdp.eval(`document.body.innerText.includes('Bản nháp #1') && !!document.querySelector('input[type=radio]:checked')`), 'Restored answer')
  await eventually(() => cdp.eval(`[...document.querySelectorAll('button')].some(x => x.innerText === 'Nộp bài')`), 'Submit button')
  await cdp.eval(`[...document.querySelectorAll('button')].find(x => x.innerText === 'Nộp bài').click()`)
  const hiddenUi = `(() => { const text=document.querySelector('section')?.innerText || ''; return text.includes('Đã nộp bài') && text.includes('Kết quả chưa được phép xem.') && !/Điểm:|Thời lượng:|Đạt|Chưa đạt|Option one|Option two/.test(text) })()`
  const visibleUi = `document.body.innerText.includes('Đã nộp bài') && document.body.innerText.includes('Điểm: 5') && document.body.innerText.includes('Thời lượng:')`
  await eventually(() => cdp.eval(hiddenResult ? hiddenUi : visibleUi), 'Result UI')
  const reviewBeforeEnd = await cdp.eval(`(async () => { const client=(await import('/src/api/axiosClient.js')).default;
    try { await client.get('/attempts/${attemptId}/review'); return 200 } catch (error) { return error.response?.status } })()`)
  if (reviewBeforeEnd !== 403) throw new Error(`Review before schedule end: ${reviewBeforeEnd}`)
  if (hiddenResult) {
    const raw = await cdp.eval(`(async () => { const client=(await import('/src/api/axiosClient.js')).default;
      return { get:(await client.get('/attempts/${attemptId}')).data,
        submit:(await client.post('/attempts/${attemptId}/submit',{revision:1})).data } })()`)
    for (const response of Object.values(raw)) {
      const payload = response?.data
      if (!payload || payload.state !== 'submitted' || payload.result !== null || payload.questions?.length !== 0 || payload.savedAnswers?.length !== 0 ||
          /"(totalMark|isPassed|timeTakenSeconds|isCorrect|point|sourceAnswerId|sourceQuestionId|snapshotJson|draftJson|answersJson)"/i.test(JSON.stringify(response)))
        throw new Error('Hidden result API response contains grading data')
    }
  }
  sql(`UPDATE dbo.Questions SET Content=N'Changed source ${tag}' WHERE Id=${fixture[2]};
    UPDATE dbo.Answers SET Content=N'Changed option',IsCorrect=CASE WHEN IsCorrect=1 THEN 0 ELSE 1 END WHERE QuestionId=${fixture[2]};
    UPDATE dbo.ExamSchedules SET EndTime=DATEADD(second,-1,SYSUTCDATETIME()) WHERE Id=${fixture[3]};`)
  const reviewAfterEnd = await cdp.eval(`(async () => { const client=(await import('/src/api/axiosClient.js')).default;
    try { return {status:200,body:(await client.get('/attempts/${attemptId}/review')).data} }
    catch (error) { return {status:error.response?.status,body:error.response?.data} } })()`)
  if (hiddenResult) {
    if (reviewAfterEnd.status !== 403 || /isCorrect|selectedAnswerIds/.test(JSON.stringify(reviewAfterEnd.body)))
      throw new Error('Hidden result review response leaked grading data')
  } else {
    const question = reviewAfterEnd.body?.data?.questions?.[0]
    if (reviewAfterEnd.status !== 200 || question?.content !== `Browser question ${tag}` ||
        question?.options?.[0]?.content !== 'Option one' || question?.options?.[0]?.isCorrect !== true ||
        question?.selectedAnswerIds?.length !== 1)
      throw new Error('Review did not use immutable attempt snapshot')
    await eventually(() => cdp.eval(`[...document.querySelectorAll('button')].some(x => x.innerText === 'Xem lại bài')`), 'Review button')
    await cdp.eval(`[...document.querySelectorAll('button')].find(x => x.innerText === 'Xem lại bài').click()`)
    await eventually(() => cdp.eval(`document.body.innerText.includes('Option one') && document.body.innerText.includes('Browser question ${tag}')`), 'Snapshot review UI')
  }
  await cdp.eval(`window.history.pushState({}, '', '/student/schedules'); window.dispatchEvent(new PopStateEvent('popstate'))`)
  await eventually(() => cdp.eval(`[...document.querySelectorAll('tr[data-row-key]')].some(x => x.innerText.includes('Browser ${tag}') && x.innerText.includes('Xem lượt gần nhất'))`), 'Post-exam schedule link')
  await cdp.eval(`[...document.querySelectorAll('tr[data-row-key]')].find(x => x.innerText.includes('Browser ${tag}')).querySelector('a[href*="attempts"]').click()`)
  await eventually(() => cdp.eval(hiddenResult ? hiddenUi : visibleUi), 'History link result UI')
  await cdp.send('Page.navigate', { url: `https://localhost:5173/student/attempts/${attemptId}` })
  try { await eventually(() => cdp.eval(hiddenResult ? hiddenUi : visibleUi), 'Direct URL result UI') }
  catch (error) {
    console.error('Direct URL page:', await cdp.eval(`({path:location.pathname,section:document.querySelector('section')?.innerText.slice(0,300)})`))
    throw error
  }
  await cdp.send('Page.reload')
  await eventually(() => cdp.eval(hiddenResult ? hiddenUi : visibleUi), 'Reloaded result UI')
  await cdp.send('Page.navigate', { url: 'https://localhost:5173/student/attempts' })
  await eventually(() => cdp.eval(`document.body.innerText.includes('Lịch sử làm bài') && document.body.innerText.includes('Browser ${tag}')`), 'Student attempt history UI')
  const historyRow = await cdp.eval(`[...document.querySelectorAll('tr[data-row-key]')].find(x => x.innerText.includes('Browser ${tag}'))?.innerText`)
  if (!historyRow || (hiddenResult && (/\b5\b|Đạt|Option one|Option two/.test(historyRow) || !historyRow.includes('Chưa được phép xem'))))
    throw new Error('History row leaks hidden result or is absent')
  const historyRaw = await cdp.eval(`(async () => { const client=(await import('/src/api/axiosClient.js')).default;
    return (await client.get('/attempts/mine')).data })()`)
  const historyItem = historyRaw.data?.items?.find((item) => item.attemptId === attemptId)
  if (!historyItem || (hiddenResult && (historyItem.result !== null ||
      /"(totalMark|isPassed|isCorrect|answersJson|snapshotJson)"/i.test(JSON.stringify(historyItem)))))
    throw new Error('History API leaked hidden result or missed attempt')
  await cdp.eval(`document.querySelector('a[href="/student/attempts/${attemptId}"]').click()`)
  await eventually(() => cdp.eval(hiddenResult ? hiddenUi : visibleUi), 'History row detail UI')
  if (sql(`SELECT COUNT(*) FROM dbo.ExamAttemptSubmissions WHERE ExamAttemptId IN (SELECT Id FROM dbo.ExamAttempts WHERE ExamId=${fixture[0]});`) !== '1')
    throw new Error('Browser submission not persisted')
  console.log(hiddenResult ? 'TASK10_BROWSER_HIDDEN_RESULT_API_SQL=PASS' : 'TASK10_BROWSER_SCHEDULE_START_SAVE_RELOAD_SUBMIT_RESULT_SQL=PASS')
} finally {
  if (fixture?.length === 4 && fixture.every((x) => Number.isSafeInteger(x) && x > 0)) {
    const [exam, classroom, question] = fixture
    sql(`DELETE dbo.ExamAttemptSubmissions WHERE ExamAttemptId IN (SELECT Id FROM dbo.ExamAttempts WHERE ExamId=${exam});
      DELETE dbo.ExamAttempts WHERE ExamId=${exam};
      DELETE dbo.ClassExamSchedule WHERE ExamScheduleId IN (SELECT Id FROM dbo.ExamSchedules WHERE ExamId=${exam});
      DELETE dbo.ExamSchedules WHERE ExamId=${exam}; DELETE dbo.ClassUsers WHERE ClassId=${classroom};
      DELETE dbo.Classes WHERE Id=${classroom};
      DELETE dbo.ExamDetailQuestions WHERE ExamDetailId IN (SELECT Id FROM dbo.ExamDetails WHERE ExamId=${exam});
      DELETE dbo.Answers WHERE QuestionId=${question}; DELETE dbo.Questions WHERE Id=${question};
      DELETE dbo.ExamDetails WHERE ExamId=${exam}; DELETE dbo.Exams WHERE Id=${exam};`)
  }
  socket?.close()
  chrome.kill()
  await pause(500)
  if (path.resolve(profile).startsWith(path.resolve(tmpdir()) + path.sep)) {
    try { await rm(profile, { recursive: true, force: true }) } catch { /* Chrome may exit later */ }
  }
}
