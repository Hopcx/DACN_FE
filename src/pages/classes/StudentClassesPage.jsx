import { useCallback, useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { Alert, Button, Form, Input, Modal, Popconfirm, Space, Table, Typography } from 'antd'
import PageHeader from '../../components/ui/PageHeader'
import { getApiError } from '../../api/response'
import { getMyClassRanking, getMyClasses, joinClass, leaveClass } from '../../services/classService'
import { formatScheduleTime } from '../../services/scheduleTime'
import { formatScore, myRankText, rankingErrorMessage } from '../../services/classRanking'

export default function StudentClassesPage() {
  const isStudent = ['1', '4'].includes(String(useSelector((state) => state.auth.user?.levelId)))
  const [form] = Form.useForm()
  const [classes, setClasses] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const load = useCallback(async () => {
    if (!isStudent) return
    setLoading(true); setError('')
    try { setClasses(await getMyClasses()) }
    catch (failure) { setError(getApiError(failure)) }
    finally { setLoading(false) }
  }, [isStudent])

  useEffect(() => { load() }, [load])

  async function join({ classCode }) {
    setSaving(true); setError(''); setMessage('')
    try { await joinClass(classCode.trim()); form.resetFields(); await load(); setMessage('Đã gửi yêu cầu tham gia; hãy chờ duyệt.') }
    catch (failure) { setError(getApiError(failure)) }
    finally { setSaving(false) }
  }

  // To-be T10: chỉ điểm và hạng của chính mình
  const [ranking, setRanking] = useState(null)
  async function openRanking(item) {
    setRanking({ item, loading: true, data: null, error: '' })
    try {
      const data = await getMyClassRanking(item.classId)
      setRanking((current) => current?.item === item ? { item, loading: false, data, error: '' } : current)
    } catch (failure) {
      setRanking((current) => current?.item === item ? { item, loading: false, data: null, error: rankingErrorMessage(failure, getApiError(failure)) } : current)
    }
  }

  async function leave(classId) {
    setSaving(true); setError(''); setMessage('')
    try { await leaveClass(classId); await load(); setMessage('Đã rời lớp.') }
    catch (failure) { setError(getApiError(failure)) }
    finally { setSaving(false) }
  }

  if (!isStudent) return <Alert type="error" showIcon title="Trang này dành cho học viên." />
  return <section className="page-body">
    <PageHeader title="Lớp học của tôi" />
    {error && <Alert type="error" showIcon title={error} className="mb-4" />}
    {message && <Alert type="success" showIcon title={message} className="mb-4" />}
    <Form form={form} layout="inline" onFinish={join} className="mb-4">
      <Form.Item name="classCode" rules={[{ required: true, message: 'Nhập mã lớp' }]}>
        <Input placeholder="Mã lớp học" maxLength={100} />
      </Form.Item>
      <Button type="primary" htmlType="submit" loading={saving}>Tham gia lớp</Button>
      <Button onClick={load}>Tải lại</Button>
    </Form>
    <Table rowKey="membershipId" loading={loading} dataSource={classes}
      locale={{ emptyText: 'Bạn chưa tham gia lớp nào' }} pagination={{ pageSize: 10 }} columns={[
        { title: 'Lớp', dataIndex: 'name' }, { title: 'Mã lớp', dataIndex: 'classCode' },
        { title: 'Môn học', dataIndex: 'subjectName', render: (value) => value || '—' },
        { title: 'Trạng thái', dataIndex: 'status', render: (value) => value === 1 ? 'Đã tham gia' : 'Chờ duyệt' },
        { title: 'Thao tác', render: (_, item) => <Space>
          {item.status === 1 && <Button onClick={() => openRanking(item)}>Kết quả của tôi</Button>}
          <Popconfirm title="Rời lớp này?" onConfirm={() => leave(item.classId)}>
            <Button danger disabled={saving}>Rời lớp</Button>
          </Popconfirm>
        </Space> },
      ]} />
    <Modal open={Boolean(ranking)} onCancel={() => setRanking(null)} footer={null} width={640} destroyOnHidden
      title={ranking ? `Kết quả của tôi — ${ranking.item.name}` : ''}>
      {ranking?.error && <Alert type="error" showIcon title={ranking.error} />}
      {ranking && !ranking.error && <div className="my-ranking">
        <Typography.Paragraph strong className="my-ranking__rank">{ranking.data ? myRankText(ranking.data) : 'Đang tải…'}</Typography.Paragraph>
        {ranking.data && <Typography.Paragraph>
          Điểm tổng (thang 10): <strong>{formatScore(ranking.data.total)}</strong> · Đã làm {ranking.data.attemptedCount} / {ranking.data.scheduleCount} lịch · Đạt {ranking.data.passedCount} lịch
        </Typography.Paragraph>}
        <Table rowKey="id" size="small" pagination={false} loading={ranking.loading} dataSource={ranking.data?.schedules || []}
          locale={{ emptyText: 'Chưa có lịch thi nào đã kết thúc và cho xem kết quả' }} columns={[
            { title: 'Lịch thi', dataIndex: 'title', render: (value, row) => <span className="cell-stack">
              <strong>{value || row.examName}</strong><small>{row.examName}</small></span> },
            { title: 'Kết thúc', dataIndex: 'endTime', render: (value) => formatScheduleTime(value, 'utc') },
            { title: 'Điểm (thang 10)', dataIndex: 'score', align: 'right',
              render: (value) => value == null ? 'Không làm (tính 0)' : formatScore(value) },
          ]} />
        {ranking.data && <Typography.Paragraph type="secondary" className="mt-4">
          Mỗi lịch lấy lượt cao nhất; lịch không làm tính 0. Chỉ tính bài thi đã kết thúc và cho xem kết quả
          {ranking.data.notCountedCount > 0 ? ` (${ranking.data.notCountedCount} lịch chưa tính)` : ''}; không tính Luyện tập/Thi thử.
        </Typography.Paragraph>}
      </div>}
    </Modal>
  </section>
}
