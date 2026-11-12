import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import { Alert, Button, Descriptions, Input, Select, Space, Table, Tabs, Tag, Typography } from 'antd'
import PageHeader from '../../components/ui/PageHeader'
import PageCard from '../../components/ui/PageCard'
import { TableEmpty } from '../../components/ui/PageState'
import { getAuditLogs, getExamActivity } from '../../services/auditService'
import { getAttemptReportOptions } from '../../services/attemptReportService'
import { buildActivityQuery, buildLogQuery } from '../../services/auditFilters'
import { excelErrorMessage } from '../../services/excelFile'
import { formatScheduleTime } from '../../services/scheduleTime'
import { getApiError } from '../../api/response'

const ACTION_LABELS = {
  'account.import': 'Nhập tài khoản',
  'account.export': 'Xuất tài khoản',
  'question.export': 'Xuất câu hỏi',
}
const PAGE_SIZES = [10, 20, 50, 100]

// Chỉ phản hồi của lần gọi mới nhất được ghi vào state; tải lại giữ dữ liệu cũ trong lúc chờ.
function useAuditList(fetcher, query) {
  const [state, setState] = useState({ data: null, loading: false, error: '' })
  const requestId = useRef(0)
  const load = useCallback(async () => {
    requestId.current += 1
    const id = requestId.current
    if (!query) { setState({ data: null, loading: false, error: '' }); return }
    setState((old) => ({ ...old, loading: true, error: '' }))
    try {
      const data = await fetcher(query)
      if (id === requestId.current) setState({ data, loading: false, error: '' })
    } catch (failure) {
      if (id === requestId.current) setState((old) => ({ ...old, loading: false, error: excelErrorMessage(failure) }))
    }
  }, [fetcher, query])
  useEffect(() => {
    load()
    return () => { requestId.current += 1 }
  }, [load])
  return { ...state, reload: load }
}

function useAuditQuery(build, applied, page, pageSize) {
  return useMemo(() => {
    try { return { query: build({ page, pageSize, ...applied }), queryError: '' } }
    catch (failure) { return { query: null, queryError: failure.message } }
  }, [build, applied, page, pageSize])
}

function useAuditPaging() {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const onChange = (nextPage, nextSize) => {
    if (nextSize !== pageSize) { setPageSize(nextSize); setPage(1) } else setPage(nextPage)
  }
  return { page, setPage, pageSize, onChange }
}

const hasFilter = (query, applied) => (query
  ? Object.keys(query).some((key) => key !== 'page' && key !== 'pageSize')
  : Object.values(applied).some((value) => value !== undefined && value !== ''))

function TimeRange({ draft, setDraft }) {
  return <>
    <Input type="datetime-local" aria-label="Từ" style={{ width: 200 }} value={draft.from || ''}
      onChange={(event) => setDraft((old) => ({ ...old, from: event.target.value }))} />
    <Input type="datetime-local" aria-label="Đến" style={{ width: 200 }} value={draft.to || ''}
      onChange={(event) => setDraft((old) => ({ ...old, to: event.target.value }))} />
  </>
}

function AuditAlerts({ queryError, error, warning }) {
  return <>
    {warning && <Alert type="warning" showIcon title={warning} className="page-alert" />}
    {queryError && <Alert type="error" showIcon title={queryError} className="page-alert" />}
    {error && <Alert type="error" showIcon title={error} className="page-alert" />}
  </>
}

