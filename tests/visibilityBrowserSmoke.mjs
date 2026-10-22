import { spawn } from 'node:child_process'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

const { DACN_QA_EMAIL: email, DACN_QA_PASSWORD: password,
  DACN_QA_ATTEMPT_ID: attemptId } = process.env
if (!email || !password || !attemptId) throw new Error('Missing short-lived QA fixture')
const profile = await mkdtemp(path.join(tmpdir(), 'dacn-visibility-'))
const port = 9300 + Math.floor(Math.random() * 1000)
const chromePath = process.env.DACN_CHROME_PATH || String.raw`C:\Program Files\Google\Chrome\Application\chrome.exe`
const chrome = spawn(chromePath, ['--headless=new', '--no-first-run', '--no-default-browser-check',
  '--ignore-certificate-errors', '--remote-allow-origins=*', `--remote-debugging-port=${port}`,
  `--user-data-dir=${profile}`, 'about:blank'], { stdio: 'ignore' })
let socket
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
async function eventually(check, label) {
  for (let i = 0; i < 100; i += 1) {
    try { const answer = await check(); if (answer) return answer } catch { /* page loading */ }
    await pause(200)
  }
  throw new Error(`${label} timed out`)
}
let nextId = 1
const pending = new Map()
function send(method, params = {}) {
  const id = nextId++
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject })
    socket.send(JSON.stringify({ id, method, params }))
  })
}
async function evaluate(expression) {
  const response = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })
  if (response.exceptionDetails) throw new Error(`Browser evaluation failed: ${expression.slice(0, 80)}`)
  return response.result.value
}
try {
  const tab = await eventually(async () => {
    const response = await fetch(`http://127.0.0.1:${port}/json/new?${encodeURIComponent('https://localhost:5173/auth/login')}`, { method: 'PUT' })
    return response.ok ? response.json() : null
  }, 'Chrome endpoint')
  socket = new WebSocket(tab.webSocketDebuggerUrl)
  socket.addEventListener('message', ({ data }) => {
    const message = JSON.parse(data)
    const task = pending.get(message.id)
    if (!task) return
    pending.delete(message.id)
    if (message.error) task.reject(new Error(message.error.message))
    else task.resolve(message.result)
  })
  await new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, { once: true })
    socket.addEventListener('error', reject, { once: true })
  })
  await send('Runtime.enable')
  await eventually(() => evaluate(`document.body?.innerText.includes('Đăng Nhập')`), 'FE login')
  let loggedIn = false
  for (let retry = 0; retry < 5 && !loggedIn; retry += 1) {
    const result = await evaluate(`(async () => { const { login } = await import('/src/services/authService.js');
      try { await login(${JSON.stringify(email)}, ${JSON.stringify(password)}); return { ok:true } }
      catch (error) { return { ok:false, status:error.response?.status, message:error.message } } })()`)
    loggedIn = result.ok
    if (!loggedIn && result.status !== 429) throw new Error(`FE Student login failed: ${result.status} ${result.message}`)
    if (!loggedIn) await pause(15000)
  }
  if (!loggedIn) throw new Error('FE Student login rate limit persisted')
  await evaluate(`window.history.pushState({}, '', '/student/attempts/${attemptId}'); window.dispatchEvent(new PopStateEvent('popstate'))`)
  await eventually(() => evaluate(`document.body.innerText.includes('Số lần rời tab đã ghi nhận: 2')`), 'Initial count')
  await evaluate(`Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' });
    document.dispatchEvent(new Event('visibilitychange'))`)
  await eventually(() => evaluate(`document.body.innerText.includes('Số lần rời tab đã ghi nhận: 3')`), 'Hidden event count')
  await evaluate(`Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'visible' });
    document.dispatchEvent(new Event('visibilitychange'))`)
  await send('Page.reload', { ignoreCache: true })
  await eventually(() => evaluate(`document.body.innerText.includes('Số lần rời tab đã ghi nhận: 3')`), 'Count after reload')
  console.log('VISIBILITY_BROWSER=PASS (synthetic visibilitychange hidden + reload)')
} finally {
  socket?.close()
  chrome.kill()
  for (let retry = 0; retry < 10; retry += 1) {
    try { await rm(profile, { recursive: true, force: true }); break }
    catch (error) { if (retry === 9) throw error; await pause(200) }
  }
}
