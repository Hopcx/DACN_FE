import { useCallback, useEffect, useState } from 'react'
import { Alert, Button, Select, Space, Table, Typography } from 'antd'
import { getApiError } from '../../api/response'
import { getAttemptReport, getAttemptReportOptions } from '../../services/attemptReportService'
import { formatScheduleTime } from '../../services/scheduleTime'

const time = (value) => formatScheduleTime(value, 'utc')
const optionsOf = (items) => (items || []).map(({ id, name }) => ({ value: id, label: name }))
const stateLabel = { inProgress: 'Đang làm', submitted: 'Đã nộp', timedOut: 'Hết giờ' }

export default function AdminAttemptReport() {
  const [filters, setFilters] = useState({})
  const [page, setPage] = useState(1)
  const [options, setOptions] = useState(null)
  const [report, setReport] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try { setReport(await getAttemptReport({ ...filters, page, pageSize: 10 })); setError('') }
    catch (failure) { setReport(null); setError(getApiError(failure)) }
    finally { setLoading(false) }
  }, [filters, page])
  useEffect(() => { load() }, [load])
  useEffect(() => {
    getAttemptReportOptions().then(setOptions).catch((failure) => setError(getApiError(failure)))
  }, [])

  const change = (key, value) => { setPage(1); setFilters((current) => ({ ...current, [key]: value })) }
  const summary = report?.summary
  return <section className="attempt-report">
    <Typography.Title level={2}>Kết quả lượt thi DACN</Typography.Title>
    <Typography.Paragraph>
      Chỉ tính lượt thi DACN mới. Tỷ lệ đạt và phổ điểm tính trên lượt đã chốt, gồm cả hết giờ và kết quả ẩn;
      lượt đang làm không vào mẫu số. Lọc lớp theo lớp được gán vào lịch, mỗi lượt chỉ đếm một lần.
    </Typography.Paragraph>
    <Space wrap className="attempt-report__filters">
      <Select allowClear placeholder="Bài thi" style={{ width: 220 }} options={optionsOf(options?.exams)}
        value={filters.examId} onChange={(value) => change('examId', value)} />
      <Select allowClear placeholder="Lớp" style={{ width: 220 }} options={optionsOf(options?.classes)}
        value={filters.classId} onChange={(value) => change('classId', value)} />
      <Select allowClear placeholder="Môn học" style={{ width: 220 }} options={optionsOf(options?.subjects)}
        value={filters.subjectId} onChange={(value) => change('subjectId', value)} />
      <Button onClick={load} loading={loading}>Tải lại</Button>
    </Space>
    {error && <Alert type="error" showIcon title={error} className="attempt-report__error" />}
    {summary && <div className="admin-stats-grid">
      {[
        ['Tổng lượt', summary.totalAttempts], ['Đang làm', summary.inProgressCount],
        ['Đã chốt', summary.finalizedCount], ['Hết giờ', summary.timeoutCount],
        ['Kết quả ẩn', summary.hiddenResultCount], ['Đạt', summary.passedCount],
        ['Tỷ lệ đạt', `${summary.passPercent}%`], ['Điểm trung bình', summary.averageScore],
      ].map(([label, value]) => <div key={label} className="admin-stat-card">
        <div className="admin-stat-card__body"><div className="admin-stat-card__value">{value}</div>
          <div className="admin-stat-card__label">{label}</div></div>
      </div>)}
    </div>}
    <Typography.Title level={3}>Phổ điểm</Typography.Title>
    <Space wrap>{report?.distribution?.length
      ? report.distribution.map((bucket) => <span key={bucket.score}>{bucket.score}: {bucket.count} lượt</span>)
      : 'Chưa có lượt đã chốt'}</Space>
    <Typography.Title level={3}>Danh sách lượt thi</Typography.Title>
    <Table rowKey="attemptId" loading={loading} dataSource={report?.items || []}
      pagination={{ current: page, pageSize: 10, total: report?.totalCount || 0,
        showSizeChanger: false, onChange: setPage }}
      columns={[
        { title: 'Học viên', dataIndex: 'userName' },
        { title: 'Bài thi', dataIndex: 'examName' },
        { title: 'Lịch', dataIndex: 'scheduleTitle' },
        { title: 'Bắt đầu', dataIndex: 'startedAt', render: time },
        { title: 'Nộp', dataIndex: 'submittedAt', render: time },
        { title: 'Trạng thái', dataIndex: 'state', render: (value) => stateLabel[value] || value },
        { title: 'Điểm', dataIndex: 'totalMark', render: (value) => value ?? '—' },
        { title: 'Kết quả', dataIndex: 'isPassed', render: (value) => value == null ? '—' : value ? 'Đạt' : 'Chưa đạt' },
      ]} />
  </section>
}
