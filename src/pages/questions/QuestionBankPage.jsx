import { useCallback, useEffect, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import { Alert, Button, Checkbox, Col, Form, Input, Modal, Popconfirm, Row, Select, Space, Table, Typography } from 'antd'
import { DeleteOutlined, DownloadOutlined, EditOutlined, EyeInvisibleOutlined, EyeOutlined, FileExcelOutlined,
  PlusOutlined, ReloadOutlined, UploadOutlined } from '@ant-design/icons'
import PageHeader from '../../components/ui/PageHeader'
import PageCard from '../../components/ui/PageCard'
import StatusTag from '../../components/ui/StatusTag'
import { LoadError, TableEmpty } from '../../components/ui/PageState'
import { getApiError, toLoadError } from '../../api/response'
import { createQuestion, deleteQuestion, downloadQuestionTemplate, getQuestionLevels, getQuestions, getQuestionSubjects,
  getQuestionTypes, importQuestions, updateQuestion, exportQuestions } from '../../services/questionService'
import { excelErrorMessage } from '../../services/excelFile'
import { clampPage, rowNumber, showTotalLabel, statusView } from '../../services/listView'

const defaultAnswers = () => [{ content: '', isCorrect: false }, { content: '', isCorrect: false }]
// Màu tag mức độ theo id (tên mức độ là dữ liệu)
const LEVEL_TONES = { 1: 'success', 2: 'info', 3: 'warning', 4: 'purple' }

export default function QuestionBankPage() {
  const user = useSelector((state) => state.auth.user)
  const allowed = String(user?.levelId) === '1' || (user?.permissions || []).some((id) => String(id) === '2')
  const [form] = Form.useForm()
  const [questions, setQuestions] = useState([])
  const [types, setTypes] = useState([])
  const [levels, setLevels] = useState([])
  const [subjects, setSubjects] = useState([])
  const [filters, setFilters] = useState({})
  const [page, setPage] = useState(1)
  const [editing, setEditing] = useState(null)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [formError, setFormError] = useState('')
  const [loadError, setLoadError] = useState(null)
  const [importFile, setImportFile] = useState(null)
  const [importErrors, setImportErrors] = useState([])
  const [importNotice, setImportNotice] = useState('')
  const [exportErrors, setExportErrors] = useState([])
  const [exporting, setExporting] = useState(false)
  const requestRef = useRef(0)

  const load = useCallback(async () => {
    if (!allowed) return
    const requestId = ++requestRef.current
    setLoading(true); setLoadError(null)
    try {
      const items = await getQuestions(filters)
      if (requestId === requestRef.current) setQuestions(items)
    } catch (failure) {
      if (requestId === requestRef.current) setLoadError(toLoadError(failure))
    } finally {
      if (requestId === requestRef.current) setLoading(false)
    }
  }, [allowed, filters])

  useEffect(() => { load() }, [load])
  useEffect(() => {
    if (!allowed) return
    Promise.all([getQuestionTypes(), getQuestionLevels(), getQuestionSubjects()])
      .then(([a, b, c]) => { setTypes(a); setLevels(b); setSubjects(c) })
      .catch((failure) => setError(getApiError(failure)))
  }, [allowed])

  function showForm(item) {
    setEditing(item || null); setFormError('')
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
      setFormError('Tập đáp án không hợp lệ cho loại câu hỏi. Cần nội dung khác nhau và số đáp án đúng phù hợp.')
      return
    }
    setSaving(true); setFormError('')
    try {
      const body = { ...values, content: values.content.trim(), answers }
      // PUT thay toàn bộ câu hỏi (contract 01-http.md): gửi lại documentPath để không bị xóa
      if (editing) await updateQuestion(editing.id, { ...body, documentPath: editing.documentPath ?? null })
      else await createQuestion(body)
      setOpen(false); await load()
    } catch (failure) { setFormError(getApiError(failure)) }
    finally { setSaving(false) }
  }

  async function remove(id) {
    setError('')
    try { await deleteQuestion(id); await load() }
    catch (failure) { setError(getApiError(failure)) }
  }

  // Bỏ ẩn: BE nhận lại toàn bộ câu hỏi với status 1 (câu đã ẩn luôn là câu chưa dùng trong đề)
  async function restore(item) {
    setError('')
    try {
      await updateQuestion(item.id, {
        subjectId: item.subjectId, questionTypeId: item.questionTypeId, questionLevelId: item.questionLevelId,
        content: item.content, status: 1, documentPath: item.documentPath ?? null,
        answers: item.answers.map(({ content, isCorrect }) => ({ content, isCorrect })),
      })
      await load()
    } catch (failure) { setError(getApiError(failure)) }
  }

  async function upload() {
    if (!importFile) return
    setSaving(true); setError(''); setImportErrors([]); setImportNotice('')
    try {
      const result = await importQuestions(importFile)
      setImportNotice(`Đã nhập ${result.imported} câu hỏi.`)
      setImportFile(null)
      await load()
    } catch (failure) {
      setError(getApiError(failure))
      setImportErrors(failure.response?.data?.data?.errors || [])
    } finally { setSaving(false) }
  }

  function changeExportFilter(patch) {
    setExportErrors([]); setPage(1); setFilters((old) => ({ ...old, ...patch }))
  }

  async function exportExcel() {
    if (!filters.subjectId || exporting) return
    setExporting(true); setError(''); setExportErrors([])
    try { await exportQuestions(filters) }
    catch (failure) {
      const errors = failure.response?.data?.data?.errors
      if (failure.response?.status === 409 && Array.isArray(errors)) {
        setError(failure.response.data.message); setExportErrors(errors)
      } else setError(excelErrorMessage(failure))
    } finally { setExporting(false) }
  }

  if (!allowed) return <Alert type="error" showIcon title="Bạn không có quyền quản lý câu hỏi." />
  const label = (items, id) => items.find((x) => x.id === id)?.name || id
  const choices = (items) => items.filter((x) => x.status === true || x.status === 1 || x.status == null)
    .map((x) => ({ value: x.id, label: x.name }))
  const currentPage = clampPage(page, 10, questions.length)
  const filtered = Boolean(filters.textSearch || filters.subjectId || filters.questionTypeId || filters.questionLevelId)

  return <section className="page-body">
    <PageHeader title="Ngân hàng câu hỏi" description="Quản lý, chỉnh sửa và sử dụng câu hỏi cho các bài thi." />
    <LoadError error={loadError} onRetry={load} retrying={loading} />
    {error && <Alert type="error" showIcon title={error} className="page-alert" />}
    {importNotice && <Alert type="success" showIcon title={importNotice} className="page-alert" />}
    <PageCard>
      <div className="page-toolbar">
        <Input.Search placeholder="Tìm theo nội dung câu hỏi" aria-label="Tìm câu hỏi" allowClear maxLength={200}
          onSearch={(textSearch) => { setPage(1); setFilters((old) => ({ ...old, textSearch: textSearch.trim() || undefined })) }} />
        {/* Smoke P4 chọn Select đầu tiên có chữ "Môn học": giữ placeholder và vị trí này */}
        <Select allowClear placeholder="Môn học" aria-label="Lọc theo môn học" style={{ minWidth: 200 }} popupMatchSelectWidth={false}
          showSearch={{ optionFilterProp: 'label' }} virtual={false} options={choices(subjects)}
          onChange={(subjectId) => changeExportFilter({ subjectId })} />
        <Select allowClear placeholder="Mức độ" aria-label="Lọc theo mức độ" style={{ minWidth: 140 }} options={choices(levels)}
          onChange={(questionLevelId) => changeExportFilter({ questionLevelId })} />
        <Select allowClear placeholder="Loại" aria-label="Lọc theo loại câu hỏi" style={{ minWidth: 170 }}
          options={choices(types).filter((x) => x.value <= 3)}
          onChange={(questionTypeId) => changeExportFilter({ questionTypeId })} />
        <div className="page-toolbar__end">
          <Button icon={<ReloadOutlined />} onClick={load} loading={loading}>Tải lại</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => showForm(null)}>Thêm câu hỏi</Button>
        </div>
      </div>
      <Table rowKey="id" size="middle" loading={loading} dataSource={questions} scroll={{ x: 1100 }}
        pagination={{ current: currentPage, pageSize: 10, showSizeChanger: false, onChange: setPage, showTotal: showTotalLabel('câu hỏi') }}
        locale={{ emptyText: <TableEmpty error={Boolean(loadError)} errorLabel="Không tải được dữ liệu." filtered={filtered}
          emptyLabel="Chưa có câu hỏi" filteredLabel="Không có câu hỏi khớp bộ lọc" /> }} columns={[
          { title: 'STT', key: 'stt', width: 64, align: 'center', render: (_, __, index) => rowNumber(currentPage, 10, index) },
          { title: 'Nội dung câu hỏi', dataIndex: 'content', width: 320, ellipsis: { showTitle: true } },
          { title: 'Môn học', dataIndex: 'subjectId', width: 160, render: (id) => label(subjects, id) },
          { title: 'Mức độ', dataIndex: 'questionLevelId', width: 120, render: (id) => id == null ? '—'
            : <StatusTag tone={LEVEL_TONES[id] || 'default'}>{label(levels, id)}</StatusTag> },
          { title: 'Dạng câu hỏi', dataIndex: 'questionTypeId', width: 170, render: (id) => label(types, id) },
          { title: 'Trạng thái', dataIndex: 'status', width: 140, render: (value) => {
            const view = statusView(value); return <StatusTag tone={view.tone}>{view.label}</StatusTag>
          } },
          { title: 'Đáp án', key: 'answers', width: 220, ellipsis: true,
            render: (_, item) => item.answers?.map((x) => `${x.content}${x.isCorrect ? ' ✓' : ''}`).join(' · ') },
          { title: 'Thao tác', key: 'actions', width: 170, render: (_, item) => item.isUsedInExam
            ? <StatusTag tone="info">Đã dùng trong đề</StatusTag>
            : <div className="page-actions">
              <Button size="small" icon={<EditOutlined />} onClick={() => showForm(item)}>Sửa</Button>
              {item.status !== 255
                ? <Popconfirm title="Ẩn câu hỏi này?" onConfirm={() => remove(item.id)}>
                  <Button size="small" danger icon={<EyeInvisibleOutlined />}>Ẩn</Button></Popconfirm>
                : <Popconfirm title="Hiển thị lại câu hỏi này?" onConfirm={() => restore(item)}>
                  <Button size="small" icon={<EyeOutlined />}>Hiện</Button></Popconfirm>}
            </div> },
        ]} />
    </PageCard>
    <PageCard>
      <h2 className="page-section-title">Nhập / xuất Excel</h2>
      <div className="page-toolbar">
        <Button icon={<DownloadOutlined />} onClick={() => downloadQuestionTemplate().catch((failure) => setError(getApiError(failure)))}>Tải mẫu Excel v1</Button>
        <input type="file" className="file-input" accept=".xlsx" aria-label="Chọn file câu hỏi Excel" onChange={(event) => {
          setImportFile(event.target.files?.[0] || null); setImportErrors([])
        }} />
        <Button type="primary" icon={<UploadOutlined />} disabled={!importFile} loading={saving} onClick={upload}>Nhập câu hỏi</Button>
        <Popconfirm title="File chứa đáp án đúng và việc xuất được ghi nhật ký. Tiếp tục?" okText="Tiếp tục" cancelText="Hủy"
          disabled={!filters.subjectId || exporting} onConfirm={exportExcel}>
          <Button icon={<FileExcelOutlined />} disabled={!filters.subjectId || exporting} loading={exporting}
            title={filters.subjectId ? undefined : 'Chọn môn học để xuất'}>Xuất Excel v1</Button>
        </Popconfirm>
      </div>
      <Typography.Text type="secondary" className="mb-4 block">
        Xuất theo môn, loại, mức độ đang lọc; không áp dụng ô tìm nội dung. Câu đã ẩn không được xuất.
      </Typography.Text>
      {importErrors.length > 0 && <Table rowKey={(_, index) => index} size="small" pagination={{ pageSize: 10 }}
        dataSource={importErrors} columns={[
          { title: 'Dòng', dataIndex: 'row' }, { title: 'Cột', dataIndex: 'column' },
          { title: 'Mã lỗi', dataIndex: 'code' }, { title: 'Chi tiết', dataIndex: 'message' },
        ]} />}
      {exportErrors.length > 0 && <>
        <Table rowKey={(_, index) => index} size="small" pagination={{ pageSize: 10 }}
          dataSource={exportErrors} columns={[
            { title: 'Câu hỏi', dataIndex: 'questionId', render: (id) => {
              const content = questions.find((item) => item.id === id)?.content
              return content ? `#${id} ${content.length > 80 ? `${content.slice(0, 80)}…` : content}` : `#${id}`
            } },
            { title: 'Mã lỗi', dataIndex: 'code' }, { title: 'Chi tiết', dataIndex: 'message' },
          ]} />
        <Button className="mb-4" onClick={() => setExportErrors([])}>Đóng danh sách lỗi</Button>
      </>}
    </PageCard>
    <Modal title={editing ? 'Sửa câu hỏi và đáp án' : 'Thêm câu hỏi và đáp án'} open={open}
      onCancel={() => setOpen(false)} onOk={() => form.submit()} confirmLoading={saving} width={760} destroyOnHidden>
      {formError && <Alert type="error" showIcon title={formError} className="page-alert" />}
      <Form form={form} layout="vertical" onFinish={save} onValuesChange={(changed) => {
        if (changed.questionTypeId === 1) form.setFieldValue('answers', [
          { content: 'Đúng', isCorrect: true }, { content: 'Sai', isCorrect: false },
        ])
      }}>
        <Row gutter={12}>
          <Col xs={24} md={10}>
            <Form.Item name="subjectId" label="Môn học" rules={[{ required: true, message: 'Chọn môn học' }]}>
              <Select showSearch={{ optionFilterProp: 'label' }} virtual={false} options={choices(subjects)} />
            </Form.Item>
          </Col>
          <Col xs={12} md={7}>
            <Form.Item name="questionLevelId" label="Mức độ"><Select allowClear options={choices(levels)} /></Form.Item>
          </Col>
          <Col xs={12} md={7}>
            <Form.Item name="status" label="Trạng thái">
              <Select options={[{ value: 1, label: 'Đang hoạt động' }, { value: 0, label: 'Ngừng hoạt động' }]} />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item name="questionTypeId" label="Loại câu hỏi" rules={[{ required: true, message: 'Chọn loại câu hỏi' }]}>
          <Select options={choices(types).filter((x) => x.value <= 3)} />
        </Form.Item>
        <Form.Item name="content" label="Nội dung" rules={[{ required: true, whitespace: true, message: 'Nhập nội dung câu hỏi' }]}>
          <Input.TextArea rows={3} maxLength={4000} />
        </Form.Item>
        <Typography.Title level={5}>Đáp án</Typography.Title>
        <Form.List name="answers">{(fields, { add, remove: removeAnswer }) => <>
          {fields.map(({ key, name }) => <Space key={key} align="baseline" className="flex mb-2">
            <Form.Item name={[name, 'content']} rules={[{ required: true, whitespace: true, message: 'Nhập nội dung đáp án' }]} className="grow mb-0">
              <Input placeholder="Nội dung đáp án" maxLength={2000} />
            </Form.Item>
            <Form.Item name={[name, 'isCorrect']} valuePropName="checked" className="mb-0"><Checkbox>Đúng</Checkbox></Form.Item>
            <Button danger icon={<DeleteOutlined />} onClick={() => removeAnswer(name)}>Xóa</Button>
          </Space>)}
          <Button icon={<PlusOutlined />} onClick={() => add({ content: '', isCorrect: false })}>Thêm đáp án</Button>
        </>}</Form.List>
      </Form>
    </Modal>
  </section>
}
