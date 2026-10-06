import { useCallback, useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { Alert, Button, Checkbox, Form, Input, InputNumber, Modal, Select, Space, Table, Typography } from 'antd'
import { getApiError } from '../../api/response'
import { createExam, createVariant, getExams, getExamSubjects, getQuestionOptions, getVariants, updateExam, updateVariant } from '../../services/examService'

const stateOptions = [{ value: 2, label: 'Nháp' }, { value: 1, label: 'Công khai' }]

export default function ExamManagementPage() {
  const allowed = (useSelector((state) => state.auth.user?.permissions) || []).some((id) => String(id) === '1')
  const [examForm] = Form.useForm()
  const [variantForm] = Form.useForm()
  const chosenQuestionIds = Form.useWatch('questionIds', variantForm) || []
  const randomRules = Form.useWatch('randomSelections', variantForm) || []
  const [exams, setExams] = useState([])
  const [subjects, setSubjects] = useState([])
  const [variants, setVariants] = useState([])
  const [questions, setQuestions] = useState([])
  const [selectedExam, setSelectedExam] = useState(null)
  const [editingExam, setEditingExam] = useState(null)
  const [editingVariant, setEditingVariant] = useState(null)
  const [examOpen, setExamOpen] = useState(false)
  const [variantOpen, setVariantOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    if (!allowed) return
    setLoading(true); setError('')
    try {
      const [items, subjectItems] = await Promise.all([getExams(), getExamSubjects()])
      setExams(items); setSubjects(subjectItems)
    } catch (failure) { setError(getApiError(failure)) }
    finally { setLoading(false) }
  }, [allowed])
  useEffect(() => { load() }, [load])

  async function selectExam(item) {
    setSelectedExam(item); setError('')
    try {
      const [variantItems, questionItems] = await Promise.all([getVariants(item.id), getQuestionOptions(item.id)])
      setVariants(variantItems); setQuestions(questionItems)
    } catch (failure) { setError(getApiError(failure)) }
  }

  function openExam(item) {
    setEditingExam(item || null)
    examForm.resetFields()
    examForm.setFieldsValue(item || { status: 2, numberOfRepeat: 1, allowViewResult: true, scoreMethodId: null })
    setExamOpen(true)
  }

  async function saveExam(values) {
    setSaving(true); setError('')
    try {
      const body = { ...values, name: values.name.trim(), scoreMethodId: editingExam?.scoreMethodId ?? null }
      if (editingExam) await updateExam(editingExam.id, body)
      else await createExam(body)
      setExamOpen(false); await load()
      if (selectedExam && editingExam?.id === selectedExam.id) setSelectedExam({ ...selectedExam, ...body })
    } catch (failure) { setError(getApiError(failure)) }
    finally { setSaving(false) }
  }

  function openVariant(item) {
    setEditingVariant(item || null)
    variantForm.resetFields()
    variantForm.setFieldsValue(item ? {
      code: item.code, status: item.status, questionIds: item.questions.map((x) => x.questionId),
      randomSelections: [],
    } : { code: '', status: 2, questionIds: [], randomSelections: [] })
    setVariantOpen(true)
  }

  async function saveVariant(values) {
    setSaving(true); setError('')
    try {
      const body = { ...values, code: values.code.trim(), questionIds: values.questionIds || [],
        randomSelections: values.randomSelections || [] }
      if (editingVariant) await updateVariant(selectedExam.id, editingVariant.id, body)
      else await createVariant(selectedExam.id, body)
      setVariantOpen(false); await selectExam(selectedExam)
    } catch (failure) { setError(getApiError(failure)) }
    finally { setSaving(false) }
  }

  if (!allowed) return <Alert type="error" message="Bạn không có quyền quản lý bài thi." />
  const subjectName = (id) => subjects.find((x) => x.id === id)?.name || id
  const questionLabel = (id) => questions.find((x) => x.id === id)?.content || `#${id}`
  return <section className="p-6">
    <Typography.Title level={2}>Bài thi và mã đề</Typography.Title>
    {error && <Alert type="error" showIcon message={error} className="mb-4" />}
    <Space className="mb-4"><Button type="primary" onClick={() => openExam(null)}>Tạo bài thi</Button><Button onClick={load}>Tải lại</Button></Space>
    <Table rowKey="id" loading={loading} dataSource={exams.filter((x) => x.status !== 255)} pagination={{ pageSize: 10 }}
      locale={{ emptyText: 'Chưa có bài thi' }} columns={[
        { title: 'Bài thi', dataIndex: 'name' },
        { title: 'Môn', dataIndex: 'subjectId', render: subjectName },
        { title: 'Số câu', dataIndex: 'numberOfQuestions' },
        { title: 'Điểm tối đa', dataIndex: 'maximmumMark' },
        { title: 'Trạng thái', dataIndex: 'status', render: (status) => status === 1 ? 'Công khai' : 'Nháp' },
        { title: 'Thao tác', render: (_, item) => <Space><Button onClick={() => selectExam(item)}>Mã đề</Button><Button onClick={() => openExam(item)}>Cấu hình</Button></Space> },
      ]} />
    {selectedExam && <section>
      <Typography.Title level={3}>Mã đề: {selectedExam.name}</Typography.Title>
      <Space className="mb-4"><Button type="primary" disabled={selectedExam.status === 1} onClick={() => openVariant(null)}>Tạo mã đề</Button><Button onClick={() => selectExam(selectedExam)}>Tải lại</Button></Space>
      <Table rowKey="id" dataSource={variants} pagination={false} expandable={{ expandedRowRender: (item) => <ul>{item.questions.map((q) => <li key={q.id}>{questionLabel(q.questionId)} — {q.point} điểm</li>)}</ul> }}
        locale={{ emptyText: 'Chưa có mã đề' }} columns={[
          { title: 'Mã đề', dataIndex: 'code' },
          { title: 'Số câu', render: (_, item) => item.questions.length },
          { title: 'Tổng điểm', render: (_, item) => item.questions.reduce((sum, q) => sum + q.point, 0).toFixed(2) },
          { title: 'Trạng thái', dataIndex: 'status', render: (status) => status === 1 ? 'Công khai' : 'Nháp' },
          { title: 'Thao tác', render: (_, item) => item.status === 2 && selectedExam.status !== 1 ? <Button onClick={() => openVariant(item)}>Sửa</Button> : null },
        ]} />
    </section>}
    <Modal title={editingExam ? 'Cấu hình bài thi' : 'Tạo bài thi'} open={examOpen} onCancel={() => setExamOpen(false)} onOk={() => examForm.submit()} confirmLoading={saving} destroyOnHidden>
      <Form form={examForm} layout="vertical" onFinish={saveExam}>
        <Form.Item name="name" label="Tên bài thi" rules={[{ required: true, whitespace: true }]}><Input /></Form.Item>
        <Form.Item name="subjectId" label="Môn học" rules={[{ required: true }]}><Select options={subjects.filter((x) => x.status === 1).map((x) => ({ value: x.id, label: x.name }))} /></Form.Item>
        <Form.Item name="description" label="Mô tả"><Input.TextArea /></Form.Item>
        <Space wrap>
          <Form.Item name="numberOfQuestions" label="Số câu" rules={[{ required: true }]}><InputNumber min={1} precision={0} /></Form.Item>
          <Form.Item name="maximmumMark" label="Điểm tối đa" rules={[{ required: true }]}><InputNumber min={0.01} /></Form.Item>
          <Form.Item name="passMark" label="Điểm đạt" rules={[{ required: true }]}><InputNumber min={0.01} /></Form.Item>
          <Form.Item name="duration" label="Thời gian (phút)" rules={[{ required: true }]}><InputNumber min={1} precision={0} /></Form.Item>
          <Form.Item name="numberOfRepeat" label="Số lần làm bài" rules={[{ required: true }]}><InputNumber min={1} precision={0} /></Form.Item>
        </Space>
        <Form.Item name="allowViewResult" valuePropName="checked"><Checkbox>Cho phép xem kết quả</Checkbox></Form.Item>
        <Form.Item name="scoreMethodId" label="Phương pháp tính điểm (ID hiện có)"><InputNumber disabled style={{ width: '100%' }} placeholder="Chưa cấu hình" /></Form.Item>
        <Form.Item name="status" label="Trạng thái" rules={[{ required: true }]}><Select options={stateOptions} disabled={!editingExam} /></Form.Item>
      </Form>
    </Modal>
    <Modal title={editingVariant ? 'Sửa mã đề' : 'Tạo mã đề'} open={variantOpen} onCancel={() => setVariantOpen(false)} onOk={() => variantForm.submit()} confirmLoading={saving} width={800} destroyOnHidden>
      <Form form={variantForm} layout="vertical" onFinish={saveVariant}>
        <Form.Item name="code" label="Mã đề" rules={[{ required: true, whitespace: true }]}><Input /></Form.Item>
        <Form.Item name="questionIds" label="Chọn câu thủ công"><Select mode="multiple" showSearch optionFilterProp="label" options={questions.map((q) => ({ value: q.id, label: `#${q.id} ${q.content}` }))} /></Form.Item>
        <Typography.Paragraph>Đã chọn {chosenQuestionIds.length} câu thủ công + {randomRules.reduce((sum, rule) => sum + (Number(rule?.count) || 0), 0)} câu ngẫu nhiên / {selectedExam?.numberOfQuestions} câu. Tổng điểm cấu hình: {selectedExam?.maximmumMark}.</Typography.Paragraph>
        <Typography.Text>Chọn ngẫu nhiên theo mức độ; để trống mức độ để lấy từ toàn bộ môn. Tổng số câu thủ công và ngẫu nhiên phải bằng {selectedExam?.numberOfQuestions}.</Typography.Text>
        <Form.List name="randomSelections">{(fields, { add, remove }) => <>
          {fields.map((field) => <Space key={field.key} align="baseline">
            <Form.Item {...field} name={[field.name, 'questionLevelId']} label="Mức độ"><Select allowClear options={[...new Set(questions.map((q) => q.questionLevelId).filter(Boolean))].map((id) => ({ value: id, label: questions.find((q) => q.questionLevelId === id)?.questionLevelName || `#${id}` }))} /></Form.Item>
            <Form.Item {...field} name={[field.name, 'count']} label="Số câu" rules={[{ required: true }]}><InputNumber min={1} precision={0} /></Form.Item>
            <Button onClick={() => remove(field.name)}>Bỏ</Button>
          </Space>)}
          <Button onClick={() => add()}>Thêm nhóm ngẫu nhiên</Button>
        </>}</Form.List>
        <Form.Item name="status" label="Trạng thái" rules={[{ required: true }]}><Select options={stateOptions} /></Form.Item>
      </Form>
    </Modal>
  </section>
}
