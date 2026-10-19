import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Alert, Button, Select, Table, Typography } from 'antd'
import { getApiError } from '../../api/response'
import { getMyAttemptHistory } from '../../services/attemptService'
import { formatScheduleTime } from '../../services/scheduleTime'

const stateLabel = { inProgress: 'Đang làm', submitted: 'Đã nộp', timedOut: 'Hết giờ', voided: 'Đã hủy' }
const localTime = (value) => formatScheduleTime(value, 'utc')

export default function StudentAttemptHistoryPage() {
  const [page, setPage] = useState(1)
  const [state, setState] = useState(undefined)
  const [history, setHistory] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const load = useCallback(async () => {
    setLoading(true); setError('')
    try { setHistory(await getMyAttemptHistory(page, 10, state)) }
    catch (failure) { setError(getApiError(failure)) }
    finally { setLoading(false) }
  }, [page, state])
  useEffect(() => { load() }, [load])

  return <section className="p-6">
    <Typography.Title level={2}>Lịch sử làm bài</Typography.Title>
    <Typography.Paragraph>Chỉ gồm lượt thi DACN mới của bạn. Lượt thi cũ đang chờ đối soát.</Typography.Paragraph>
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
  </section>
}
