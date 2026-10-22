import { useCallback, useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { Alert, Button, Form, Input, Popconfirm, Space, Table, Typography } from 'antd'
import { getApiError } from '../../api/response'
import { addTeacherClassMember, approveTeacherClassMember, getTeacherClasses,
  getTeacherClassMembers, lookupTeacherStudent, removeTeacherClassMember } from '../../services/classService'

export default function TeacherClassesPage() {
  const isTeacher = String(useSelector((state) => state.auth.user?.levelId)) === '3'
  const [form] = Form.useForm()
  const [classes, setClasses] = useState([])
  const [selected, setSelected] = useState(null)
  const [members, setMembers] = useState([])
  const [lookup, setLookup] = useState(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    if (!isTeacher) return
    setLoading(true); setError('')
    try { setClasses(await getTeacherClasses()) }
    catch (failure) { setError(getApiError(failure)) }
    finally { setLoading(false) }
  }, [isTeacher])

  useEffect(() => { load() }, [load])

  async function choose(item) {
    setSelected(item); setMembers([]); setLookup(null); setError('')
    try { setMembers(await getTeacherClassMembers(item.id)) }
    catch (failure) { setError(getApiError(failure)) }
  }

  async function write(operation) {
    setBusy(true); setError('')
    try {
      await operation()
      setMembers(await getTeacherClassMembers(selected.id))
      setClasses(await getTeacherClasses())
      setLookup(null); form.resetFields()
    } catch (failure) { setError(getApiError(failure)) }
    finally { setBusy(false) }
  }

  async function findStudent() {
    try {
      const { email } = await form.validateFields()
      setBusy(true); setError(''); setLookup(null)
      setLookup(await lookupTeacherStudent(selected.id, email.trim()))
    } catch (failure) {
      if (!failure?.errorFields) setError(getApiError(failure))
    } finally { setBusy(false) }
  }

  if (!isTeacher) return <Alert type="error" message="Bạn không có quyền xem lớp của giảng viên." />
  return <section className="p-6">
    <Typography.Title level={2}>Lớp của tôi</Typography.Title>
    {error && <Alert type="error" showIcon message={error} className="mb-4" />}
    <Button onClick={load} className="mb-4">Tải lại</Button>
    <Table rowKey="id" loading={loading} dataSource={classes} locale={{ emptyText: 'Chưa có lớp được phân công' }}
      columns={[
        { title: 'Lớp', dataIndex: 'name' },
        { title: 'Mã lớp', dataIndex: 'classCode' },
        { title: 'Môn', dataIndex: 'subjectName', render: (name) => name || '—' },
        { title: 'Sĩ số tối đa', dataIndex: 'capacity' },
        { title: 'Trạng thái', dataIndex: 'status', render: (status) => status === 1 ? 'Hoạt động' : 'Tạm ngừng' },
        { title: 'Thao tác', render: (_, item) => <Button onClick={() => choose(item)}>Thành viên</Button> },
      ]} />
    {selected && <section className="mt-6">
      <Typography.Title level={3}>Thành viên · {selected.name}</Typography.Title>
      <Form form={form} layout="inline" onFinish={findStudent}>
        <Form.Item name="email" rules={[{ required: true, type: 'email', message: 'Nhập email hợp lệ' }]}>
          <Input type="email" placeholder="Email học viên đã xác minh" style={{ minWidth: 280 }}
            onChange={() => setLookup(null)} />
        </Form.Item>
        <Button htmlType="submit" loading={busy}>Tìm học viên</Button>
      </Form>
      {lookup && <Space className="my-4">
        <span>{lookup.fullName} ({lookup.email})</span>
        <Button type="primary" disabled={selected.status !== 1} loading={busy}
          onClick={() => write(() => addTeacherClassMember(selected.id, lookup.email))}>Thêm vào lớp</Button>
      </Space>}
      <Table rowKey="id" dataSource={members} loading={busy} className="mt-4"
        locale={{ emptyText: 'Chưa có thành viên' }} columns={[
          { title: 'Học viên', dataIndex: 'fullName' },
          { title: 'Email', dataIndex: 'email' },
          { title: 'Trạng thái', dataIndex: 'status', render: (status) => status === 1 ? 'Đã duyệt' : 'Chờ duyệt' },
          { title: 'Thao tác', render: (_, member) => <Space>
            {member.status === 2 && <Button disabled={busy} onClick={() => write(() => approveTeacherClassMember(selected.id, member.id))}>Duyệt</Button>}
            <Popconfirm title="Xóa học viên khỏi lớp?" onConfirm={() => write(() => removeTeacherClassMember(selected.id, member.id))}>
              <Button danger disabled={busy}>Xóa</Button>
            </Popconfirm>
          </Space> },
        ]} />
    </section>}
  </section>
}
