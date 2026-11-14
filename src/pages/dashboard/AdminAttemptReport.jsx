import { useCallback, useEffect, useRef, useState } from 'react'
import { Alert, Button, Descriptions, Input, Modal, Segmented, Select, Table, Typography } from 'antd'
import { DeleteOutlined, ProfileOutlined, ReloadOutlined } from '@ant-design/icons'
import { getApiError, toLoadError } from '../../api/response'
import { getAttemptReport, getAttemptReportOptions, getLegacySubmissionReport, getScoreGroups, voidAttempt } from '../../services/attemptReportService'
import { DistributionChart, GroupedDistributionChart, PassDonutChart, StatusColumnChart } from '../../components/charts'
import { formatScheduleTime } from '../../services/scheduleTime'
import { rowNumber, showTotalLabel } from '../../services/listView'
import PageCard from '../../components/ui/PageCard'
import StatusTag from '../../components/ui/StatusTag'
import { LoadError, TableEmpty } from '../../components/ui/PageState'

const time = (value) => formatScheduleTime(value, 'utc')
const optionsOf = (items) => (items || []).map(({ id, name }) => ({ value: id, label: name }))
const stateTone = { inProgress: 'info', submitted: 'success', timedOut: 'warning', voided: 'danger' }
const stateLabel = { inProgress: 'Đang làm', submitted: 'Đã nộp', timedOut: 'Hết giờ', voided: 'Đã hủy' }
const stateTag = (value) => <StatusTag tone={stateTone[value]}>{stateLabel[value] || value}</StatusTag>
const resultTag = (value) => value == null ? '—'
  : <StatusTag tone={value ? 'success' : 'danger'}>{value ? 'Đạt' : 'Chưa đạt'}</StatusTag>
