import { useCallback, useEffect, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import { Alert, Button, Image, Popconfirm, Space, Table, Typography } from 'antd'
import { DeleteOutlined, ReloadOutlined } from '@ant-design/icons'
import PageHeader from '../../components/ui/PageHeader'
import PageCard from '../../components/ui/PageCard'
import { getApiError } from '../../api/response'
import { apiBaseURL, deleteOrphanMedia, getOrphanMedia } from '../../services/mediaService'
import { formatBytes, orphanErrorMessage, resolveMediaUrl } from '../../services/mediaView'
import { formatVnMoment } from '../../utils/duration'

// To-be T15 (QT15-4): media mồ côi — không câu hỏi nào gắn và không bài làm/phiên nào tham chiếu, tải lên ≥ 24 giờ.
// Không xóa tự động (Q15): Admin xóa tay (xóa dòng + file, có audit).
export default function AdminOrphanMediaPage() {
  const levelId = useSelector((state) => state.auth.user?.levelId)
  const [data, setData] = useState(null)
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState([])
  const [loading, setLoading] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const requestRef = useRef(0)

  const load = useCallback(async () => {
    const requestId = ++requestRef.current
    setLoading(true); setError('')
    try {
      const result = await getOrphanMedia(page, 20)
      if (requestId === requestRef.current) { setData(result); setSelected([]) }
    } catch (failure) {
      if (requestId === requestRef.current) setError(getApiError(failure))
    } finally {
      if (requestId === requestRef.current) setLoading(false)
    }
  }, [page])
  useEffect(() => { if (String(levelId) === '1') load() }, [load, levelId])

  async function remove(ids) {
    setBusy(true); setError(''); setMessage('')
    let done = 0; const failures = []
    for (const id of ids) {
      try { await deleteOrphanMedia(id); done += 1 } catch (failure) { failures.push(orphanErrorMessage(failure, getApiError(failure))) }
    }
    setBusy(false)
    if (done) setMessage(`Đã xóa ${done} media.`)
    if (failures.length) setError([...new Set(failures)].join(' '))
    if (done && (data?.items?.length || 0) === done && page > 1) setPage(page - 1); else await load()
  }

  if (String(levelId) !== '1') return <Alert type="error" showIcon title="Chỉ quản trị viên được quản lý media mồ côi." />
  const base = apiBaseURL()
  return <section className="page-body">
    <PageHeader title="Media mồ côi" description={`Ảnh/âm thanh không còn câu hỏi hay bài làm nào dùng, tải lên từ ${data?.minAgeHours ?? 24} giờ trước. Hệ thống không tự xóa; xóa ở đây là xóa hẳn file.`} />
    {error && <Alert type="error" showIcon title={error} className="page-alert" closable onClose={() => setError('')} />}
    {message && <Alert type="success" showIcon title={message} className="page-alert" closable onClose={() => setMessage('')} />}
    <PageCard>
      <div className="page-toolbar">
        <Typography.Text>{data ? `${data.total} media · ${formatBytes(data.totalBytes)}` : ''}</Typography.Text>
        <Space className="page-toolbar__end">
          <Popconfirm title={`Xóa hẳn ${selected.length} media đã chọn?`} disabled={!selected.length} onConfirm={() => remove(selected)}>
            <Button danger icon={<DeleteOutlined />} disabled={!selected.length || busy} loading={busy}>Xóa đã chọn ({selected.length})</Button>
          </Popconfirm>
          <Button icon={<ReloadOutlined />} onClick={load} loading={loading}>Tải lại</Button>
        </Space>
      </div>
      <Table rowKey="id" size="middle" loading={loading} dataSource={data?.items || []} scroll={{ x: 820 }}
        rowSelection={{ selectedRowKeys: selected, onChange: setSelected }}
        pagination={{ current: page, pageSize: 20, total: data?.total || 0, showSizeChanger: false, onChange: setPage }}
        locale={{ emptyText: 'Không có media mồ côi' }} columns={[
          { title: 'Xem trước', key: 'preview', width: 140, render: (_, row) => row.kind === 'image'
            ? <Image src={resolveMediaUrl(row.url, base)} width={110} height={70} style={{ objectFit: 'contain' }} alt={row.originalName} />
            : <audio src={resolveMediaUrl(row.url, base)} controls preload="none" style={{ width: 120 }} /> },
          { title: 'Tên file', dataIndex: 'originalName', ellipsis: true },
          { title: 'Loại', dataIndex: 'kind', width: 90, render: (value) => value === 'image' ? 'Ảnh' : 'Âm thanh' },
          { title: 'Dung lượng', dataIndex: 'sizeBytes', width: 110, align: 'right', render: formatBytes },
          { title: 'Người tải', dataIndex: 'uploader', width: 200, ellipsis: true, render: (value) => value || '—' },
          { title: 'Tải lên lúc', dataIndex: 'uploadedAtUtc', width: 150, render: (value) => formatVnMoment(value) },
          { title: 'Thao tác', key: 'actions', width: 100, render: (_, row) => <Popconfirm title="Xóa hẳn media này?" onConfirm={() => remove([row.id])}>
            <Button size="small" danger icon={<DeleteOutlined />} disabled={busy}>Xóa</Button></Popconfirm> },
        ]} />
    </PageCard>
  </section>
}
