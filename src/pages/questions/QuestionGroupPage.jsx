import { useCallback, useEffect, useMemo, useState } from 'react'
import { Alert, Button, Form, Input, Modal, Popconfirm, Select, Space, Table, Tag, Typography } from 'antd'
import { ArrowDownOutlined, ArrowUpOutlined, DeleteOutlined, EditOutlined, EyeInvisibleOutlined, EyeOutlined, PlusOutlined,
  ReloadOutlined } from '@ant-design/icons'
import PageHeader from '../../components/ui/PageHeader'
import PageCard from '../../components/ui/PageCard'
import StatusTag from '../../components/ui/StatusTag'
import QuestionMediaPanel from './QuestionMediaPanel'
import { getApiError } from '../../api/response'
import { getQuestions, getQuestionSubjects } from '../../services/questionService'
import { attachGroupMedia, createQuestionGroup, deleteQuestionGroup, detachGroupMedia, getQuestionGroup, getQuestionGroups,
  setQuestionGroupStatus, updateQuestionGroup } from '../../services/questionGroupService'
import { groupFormProblem, MAX_CONTENT, MAX_GROUP_QUESTIONS, MAX_TITLE, MIN_GROUP_QUESTIONS, moveItem } from '../../services/questionGroupView'

const ERRORS = {
  GROUP_LOCKED: 'Đoạn có câu đã nằm trong đề thi hoặc đã có bài làm nên không sửa/xóa được (vẫn ẩn/hiện được).',
  QUESTION_IN_OTHER_GROUP: 'Có câu hỏi đã thuộc đoạn dùng chung khác.',
  QUESTION_LOCKED: 'Có câu hỏi đã nằm trong đề thi hoặc đã có bài làm nên không đưa vào đoạn được.',
  GROUP_NOT_FOUND: 'Đoạn không còn tồn tại.',
}
const groupError = (failure) => ERRORS[failure?.response?.data?.message] || getApiError(failure)
const short = (text, n = 80) => (text && text.length > n ? `${text.slice(0, n)}…` : text)

