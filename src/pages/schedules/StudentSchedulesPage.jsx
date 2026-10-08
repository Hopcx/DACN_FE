import { useCallback, useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { Alert, Button, Table, Typography } from 'antd'
import { getApiError } from '../../api/response'
import { getMySchedules } from '../../services/scheduleService'
import { formatScheduleTime } from '../../services/scheduleTime'

export default function StudentSchedulesPage() {
  const isStudent = String(useSelector((state) => state.auth.user?.levelId)) === '4'
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const load = useCallback(async () => {
    if (!isStudent) return
    setLoading(true); setError('')
    try { setRows(await getMySchedules()) }
    catch (failure) { setError(getApiError(failure)) }
    finally { setLoading(false) }
  }, [isStudent])
  useEffect(() => { load() }, [load])
  if (!isStudent) return <Alert type="error" message="Trang này dành cho học viên." />
  return <section className="p-6">
    <Typography.Title level={2}>Lịch thi của tôi</Typography.Title>
    {error && <Alert type="error" showIcon message={error} className="mb-4" />}
    <Button onClick={load} className="mb-4">Tải lại</Button>
    <Table rowKey="id" loading={loading} dataSource={rows} pagination={{ pageSize: 10 }}
      locale={{ emptyText: 'Bạn chưa có lịch thi' }} columns={[
        { title: 'Lịch thi', dataIndex: 'title', render: (value, item) => value || `#${item.id}` },
        { title: 'Môn', dataIndex: 'subjectName', render: (value) => value || '—' },
        { title: 'Bắt đầu', dataIndex: 'startTime', render: (value, item) => formatScheduleTime(value, item.timeZoneStatus) },
        { title: 'Kết thúc', dataIndex: 'endTime', render: (value, item) => formatScheduleTime(value, item.timeZoneStatus) },
        { title: 'Phòng', dataIndex: 'roomName', render: (value) => value || '—' },
      ]} />
  </section>
}
