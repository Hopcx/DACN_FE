import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Alert, Button, Col, Empty, Form, InputNumber, Popconfirm, Radio, Row, Select, Space, Table, Typography } from 'antd'
import { DeleteOutlined, EyeOutlined, PlayCircleOutlined, RedoOutlined, ReloadOutlined, RocketOutlined } from '@ant-design/icons'
import PageHeader from '../../components/ui/PageHeader'
import PageCard from '../../components/ui/PageCard'
import StatusTag from '../../components/ui/StatusTag'
import { getApiError } from '../../api/response'
import { abandonPractice, createPractice, getMyPractice, getPracticeOptions, retryPractice } from '../../services/practiceService'
import { asUtc, buildCreateBody, DEFAULT_COUNT, maxSelectable, MODE_LABELS, practiceErrorMessage, resultLabel, STATE_LABELS } from '../../services/practiceView'
import { formatScheduleTime } from '../../services/scheduleTime'

const withCount = (items) => (items || []).map((x) => ({ value: x.id, label: `${x.name} (${x.questionCount} câu)` }))

// To-be T7: Luyện tập — tạo phiên theo tiêu chí và lịch sử phiên (tách khỏi "Bài đã làm" của bài thi).
export default function PracticePage() {
  const navigate = useNavigate()
  const [form] = Form.useForm()
  const [options, setOptions] = useState(null)
  const [optionsError, setOptionsError] = useState('')
  const [history, setHistory] = useState(null)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const subjectId = Form.useWatch('subjectId', form)
  const chapterIds = Form.useWatch('chapterIds', form)
  const questionLevelIds = Form.useWatch('questionLevelIds', form)
  const tagIds = Form.useWatch('tagIds', form)

  const loadOptions = useCallback(async () => {
    setOptionsError('')
    try { setOptions(await getPracticeOptions()) } catch (failure) { setOptionsError(getApiError(failure)) }
  }, [])
  const loadHistory = useCallback(async () => {
    setLoading(true)
    try { setHistory(await getMyPractice(page, 10)) } catch (failure) { setError(getApiError(failure)) }
    finally { setLoading(false) }
  }, [page])
  useEffect(() => { loadOptions() }, [loadOptions])
  useEffect(() => { loadHistory() }, [loadHistory])

  const subjects = useMemo(() => options?.subjects || [], [options])
  const subject = subjects.find((x) => x.id === subjectId)
  const limit = maxSelectable(subject, { chapterIds, questionLevelIds, tagIds })
  // Số câu không vượt cận trên khi đổi môn/bộ lọc (giữ lựa chọn của người dùng nếu vẫn hợp lệ)
  useEffect(() => {
    const count = form.getFieldValue('questionCount')
    if (subject && limit > 0 && count == null) form.setFieldValue('questionCount', Math.min(DEFAULT_COUNT, limit))
    else if (subject && limit > 0 && count > limit) form.setFieldValue('questionCount', limit)
  }, [form, subject, limit])

  async function start(values) {
    setBusy(true); setError('')
    try {
      const created = await createPractice(buildCreateBody(values))
      navigate(`/student/practice/${created.id}`)
    } catch (failure) { setError(practiceErrorMessage(failure)) }
    finally { setBusy(false) }
  }

  async function act(action, row) {
    setBusy(true); setError('')
    try {
      if (action === 'retry') { const created = await retryPractice(row.id); navigate(`/student/practice/${created.id}`); return }
      await abandonPractice(row.id)
      if ((history?.items || []).length === 1 && page > 1) setPage(page - 1)
      else await loadHistory()
    } catch (failure) { setError(practiceErrorMessage(failure)) }
    finally { setBusy(false) }
  }

  const noSubjects = options && subjects.length === 0
  return <section className="page-body">
    <PageHeader title="Luyện tập" description="Tự tạo bộ câu hỏi theo môn, chương, mức độ, tag và luyện không giới hạn thời gian." />
    {error && <Alert type="error" showIcon title={error} className="page-alert" closable onClose={() => setError('')} />}
    {optionsError && <Alert type="error" showIcon title={optionsError} className="page-alert"
      action={<Button size="small" onClick={loadOptions}>Thử lại</Button>} />}
    <PageCard>
      <h2 className="page-section-title">Tạo phiên luyện tập</h2>
      {noSubjects ? <Empty description="Bạn chưa tham gia lớp nào có môn để luyện tập." />
        : <Form form={form} layout="vertical" onFinish={start} disabled={!options || busy}
          initialValues={{ questionCount: DEFAULT_COUNT, revealMode: 'end' }}
          onValuesChange={(changed) => {
            if ('subjectId' in changed) form.setFieldsValue({ chapterIds: [], questionLevelIds: [], tagIds: [] })
          }}>
          <Row gutter={12}>
            <Col xs={24} md={12}>
              <Form.Item name="subjectId" label="Môn học" rules={[{ required: true, message: 'Chọn môn học' }]}>
                <Select placeholder="Chọn môn" aria-label="Môn luyện tập" options={withCount(subjects)} loading={!options}
                  showSearch={{ optionFilterProp: 'label' }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="chapterIds" label="Chương (không chọn = tất cả)">
                <Select mode="multiple" allowClear placeholder="Tất cả chương" aria-label="Chương luyện tập"
                  disabled={!subject} options={withCount(subject?.chapters)} maxTagCount="responsive" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="questionLevelIds" label="Mức độ (không chọn = tất cả)">
                <Select mode="multiple" allowClear placeholder="Tất cả mức độ" aria-label="Mức độ luyện tập"
                  disabled={!subject} options={withCount(subject?.levels)} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="tagIds" label="Tag (không chọn = tất cả)">
                <Select mode="multiple" allowClear placeholder="Tất cả tag" aria-label="Tag luyện tập"
                  disabled={!subject} options={withCount(subject?.tags)} maxTagCount="responsive" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="questionCount" label="Số câu" extra={subject ? `Tối đa khoảng ${limit} câu với bộ lọc hiện tại.` : undefined}
                rules={[{ required: true, message: 'Nhập số câu' }, {
                  validator: (_, value) => (!subject || value == null || value <= limit ? Promise.resolve()
                    : Promise.reject(new Error(`Bộ lọc hiện tại có tối đa ${limit} câu.`))),
                }]}>
                <InputNumber min={1} max={Math.max(1, limit || 50)} precision={0} className="w-full" aria-label="Số câu" />
              </Form.Item>
            </Col>
            <Col xs={24} md={16}>
              <Form.Item name="revealMode" label="Hiện đáp án">
                <Radio.Group aria-label="Chế độ hiện đáp án" options={[
                  { value: 'end', label: 'Cuối phiên (sau khi nộp bài)' },
                  { value: 'perQuestion', label: 'Từng câu (bấm “Kiểm tra câu này”)' },
                ]} />
              </Form.Item>
            </Col>
          </Row>
          <Button type="primary" htmlType="submit" icon={<RocketOutlined />} loading={busy} disabled={!subject || limit === 0}>
            Bắt đầu luyện tập
          </Button>
          {subject && limit === 0 && <Typography.Text type="secondary" className="ml-2">Không có câu nào khớp bộ lọc.</Typography.Text>}
        </Form>}
    </PageCard>
    <PageCard>
      <div className="page-toolbar">
        <h2 className="page-section-title mb-0">Lịch sử luyện tập</h2>
        <div className="page-toolbar__end">
          <Button icon={<ReloadOutlined />} onClick={loadHistory} loading={loading}>Làm mới</Button>
        </div>
      </div>
      <Table rowKey="id" size="middle" loading={loading} dataSource={history?.items || []} scroll={{ x: 900 }}
        locale={{ emptyText: 'Chưa có phiên luyện tập nào' }}
        pagination={{ current: page, pageSize: 10, total: history?.totalCount || 0, showSizeChanger: false, onChange: setPage,
          showTotal: (total) => `${total} phiên` }}
        columns={[
          { title: 'Môn học', dataIndex: 'subjectName', render: (value) => value || '—' },
          { title: 'Chế độ', dataIndex: 'revealMode', width: 120, render: (value) => MODE_LABELS[value] || value },
          { title: 'Trạng thái', dataIndex: 'state', width: 120,
            render: (value) => <StatusTag tone={value === 'finished' ? 'success' : 'info'}>{STATE_LABELS[value] || value}</StatusTag> },
          { title: 'Kết quả', key: 'result', width: 100, align: 'center', render: (_, row) => resultLabel(row) },
          { title: 'Tạo lúc', dataIndex: 'createdAtUtc', width: 160, render: (value) => formatScheduleTime(asUtc(value), 'utc') },
          { title: 'Nộp lúc', dataIndex: 'finishedAtUtc', width: 160, render: (value) => (value ? formatScheduleTime(asUtc(value), 'utc') : '—') },
          { title: 'Thao tác', key: 'actions', width: 260, render: (_, row) => row.state === 'inProgress'
            ? <Space wrap>
              <Button size="small" type="primary" icon={<PlayCircleOutlined />} onClick={() => navigate(`/student/practice/${row.id}`)}>Làm tiếp</Button>
              <Popconfirm title="Bỏ phiên này? Bài làm dở sẽ bị xóa." okText="Bỏ phiên" cancelText="Không" onConfirm={() => act('abandon', row)}>
                <Button size="small" danger icon={<DeleteOutlined />} disabled={busy}>Bỏ phiên</Button>
              </Popconfirm>
            </Space>
            : <Space wrap>
              <Button size="small" icon={<EyeOutlined />} onClick={() => navigate(`/student/practice/${row.id}`)}>Xem lại</Button>
              <Button size="small" icon={<RedoOutlined />} disabled={busy} onClick={() => act('retry', row)}>Làm lại bộ này</Button>
            </Space> },
        ]} />
    </PageCard>
  </section>
}
