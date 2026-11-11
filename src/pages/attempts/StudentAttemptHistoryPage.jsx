import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Alert, Button, Select, Space, Table, Typography } from 'antd'
import { EyeOutlined, ReloadOutlined } from '@ant-design/icons'
import PageHeader from '../../components/ui/PageHeader'
import PageCard from '../../components/ui/PageCard'
import StatusTag from '../../components/ui/StatusTag'
import { getApiError } from '../../api/response'
import { getMyAttemptHistory, getMyLegacySubmissions } from '../../services/attemptService'
import { formatScheduleTime } from '../../services/scheduleTime'
import { formatVnRange } from '../../utils/duration'

const stateLabel = { inProgress: 'Đang làm bài', submitted: 'Đã nộp', timedOut: 'Hết giờ', voided: 'Đã hủy' }
const stateTone = { inProgress: 'info', submitted: 'success', timedOut: 'danger', voided: 'default' }
const localTime = (value) => formatScheduleTime(value, 'utc')

function stateCell(row) {
  if (row.pendingFinalization) return <StatusTag tone="warning">Đang chốt bài</StatusTag>
  if (row.result && row.state !== 'inProgress') return <StatusTag tone="success">Đã có kết quả</StatusTag>
  if ((row.state === 'submitted' || row.state === 'timedOut') && !row.result)
    return <span className="history-state"><StatusTag tone={stateTone[row.state]}>{stateLabel[row.state]}</StatusTag>
      <small>Chưa công bố kết quả</small></span>
  return <StatusTag tone={stateTone[row.state]}>{stateLabel[row.state] || row.state}</StatusTag>
}

export default function StudentAttemptHistoryPage() {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [state, setState] = useState(undefined)
  const [history, setHistory] = useState(null)
  const [legacyPage, setLegacyPage] = useState(1)
  const [legacy, setLegacy] = useState(null)
  const [legacyError, setLegacyError] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const load = useCallback(async () => {
    setLoading(true); setError('')
    try { setHistory(await getMyAttemptHistory(page, pageSize, state)) }
    catch (failure) { setError(getApiError(failure)) }
    finally { setLoading(false) }
  }, [page, pageSize, state])
  useEffect(() => { load() }, [load])
  const loadLegacy = useCallback(async () => {
    try { setLegacy(await getMyLegacySubmissions(legacyPage, 10)); setLegacyError('') }
    catch (failure) { setLegacy(null); setLegacyError(getApiError(failure)) }
  }, [legacyPage])
  useEffect(() => { loadLegacy() }, [loadLegacy])

  const total = history?.totalCount || 0
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  return <section className="page-body">
    <PageHeader title="Lịch sử lượt thi" description="Danh sách các lượt làm bài của bạn."
      extra={<Button icon={<ReloadOutlined />} onClick={load} loading={loading}>Làm mới</Button>} />
    {error && <Alert type="error" showIcon title={error} className="mb-4" />}
    <PageCard>
      <Space wrap className="history-toolbar">
        <Select value={state ?? 'all'} style={{ width: 200 }}
          options={[{ value: 'all', label: 'Tất cả trạng thái' }, ...Object.entries(stateLabel).map(([value, label]) => ({ value, label }))]}
          onChange={(value) => { setPage(1); setState(value === 'all' ? undefined : value) }} />
        <Select value={pageSize} style={{ width: 140 }} options={[10, 20, 50].map((value) => ({ value, label: `${value} dòng/trang` }))}
          onChange={(value) => { setPage(1); setPageSize(value) }} />
      </Space>
      <Table rowKey="attemptId" loading={loading} dataSource={history?.items || []} scroll={{ x: 760 }}
        pagination={{ current: page, pageSize, total, showSizeChanger: false, onChange: setPage,
          showTotal: () => `Hiển thị ${from} – ${Math.min(page * pageSize, total)} của ${total} lượt thi` }}
        locale={{ emptyText: 'Chưa có lượt thi nào' }} columns={[
          { title: '#', width: 48, render: (_, __, index) => from + index },
          { title: 'Bài thi', render: (_, row) => <span className="history-exam"><strong>{row.examName}</strong>
            {row.scheduleTitle && <small>{row.scheduleTitle}</small>}
            {row.attemptNumber && <small>Lần {row.attemptNumber}/{row.numberOfRepeat || '?'}</small>}</span> },
          { title: 'Thời gian làm bài', render: (_, row) => formatVnRange(row.startedAt, row.finishedAt || row.submittedAt || row.deadline) || localTime(row.startedAt) },
          { title: 'Trạng thái', render: (_, row) => stateCell(row) },
          { title: 'Kết quả', align: 'center', render: (_, row) => row.result
            ? <span className="history-score"><strong>{row.result.totalMark}</strong><small>{row.result.isPassed ? 'Đạt' : 'Chưa đạt'}</small></span>
            : row.state === 'inProgress' || row.state === 'voided' ? '—' : <small className="muted">Chưa được phép xem</small> },
          { title: 'Thao tác', render: (_, row) => row.reviewAvailable
            ? <Button icon={<EyeOutlined />} onClick={() => navigate(`/student/attempts/${row.attemptId}?review=1`)}>Xem lại bài</Button>
            : row.state === 'inProgress' && !row.pendingFinalization
              ? <Button type="primary" onClick={() => navigate(`/student/attempts/${row.attemptId}`)}>Tiếp tục</Button>
              : <Link to={`/student/attempts/${row.attemptId}`}>Mở lượt thi</Link> },
        ]} />
    </PageCard>
    <PageCard>
      <Typography.Title level={4}>Bài nộp lịch sử</Typography.Title>
      <Typography.Paragraph type="secondary">Dữ liệu có nguồn riêng; thời gian gốc chưa rõ múi giờ. Bài cũ không có snapshot để xem đáp án đúng.</Typography.Paragraph>
      {legacyError && <Alert type="error" showIcon title={legacyError} className="mb-4" />}
      <Table rowKey="id" dataSource={legacy?.items || []} scroll={{ x: 760 }}
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
        ]} />
    </PageCard>
  </section>
}
