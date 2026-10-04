import { useCallback, useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { Alert, Button, Checkbox, Form, Input, Modal, Popconfirm, Select, Space, Table, Typography } from 'antd'
import { getApiError } from '../../api/response'
import { createQuestion, deleteQuestion, getQuestionLevels, getQuestions, getQuestionSubjects,
  getQuestionTypes, updateQuestion } from '../../services/questionService'

const defaultAnswers = () => [{ content: '', isCorrect: false }, { content: '', isCorrect: false }]

export default function QuestionBankPage() {
  const user = useSelector((state) => state.auth.user)
  const allowed = (user?.permissions || []).some((id) => String(id) === '2')
  const [form] = Form.useForm()
  const [questions, setQuestions] = useState([])
  const [types, setTypes] = useState([])
  const [levels, setLevels] = useState([])
  const [subjects, setSubjects] = useState([])
  const [filters, setFilters] = useState({})
  const [editing, setEditing] = useState(null)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    if (!allowed) return
    setLoading(true); setError('')
    try { setQuestions(await getQuestions(filters)) }
    catch (failure) { setError(getApiError(failure)) }
    finally { setLoading(false) }
  }, [allowed, filters])

  useEffect(() => { load() }, [load])
  useEffect(() => {
    if (!allowed) return
    Promise.all([getQuestionTypes(), getQuestionLevels(), getQuestionSubjects()])
      .then(([a, b, c]) => { setTypes(a); setLevels(b); setSubjects(c) })
      .catch((failure) => setError(getApiError(failure)))
  }, [allowed])

  function showForm(item) {
    setEditing(item || null); setError('')
    form.setFieldsValue(item ? { ...item, answers: item.answers.map(({ content, isCorrect }) => ({ content, isCorrect })) }
      : { content: '', status: 1, answers: defaultAnswers() })
    setOpen(true)
  }

  async function save(values) {
    const answers = (values.answers || []).map((x) => ({ content: x.content?.trim(), isCorrect: Boolean(x.isCorrect) }))
    const correct = answers.filter((x) => x.isCorrect).length
    if (answers.length < 2 || answers.length > 20 || answers.some((x) => !x.content) ||
      new Set(answers.map((x) => x.content.toLocaleLowerCase())).size !== answers.length ||
      (values.questionTypeId === 1 && (answers.length !== 2 || correct !== 1 ||
        !['đúng', 'sai'].every((text) => answers.some((x) => x.content.toLocaleLowerCase() === text)))) ||
      (values.questionTypeId === 2 && correct !== 1) ||
      (values.questionTypeId === 3 && correct < 1)) {
      setError('Tập đáp án không hợp lệ cho loại câu hỏi. Cần nội dung khác nhau và số đáp án đúng phù hợp.')
      return
    }
    setSaving(true); setError('')
    try {
      const body = { ...values, content: values.content.trim(), answers }
      if (editing) await updateQuestion(editing.id, body)
      else await createQuestion(body)
      setOpen(false); await load()
    } catch (failure) { setError(getApiError(failure)) }
    finally { setSaving(false) }
  }

  async function remove(id) {
    setError('')
    try { await deleteQuestion(id); await load() }
    catch (failure) { setError(getApiError(failure)) }
  }

  if (!allowed) return <Alert type="error" message="Bạn không có quyền quản lý câu hỏi." />
  const label = (items, id) => items.find((x) => x.id === id)?.name || id
  const choices = (items) => items.filter((x) => x.status === true || x.status === 1 || x.status == null)
    .map((x) => ({ value: x.id, label: x.name }))

  return <section className="p-6">
    <Typography.Title level={2}>Ngân hàng câu hỏi</Typography.Title>
    {error && <Alert type="error" showIcon message={error} className="mb-4" />}
    <Space wrap className="mb-4">
      <Input.Search placeholder="Tìm nội dung" allowClear onSearch={(textSearch) => setFilters((old) => ({ ...old, textSearch: textSearch.trim() || undefined }))} />
      <Select allowClear placeholder="Môn học" style={{ minWidth: 160 }} options={choices(subjects)}
        onChange={(subjectId) => setFilters((old) => ({ ...old, subjectId }))} />
      <Select allowClear placeholder="Loại" style={{ minWidth: 170 }} options={choices(types).filter((x) => x.value <= 3)}
        onChange={(questionTypeId) => setFilters((old) => ({ ...old, questionTypeId }))} />
      <Select allowClear placeholder="Mức độ" style={{ minWidth: 140 }} options={choices(levels)}
        onChange={(questionLevelId) => setFilters((old) => ({ ...old, questionLevelId }))} />
      <Button type="primary" onClick={() => showForm(null)}>Thêm câu hỏi</Button>
      <Button onClick={load}>Tải lại</Button>
    </Space>
    <Table rowKey="id" loading={loading} dataSource={questions} pagination={{ pageSize: 10 }}
      locale={{ emptyText: 'Chưa có câu hỏi' }} columns={[
        { title: 'Nội dung', dataIndex: 'content' },
        { title: 'Môn', dataIndex: 'subjectId', render: (id) => label(subjects, id) },
        { title: 'Loại', dataIndex: 'questionTypeId', render: (id) => label(types, id) },
        { title: 'Mức độ', dataIndex: 'questionLevelId', render: (id) => label(levels, id) },
        { title: 'Trạng thái', render: (_, item) => item.status === 255 ? 'Đã ẩn' : item.status === 1 ? 'Hoạt động' : 'Tạm ngừng' },
        { title: 'Đáp án', render: (_, item) => item.answers?.map((x) => `${x.content}${x.isCorrect ? ' ✓' : ''}`).join(' · ') },
        { title: 'Thao tác', render: (_, item) => <Space>
          {item.isUsedInExam ? 'Đã dùng trong đề' : <>
            <Button onClick={() => showForm(item)}>Sửa</Button>
            {item.status !== 255 && <Popconfirm title="Ẩn câu hỏi này?" onConfirm={() => remove(item.id)}>
              <Button danger>Ẩn</Button></Popconfirm>}
          </>}
        </Space> },
      ]} />
    <Modal title={editing ? 'Sửa câu hỏi và đáp án' : 'Thêm câu hỏi và đáp án'} open={open}
      onCancel={() => setOpen(false)} onOk={() => form.submit()} confirmLoading={saving} width={760} destroyOnHidden>
      {error && <Alert type="error" showIcon message={error} className="mb-4" />}
      <Form form={form} layout="vertical" onFinish={save} onValuesChange={(changed) => {
        if (changed.questionTypeId === 1) form.setFieldValue('answers', [
          { content: 'Đúng', isCorrect: true }, { content: 'Sai', isCorrect: false },
        ])
      }}>
        <Form.Item name="subjectId" label="Môn học" rules={[{ required: true }]}><Select options={choices(subjects)} /></Form.Item>
        <Form.Item name="questionTypeId" label="Loại câu hỏi" rules={[{ required: true }]}><Select options={choices(types).filter((x) => x.value <= 3)} /></Form.Item>
        <Form.Item name="questionLevelId" label="Mức độ"><Select allowClear options={choices(levels)} /></Form.Item>
        <Form.Item name="content" label="Nội dung" rules={[{ required: true, whitespace: true }]}><Input.TextArea maxLength={4000} /></Form.Item>
        <Form.Item name="status" label="Trạng thái"><Select options={[{ value: 1, label: 'Hoạt động' }, { value: 0, label: 'Tạm ngừng' }]} /></Form.Item>
        <Typography.Title level={5}>Đáp án</Typography.Title>
        <Form.List name="answers">{(fields, { add, remove: removeAnswer }) => <>
          {fields.map(({ key, name }) => <Space key={key} align="baseline" className="flex mb-2">
            <Form.Item name={[name, 'content']} rules={[{ required: true, whitespace: true }]} className="grow mb-0">
              <Input placeholder="Nội dung đáp án" maxLength={2000} />
            </Form.Item>
            <Form.Item name={[name, 'isCorrect']} valuePropName="checked" className="mb-0"><Checkbox>Đúng</Checkbox></Form.Item>
            <Button danger onClick={() => removeAnswer(name)}>Xóa</Button>
          </Space>)}
          <Button onClick={() => add({ content: '', isCorrect: false })}>Thêm đáp án</Button>
        </>}</Form.List>
      </Form>
    </Modal>
  </section>
}