// To-be T18 (QT18-1/2): đoạn dùng chung — chữ + media, 2–10 câu con cùng môn theo thứ tự; câu con luôn đi cùng cả đoạn.
export default function QuestionGroupPage() {
  const [form] = Form.useForm()
  const [groups, setGroups] = useState([])
  const [subjects, setSubjects] = useState([])
  const [subjectFilter, setSubjectFilter] = useState()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)
  const [candidates, setCandidates] = useState([])
  const [members, setMembers] = useState([])
  const [subjectId, setSubjectId] = useState()

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try { setGroups(await getQuestionGroups(subjectFilter ? { subjectId: subjectFilter } : {})) }
    catch (failure) { setError(groupError(failure)) }
    finally { setLoading(false) }
  }, [subjectFilter])
  useEffect(() => { load() }, [load])
  useEffect(() => { getQuestionSubjects().then(setSubjects).catch(() => {}) }, [])

  // Câu của môn đang chọn: câu lẻ hoặc đã thuộc chính đoạn đang sửa
  useEffect(() => {
    if (!open || !subjectId) { setCandidates([]); return }
    let alive = true
    getQuestions({ subjectId }).then((rows) => {
      if (alive) setCandidates((rows || []).filter((q) => q.status !== 255 && (!q.groupId || q.groupId === editing?.id)))
    }).catch(() => {})
    return () => { alive = false }
  }, [open, subjectId, editing?.id])

  async function showForm(item) {
    setFormError(''); form.resetFields()
    if (!item) {
      setEditing(null); setMembers([]); setSubjectId(undefined)
      form.setFieldsValue({ title: '', content: '' }); setOpen(true); return
    }
    try {
      const detail = await getQuestionGroup(item.id)
      setEditing(detail); setMembers(detail.questions.map((q) => ({ id: q.id, content: q.content })))
      setSubjectId(detail.subjectId)
      form.setFieldsValue({ subjectId: detail.subjectId, title: detail.title, content: detail.content })
      setOpen(true)
    } catch (failure) { setError(groupError(failure)) }
  }

  async function save(values) {
    const body = { subjectId: values.subjectId, title: (values.title ?? '').trim(), content: (values.content ?? '').trim(),
      questionIds: members.map((m) => m.id) }
    const problem = groupFormProblem(body)
    if (problem) { setFormError(problem); return }
    setSaving(true); setFormError('')
    try {
      if (editing) await updateQuestionGroup(editing.id, body); else await createQuestionGroup(body)
      setOpen(false); await load()
    } catch (failure) { setFormError(groupError(failure)) }
    finally { setSaving(false) }
  }

  async function act(operation) {
    setError('')
    try { await operation(); await load() } catch (failure) { setError(groupError(failure)) }
  }

  // Media của đoạn: dùng lại panel media câu hỏi (cùng giới hạn T14)
  const mediaSource = useMemo(() => editing && {
    load: async () => { const g = await getQuestionGroup(editing.id); return { locked: g.locked, items: g.media } },
    attach: async (mediaId) => { const g = await attachGroupMedia(editing.id, mediaId); return { locked: g.locked, items: g.media } },
    detach: async (mediaId) => { const g = await detachGroupMedia(editing.id, mediaId); return { locked: g.locked, items: g.media } },
    lockedText: 'Đoạn có câu đã nằm trong đề thi hoặc đã có bài làm nên không thêm/gỡ ảnh, âm thanh được (chỉ xem).',
    detachTitle: 'Gỡ media khỏi đoạn?',
  }, [editing])

  const locked = Boolean(editing?.locked)
  const available = candidates.filter((q) => !members.some((m) => m.id === q.id))
  return <section className="page-section">
    <PageHeader title="Đoạn dùng chung" description={`Bài đọc/bài nghe dùng chung cho ${MIN_GROUP_QUESTIONS}–${MAX_GROUP_QUESTIONS} câu cùng môn. Câu trong đoạn luôn được chọn cùng cả đoạn khi tạo đề và luyện tập.`}
      extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => showForm(null)}>Thêm đoạn</Button>} />
    {error && <Alert type="error" showIcon title={error} className="page-alert" closable onClose={() => setError('')} />}
    <PageCard>
      <div className="page-toolbar">
        <Select allowClear placeholder="Lọc theo môn" style={{ minWidth: 220 }} value={subjectFilter} onChange={setSubjectFilter}
          options={subjects.map((s) => ({ value: s.id, label: s.name }))} aria-label="Lọc theo môn" />
        <Button icon={<ReloadOutlined />} onClick={load}>Tải lại</Button>
      </div>
      <Table rowKey="id" loading={loading} dataSource={groups} pagination={{ pageSize: 20 }} columns={[
        { title: 'Tiêu đề', dataIndex: 'title', render: (value, item) => <Space direction="vertical" size={0}>
          <strong>{value}</strong><small className="muted">{item.subjectName}</small></Space> },
        { title: 'Số câu', dataIndex: 'questionCount', width: 90 },
        { title: 'Media', dataIndex: 'mediaCount', width: 80 },
        { title: 'Trạng thái', dataIndex: 'status', width: 170, render: (value, item) => <Space>
          <StatusTag tone={value === 1 ? 'success' : 'default'}>{value === 1 ? 'Đang dùng' : 'Đã ẩn'}</StatusTag>
          {item.locked && <Tag>Đã vào đề</Tag>}</Space> },
        { title: 'Thao tác', key: 'actions', width: 260, render: (_, item) => <Space wrap>
          <Button size="small" icon={<EditOutlined />} onClick={() => showForm(item)}>{item.locked ? 'Xem' : 'Sửa'}</Button>
          <Button size="small" icon={item.status === 1 ? <EyeInvisibleOutlined /> : <EyeOutlined />}
            onClick={() => act(() => setQuestionGroupStatus(item.id, item.status === 1 ? 0 : 1))}>{item.status === 1 ? 'Ẩn' : 'Hiện'}</Button>
          {!item.locked && <Popconfirm title="Xóa đoạn? Các câu con trở thành câu lẻ." onConfirm={() => act(() => deleteQuestionGroup(item.id))}>
            <Button size="small" danger icon={<DeleteOutlined />}>Xóa</Button></Popconfirm>}
        </Space> },
      ]} />
    </PageCard>
    <Modal title={editing ? (locked ? 'Xem đoạn dùng chung' : 'Sửa đoạn dùng chung') : 'Thêm đoạn dùng chung'} open={open} width={820}
      onCancel={() => setOpen(false)} onOk={() => form.submit()} confirmLoading={saving} okButtonProps={{ disabled: locked }} destroyOnHidden>
      {formError && <Alert type="error" showIcon title={formError} className="page-alert" />}
      {locked && <Alert type="info" showIcon className="page-alert" title={ERRORS.GROUP_LOCKED} />}
      <Form form={form} layout="vertical" onFinish={save} disabled={locked}
        onValuesChange={(changed) => { if ('subjectId' in changed) { setSubjectId(changed.subjectId); setMembers([]) } }}>
        <Form.Item name="subjectId" label="Môn học" rules={[{ required: true, message: 'Chọn môn học' }]}>
          <Select options={subjects.map((s) => ({ value: s.id, label: s.name }))} showSearch={{ optionFilterProp: 'label' }} />
        </Form.Item>
        <Form.Item name="title" label="Tiêu đề" rules={[{ required: true, whitespace: true, message: 'Nhập tiêu đề' }]}>
          <Input maxLength={MAX_TITLE} placeholder="Ví dụ: Bài đọc 1 — Biến đổi khí hậu" />
        </Form.Item>
        <Form.Item name="content" label="Nội dung đoạn" rules={[{ required: true, whitespace: true, message: 'Nhập nội dung đoạn' }]}>
          <Input.TextArea rows={6} maxLength={MAX_CONTENT} showCount placeholder="Đoạn văn / lời dẫn hiển thị phía trên các câu con" />
        </Form.Item>
        <Typography.Title level={5}>Câu hỏi trong đoạn ({members.length}/{MAX_GROUP_QUESTIONS})</Typography.Title>
        <Select className="group-question-picker" placeholder={subjectId ? 'Thêm câu hỏi (câu lẻ cùng môn)' : 'Chọn môn trước'}
          disabled={locked || !subjectId || members.length >= MAX_GROUP_QUESTIONS} value={null} showSearch={{ optionFilterProp: 'label' }}
          // Review T18: câu đã vào đề không đưa vào đoạn được (BE trả QUESTION_LOCKED) — hiện nhưng khóa
          options={available.map((q) => ({ value: q.id, disabled: Boolean(q.isUsedInExam),
            label: `#${q.id} · ${short(q.content)}${q.isUsedInExam ? ' (đã vào đề)' : ''}` }))} aria-label="Thêm câu hỏi vào đoạn"
          onChange={(id) => { const q = candidates.find((x) => x.id === id); if (q) setMembers((old) => [...old, { id: q.id, content: q.content }]) }} />
        <ol className="group-members">
          {members.map((m, i) => <li key={m.id} className="group-members__item">
            <span className="group-members__text">#{m.id} · {short(m.content, 120)}</span>
            {!locked && <Space size={4}>
              <Button size="small" icon={<ArrowUpOutlined />} aria-label="Lên" disabled={i === 0} onClick={() => setMembers((old) => moveItem(old, i, -1))} />
              <Button size="small" icon={<ArrowDownOutlined />} aria-label="Xuống" disabled={i === members.length - 1}
                onClick={() => setMembers((old) => moveItem(old, i, 1))} />
              <Button size="small" danger icon={<DeleteOutlined />} aria-label="Bỏ khỏi đoạn"
                onClick={() => setMembers((old) => old.filter((x) => x.id !== m.id))} />
            </Space>}
          </li>)}
          {members.length === 0 && <li className="muted">Chưa có câu hỏi.</li>}
        </ol>
      </Form>
      {editing ? <QuestionMediaPanel source={mediaSource} />
        : <Typography.Paragraph type="secondary">Lưu đoạn trước, sau đó mở “Sửa” để thêm ảnh/âm thanh cho đoạn.</Typography.Paragraph>}
    </Modal>
  </section>
}
