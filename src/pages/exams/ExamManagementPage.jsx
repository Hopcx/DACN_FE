import { useCallback, useEffect, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import { Alert, Button, Checkbox, Col, Form, Input, InputNumber, Modal, Row, Select, Space, Table, Typography } from 'antd'
import { CloseOutlined, DeleteOutlined, EditOutlined, FileTextOutlined, PlusOutlined, ReloadOutlined, SettingOutlined } from '@ant-design/icons'
import PageHeader from '../../components/ui/PageHeader'
import PageCard from '../../components/ui/PageCard'
import StatusTag from '../../components/ui/StatusTag'
import { LoadError, TableEmpty } from '../../components/ui/PageState'
import { getApiError, toLoadError } from '../../api/response'
import { visibleExams } from '../../services/examList'
import { rowNumber, showTotalLabel } from '../../services/listView'
import { createExam, createVariant, getExams, getExamSubjects, getQuestionOptions, getVariants, updateExam, updateVariant } from '../../services/examService'

const stateOptions = [{ value: 2, label: 'Nháp' }, { value: 1, label: 'Công khai' }]
// Smoke P1 tìm dòng bài mới theo chữ "Nháp": giữ nguyên nhãn
const stateTag = (status) => Number(status) === 1
  ? <StatusTag tone="success">Công khai</StatusTag> : <StatusTag tone="warning">Nháp</StatusTag>

export default function ExamManagementPage() {
  const authUser = useSelector((state) => state.auth.user)
  const allowed = String(authUser?.levelId) === '1' || (authUser?.permissions || []).some((id) => String(id) === '1')
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
  const [loadError, setLoadError] = useState(null)
  const [examError, setExamError] = useState('')
  const [variantError, setVariantError] = useState('')
  const [variantFormError, setVariantFormError] = useState('')
  const [variantsLoading, setVariantsLoading] = useState(false)
  const [keyword, setKeyword] = useState('')
  const [subjectFilter, setSubjectFilter] = useState()
  const [statusFilter, setStatusFilter] = useState()
  const [examPage, setExamPage] = useState(1)
  const variantRequestRef = useRef(0)

  const load = useCallback(async () => {
    if (!allowed) return
    setLoading(true); setLoadError(null)
    try {
      const [items, subjectItems] = await Promise.all([getExams(), getExamSubjects()])
      setExams(items); setSubjects(subjectItems)
    } catch (failure) { setLoadError(toLoadError(failure)) }
    finally { setLoading(false) }
  }, [allowed])
  useEffect(() => { load() }, [load])

  async function selectExam(item) {
    const requestId = ++variantRequestRef.current
    // Đổi sang bài khác thì bỏ mã đề của bài cũ, tránh "Sửa" gửi mã đề sai bài khi tải lỗi
    if (selectedExam?.id !== item.id) { setVariants([]); setQuestions([]) }
    setSelectedExam(item); setVariantError(''); setVariantsLoading(true)
    try {
      const [variantItems, questionItems] = await Promise.all([getVariants(item.id), getQuestionOptions(item.id)])
      if (requestId !== variantRequestRef.current) return
      setVariants(variantItems); setQuestions(questionItems)
    } catch (failure) {
      if (requestId === variantRequestRef.current) setVariantError(getApiError(failure))
    } finally {
      if (requestId === variantRequestRef.current) setVariantsLoading(false)
    }
  }

  function openExam(item) {
    setEditingExam(item || null); setExamError('')
    examForm.resetFields()
    examForm.setFieldsValue(item || { status: 2, numberOfRepeat: 1, allowViewResult: true, scoreMethodId: null })
    setExamOpen(true)
  }

  async function saveExam(values) {
    setSaving(true); setExamError('')
    try {
      const body = { ...values, name: values.name.trim(), scoreMethodId: editingExam?.scoreMethodId ?? null }
      if (editingExam) await updateExam(editingExam.id, body)
      else await createExam(body)
      setExamOpen(false); if (!editingExam) setExamPage(1); await load()
      if (selectedExam && editingExam?.id === selectedExam.id) setSelectedExam({ ...selectedExam, ...body })
    } catch (failure) { setExamError(getApiError(failure)) }
    finally { setSaving(false) }
  }

  function openVariant(item) {
    setEditingVariant(item || null); setVariantFormError('')
    variantForm.resetFields()
    variantForm.setFieldsValue(item ? {
      code: item.code, status: item.status, questionIds: item.questions.map((x) => x.questionId),
      randomSelections: [],
    } : { code: '', status: 2, questionIds: [], randomSelections: [] })
    setVariantOpen(true)
  }

  async function saveVariant(values) {
    setSaving(true); setVariantFormError('')
    try {
      const body = { ...values, code: values.code.trim(), questionIds: values.questionIds || [],
        randomSelections: values.randomSelections || [] }
      if (editingVariant) await updateVariant(selectedExam.id, editingVariant.id, body)
      else await createVariant(selectedExam.id, body)
      setVariantOpen(false); await selectExam(selectedExam)
    } catch (failure) { setVariantFormError(getApiError(failure)) }
    finally { setSaving(false) }
  }

  if (!allowed) return <Alert type="error" showIcon title="Bạn không có quyền quản lý bài thi." />
  const shownExams = visibleExams(exams, keyword, { subjectId: subjectFilter, status: statusFilter })
  const subjectName = (id) => subjects.find((x) => x.id === id)?.name || id
  const questionLabel = (id) => questions.find((x) => x.id === id)?.content || `#${id}`
  const levelOptions = [...new Set(questions.map((q) => q.questionLevelId).filter(Boolean))]
    .map((id) => ({ value: id, label: questions.find((q) => q.questionLevelId === id)?.questionLevelName || `#${id}` }))
  return <section className="page-body">
    <PageHeader title="Quản lý bài thi" description="Tạo và cấu hình các bài thi trắc nghiệm." />
    <LoadError error={loadError} onRetry={load} retrying={loading} />
    <PageCard>
      <div className="page-toolbar">
        <Input.Search placeholder="Tìm theo tên bài thi" aria-label="Tìm bài thi" allowClear maxLength={100} style={{ width: 260 }}
          onSearch={(value) => { setKeyword(value.trim()); setExamPage(1) }}
          onChange={(event) => { if (!event.target.value) { setKeyword(''); setExamPage(1) } }} />
        <Select allowClear placeholder="Tất cả môn học" aria-label="Lọc bài thi theo môn học" style={{ minWidth: 200 }}
          popupMatchSelectWidth={false} showSearch={{ optionFilterProp: 'label' }} virtual={false} value={subjectFilter}
          options={subjects.map((x) => ({ value: x.id, label: x.name }))}
          onChange={(value) => { setSubjectFilter(value); setExamPage(1) }} />
        <Select allowClear placeholder="Tất cả trạng thái" aria-label="Lọc trạng thái bài thi" style={{ minWidth: 160 }}
          value={statusFilter} options={stateOptions} onChange={(value) => { setStatusFilter(value); setExamPage(1) }} />
        <div className="page-toolbar__end">
          <Button icon={<ReloadOutlined />} onClick={load} loading={loading}>Tải lại</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => openExam(null)}>Tạo bài thi</Button>
        </div>
      </div>
      <Table rowKey="id" size="middle" loading={loading} dataSource={shownExams} scroll={{ x: 1000 }}
        pagination={{ current: examPage, pageSize: 10, showSizeChanger: false, onChange: setExamPage, showTotal: showTotalLabel('bài thi') }}
        locale={{ emptyText: <TableEmpty error={Boolean(loadError)} errorLabel="Không tải được dữ liệu."
          filtered={Boolean(keyword || subjectFilter || statusFilter)} emptyLabel="Chưa có bài thi" filteredLabel="Không có bài thi khớp bộ lọc" /> }} columns={[
          { title: 'STT', key: 'stt', width: 64, align: 'center', render: (_, __, index) => rowNumber(examPage, 10, index) },
          { title: 'Tên bài thi', dataIndex: 'name', render: (value) => <strong>{value}</strong> },
          { title: 'Môn học', dataIndex: 'subjectId', render: subjectName },
          { title: 'Thời gian (phút)', dataIndex: 'duration', align: 'right', width: 130 },
          { title: 'Số câu', dataIndex: 'numberOfQuestions', align: 'right', width: 90 },
          { title: 'Lượt làm tối đa', dataIndex: 'numberOfRepeat', align: 'right', width: 130 },
          { title: 'Điểm đạt', key: 'pass', width: 110, render: (_, item) => `${item.passMark} / ${item.maximmumMark}` },
          { title: 'Trạng thái', dataIndex: 'status', width: 120, render: stateTag },
          { title: 'Thao tác', key: 'actions', width: 210, render: (_, item) => <div className="page-actions">
            <Button size="small" icon={<SettingOutlined />} onClick={() => openExam(item)}>Cấu hình</Button>
            <Button size="small" icon={<FileTextOutlined />} type={selectedExam?.id === item.id ? 'primary' : 'default'}
              onClick={() => selectExam(item)}>Mã đề</Button>
          </div> },
        ]} />
    </PageCard>
    {selectedExam && <PageCard>
      <h2 className="page-section-title">Mã đề: {selectedExam.name}</h2>
      {variantError && <Alert type="error" showIcon title={variantError} className="page-alert" />}
      <div className="page-toolbar">
        <Button type="primary" icon={<PlusOutlined />} disabled={selectedExam.status === 1} onClick={() => openVariant(null)}>Tạo mã đề</Button>
        <Button icon={<ReloadOutlined />} loading={variantsLoading} onClick={() => selectExam(selectedExam)}>Tải lại</Button>
        <Button icon={<CloseOutlined />} onClick={() => setSelectedExam(null)}>Đóng</Button>
      </div>
      {/* pagination={false}: trang chỉ có một thanh phân trang (smoke P1 bấm trang cuối của bảng bài thi) */}
      <Table rowKey="id" size="middle" loading={variantsLoading} dataSource={variants} pagination={false}
        expandable={{ expandedRowRender: (item) => <ul>{item.questions.map((q) => <li key={q.id}>{questionLabel(q.questionId)} — {q.point} điểm</li>)}</ul> }}
        locale={{ emptyText: 'Chưa có mã đề' }} columns={[
          { title: 'Mã đề', dataIndex: 'code', render: (value) => <strong>{value}</strong> },
          { title: 'Số câu', key: 'count', render: (_, item) => item.questions.length },
          { title: 'Tổng điểm', key: 'total', render: (_, item) => item.questions.reduce((sum, q) => sum + q.point, 0).toFixed(2) },
          { title: 'Trạng thái', dataIndex: 'status', render: stateTag },
          { title: 'Thao tác', key: 'actions', render: (_, item) => item.status === 2 && selectedExam.status !== 1
            ? <Button size="small" icon={<EditOutlined />} onClick={() => openVariant(item)}>Sửa</Button> : null },
        ]} />
    </PageCard>}
    <Modal title={editingExam ? 'Cấu hình bài thi' : 'Tạo bài thi'} open={examOpen} onCancel={() => setExamOpen(false)} onOk={() => examForm.submit()} confirmLoading={saving} width={640} destroyOnHidden>
      {examError && <Alert type="error" showIcon title={examError} className="page-alert" />}
      <Form form={examForm} layout="vertical" onFinish={saveExam}>
        <Row gutter={12}>
          <Col xs={24} md={12}>
            <Form.Item name="name" label="Tên bài thi" rules={[{ required: true, whitespace: true, message: 'Nhập tên bài thi' }]}><Input /></Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="subjectId" label="Môn học" rules={[{ required: true, message: 'Chọn môn học' }]}>
              <Select showSearch={{ optionFilterProp: 'label' }} virtual={false} options={subjects.filter((x) => x.status === 1).map((x) => ({ value: x.id, label: x.name }))} />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item name="description" label="Mô tả"><Input.TextArea rows={2} /></Form.Item>
        <Row gutter={12}>
          <Col xs={12} md={8}>
            <Form.Item name="numberOfQuestions" label="Số câu" rules={[{ required: true, message: 'Nhập số câu' }]}><InputNumber min={1} precision={0} className="w-full" /></Form.Item>
          </Col>
          <Col xs={12} md={8}>
            <Form.Item name="duration" label="Thời gian (phút)" rules={[{ required: true, message: 'Nhập thời gian' }]}><InputNumber min={1} precision={0} className="w-full" /></Form.Item>
          </Col>
          <Col xs={12} md={8}>
            <Form.Item name="numberOfRepeat" label="Số lần làm bài" rules={[{ required: true, message: 'Nhập số lần làm bài' }]}><InputNumber min={1} precision={0} className="w-full" /></Form.Item>
          </Col>
          <Col xs={12} md={12}>
            <Form.Item name="maximmumMark" label="Điểm tối đa" rules={[{ required: true, message: 'Nhập điểm tối đa' }]}><InputNumber min={0.01} className="w-full" /></Form.Item>
          </Col>
          <Col xs={12} md={12}>
            <Form.Item name="passMark" label="Điểm đạt" rules={[{ required: true, message: 'Nhập điểm đạt' }]}><InputNumber min={0.01} className="w-full" /></Form.Item>
          </Col>
        </Row>
        <Form.Item name="allowViewResult" valuePropName="checked"><Checkbox>Cho phép xem kết quả</Checkbox></Form.Item>
        <Form.Item name="scoreMethodId" label="Phương pháp tính điểm (ID hiện có)"><InputNumber disabled style={{ width: '100%' }} placeholder="Chưa cấu hình" /></Form.Item>
        <Form.Item name="status" label="Trạng thái" rules={[{ required: true, message: 'Chọn trạng thái' }]}><Select options={stateOptions} disabled={!editingExam} /></Form.Item>
      </Form>
    </Modal>
    <Modal title={editingVariant ? 'Sửa mã đề' : 'Tạo mã đề'} open={variantOpen} onCancel={() => setVariantOpen(false)} onOk={() => variantForm.submit()} confirmLoading={saving} width={800} destroyOnHidden>
      {variantFormError && <Alert type="error" showIcon title={variantFormError} className="page-alert" />}
      <Form form={variantForm} layout="vertical" onFinish={saveVariant}>
        <Form.Item name="code" label="Mã đề" rules={[{ required: true, whitespace: true, message: 'Nhập mã đề' }]}><Input /></Form.Item>
        <Form.Item name="questionIds" label="Chọn câu thủ công"><Select mode="multiple" showSearch={{ optionFilterProp: 'label' }} options={questions.map((q) => ({ value: q.id, label: `#${q.id} ${q.content}` }))} /></Form.Item>
        <Typography.Paragraph>Đã chọn {chosenQuestionIds.length} câu thủ công + {randomRules.reduce((sum, rule) => sum + (Number(rule?.count) || 0), 0)} câu ngẫu nhiên / {selectedExam?.numberOfQuestions} câu. Tổng điểm cấu hình: {selectedExam?.maximmumMark}.</Typography.Paragraph>
        <Typography.Text>Chọn ngẫu nhiên theo mức độ; để trống mức độ để lấy từ toàn bộ môn. Tổng số câu thủ công và ngẫu nhiên phải bằng {selectedExam?.numberOfQuestions}.</Typography.Text>
        <Form.List name="randomSelections">{(fields, { add, remove }) => <>
          {fields.map((field) => <Space key={field.key} align="baseline">
            <Form.Item {...field} name={[field.name, 'questionLevelId']} label="Mức độ"><Select allowClear style={{ minWidth: 160 }} options={levelOptions} /></Form.Item>
            <Form.Item {...field} name={[field.name, 'count']} label="Số câu" rules={[{ required: true, message: 'Nhập số câu' }]}><InputNumber min={1} precision={0} /></Form.Item>
            <Button icon={<DeleteOutlined />} onClick={() => remove(field.name)}>Bỏ</Button>
          </Space>)}
          <Button icon={<PlusOutlined />} onClick={() => add()}>Thêm nhóm ngẫu nhiên</Button>
        </>}</Form.List>
        <Form.Item name="status" label="Trạng thái" rules={[{ required: true, message: 'Chọn trạng thái' }]}><Select options={stateOptions} /></Form.Item>
      </Form>
    </Modal>
  </section>
}
