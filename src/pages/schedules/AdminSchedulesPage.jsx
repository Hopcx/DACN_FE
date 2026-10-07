import { useCallback, useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { Alert, Button, Space, Table, Typography } from 'antd'
import { getApiError } from '../../api/response'
import { getScheduleAssignments, getScheduleClassOptions, getSchedules } from '../../services/scheduleService'
import { formatScheduleTime } from '../../services/scheduleTime'

export default function AdminSchedulesPage() {
  const allowed = (useSelector((state) => state.auth.user?.permissions) || []).some((id) => String(id) === '4')
  const [rows, setRows] = useState([])
  const [assignments, setAssignments] = useState([])
  const [classes, setClasses] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    if (!allowed) return
    setLoading(true); setError('')
    try {
      const [schedules, links, options] = await Promise.all([
        getSchedules(), getScheduleAssignments(), getScheduleClassOptions(),
      ])
      setRows(schedules.filter((item) => item.status !== 255))
      setAssignments(links)
      setClasses(options)
    } catch (failure) { setError(getApiError(failure)) }
    finally { setLoading(false) }
  }, [allowed])

  useEffect(() => { load() }, [load])
  if (!allowed) return <Alert type="error" message="Bạn không có quyền quản lý lịch thi." />

  const className = (id) => classes.find((item) => item.id === id)?.name || `#${id}`
  return <section className="p-6">
    <Typography.Title level={2}>Quản lý lịch thi</Typography.Title>
    {error && <Alert type="error" showIcon message={error} className="mb-4" />}
    <Space className="mb-4"><Button onClick={load}>Tải lại</Button></Space>
    <Table rowKey="id" loading={loading} dataSource={rows} pagination={{ pageSize: 10 }}
      locale={{ emptyText: 'Chưa có lịch thi' }} columns={[
        { title: 'Lịch thi', dataIndex: 'title', render: (value, item) => value || `#${item.id}` },
        { title: 'Bài thi', dataIndex: 'examId' },
        { title: 'Bắt đầu', dataIndex: 'startTime', render: formatScheduleTime },
        { title: 'Kết thúc', dataIndex: 'endTime', render: formatScheduleTime },
        { title: 'Phòng', dataIndex: 'roomId', render: (value) => value || '—' },
        { title: 'Lớp đã gán', render: (_, item) => assignments.filter((link) => link.examScheduleId === item.id)
          .map((link) => className(link.classId)).join(', ') || '—' },
      ]} />
  </section>
}
