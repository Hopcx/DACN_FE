import { useCallback, useEffect, useRef, useState } from 'react'
import { Alert, Button, Popover, Table, Typography } from 'antd'
import { ReloadOutlined } from '@ant-design/icons'
import StatusTag from '../../components/ui/StatusTag'
import { getApiError } from '../../api/response'
import { getTeacherClassAnalysis } from '../../services/classService'
import { rankingErrorMessage } from '../../services/classRanking'
import { formatPercent, hardEmptyText, rateTone, reportNotes, scopeText } from '../../services/classReport'

// To-be T12 (Q13b): báo cáo lớp — theo chương và câu hay sai. Tải khi mở tab; đổi lớp thì tạo lại (key).
export default function ClassReportTab({ classId }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const requestRef = useRef(0)

  const load = useCallback(async () => {
    const requestId = ++requestRef.current
    setLoading(true); setError('')
    try {
      const result = await getTeacherClassAnalysis(classId)
      if (requestId === requestRef.current) setData(result)
    } catch (failure) {
      if (requestId === requestRef.current) { setData(null); setError(rankingErrorMessage(failure, getApiError(failure))) }
    } finally {
      if (requestId === requestRef.current) setLoading(false)
    }
  }, [classId])
  useEffect(() => { load() }, [load])

  const t = data?.thresholds
  return <div className="class-report">
    {error && <Alert type="error" showIcon title={error} className="page-alert" />}
    <div className="page-toolbar">
      <span className="muted">{scopeText(data)}</span>
      <div className="page-toolbar__end">
        <Button icon={<ReloadOutlined />} onClick={load} loading={loading}>Tải lại</Button>
      </div>
    </div>
    {reportNotes(data).map((note) => <Alert key={note} type="info" showIcon title={note} className="page-alert" />)}

    <h3 className="page-section-title">Theo chương</h3>
    {t && <Typography.Paragraph type="secondary">
      Học viên “Yếu” ở một chương: tỉ lệ đúng dưới {t.weakBelow}% với ít nhất {t.minQuestions} câu của chương đó.
    </Typography.Paragraph>}
    <Table rowKey={(row) => row.chapterId ?? 'none'} size="small" pagination={false} loading={loading} dataSource={data?.chapters || []}
      scroll={{ x: 680 }} locale={{ emptyText: 'Chưa có dữ liệu bài thi được tính' }} columns={[
        { title: 'Chương', dataIndex: 'name', render: (value, row) => row.chapterId == null ? <span className="muted">Chưa gán chương</span>
          : <span><strong>{value}</strong>{row.hidden && <span className="muted"> (đã ẩn)</span>}</span> },
        { title: 'Số câu đã làm', dataIndex: 'total', width: 120, align: 'right' },
        { title: 'Tỉ lệ đúng', dataIndex: 'rate', width: 110, align: 'right',
          render: (value) => <StatusTag tone={rateTone(value, t)}>{formatPercent(value)}</StatusTag> },
        { title: 'Học viên có dữ liệu', dataIndex: 'studentCount', width: 150, align: 'right' },
        { title: 'Học viên "Yếu"', dataIndex: 'weakCount', width: 140, align: 'right', render: (value, row) => value === 0 ? '0'
          : <Popover title={`Học viên "Yếu" (${value})`} trigger="click" content={<ul className="class-report__weak">
            {row.weakStudents.map((s) => <li key={s.userId}>{s.fullName} <span className="muted">({s.userName})</span></li>)}
          </ul>}><Button size="small" type="link" danger aria-label={`Xem ${value} học viên Yếu`}>{value}</Button></Popover> },
      ]} />

    <h3 className="page-section-title mt-4">Câu hay sai</h3>
    {t && <Typography.Paragraph type="secondary">
      Tỉ lệ đúng dưới {t.hardBelow}% với ít nhất {t.hardMinAnswers} lượt (tính cả câu bỏ trống, như khi chấm điểm; tối đa {t.maxHardQuestions} câu).
      Đáp án nhiễu là đáp án sai (theo đề lúc thi) được chọn nhiều nhất. Chương theo phân loại lúc thi; nội dung câu theo ngân hàng hiện tại;
      không hiện đáp án đúng.
    </Typography.Paragraph>}
    <Table rowKey="questionId" size="small" pagination={false} loading={loading} dataSource={data?.hardQuestions || []}
      scroll={{ x: 900 }} locale={{ emptyText: hardEmptyText(data) }} columns={[
        { title: 'Mã câu', dataIndex: 'questionId', width: 80 },
        { title: 'Nội dung', dataIndex: 'content', render: (value, row) => <span className="class-report__content">{value}
          {row.hidden && <span className="muted"> (đã ẩn)</span>}</span> },
        { title: 'Chương', dataIndex: 'chapterName', width: 140, render: (value) => value || '—' },
        { title: 'Mức độ', dataIndex: 'level', width: 100, render: (value) => value || '—' },
        { title: 'Số lượt', dataIndex: 'answers', width: 80, align: 'right' },
        { title: 'Tỉ lệ đúng', dataIndex: 'rate', width: 100, align: 'right', render: (value) => <StatusTag tone="danger">{formatPercent(value)}</StatusTag> },
        { title: 'Đáp án nhiễu', dataIndex: 'distractor', width: 200, render: (value, row) => value
          ? <span>{value} <span className="muted">({row.distractorCount} lần)</span></span> : '—' },
      ]} />
  </div>
}