function SystemLogTab() {
  const [draft, setDraft] = useState({})
  const [applied, setApplied] = useState({})
  const { page, setPage, pageSize, onChange } = useAuditPaging()
  const { query, queryError } = useAuditQuery(buildLogQuery, applied, page, pageSize)
  const { data, loading, error, reload } = useAuditList(getAuditLogs, query)

  const apply = (next) => { setApplied(next); setPage(1) }
  const setActor = (actorUserId, actorLabel) => {
    const next = { ...draft, actorUserId, actorLabel }
    setDraft(next); apply(next)
  }

  return <>
    <PageCard>
      <div className="page-toolbar">
        <Input allowClear maxLength={100} placeholder="Tìm trong tên hoặc mô tả" aria-label="Tìm nhật ký" style={{ maxWidth: 260 }}
          value={draft.search || ''} onChange={(event) => setDraft((old) => ({ ...old, search: event.target.value }))}
          onPressEnter={() => apply(draft)} />
        <Select allowClear placeholder="Hành động" aria-label="Hành động" style={{ minWidth: 180 }} value={draft.action}
          options={Object.entries(ACTION_LABELS).map(([value, label]) => ({ value, label }))}
          onChange={(value) => setDraft((old) => ({ ...old, action: value }))} />
        <TimeRange draft={draft} setDraft={setDraft} />
        <Button type="primary" onClick={() => apply(draft)}>Lọc</Button>
        <Button onClick={reload} loading={loading}>Tải lại</Button>
      </div>
      {applied.actorUserId && <Tag closable onClose={() => setActor(undefined, undefined)}>Người thực hiện: {applied.actorLabel}</Tag>}
    </PageCard>
    <AuditAlerts queryError={queryError} error={error} />
    <PageCard>
      <Table rowKey="id" loading={loading} dataSource={data?.items || []} scroll={{ x: 900 }}
        locale={{ emptyText: <TableEmpty error={Boolean(error || queryError)}
          errorLabel={queryError ? 'Bộ lọc chưa hợp lệ nên chưa tải dữ liệu.' : 'Không tải được nhật ký. Bấm "Tải lại" để thử lại.'}
          filtered={hasFilter(query, applied)} emptyLabel="Chưa có nhật ký" /> }}
        pagination={{
          current: page, pageSize, total: data?.totalCount || 0, showSizeChanger: true,
          pageSizeOptions: PAGE_SIZES, onChange,
        }}
        expandable={{ expandedRowRender: (row) => <Descriptions size="small" column={2} items={[
          { key: 'name', label: 'Tên', children: row.name ?? '—' },
          { key: 'status', label: 'Trạng thái', children: row.status ?? '—' },
          { key: 'entityType', label: 'Loại đối tượng', children: row.entityType ?? '—' },
          { key: 'entityId', label: 'Mã đối tượng', children: row.entityId ?? '—' },
          { key: 'actorUserId', label: 'Mã người thực hiện', children: row.actorUserId ?? '—' },
          { key: 'correlationId', label: 'Mã tương quan', children: row.correlationId ?? '—' },
          { key: 'id', label: 'Mã nhật ký', children: row.id },
        ]} /> }}
        columns={[
          { title: 'Thời điểm', dataIndex: 'createdAt', width: 160,
            render: (value) => value ? formatScheduleTime(value, 'utc') : 'Không rõ (bản ghi cũ)' },
          { title: 'Hành động', render: (_, row) => ACTION_LABELS[row.action] || row.action || row.name },
          { title: 'Người thực hiện', render: (_, row) => <Space orientation="vertical" size={0}>
            <span>{row.actorUserName || (row.actorUserId ? 'Tài khoản đã xóa' : '—')}</span>
            {row.actorUserId && <Button type="link" size="small" style={{ padding: 0 }}
              onClick={() => setActor(row.actorUserId, row.actorUserName || row.actorUserId)}>Lọc theo người này</Button>}
          </Space> },
          { title: 'Đối tượng', render: (_, row) => row.entityType ? `${row.entityType}${row.entityId ? ` #${row.entityId}` : ''}` : '—' },
          { title: 'Mô tả', dataIndex: 'description', ellipsis: true },
        ]} />
    </PageCard>
  </>
}

function ExamActivityTab() {
  const [draft, setDraft] = useState({})
  const [applied, setApplied] = useState({})
  const [exams, setExams] = useState([])
  const [optionsError, setOptionsError] = useState('')
  const { page, setPage, pageSize, onChange } = useAuditPaging()
  const { query, queryError } = useAuditQuery(buildActivityQuery, applied, page, pageSize)
  const { data, loading, error, reload } = useAuditList(getExamActivity, query)

  useEffect(() => {
    let active = true
    getAttemptReportOptions().then((options) => { if (active) setExams(options?.exams || []) })
      .catch((failure) => { if (active) setOptionsError(`Không tải được danh sách bài thi: ${getApiError(failure)}`) })
    return () => { active = false }
  }, [])

  const apply = (next) => { setApplied(next); setPage(1) }
  const setFilter = (patch) => { const next = { ...draft, ...patch }; setDraft(next); apply(next) }

  return <>
    <Typography.Paragraph type="secondary">
      Thời điểm lưu nguyên giá trị, chưa rõ múi giờ. Hệ thống DACN hiện chưa tự ghi loại nhật ký này.
    </Typography.Paragraph>
    <PageCard>
      <div className="page-toolbar">
        <Select allowClear showSearch optionFilterProp="label" placeholder="Bài thi" aria-label="Bài thi" style={{ minWidth: 220 }}
          value={draft.examId} options={exams.map((exam) => ({ value: exam.id, label: exam.name }))}
          onChange={(value) => setDraft((old) => ({ ...old, examId: value }))} />
        <Input allowClear maxLength={100} placeholder="Loại hành động" aria-label="Loại hành động" style={{ maxWidth: 200 }}
          value={draft.actionType || ''} onChange={(event) => setDraft((old) => ({ ...old, actionType: event.target.value }))}
          onPressEnter={() => apply(draft)} />
        <TimeRange draft={draft} setDraft={setDraft} />
        <Button type="primary" onClick={() => apply(draft)}>Lọc</Button>
        <Button onClick={reload} loading={loading}>Tải lại</Button>
      </div>
      <Space wrap>
        {applied.userId && <Tag closable onClose={() => setFilter({ userId: undefined, userLabel: undefined })}>Người dùng: {applied.userLabel}</Tag>}
        {applied.examScheduleId && <Tag closable onClose={() => setFilter({ examScheduleId: undefined, scheduleLabel: undefined })}>Lịch: {applied.scheduleLabel}</Tag>}
      </Space>
    </PageCard>
    <AuditAlerts queryError={queryError} error={error} warning={optionsError} />
    <PageCard>
      <Table rowKey="id" loading={loading} dataSource={data?.items || []} scroll={{ x: 900 }}
        locale={{ emptyText: <TableEmpty error={Boolean(error || queryError)}
          errorLabel={queryError ? 'Bộ lọc chưa hợp lệ nên chưa tải dữ liệu.' : 'Không tải được nhật ký. Bấm "Tải lại" để thử lại.'}
          filtered={hasFilter(query, applied)} emptyLabel="Chưa có nhật ký hoạt động thi" /> }}
        pagination={{
          current: page, pageSize, total: data?.totalCount || 0, showSizeChanger: true,
          pageSizeOptions: PAGE_SIZES, onChange,
        }}
        expandable={{ expandedRowRender: (row) => <Descriptions size="small" column={2} items={[
          { key: 'id', label: 'Mã nhật ký', children: row.id },
          { key: 'userId', label: 'Mã người dùng', children: row.userId ?? '—' },
          { key: 'examId', label: 'Mã bài thi', children: row.examId ?? '—' },
          { key: 'examDetailId', label: 'Mã chi tiết bài thi', children: row.examDetailId ?? '—' },
          { key: 'examScheduleId', label: 'Mã lịch', children: row.examScheduleId ?? '—' },
        ]} /> }}
        columns={[
          { title: 'Thời điểm', dataIndex: 'actionTime', width: 200, render: (value) => formatScheduleTime(value, 'unknown') },
          { title: 'Người dùng', render: (_, row) => <Space orientation="vertical" size={0}>
            <span>{row.fullName || '—'}</span>
            {row.userName && <Typography.Text type="secondary" style={{ fontSize: 12 }}>{row.userName}</Typography.Text>}
            {row.userId && <Button type="link" size="small" style={{ padding: 0 }}
              onClick={() => setFilter({ userId: row.userId, userLabel: row.fullName || row.userName || row.userId })}>Lọc theo người này</Button>}
          </Space> },
          { title: 'Bài thi', dataIndex: 'examName', render: (value) => value || '—' },
          { title: 'Lịch', render: (_, row) => <Space orientation="vertical" size={0}>
            <span>{row.scheduleTitle || '—'}</span>
            {row.examScheduleId && <Button type="link" size="small" style={{ padding: 0 }}
              onClick={() => setFilter({ examScheduleId: row.examScheduleId, scheduleLabel: row.scheduleTitle || `#${row.examScheduleId}` })}>Lọc theo lịch này</Button>}
          </Space> },
          { title: 'Hành động', dataIndex: 'actionType' },
        ]} />
    </PageCard>
  </>
}

export default function AdminAuditPage() {
  const levelId = useSelector((state) => state.auth.user?.levelId)
  if (String(levelId) !== '1') return <Alert type="error" showIcon title="Bạn không có quyền xem nhật ký." />
  return <section className="page-body">
    <PageHeader title="Nhật ký hệ thống" description="Chỉ xem. Nhật ký do hệ thống ghi, không sửa hoặc xóa được." />
    <Tabs items={[
      { key: 'logs', label: 'Nhật ký hệ thống', children: <SystemLogTab /> },
      { key: 'activity', label: 'Hoạt động thi', children: <ExamActivityTab /> },
    ]} />
  </section>
}
