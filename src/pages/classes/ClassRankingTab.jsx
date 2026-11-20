import { useCallback, useEffect, useRef, useState } from 'react'
import { Alert, Button, Table } from 'antd'
import { ReloadOutlined } from '@ant-design/icons'
import StatusTag from '../../components/ui/StatusTag'
import { getApiError } from '../../api/response'
import { formatScheduleTime } from '../../services/scheduleTime'
import { getTeacherClassRanking } from '../../services/classService'
import { formatScore, groupView, notCountedLabel, rankingErrorMessage, rankingRule } from '../../services/classRanking'

// To-be T10: bảng xếp hạng lớp cho giảng viên/Admin. Tải khi mở tab; đổi lớp thì component được tạo lại (key).
export default function ClassRankingTab({ classId }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const requestRef = useRef(0)

  const load = useCallback(async () => {
    const requestId = ++requestRef.current
    setLoading(true); setError('')
    try {
      const result = await getTeacherClassRanking(classId)
      if (requestId === requestRef.current) setData(result)
    } catch (failure) {
      // Review T10: tải lại lỗi thì bỏ bảng cũ để không nhầm là dữ liệu hiện tại
      if (requestId === requestRef.current) { setData(null); setError(rankingErrorMessage(failure, getApiError(failure))) }
    } finally {
      if (requestId === requestRef.current) setLoading(false)
    }
  }, [classId])

  useEffect(() => { load() }, [load])

  const schedules = data?.schedules || []
  const columns = [
    { title: 'Hạng', dataIndex: 'rank', width: 70, align: 'center', fixed: 'left', render: (value) => value ?? '—' },
    { title: 'Học viên', dataIndex: 'fullName', width: 220, fixed: 'left', render: (value, row) => <span className="cell-stack">
      <strong>{value}</strong><small>{row.userName}</small></span> },
    { title: 'Số lịch', key: 'attempted', width: 90, align: 'center',
      render: (_, row) => `${row.attemptedCount} / ${row.scheduleCount}` },
    ...schedules.map((s) => ({
      title: <span className="cell-stack" title={s.examName}><strong>{s.title || s.examName}</strong>
        <small>{formatScheduleTime(s.endTime, 'utc')}</small></span>,
      key: `s${s.id}`, width: 140, align: 'right',
      render: (_, row) => formatScore(row.scores.find((x) => x.scheduleId === s.id)?.score),
    })),
    { title: 'Điểm tổng', dataIndex: 'total', width: 110, align: 'right',
      render: (value) => value == null ? <span className="muted">Chưa có điểm</span> : <strong>{formatScore(value)}</strong> },
    { title: 'Số lần đạt', dataIndex: 'passedCount', width: 100, align: 'center' },
    { title: 'Nhóm', dataIndex: 'group', width: 100, render: (value) => {
      const view = groupView(value)
      return view ? <StatusTag tone={view.tone}>{view.label}</StatusTag> : '—'
    } },
  ]

  return <div className="class-ranking">
    {error && <Alert type="error" showIcon title={error} className="page-alert" />}
    <div className="page-toolbar">
      <span className="muted">{data ? rankingRule(data) : ''}</span>
      <div className="page-toolbar__end">
        <Button icon={<ReloadOutlined />} onClick={load} loading={loading}>Tải lại</Button>
      </div>
    </div>
    {data && !data.rankingVisible && <Alert type="info" showIcon className="page-alert"
      title={`Lớp có ${data.scoredCount} học viên có điểm (cần ≥ ${data.minScoredForRanking}): chưa chia nhóm Top/Bottom; học viên chưa thấy hạng của mình.`} />}
    {data?.skippedAttempts > 0 && <Alert type="warning" showIcon className="page-alert"
      title={`${data.skippedAttempts} lượt bị bỏ qua vì đề có tổng điểm 0.`} />}
    <Table rowKey="userId" size="small" loading={loading} dataSource={data?.students || []} columns={columns}
      scroll={{ x: 780 + schedules.length * 140 }} pagination={{ pageSize: 50, showSizeChanger: false }}
      rowClassName={(row) => row.group ? `ranking-row--${row.group}` : ''}
      locale={{ emptyText: schedules.length === 0 ? 'Chưa có lịch thi nào đã kết thúc và cho xem kết quả' : 'Lớp chưa có học viên đã duyệt' }} />
    {data?.notCounted?.length > 0 && <div className="mt-4">
      <h3 className="page-section-title">Lịch chưa tính ({data.notCounted.length})</h3>
      <Table rowKey="id" size="small" pagination={false} dataSource={data.notCounted} columns={[
        { title: 'Lịch thi', dataIndex: 'title', render: (value, row) => <span className="cell-stack">
          <strong>{value || row.examName}</strong><small>{row.examName}</small></span> },
        { title: 'Kết thúc', dataIndex: 'endTime', render: (value, row) => formatScheduleTime(value, row.timeZoneStatus) },
        { title: 'Lý do', dataIndex: 'reason', render: (value) => <StatusTag tone="warning">{notCountedLabel(value)}</StatusTag> },
      ]} />
    </div>}
  </div>
}
