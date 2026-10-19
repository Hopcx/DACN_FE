import { useCallback, useEffect, useState } from 'react'
import { Alert, Button, Input, Modal, Select, Space, Table, Typography } from 'antd'
import { getApiError } from '../../api/response'
import { getAttemptReport, getAttemptReportOptions, getLegacySubmissionReport, voidAttempt } from '../../services/attemptReportService'
import { formatScheduleTime } from '../../services/scheduleTime'

const time = (value) => formatScheduleTime(value, 'utc')
const optionsOf = (items) => (items || []).map(({ id, name }) => ({ value: id, label: name }))
const stateLabel = { inProgress: 'Đang làm', submitted: 'Đã nộp', timedOut: 'Hết giờ', voided: 'Đã hủy' }

export default function AdminAttemptReport() {
  const [filters, setFilters] = useState({})
  const [page, setPage] = useState(1)
  const [options, setOptions] = useState(null)
  const [report, setReport] = useState(null)
  const [legacyPage, setLegacyPage] = useState(1)
  const [legacyStatus, setLegacyStatus] = useState(undefined)
  const [legacyReport, setLegacyReport] = useState(null)
  const [legacyError, setLegacyError] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [voidTarget, setVoidTarget] = useState(null)
  const [voidReason, setVoidReason] = useState('')
  const [voidBusy, setVoidBusy] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try { setReport(await getAttemptReport({ ...filters, page, pageSize: 10 })); setError('') }
    catch (failure) { setReport(null); setError(getApiError(failure)) }
    finally { setLoading(false) }
  }, [filters, page])
  useEffect(() => { load() }, [load])
  const loadLegacy = useCallback(async () => {
    try { setLegacyReport(await getLegacySubmissionReport({ page: legacyPage, pageSize: 10, status: legacyStatus })); setLegacyError('') }
    catch (failure) { setLegacyReport(null); setLegacyError(getApiError(failure)) }
  }, [legacyPage, legacyStatus])
  useEffect(() => { loadLegacy() }, [loadLegacy])
  useEffect(() => {
    getAttemptReportOptions().then(setOptions).catch((failure) => setError(getApiError(failure)))
  }, [])

  const change = (key, value) => { setPage(1); setFilters((current) => ({ ...current, [key]: value })) }
  const confirmVoid = async () => {
    if (!voidTarget || !voidReason.trim() || voidBusy) return
    setVoidBusy(true); setError('')
    try {
      await voidAttempt(voidTarget.attemptId, voidReason.trim())
      setVoidTarget(null); setVoidReason('')
      await load()
    } catch (failure) { setError(getApiError(failure)) }
    finally { setVoidBusy(false) }
  }
  const summary = report?.summary
  return <section className="attempt-report">
    <Typography.Title level={2}>Kết quả lượt thi DACN</Typography.Title>
    <Typography.Paragraph>
      Chỉ tính lượt thi DACN mới. Tỷ lệ đạt và phổ điểm tính trên lượt đã chốt chưa bị hủy, gồm cả hết giờ và kết quả ẩn;
      lượt đang làm và đã hủy không vào mẫu số. Lọc lớp theo lớp được gán vào lịch, mỗi lượt chỉ đếm một lần.
    </Typography.Paragraph>
    <Space wrap className="attempt-report__filters">
      <Select allowClear placeholder="Bài thi" style={{ width: 220 }} options={optionsOf(options?.exams)}
        value={filters.examId} onChange={(value) => change('examId', value)} />
      <Select allowClear placeholder="Lớp" style={{ width: 220 }} options={optionsOf(options?.classes)}
        value={filters.classId} onChange={(value) => change('classId', value)} />
      <Select allowClear placeholder="Môn học" style={{ width: 220 }} options={optionsOf(options?.subjects)}
        value={filters.subjectId} onChange={(value) => change('subjectId', value)} />
      <Select allowClear placeholder="Trạng thái" style={{ width: 180 }}
        options={Object.entries(stateLabel).map(([value, label]) => ({ value, label }))}
        value={filters.state} onChange={(value) => change('state', value)} />
      <Button onClick={load} loading={loading}>Tải lại</Button>
    </Space>
    {error && <Alert type="error" showIcon title={error} className="attempt-report__error" />}
    {summary && <div className="admin-stats-grid">
      {[
        ['Tổng lượt', summary.totalAttempts], ['Đang làm', summary.inProgressCount],
        ['Đã chốt', summary.finalizedCount], ['Đã hủy', summary.voidedCount], ['Hết giờ', summary.timeoutCount],
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
        { title: 'Điểm gốc', dataIndex: 'totalMark', render: (value) => value ?? '—' },
        { title: 'Kết quả', dataIndex: 'isPassed', render: (value) => value == null ? '—' : value ? 'Đạt' : 'Chưa đạt' },
        { title: 'Hủy', render: (_, row) => row.state === 'voided'
          ? <span title={row.voidReason}>{row.voidReason || 'Đã hủy'}</span>
          : row.state === 'inProgress' ? '—' : <Button danger size="small" onClick={() => { setVoidTarget(row); setVoidReason('') }}>Hủy kết quả</Button> },
      ]} />
    <Modal title="Hủy kết quả lượt thi" open={Boolean(voidTarget)} okText="Xác nhận hủy"
      okButtonProps={{ danger: true, disabled: !voidReason.trim(), loading: voidBusy }}
      onOk={confirmVoid} onCancel={() => { if (!voidBusy) { setVoidTarget(null); setVoidReason('') } }}>
      <Typography.Paragraph>Lượt đã hủy vẫn giữ điểm và bản chấm gốc để audit. Thao tác này không hoàn lượt thi.</Typography.Paragraph>
      <Input.TextArea value={voidReason} onChange={(event) => setVoidReason(event.target.value)}
        maxLength={1000} showCount rows={3} placeholder="Lý do hủy (bắt buộc)" />
    </Modal>
    <Typography.Title level={2}>Bài nộp từ nguồn lịch sử</Typography.Title>
    <Typography.Paragraph>Phạm vi riêng <code>legacySubmissionsOnly</code>; số liệu trên không cộng bài cũ. Trạng thái gốc không đồng nghĩa với hủy kết quả DACN. Giờ gốc chưa rõ múi giờ.</Typography.Paragraph>
    {legacyError && <Alert type="error" showIcon title={legacyError} className="attempt-report__error" />}
    <Select allowClear placeholder="Status lịch sử" style={{ width: 190 }} value={legacyStatus}
      options={[{ value: 'accepted', label: 'Chấp nhận' }, { value: 'notRecognized', label: 'Không công nhận' }, { value: 'pending', label: 'Chờ kiểm tra' }]}
      onChange={(value) => { setLegacyPage(1); setLegacyStatus(value) }} />
    <Button onClick={loadLegacy}>Tải lại bài cũ</Button>
    {legacyReport && <Typography.Paragraph>
      Tổng: {legacyReport.summary.totalSubmissions} · Chấp nhận: {legacyReport.summary.acceptedStatusCount}
      {' '}· Không công nhận: {legacyReport.summary.notRecognizedStatusCount}
      {' '}· Chờ kiểm tra: {legacyReport.summary.pendingStatusCount}
      {' '}· Tổng điểm gốc: {legacyReport.summary.storedScoreSum}
    </Typography.Paragraph>}
    <Table rowKey="id" dataSource={legacyReport?.items || []}
      pagination={{ current: legacyPage, pageSize: 10, total: legacyReport?.totalCount || 0,
        showSizeChanger: false, onChange: setLegacyPage }} columns={[
        { title: 'Nguồn', render: (_, row) => `${row.sourceSystem}/${row.sourceDatabase}` },
        { title: 'ID nguồn', dataIndex: 'legacyId' },
        { title: 'Bài thi', dataIndex: 'examName' },
        { title: 'Giờ gốc', dataIndex: 'submittedAtLocalUnknown' },
        { title: 'Status gốc', dataIndex: 'legacyStatus', render: (value) => value === true ? 'Chấp nhận' : value === false ? 'Không công nhận' : 'Chờ kiểm tra' },
        { title: 'Điểm lưu', dataIndex: 'totalMark' },
        { title: 'Đạt', dataIndex: 'isPassed', render: (value) => value ? 'Đạt' : 'Chưa đạt' },
      ]} />
  </section>
}
