import { spawn } from 'node:child_process'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

const { DACN_QA_EMAIL: email, DACN_QA_PASSWORD: password,
  DACN_QA_IMPORT_FILE: filePath, DACN_QA_TAG: tag } = process.env
if (!email || !password || !filePath || !tag) throw new Error('Missing short-lived QA fixture')
const profile = await mkdtemp(path.join(tmpdir(), 'dacn-import-'))
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
    if (!loggedIn && result.status !== 429) throw new Error(`FE Examiner login failed: ${result.status} ${result.message}`)
    if (!loggedIn) await pause(15000)
  }
  if (!loggedIn) throw new Error('FE Examiner login rate limit persisted')
  await evaluate(`window.history.pushState({}, '', '/admin/questions'); window.dispatchEvent(new PopStateEvent('popstate'))`)
  await eventually(() => evaluate(`document.body.innerText.includes('Ngân hàng câu hỏi') &&
    !!document.querySelector('input[type="file"]')`), 'Question import page')
  const document = await send('DOM.getDocument')
  const input = await send('DOM.querySelector', { nodeId: document.root.nodeId, selector: 'input[type="file"]' })
  await send('DOM.setFileInputFiles', { files: [filePath], nodeId: input.nodeId })
  await eventually(() => evaluate(`[...document.querySelectorAll('button')].some(x => x.innerText.includes('Nhập câu hỏi') && !x.disabled)`), 'Import selection')
  await evaluate(`[...document.querySelectorAll('button')].find(x => x.innerText.includes('Nhập câu hỏi')).click()`)
  try {
    await eventually(() => evaluate(`document.body.innerText.includes('Đã nhập 1 câu hỏi.') &&
      document.body.innerText.includes('As-is import ${tag} browser')`), 'Import through FE')
  } catch (error) {
    throw new Error(`${error.message}: ${(await evaluate('document.body.innerText')).slice(0, 1800)}`)
  }
  console.log('QUESTION_IMPORT_BROWSER=PASS')
} finally {
  socket?.close()
  chrome.kill()
  for (let retry = 0; retry < 10; retry += 1) {
    try { await rm(profile, { recursive: true, force: true }); break }
    catch (error) { if (retry === 9) throw error; await pause(200) }
  }
}
