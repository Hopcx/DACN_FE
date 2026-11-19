import { useCallback, useEffect, useRef, useState } from 'react'
import { getApiError } from '../api/response'
import { flagQuestion, getReviewFlags, unflagQuestion } from '../services/reviewFlagService'
import { applyIntents, legacyFlagIds } from '../services/reviewFlags'

const EMPTY = new Set()

/**
 * To-be T8: đánh dấu câu lưu ở server cho một lượt thi/phiên luyện tập.
 * - Cập nhật lạc quan; mỗi câu chỉ một request chạy tại một thời điểm (xếp hàng theo câu) nên bấm nhanh
 *   Đánh dấu → Bỏ đánh dấu luôn kết thúc đúng ý cuối cùng của người dùng.
 * - Lỗi: tải lại danh sách từ server (không tự lật trạng thái) rồi báo onError.
 * - Lần tải đầu không ghi đè thao tác người dùng bấm trong lúc chờ (giữ "ý định" theo câu).
 * - State và kết quả request gắn với khóa nguồn: request của nguồn cũ (vd. trước "Làm lại bộ này") bị bỏ qua.
 * - legacyKey: khóa sessionStorage cũ (trang thi trước T8) — đẩy lên server một lần rồi xóa (QT8-3 a).
 */
export default function useReviewFlags(sourceKind, sourceId, { legacyKey, onError } = {}) {
  const key = `${sourceKind}:${sourceId}`
  const [store, setStore] = useState({ key: null, flags: EMPTY })
  const flags = store.key === key ? store.flags : EMPTY
  const flagsRef = useRef({ key: null, flags: EMPTY })
  const keyRef = useRef(key)
  const intentsRef = useRef(new Map())   // questionId → true/false: ý định chưa được server xác nhận
  const queuesRef = useRef(new Map())    // questionId → Promise của request đang chạy
  const errorRef = useRef(onError)
  useEffect(() => { errorRef.current = onError }, [onError])

  const write = useCallback((forKey, next) => {
    if (forKey !== keyRef.current) return
    flagsRef.current = { key: forKey, flags: next }
    setStore(flagsRef.current)
  }, [])
  const current = useCallback(() => (flagsRef.current.key === keyRef.current ? flagsRef.current.flags : EMPTY), [])

  const resync = useCallback(async (forKey) => {
    try {
      const data = await getReviewFlags(sourceKind, sourceId)
      write(forKey, applyIntents(data.questionIds || [], intentsRef.current))
    } catch { /* giữ trạng thái hiện tại; lỗi đã được báo */ }
  }, [sourceKind, sourceId, write])

  useEffect(() => {
    keyRef.current = key
    intentsRef.current = new Map()
    queuesRef.current = new Map()
    if (!sourceId) return undefined
    let cancelled = false
    ;(async () => {
      try {
        const legacy = legacyKey ? legacyFlagIds(sessionStorage.getItem(legacyKey)) : []
        if (legacy.length) {
          // Đẩy một lần rồi xóa khóa cũ dù vài câu lỗi (tránh đánh dấu lại câu người dùng đã bỏ ở lần mở sau)
          await Promise.allSettled(legacy.map((id) => flagQuestion(sourceKind, sourceId, id)))
          sessionStorage.removeItem(legacyKey)
        }
        const data = await getReviewFlags(sourceKind, sourceId)
        if (!cancelled) write(key, applyIntents(data.questionIds || [], intentsRef.current))
      } catch (failure) { if (!cancelled) errorRef.current?.(`Không tải được câu đã đánh dấu: ${getApiError(failure)}`) }
    })()
    return () => { cancelled = true }
  }, [key, sourceKind, sourceId, legacyKey, write])

  const toggle = useCallback((questionId) => {
    const forKey = keyRef.current
    const desired = !current().has(questionId)
    intentsRef.current.set(questionId, desired)
    const next = new Set(current())
    if (desired) next.add(questionId); else next.delete(questionId)
    write(forKey, next)
    const previous = queuesRef.current.get(questionId) || Promise.resolve()
    const run = previous.then(async () => {
      if (forKey !== keyRef.current) return
      try {
        if (desired) await flagQuestion(sourceKind, sourceId, questionId)
        else await unflagQuestion(sourceKind, sourceId, questionId)
        // Chỉ xóa ý định nếu không có lần bấm mới hơn cho câu này
        if (intentsRef.current.get(questionId) === desired && queuesRef.current.get(questionId) === run) intentsRef.current.delete(questionId)
      } catch (failure) {
        if (forKey !== keyRef.current) return
        intentsRef.current.delete(questionId)
        errorRef.current?.(`Không lưu được đánh dấu: ${getApiError(failure)}`)
        await resync(forKey)
      }
    })
    queuesRef.current.set(questionId, run)
    return run
  }, [sourceKind, sourceId, current, write, resync])

  return [flags, toggle]
}
