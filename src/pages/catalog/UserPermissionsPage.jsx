import { useCallback, useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { Alert, Button, Form, Modal, Popconfirm, Select, Space, Table, Typography } from 'antd'
import { getUsers } from '../../services/accountService'
import { permissionsApi, userPermissionsApi } from '../../services/catalogService'
import { getApiError } from '../../api/response'

export default function UserPermissionsPage() {
  const isAdmin = String(useSelector((state) => state.auth.user?.levelId)) === '1'
  const [form] = Form.useForm()
  const [users, setUsers] = useState([])
  const [permissions, setPermissions] = useState([])
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(null)

  const load = useCallback(async () => {
    if (!isAdmin) return
    setLoading(true); setError('')
    try {
      const [accounts, rights, assignments] = await Promise.all([
        getUsers(), permissionsApi.list(), userPermissionsApi.list(),
      ])
      setUsers(accounts); setPermissions(rights); setRows(assignments)
    } catch (failure) { setError(getApiError(failure)) }
    finally { setLoading(false) }
  }, [isAdmin])

  useEffect(() => { load() }, [load])

  function show(item) {
    setEditing(item || null)
    form.resetFields()
    form.setFieldsValue(item || { userId: undefined, permissionId: undefined })
    setOpen(true)
  }

  async function save(values) {
    setSaving(true); setError('')
    try {
      if (editing) await userPermissionsApi.update(editing.id, values)
      else await userPermissionsApi.create(values)
      setOpen(false); form.resetFields(); await load()
    } catch (failure) { setError(getApiError(failure)) }
    finally { setSaving(false) }
  }

  async function remove(id) {
    setError('')
    try { await userPermissionsApi.remove(id); await load() }
    catch (failure) { setError(getApiError(failure)) }
  }

  if (!isAdmin) return <Alert type="error" message="Bạn không có quyền truy cập mục này." />
  return <section className="p-6">
    <Typography.Title level={2}>Gán quyền tài khoản</Typography.Title>
    {error && <Alert type="error" showIcon message={error} className="mb-4" />}
    <Space className="mb-4"><Button type="primary" onClick={() => show(null)}>Gán quyền</Button>
      <Button onClick={load}>Tải lại</Button></Space>
    <Table rowKey="id" loading={loading} dataSource={rows} locale={{ emptyText: 'Chưa có quyền được gán' }}
      columns={[
        { title: 'Tài khoản', dataIndex: 'userId', render: (id) => users.find((user) => user.id === id)?.userName || id },
        { title: 'Quyền', dataIndex: 'permissionId', render: (id) => permissions.find((permission) => permission.id === id)?.name || id },
        { title: 'Thao tác', render: (_, item) => <Space><Button onClick={() => show(item)}>Sửa</Button>
          <Popconfirm title="Thu hồi quyền này?" onConfirm={() => remove(item.id)}><Button danger>Thu hồi</Button></Popconfirm>
        </Space> },
      ]} pagination={{ pageSize: 10 }} />
    <Modal title={editing ? 'Sửa quyền đã gán' : 'Gán quyền'} open={open} onCancel={() => setOpen(false)}
      onOk={() => form.submit()} confirmLoading={saving} destroyOnHidden>
      <Form form={form} layout="vertical" onFinish={save}>
        <Form.Item name="userId" label="Tài khoản" rules={[{ required: true, message: 'Chọn tài khoản' }]}>
          <Select showSearch optionFilterProp="label" options={users.map((user) => ({ value: user.id, label: `${user.fullName} (${user.userName})` }))} />
        </Form.Item>
        <Form.Item name="permissionId" label="Quyền" rules={[{ required: true, message: 'Chọn quyền' }]}>
          <Select options={permissions.filter((item) => item.status === 1).map((item) => ({ value: item.id, label: item.name }))} />
        </Form.Item>
      </Form>
    </Modal>
  </section>
}
