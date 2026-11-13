import { useCallback, useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { Alert, Button, Form, Modal, Popconfirm, Select, Table } from 'antd'
import { EditOutlined, PlusOutlined, ReloadOutlined, StopOutlined } from '@ant-design/icons'
import PageHeader from '../../components/ui/PageHeader'
import PageCard from '../../components/ui/PageCard'
import { LoadError, TableEmpty } from '../../components/ui/PageState'
import { getUsers } from '../../services/accountService'
import { permissionsApi, userPermissionsApi } from '../../services/catalogService'
import { getApiError, toLoadError } from '../../api/response'
import { clampPage, rowNumber, showTotalLabel } from '../../services/listView'

export default function UserPermissionsPage() {
  const isAdmin = String(useSelector((state) => state.auth.user?.levelId)) === '1'
  const [form] = Form.useForm()
  const [users, setUsers] = useState([])
  const [permissions, setPermissions] = useState([])
  const [rows, setRows] = useState([])
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [loadError, setLoadError] = useState(null)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(null)

  const load = useCallback(async () => {
    if (!isAdmin) return
    setLoading(true); setLoadError(null)
    try {
      const [accounts, rights, assignments] = await Promise.all([
        getUsers(), permissionsApi.list(), userPermissionsApi.list(),
      ])
      setUsers(accounts); setPermissions(rights); setRows(assignments)
    } catch (failure) { setLoadError(toLoadError(failure)) }
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

  if (!isAdmin) return <Alert type="error" showIcon title="Bạn không có quyền truy cập mục này." />
  const currentPage = clampPage(page, 10, rows.length)
  const permissionOptions = permissions.filter((item) => item.status === 1).map((item) => ({ value: item.id, label: item.name }))
  // Quyền đang gán nhưng đã ngừng hoạt động: hiện tên để Select không hiện mã thô
  const assigned = editing && permissions.find((item) => item.id === editing.permissionId)
  if (assigned && assigned.status !== 1) {
    permissionOptions.push({ value: assigned.id, label: `${assigned.name} (ngừng hoạt động)`, disabled: true })
  }
  return <section className="page-body">
    <PageHeader title="Phân quyền người dùng" description="Gán quyền chức năng cho từng tài khoản." />
    <LoadError error={loadError} onRetry={load} retrying={loading} />
    {error && <Alert type="error" showIcon title={error} className="page-alert" />}
    <PageCard>
      <div className="page-toolbar">
        <div className="page-toolbar__end">
          <Button icon={<ReloadOutlined />} onClick={load} loading={loading}>Tải lại</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => show(null)}>Gán quyền</Button>
        </div>
      </div>
      <Table rowKey="id" size="middle" loading={loading} dataSource={rows} scroll={{ x: 640 }}
        locale={{ emptyText: <TableEmpty error={Boolean(loadError)} errorLabel="Không tải được dữ liệu." emptyLabel="Chưa có quyền được gán" /> }}
        columns={[
          { title: 'STT', key: 'stt', width: 64, align: 'center', render: (_, __, index) => rowNumber(currentPage, 10, index) },
          { title: 'Tài khoản', dataIndex: 'userId', render: (id) => {
            const user = users.find((item) => item.id === id)
            return user ? <span className="cell-stack"><strong>{user.fullName}</strong><small>{user.userName}</small></span> : id
          } },
          { title: 'Quyền', dataIndex: 'permissionId', render: (id) => permissions.find((permission) => permission.id === id)?.name || id },
          { title: 'Thao tác', key: 'actions', render: (_, item) => <div className="page-actions">
            <Button size="small" icon={<EditOutlined />} onClick={() => show(item)}>Sửa</Button>
            <Popconfirm title="Thu hồi quyền này?" onConfirm={() => remove(item.id)}>
              <Button size="small" danger icon={<StopOutlined />}>Thu hồi</Button>
            </Popconfirm>
          </div> },
        ]}
        pagination={{ current: currentPage, pageSize: 10, showSizeChanger: false, onChange: setPage, showTotal: showTotalLabel('quyền đã gán') }} />
    </PageCard>
    <Modal title={editing ? 'Sửa quyền đã gán' : 'Gán quyền'} open={open} onCancel={() => setOpen(false)}
      onOk={() => form.submit()} confirmLoading={saving} destroyOnHidden>
      <Form form={form} layout="vertical" onFinish={save}>
        <Form.Item name="userId" label="Tài khoản" rules={[{ required: true, message: 'Chọn tài khoản' }]}>
          <Select showSearch={{ optionFilterProp: 'label' }} options={users.map((user) => ({ value: user.id, label: `${user.fullName} (${user.userName})` }))} />
        </Form.Item>
        <Form.Item name="permissionId" label="Quyền" rules={[{ required: true, message: 'Chọn quyền' }]}>
          <Select showSearch={{ optionFilterProp: 'label' }} options={permissionOptions} />
        </Form.Item>
      </Form>
    </Modal>
  </section>
}
