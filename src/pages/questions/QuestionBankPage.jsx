import { useCallback, useEffect, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import { Alert, Button, Checkbox, Col, Form, Input, Modal, Popconfirm, Row, Select, Space, Table, Tag, Tooltip, Typography } from 'antd'
import { DeleteOutlined, DownloadOutlined, EditOutlined, EyeInvisibleOutlined, EyeOutlined, FileExcelOutlined,
  PlusOutlined, ReloadOutlined, UploadOutlined } from '@ant-design/icons'
import PageHeader from '../../components/ui/PageHeader'
import PageCard from '../../components/ui/PageCard'
import StatusTag from '../../components/ui/StatusTag'
import { LoadError, TableEmpty } from '../../components/ui/PageState'
import { getApiError, toLoadError } from '../../api/response'
import { createQuestion, createTag, deleteQuestion, downloadQuestionTemplate, getChapters, getQuestionLevels, getQuestions,
  getQuestionSubjects, getQuestionTypes, getTags, importQuestions, updateQuestion, exportQuestions } from '../../services/questionService'
import { chapterProblem, duplicateTagId, EXPLANATION_MAX, MAX_TAGS, metadataOptions, normalizeTagName, questionBody,
  restoreBody, tagKey, tagProblem, tagSummary } from '../../services/questionMetadata'
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
  // To-be T3: chương/tag tải kèm mục đã ẩn để hiển thị tên của câu đang gắn
  const [chapters, setChapters] = useState([])
  const [tags, setTags] = useState([])
  const [tagSearch, setTagSearch] = useState('')
  const [creatingTag, setCreatingTag] = useState(false)
  const requestRef = useRef(0)
  // Mỗi lần mở/đóng form là một phiên; kết quả tạo tag về muộn không ghi vào form của phiên khác
  const formSessionRef = useRef(0)

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

  const loadMetadata = useCallback(async () => {
    if (!allowed) return
    try {
      const [a, b] = await Promise.all([getChapters({ includeHidden: true }), getTags({ includeHidden: true })])
      setChapters(a); setTags(b)
    } catch (failure) { setError(getApiError(failure)) }
  }, [allowed])
  useEffect(() => { loadMetadata() }, [loadMetadata])

  function showForm(item) {
    formSessionRef.current += 1
    setEditing(item || null); setFormError(''); setTagSearch('')
    // Xóa trắng trước: form Thêm không mang theo môn/chương/tag của câu vừa sửa
    form.resetFields()
    form.setFieldsValue(item ? {
      ...item, explanation: item.explanation ?? '', tagIds: item.tagIds ?? [], chapterId: item.chapterId ?? undefined,
      answers: item.answers.map(({ content, isCorrect }) => ({ content, isCorrect })),
    } : { content: '', status: 1, explanation: '', tagIds: [], answers: defaultAnswers() })
    setOpen(true)
  }

  // Gõ tên tag chưa có → mục "Tạo tag"; 409 (trùng sau chuẩn hóa) → chọn tag có sẵn theo id
  async function pickTags(values) {
    const pending = values.find((x) => typeof x === 'string' && x.startsWith('new:'))
    if (!pending) { form.setFieldValue('tagIds', values); return }
    const rest = values.filter((x) => x !== pending)
    const name = normalizeTagName(pending.slice(4))
    const session = formSessionRef.current
    const current = () => session === formSessionRef.current
    // Bỏ giá trị tạm "new:…" khỏi form ngay; nút OK bị khóa đến khi tạo xong
    form.setFieldValue('tagIds', rest)
    setCreatingTag(true); setFormError('')
    try {
      const created = await createTag(name)
      setTags((old) => [...old, created])
      if (current()) form.setFieldValue('tagIds', [...new Set([...(form.getFieldValue('tagIds') || []), created.id])])
    } catch (failure) {
      const id = failure.response?.status === 409 ? duplicateTagId(failure.response?.data?.message) : null
      const existing = id && (await getTags({ includeHidden: true }).catch(() => null))
      if (existing) setTags(existing)
      const found = existing?.find((x) => x.id === id)
      if (!current()) return
      if (found?.status === 1) form.setFieldValue('tagIds', [...new Set([...(form.getFieldValue('tagIds') || []), id])])
      else { setFormError(found ? `Tag “${found.name}” đã bị ẩn hoặc ngừng dùng.` : getApiError(failure)) }
    } finally { setCreatingTag(false); setTagSearch('') }
  }

  async function save(values) {
    if (creatingTag) return
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
    const problem = chapterProblem(values.chapterId, chapters) || tagProblem(values.tagIds)
    if (problem) { setFormError(problem); return }
    setSaving(true); setFormError('')
    try {
      // PUT thay toàn bộ câu hỏi (contract To-be T2): questionBody luôn gửi documentPath, chapterId, explanation, tagIds
      const body = questionBody({ ...values, answers }, editing)
      if (editing) await updateQuestion(editing.id, body)
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

  // Bỏ ẩn: BE nhận lại toàn bộ câu hỏi với status 1 (câu đã ẩn luôn là câu chưa dùng trong đề).
  // restoreBody giữ chương/tag/lời giải; chương đã ẩn không gắn lại được nên bị bỏ và báo cho người dùng.
  async function restore(item) {
    setError(''); setImportNotice('')
    try {
      const { body, droppedChapter } = restoreBody(item, chapters)
      await updateQuestion(item.id, body)
      if (droppedChapter) setImportNotice('Đã hiện lại câu hỏi; chương cũ đã bị ẩn nên câu được bỏ chương.')
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
  const filtered = Boolean(filters.textSearch || filters.subjectId || filters.questionTypeId || filters.questionLevelId ||
    filters.chapterId || filters.tagIds?.length)
  const chaptersOf = (subjectId) => chapters.filter((x) => x.subjectId === subjectId)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name))
  const chapterName = (id) => chapters.find((x) => x.id === id)?.name
  // Tag: gõ tên chưa có (so theo khóa chuẩn hóa) thì thêm mục "Tạo tag" ở đầu danh sách
  const typedTag = normalizeTagName(tagSearch)
  const tagChoicesFor = (selected) => {
    const list = metadataOptions(tags, selected || [])
    if (typedTag && typedTag.length <= 50 && !tags.some((x) => tagKey(x.name) === tagKey(typedTag)))
      list.unshift({ value: `new:${typedTag}`, label: `Tạo tag “${typedTag}”` })
    return list
  }

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
          onChange={(subjectId) => changeExportFilter({ subjectId, chapterId: undefined })} />
        <Select allowClear placeholder="Mức độ" aria-label="Lọc theo mức độ" style={{ minWidth: 140 }} options={choices(levels)}
          onChange={(questionLevelId) => changeExportFilter({ questionLevelId })} />
        <Select allowClear placeholder="Loại" aria-label="Lọc theo loại câu hỏi" style={{ minWidth: 170 }}
          options={choices(types).filter((x) => x.value <= 3)}
          onChange={(questionTypeId) => changeExportFilter({ questionTypeId })} />
        <Select allowClear placeholder="Chương" aria-label="Lọc theo chương" style={{ minWidth: 170 }} popupMatchSelectWidth={false}
          disabled={!filters.subjectId} title={filters.subjectId ? undefined : 'Chọn môn học để lọc theo chương'}
          value={filters.chapterId} options={metadataOptions(chaptersOf(filters.subjectId), filters.chapterId)
            .map((x) => ({ ...x, disabled: false }))}
          onChange={(chapterId) => changeExportFilter({ chapterId })} />
        <Select mode="multiple" allowClear placeholder="Tag" aria-label="Lọc theo tag" style={{ minWidth: 180 }} maxTagCount="responsive"
          popupMatchSelectWidth={false} showSearch={{ optionFilterProp: 'label' }}
          options={metadataOptions(tags, filters.tagIds || []).map((x) => ({ ...x, disabled: false }))}
          onChange={(tagIds) => changeExportFilter({ tagIds: tagIds.length ? tagIds : undefined })} />
        <div className="page-toolbar__end">
          <Button icon={<ReloadOutlined />} onClick={load} loading={loading}>Tải lại</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => showForm(null)}>Thêm câu hỏi</Button>
        </div>
      </div>
      <Table rowKey="id" size="middle" loading={loading} dataSource={questions} scroll={{ x: 1440 }}
        pagination={{ current: currentPage, pageSize: 10, showSizeChanger: false, onChange: setPage, showTotal: showTotalLabel('câu hỏi') }}
        locale={{ emptyText: <TableEmpty error={Boolean(loadError)} errorLabel="Không tải được dữ liệu." filtered={filtered}
          emptyLabel="Chưa có câu hỏi" filteredLabel="Không có câu hỏi khớp bộ lọc" /> }} columns={[
          { title: 'STT', key: 'stt', width: 64, align: 'center', render: (_, __, index) => rowNumber(currentPage, 10, index) },
          { title: 'Nội dung câu hỏi', dataIndex: 'content', width: 320, ellipsis: { showTitle: true } },
          { title: 'Môn học', dataIndex: 'subjectId', width: 160, render: (id) => label(subjects, id) },
          { title: 'Chương', dataIndex: 'chapterId', width: 160, ellipsis: { showTitle: true },
            render: (id) => (id == null ? '—' : chapterName(id) ?? `#${id}`) },
          { title: 'Tag', dataIndex: 'tagIds', width: 200, render: (ids) => {
            const view = tagSummary(ids, tags)
            if (!view.all.length) return '—'
            return <Tooltip title={view.more ? view.all.join(', ') : undefined}><span>
              {view.shown.map((name) => <Tag key={name}>{name}</Tag>)}{view.more > 0 && <Tag>+{view.more}</Tag>}
            </span></Tooltip>
          } },
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
        Xuất theo môn, loại, mức độ đang lọc; không áp dụng ô tìm nội dung, chương và tag. Câu đã ẩn không được xuất.
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
      onCancel={() => { formSessionRef.current += 1; setOpen(false) }} onOk={() => form.submit()} confirmLoading={saving}
      okButtonProps={{ disabled: creatingTag }} width={760} destroyOnHidden>
      {formError && <Alert type="error" showIcon title={formError} className="page-alert" />}
      <Form form={form} layout="vertical" onFinish={save} onValuesChange={(changed) => {
        // Chương phụ thuộc môn: đổi môn thì bỏ chương
        if ('subjectId' in changed) form.setFieldValue('chapterId', undefined)
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
        <Row gutter={12}>
          {/* Chương/tag phụ thuộc giá trị form: render theo dependencies (tránh Form.useWatch khi modal chưa mở) */}
          <Form.Item noStyle dependencies={['subjectId', 'chapterId', 'tagIds']}>{({ getFieldValue }) => {
            const formSubjectId = getFieldValue('subjectId')
            const formChapterId = getFieldValue('chapterId')
            const formChapterProblem = chapterProblem(formChapterId, chapters)
            return <>
              <Col xs={24} md={10}>
                <Form.Item name="chapterId" label="Chương" validateStatus={formChapterProblem ? 'error' : undefined}
                  help={formChapterProblem || (formSubjectId ? undefined : 'Chọn môn học trước')}>
                  <Select allowClear placeholder="Không thuộc chương" disabled={!formSubjectId}
                    options={metadataOptions(chaptersOf(formSubjectId), formChapterId)} />
                </Form.Item>
              </Col>
              <Col xs={24} md={14}>
                <Form.Item name="tagIds" label={`Tag (tối đa ${MAX_TAGS})`} getValueProps={(value) => ({ value: value || [] })}>
                  <Select mode="multiple" placeholder="Tìm hoặc gõ tên để tạo tag" maxCount={MAX_TAGS} loading={creatingTag}
                    disabled={creatingTag} options={tagChoicesFor(getFieldValue('tagIds'))} onChange={pickTags} onBlur={() => setTagSearch('')}
                    showSearch={{
                      searchValue: tagSearch, onSearch: (value) => setTagSearch(value.slice(0, 50)),
                      filterOption: (input, option) => String(option.value).startsWith('new:') || tagKey(option.label).includes(tagKey(input)),
                    }} />
                </Form.Item>
              </Col>
            </>
          }}</Form.Item>
        </Row>
        <Form.Item name="content" label="Nội dung" rules={[{ required: true, whitespace: true, message: 'Nhập nội dung câu hỏi' }]}>
          <Input.TextArea rows={3} maxLength={4000} />
        </Form.Item>
        <Form.Item name="explanation" label="Lời giải (không bắt buộc)">
          <Input.TextArea rows={3} maxLength={EXPLANATION_MAX} showCount placeholder="Giải thích đáp án đúng" />
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
