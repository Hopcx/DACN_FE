// Invoked by Task11Task13SqlSmoke.ps1 while its disposable SQL fixture exists.
import { spawn } from 'node:child_process'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

const email = process.env.DACN_QA_EMAIL
const password = process.env.DACN_QA_PASSWORD
const tag = process.env.DACN_QA_TAG
const attemptId = process.env.DACN_QA_ATTEMPT_ID
if (!email || !password || !tag || !attemptId) throw new Error('Missing short-lived QA fixture credentials')
const profile = await mkdtemp(path.join(tmpdir(), 'dacn-admin-report-'))
const port = 9300 + Math.floor(Math.random() * 1000)
const chromePath = process.env.DACN_CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const chrome = spawn(chromePath, ['--headless=new', '--no-first-run', '--no-default-browser-check',
  '--ignore-certificate-errors', '--remote-allow-origins=*', `--remote-debugging-port=${port}`,
  `--user-data-dir=${profile}`, 'about:blank'], { stdio: 'ignore' })
let socket
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
async function eventually(check, label) {
  for (let i = 0; i < 80; i += 1) {
    try { const answer = await check(); if (answer) return answer } catch { /* retry while loading */ }
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
    if (!loggedIn && result.status !== 429) throw new Error(`FE admin login failed: HTTP ${result.status} ${result.message}`)
    if (!loggedIn) await pause(15000)
  }
  if (!loggedIn) throw new Error('FE admin login rate limit persisted')
  await evaluate(`window.history.pushState({}, '', '/admin/dashboard'); window.dispatchEvent(new PopStateEvent('popstate'))`)
  await eventually(() => evaluate(`document.body.innerText.includes('Kết quả lượt thi DACN') &&
    document.body.innerText.includes('Report QA ${tag}')`), 'Admin report table')
  const stats = await evaluate(`Object.fromEntries([...document.querySelectorAll('.attempt-report .admin-stat-card')].map(card => [
    card.querySelector('.admin-stat-card__label')?.innerText,
    card.querySelector('.admin-stat-card__value')?.innerText]))`)
  for (const [label, expected] of Object.entries({ 'Tổng lượt': '5', 'Đang làm': '1', 'Đã chốt': '4',
    'Hết giờ': '1', 'Kết quả ẩn': '1', 'Đạt': '2', 'Tỷ lệ đạt': '50%', 'Điểm trung bình': '5' })) {
    if (stats[label] !== expected) throw new Error(`Admin report ${label}: ${stats[label]} instead of ${expected}`)
  }
  const rows = await evaluate(`document.querySelectorAll('.attempt-report tr[data-row-key]').length`)
  if (rows !== 5) throw new Error(`Admin report rows: ${rows}`)
  await evaluate(`[...document.querySelectorAll('tr[data-row-key]')].find(row =>
    row.dataset.rowKey?.toLowerCase() === ${JSON.stringify(attemptId.toLowerCase())})?.querySelector('button').click()`)
  await eventually(() => evaluate(`!!document.querySelector('.ant-modal textarea')`), 'Void modal')
  await evaluate(`document.querySelector('.ant-modal textarea').focus()`)
  await send('Input.insertText', { text: 'QA audit reason' })
  await eventually(() => evaluate(`[...document.querySelectorAll('.ant-modal button')].some(x => x.innerText.includes('Xác nhận hủy') && !x.disabled)`), 'Void confirmation')
  await evaluate(`[...document.querySelectorAll('.ant-modal button')].find(x => x.innerText.includes('Xác nhận hủy')).click()`)
  await eventually(() => evaluate(`Object.fromEntries([...document.querySelectorAll('.attempt-report .admin-stat-card')].map(card => [
    card.querySelector('.admin-stat-card__label')?.innerText, card.querySelector('.admin-stat-card__value')?.innerText]))['Đã hủy'] === '1'`), 'Voided report')
  const after = await evaluate(`Object.fromEntries([...document.querySelectorAll('.attempt-report .admin-stat-card')].map(card => [
    card.querySelector('.admin-stat-card__label')?.innerText, card.querySelector('.admin-stat-card__value')?.innerText]))`)
  if (after['Đã chốt'] !== '3' || after['Đạt'] !== '1' || after['Tỷ lệ đạt'] !== '33.33%' || after['Điểm trung bình'] !== '4')
    throw new Error(`Post-void browser stats mismatch: ${JSON.stringify(after)}`)
  console.log('TASK13_ADMIN_BROWSER_API_SQL=PASS')
} finally {
  socket?.close()
  chrome.kill()
  await pause(500)
  if (path.resolve(profile).startsWith(path.resolve(tmpdir()) + path.sep)) {
    try { await rm(profile, { recursive: true, force: true }) } catch { /* Chrome may exit later */ }
  }
}
