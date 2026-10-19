import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Alert, Button, Select, Table, Typography } from 'antd'
import { getApiError } from '../../api/response'
import { getMyAttemptHistory, getMyLegacySubmissions } from '../../services/attemptService'
import { formatScheduleTime } from '../../services/scheduleTime'

const stateLabel = { inProgress: 'Đang làm', submitted: 'Đã nộp', timedOut: 'Hết giờ', voided: 'Đã hủy' }
const localTime = (value) => formatScheduleTime(value, 'utc')

export default function StudentAttemptHistoryPage() {
  const [page, setPage] = useState(1)
  const [state, setState] = useState(undefined)
  const [history, setHistory] = useState(null)
  const [legacyPage, setLegacyPage] = useState(1)
  const [legacy, setLegacy] = useState(null)
  const [legacyError, setLegacyError] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const load = useCallback(async () => {
    setLoading(true); setError('')
    try { setHistory(await getMyAttemptHistory(page, 10, state)) }
    catch (failure) { setError(getApiError(failure)) }
    finally { setLoading(false) }
  }, [page, state])
  useEffect(() => { load() }, [load])
  const loadLegacy = useCallback(async () => {
    try { setLegacy(await getMyLegacySubmissions(legacyPage, 10)); setLegacyError('') }
    catch (failure) { setLegacy(null); setLegacyError(getApiError(failure)) }
  }, [legacyPage])
  useEffect(() => { loadLegacy() }, [loadLegacy])

  return <section className="p-6">
    <Typography.Title level={2}>Lịch sử làm bài</Typography.Title>
    <Typography.Paragraph>Lượt thi DACN mới và bài nộp từ nguồn lịch sử được hiển thị riêng.</Typography.Paragraph>
    {error && <Alert type="error" showIcon title={error} className="mb-4" />}
    <Select allowClear placeholder="Trạng thái" value={state} className="mr-2" style={{ width: 180 }}
      options={Object.entries(stateLabel).map(([value, label]) => ({ value, label }))}
      onChange={(value) => { setPage(1); setState(value) }} />
    <Button onClick={load} disabled={loading} className="mb-4">Tải lại</Button>
    <Table rowKey="attemptId" loading={loading} dataSource={history?.items || []}
      pagination={{ current: page, pageSize: history?.pageSize || 10, total: history?.totalCount || 0,
        showSizeChanger: false, onChange: setPage }}
      locale={{ emptyText: 'Chưa có lượt thi DACN mới' }} columns={[
        { title: 'Bài thi', dataIndex: 'examName' },
        { title: 'Lịch', dataIndex: 'scheduleTitle', render: (value, row) => value || `#${row.scheduleId}` },
        { title: 'Bắt đầu', dataIndex: 'startedAt', render: localTime },
        { title: 'Nộp', dataIndex: 'submittedAt', render: localTime },
        { title: 'Trạng thái', render: (_, row) => row.pendingFinalization ? 'Đang chốt bài' : stateLabel[row.state] || row.state },
        { title: 'Kết quả', render: (_, row) => row.result
          ? `${row.result.totalMark} · ${row.result.isPassed ? 'Đạt' : 'Chưa đạt'}`
          : row.state === 'inProgress' || row.state === 'voided' ? '—' : 'Chưa được phép xem' },
        { title: 'Chi tiết', render: (_, row) => <Link to={`/student/attempts/${row.attemptId}`}>Mở lượt thi</Link> },
      ]} />
    <Typography.Title level={3}>Bài nộp lịch sử</Typography.Title>
    <Typography.Paragraph>Dữ liệu có nguồn riêng; thời gian gốc chưa rõ múi giờ. Bài cũ không có snapshot để xem đáp án đúng.</Typography.Paragraph>
    {legacyError && <Alert type="error" showIcon title={legacyError} className="mb-4" />}
    <Button onClick={loadLegacy} className="mb-4">Tải lại bài cũ</Button>
    <Table rowKey="id" dataSource={legacy?.items || []}
      pagination={{ current: legacyPage, pageSize: legacy?.pageSize || 10, total: legacy?.totalCount || 0,
        showSizeChanger: false, onChange: setLegacyPage }}
      locale={{ emptyText: 'Chưa có bài nộp lịch sử' }} columns={[
        { title: 'Nguồn', dataIndex: 'sourceSystem' },
        { title: 'Bài thi', dataIndex: 'examName' },
        { title: 'Lịch', dataIndex: 'scheduleTitle' },
        { title: 'Giờ gốc (múi giờ chưa rõ)', dataIndex: 'submittedAtLocalUnknown' },
        { title: 'Trạng thái gốc', dataIndex: 'legacyStatus', render: (value) => value === true ? 'Chấp nhận' : value === false ? 'Không công nhận' : 'Chờ kiểm tra' },
        { title: 'Kết quả', dataIndex: 'result', render: (value) => value
          ? `${value.totalMark} · ${value.isPassed ? 'Đạt' : 'Chưa đạt'}` : 'Chưa được phép xem' },
        { title: 'Xem bài', render: () => 'Không có snapshot' },
      ]} />
  </section>
}