const canVoid = (row) => row && row.state !== 'voided' && row.state !== 'inProgress'

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
  const [loadError, setLoadError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [voidTarget, setVoidTarget] = useState(null)
  const [voidReason, setVoidReason] = useState('')
  const [voidBusy, setVoidBusy] = useState(false)
  const [voidError, setVoidError] = useState('')
  const [detail, setDetail] = useState(null)
  const requestRef = useRef(0)

  // Bảng phân trang server: page nằm trong deps là đúng
  const load = useCallback(async () => {
    const requestId = ++requestRef.current
    setLoading(true); setLoadError(null)
    try {
      const data = await getAttemptReport({ ...filters, page, pageSize: 10 })
      if (requestId === requestRef.current) setReport(data)
    } catch (failure) {
      if (requestId === requestRef.current) setLoadError(toLoadError(failure))
    } finally {
      if (requestId === requestRef.current) setLoading(false)
    }
  }, [filters, page])
  useEffect(() => { load() }, [load])
  const loadLegacy = useCallback(async () => {
    try { setLegacyReport(await getLegacySubmissionReport({ page: legacyPage, pageSize: 10, status: legacyStatus })); setLegacyError('') }
    catch (failure) { setLegacyReport(null); setLegacyError(getApiError(failure)) }
  }, [legacyPage, legacyStatus])
  useEffect(() => { loadLegacy() }, [loadLegacy])
  const [groupBy, setGroupBy] = useState('exam')
  const [scoreGroups, setScoreGroups] = useState(null)
  const [groupsError, setGroupsError] = useState('')
  const loadGroups = useCallback(async () => {
    const { examId, classId, subjectId } = filters
    try { setScoreGroups(await getScoreGroups({ groupBy, examId, classId, subjectId })); setGroupsError('') }
    catch (failure) { setScoreGroups(null); setGroupsError(getApiError(failure)) }
  }, [filters, groupBy])
  useEffect(() => { loadGroups() }, [loadGroups])
  useEffect(() => {
    getAttemptReportOptions().then(setOptions).catch((failure) => setError(getApiError(failure)))
  }, [])

  const change = (key, value) => { setPage(1); setFilters((current) => ({ ...current, [key]: value })) }
  const openVoid = (row) => { setVoidTarget(row); setVoidReason(''); setVoidError('') }
  const confirmVoid = async () => {
    if (!voidTarget || !voidReason.trim() || voidBusy) return
    setVoidBusy(true); setVoidError('')
    try {
      await voidAttempt(voidTarget.attemptId, voidReason.trim())
      setVoidTarget(null); setVoidReason(''); setDetail(null)
      await load()
    } catch (failure) { setVoidError(getApiError(failure)) }
    finally { setVoidBusy(false) }
  }
  const selectProps = { allowClear: true, showSearch: { optionFilterProp: 'label' }, virtual: false, popupMatchSelectWidth: false }
  const summary = report?.summary
  return <section className="attempt-report">
    <PageCard>
    <div className="page-toolbar attempt-report__filters">
      <Select {...selectProps} placeholder="Bài thi" style={{ width: 220 }} options={optionsOf(options?.exams)}
        value={filters.examId} onChange={(value) => change('examId', value)} />
      <Select {...selectProps} placeholder="Lớp" style={{ width: 220 }} options={optionsOf(options?.classes)}
        value={filters.classId} onChange={(value) => change('classId', value)} />
      <Select {...selectProps} placeholder="Môn học" style={{ width: 220 }} options={optionsOf(options?.subjects)}
        value={filters.subjectId} onChange={(value) => change('subjectId', value)} />
      <Select allowClear placeholder="Trạng thái" style={{ width: 180 }}
        options={Object.entries(stateLabel).map(([value, label]) => ({ value, label }))}
        value={filters.state} onChange={(value) => change('state', value)} />
      <div className="page-toolbar__end">
        <Button icon={<ReloadOutlined />} onClick={load} loading={loading}>Tải lại</Button>
      </div>
    </div>
    </PageCard>
    <LoadError error={loadError} onRetry={load} retrying={loading} />
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
    {summary && <div className="report-charts">
      <PageCard>
        <h2 className="page-section-title">Phân bố lượt thi theo trạng thái</h2>
        <StatusColumnChart data={[
          { key: 'submitted', label: 'Đã nộp', value: summary.submittedCount },
          { key: 'inProgress', label: 'Đang làm', value: summary.inProgressCount },
          { key: 'timedOut', label: 'Hết giờ', value: summary.timeoutCount },
          { key: 'voided', label: 'Đã hủy', value: summary.voidedCount },
        ]} />
      </PageCard>
      <PageCard>
        <h2 className="page-section-title">Tỷ lệ kết quả <small>(chỉ lượt đã chốt)</small></h2>
        <PassDonutChart passed={summary.passedCount} failed={summary.failedCount} />
      </PageCard>
    </div>}
    <PageCard>
    <h2 className="page-section-title">Phổ điểm <small>(điểm gốc, theo bộ lọc hiện tại)</small></h2>
    <DistributionChart data={(report?.distribution || []).map((bucket) => ({ label: String(bucket.score), count: bucket.count }))} />
    </PageCard>
    <PageCard>
    <div className="score-groups__toolbar">
      <h2 className="page-section-title">Phổ điểm theo nhóm <small>(quy về thang 10)</small></h2>
      <Segmented value={groupBy} onChange={setGroupBy} options={[
        { value: 'exam', label: 'Theo bài thi' }, { value: 'class', label: 'Theo lớp' }, { value: 'subject', label: 'Theo môn học' }]} />
    </div>
    {groupsError && <Alert type="error" showIcon title={groupsError} className="attempt-report__error" />}
    <GroupedDistributionChart groups={scoreGroups?.groups} />
    <Table rowKey="id" size="small" pagination={false} dataSource={scoreGroups?.groups || []} scroll={{ x: 640 }}
      locale={{ emptyText: 'Chưa có lượt đã chốt' }} style={{ marginTop: 12 }}
      columns={[
        { title: groupBy === 'exam' ? 'Bài thi' : groupBy === 'class' ? 'Lớp' : 'Môn học', dataIndex: 'name' },
        { title: 'Lượt đã chốt', dataIndex: 'finalizedCount', align: 'right' },
        { title: 'Đạt', dataIndex: 'passedCount', align: 'right' },
        { title: 'Chưa đạt', dataIndex: 'failedCount', align: 'right' },
        { title: 'Tỷ lệ đạt', dataIndex: 'passPercent', align: 'right', render: (value) => `${value}%` },
        { title: 'Điểm TB (gốc)', dataIndex: 'averageScore', align: 'right' },
      ]} />
    {groupBy === 'class' && <Typography.Paragraph type="secondary" className="dash-note">
      Một lượt được tính cho lớp khi lịch thi được gán cho lớp và học viên là thành viên đã duyệt của lớp đó.
    </Typography.Paragraph>}
    </PageCard>
    <PageCard>
    <h2 className="page-section-title">Danh sách lượt thi</h2>
    <Table rowKey="attemptId" size="middle" loading={loading} dataSource={report?.items || []} scroll={{ x: 1100 }}
      pagination={{ current: page, pageSize: 10, total: report?.totalCount || 0,
        showSizeChanger: false, onChange: setPage, showTotal: showTotalLabel('lượt thi') }}
      locale={{ emptyText: <TableEmpty error={Boolean(loadError)} errorLabel="Không tải được dữ liệu."
        filtered={Boolean(filters.examId || filters.classId || filters.subjectId || filters.state)}
        emptyLabel="Chưa có lượt thi" filteredLabel="Không có lượt thi khớp bộ lọc" /> }}
      columns={[
        { title: 'STT', key: 'stt', width: 64, align: 'center', render: (_, __, index) => rowNumber(page, 10, index) },
        { title: 'Học viên', dataIndex: 'userName', render: (value) => <strong>{value}</strong> },
        { title: 'Bài thi', dataIndex: 'examName', render: (value, row) => <span className="cell-stack">
          {value}<small>{row.scheduleTitle}</small></span> },
        { title: 'Bắt đầu', dataIndex: 'startedAt', width: 150, render: time },
        { title: 'Nộp', dataIndex: 'submittedAt', width: 150, render: time },
        { title: 'Trạng thái', dataIndex: 'state', width: 110, render: stateTag },
        { title: 'Điểm gốc', dataIndex: 'totalMark', width: 100, align: 'right', render: (value) => value ?? '—' },
        { title: 'Kết quả', dataIndex: 'isPassed', width: 100, render: resultTag },
        // Smoke P1 bấm nút đầu tiên của dòng: "Hủy kết quả" phải đứng trước "Chi tiết"
        { title: 'Thao tác', key: 'actions', width: 230, render: (_, row) => <div className="page-actions">
          {row.state === 'voided'
            ? <span className="cell-stack"><StatusTag tone="danger">Đã hủy</StatusTag><small title={row.voidReason}>{row.voidReason}</small></span>
            : canVoid(row) && <Button danger size="small" icon={<DeleteOutlined />} onClick={() => openVoid(row)}>Hủy kết quả</Button>}
          <Button size="small" icon={<ProfileOutlined />} onClick={() => setDetail(row)}>Chi tiết</Button>
        </div> },
      ]} />
    </PageCard>
    <Modal title="Chi tiết lượt thi" open={Boolean(detail)} width={640} destroyOnHidden onCancel={() => setDetail(null)}
      footer={<>
        {canVoid(detail) && <Button danger icon={<DeleteOutlined />} onClick={() => openVoid(detail)}>Hủy kết quả</Button>}
        <Button onClick={() => setDetail(null)}>Đóng</Button>
      </>}>
      {detail && <Descriptions column={1} size="small" bordered items={[
        { key: 'user', label: 'Học viên', children: detail.userName },
        { key: 'exam', label: 'Bài thi', children: detail.examName },
        { key: 'schedule', label: 'Lịch thi', children: detail.scheduleTitle || '—' },
        { key: 'start', label: 'Bắt đầu', children: time(detail.startedAt) },
        { key: 'submit', label: 'Nộp bài', children: time(detail.submittedAt) },
        { key: 'state', label: 'Trạng thái', children: stateTag(detail.state) },
        { key: 'mark', label: 'Điểm gốc', children: detail.totalMark ?? '—' },
        { key: 'result', label: 'Kết quả', children: resultTag(detail.isPassed) },
        ...(detail.state === 'voided' ? [
          { key: 'voidedAt', label: 'Thời điểm hủy', children: time(detail.voidedAt) },
          { key: 'reason', label: 'Lý do hủy', children: detail.voidReason || '—' },
        ] : []),
      ]} />}
    </Modal>
    <Modal title={<span><DeleteOutlined className="text-red-600" /> Xác nhận hủy kết quả</span>} open={Boolean(voidTarget)}
      okText="Xác nhận hủy" cancelText="Hủy" destroyOnHidden
      okButtonProps={{ danger: true, disabled: !voidReason.trim(), loading: voidBusy }}
      onOk={confirmVoid} onCancel={() => { if (!voidBusy) { setVoidTarget(null); setVoidReason(''); setVoidError('') } }}>
      <Typography.Paragraph>
        Lượt thi sẽ được đánh dấu “Đã hủy” và không còn tính vào tỷ lệ đạt, phổ điểm. Điểm và bản chấm gốc vẫn được giữ để đối soát. Thao tác này không hoàn lượt thi.
      </Typography.Paragraph>
      {voidTarget && <div className="detail-meta">
        <span>Học viên: <strong>{voidTarget.userName}</strong></span>
        <span>Bài thi: {voidTarget.examName}</span>
        <span>Điểm gốc: {voidTarget.totalMark ?? '—'}</span>
      </div>}
      {voidError && <Alert type="error" showIcon title={voidError} className="page-alert" />}
      <label htmlFor="void-reason" className="block mb-1">Lý do hủy kết quả <span className="text-red-600">*</span></label>
      <Input.TextArea id="void-reason" value={voidReason} onChange={(event) => setVoidReason(event.target.value)}
        maxLength={1000} showCount rows={3} placeholder="Nhập lý do hủy kết quả..." />
    </Modal>
    <PageCard>
    <h2 className="page-section-title">Bài nộp từ nguồn lịch sử</h2>
    <Typography.Paragraph type="secondary">Phạm vi riêng <code>legacySubmissionsOnly</code>; số liệu trên không cộng bài cũ. Trạng thái gốc không đồng nghĩa với hủy kết quả DACN. Giờ gốc chưa rõ múi giờ.</Typography.Paragraph>
    {legacyError && <Alert type="error" showIcon title={legacyError} className="attempt-report__error" />}
    <Select allowClear placeholder="Status lịch sử" style={{ width: 190 }} value={legacyStatus}
      options={[{ value: 'accepted', label: 'Chấp nhận' }, { value: 'notRecognized', label: 'Không công nhận' }, { value: 'pending', label: 'Chờ kiểm tra' }]}
      onChange={(value) => { setLegacyPage(1); setLegacyStatus(value) }} />
    {' '}<Button onClick={loadLegacy}>Tải lại bài cũ</Button>
    {legacyReport && <Typography.Paragraph>
      Tổng: {legacyReport.summary.totalSubmissions} · Chấp nhận: {legacyReport.summary.acceptedStatusCount}
      {' '}· Không công nhận: {legacyReport.summary.notRecognizedStatusCount}
      {' '}· Chờ kiểm tra: {legacyReport.summary.pendingStatusCount}
      {' '}· Tổng điểm gốc: {legacyReport.summary.storedScoreSum}
    </Typography.Paragraph>}
    <Table rowKey="id" dataSource={legacyReport?.items || []} scroll={{ x: 760 }}
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
    </PageCard>
  </section>
}
