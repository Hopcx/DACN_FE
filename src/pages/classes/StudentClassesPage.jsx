import { useCallback, useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { Alert, Button, Form, Input, Popconfirm, Space, Table, Typography } from 'antd'
import { getApiError } from '../../api/response'
import { getMyClasses, joinClass, leaveClass } from '../../services/classService'

export default function StudentClassesPage() {
  const isStudent = String(useSelector((state) => state.auth.user?.levelId)) === '4'
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

  async function leave(classId) {
    setSaving(true); setError(''); setMessage('')
    try { await leaveClass(classId); await load(); setMessage('Đã rời lớp.') }
    catch (failure) { setError(getApiError(failure)) }
    finally { setSaving(false) }
  }

  if (!isStudent) return <Alert type="error" message="Trang này dành cho học viên." />
  return <section className="p-6">
    <Typography.Title level={2}>Lớp học của tôi</Typography.Title>
    {error && <Alert type="error" showIcon message={error} className="mb-4" />}
    {message && <Alert type="success" showIcon message={message} className="mb-4" />}
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
          <Popconfirm title="Rời lớp này?" onConfirm={() => leave(item.classId)}>
            <Button danger disabled={saving}>Rời lớp</Button>
          </Popconfirm>
        </Space> },
      ]} />
  </section>
}
