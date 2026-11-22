import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Alert, Button, Empty, Select, Space, Table, Typography } from 'antd'
import { ExperimentOutlined, ReloadOutlined } from '@ant-design/icons'
import PageHeader from '../../components/ui/PageHeader'
import PageCard from '../../components/ui/PageCard'
import StatusTag from '../../components/ui/StatusTag'
import { getApiError } from '../../api/response'
import { getMyAnalysis } from '../../services/analysisService'
import { dataNotes, formatRate, levelView, practiceLink, thresholdText } from '../../services/analysisView'

const DAY_OPTIONS = [30, 90, 180, 365].map((value) => ({ value, label: `${value} ngày gần nhất` }))

// To-be T11 (Q13a): phân tích riêng của học viên theo chương/tag — bài thi đã công bố + luyện tập + thi thử.
export default function StudentAnalysisPage() {
  const [subjectId, setSubjectId] = useState(undefined)
  const [days, setDays] = useState(90)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const requestRef = useRef(0)

  const load = useCallback(async () => {
    const requestId = ++requestRef.current
    setLoading(true); setError('')
    try {
      const result = await getMyAnalysis({ subjectId, days })
      if (requestId === requestRef.current) setData(result)
    } catch (failure) {
      // Review T11: lỗi thì bỏ số liệu cũ nhưng giữ danh sách môn để vẫn đổi môn/khoảng ngày được
      if (requestId === requestRef.current) {
        setData((previous) => previous ? { subjects: previous.subjects, subjectId: previous.subjectId } : null)
        setError(getApiError(failure))
      }
    } finally {
      if (requestId === requestRef.current) setLoading(false)
    }
  }, [subjectId, days])
  useEffect(() => { load() }, [load])

  const selected = data?.subjectId
  // Môn đã chọn có thể hết dữ liệu khi đổi khoảng ngày: không hiện id trần trong ô chọn
  const selectedKnown = (data?.subjects || []).some((x) => x.id === selected)
  const columns = (key) => [
    { title: key === 'chapter' ? 'Chương' : 'Tag', dataIndex: 'name', render: (value, row) => <span>
      <strong>{value}</strong>{row.hidden && <span className="muted"> (đã ẩn)</span>}</span> },
    { title: 'Số câu', key: 'total', width: 90, align: 'right', render: (_, row) => row.stats.total },
    { title: 'Đúng', key: 'correct', width: 80, align: 'right', render: (_, row) => row.stats.correct },
    { title: 'Tỉ lệ đúng', key: 'rate', width: 110, align: 'right', render: (_, row) => formatRate(row.stats.rate) },
    { title: 'Xếp loại', key: 'level', width: 150, render: (_, row) => {
      const view = levelView(row.stats.level)
      return <StatusTag tone={view.tone}>{view.label}</StatusTag>
    } },
    { title: '', key: 'practice', width: 170, render: (_, row) => {
      const to = practiceLink(selected, { [key === 'chapter' ? 'chapterId' : 'tagId']: row[`${key}Id`], hidden: row.hidden })
      return to ? <Link to={to}><Button size="small" icon={<ExperimentOutlined />}>Luyện tập {key === 'chapter' ? 'chương' : 'tag'} này</Button></Link> : null
    } },
  ]

  const totalsView = data?.totals ? levelView(data.totals.level) : null
  return <section className="page-body">
    <PageHeader title="Phân tích của tôi"
      description="Tỉ lệ đúng theo chương và tag, gồm bài thi đã được công bố kết quả, luyện tập và thi thử của bạn. Chỉ bạn xem được." />
    {error && <Alert type="error" showIcon title={error} className="page-alert" />}
    <PageCard>
      <div className="page-toolbar">
        <Space wrap>
          <Select aria-label="Môn phân tích" style={{ minWidth: 240 }} placeholder="Chọn môn" value={selectedKnown ? selected : undefined}
            onChange={setSubjectId} options={(data?.subjects || []).map((x) => ({ value: x.id, label: `${x.name} (${x.questionCount} câu)` }))} />
          <Select aria-label="Khoảng thời gian" style={{ minWidth: 170 }} value={days} onChange={setDays} options={DAY_OPTIONS} />
        </Space>
        <div className="page-toolbar__end">
          <Button icon={<ReloadOutlined />} onClick={load} loading={loading}>Tải lại</Button>
        </div>
      </div>
      {!loading && !error && data && !data.totals
        ? <Empty description={selected && !selectedKnown ? 'Môn đã chọn không có dữ liệu trong khoảng thời gian này. Hãy chọn môn khác hoặc mở rộng khoảng ngày.'
          : 'Chưa có dữ liệu trong khoảng thời gian này. Hãy luyện tập hoặc chờ bài thi được công bố kết quả.'} />
        : data?.totals && <div className="student-analysis">
          <Typography.Paragraph className="student-analysis__summary">
            Tổng: <strong>{data.totals.correct}/{data.totals.total}</strong> câu đúng ({formatRate(data.totals.rate)})
            {totalsView && <> · <StatusTag tone={totalsView.tone}>{totalsView.label}</StatusTag></>}
            <span className="muted"> · Bài thi {data.bySource.exam} · Luyện tập {data.bySource.practice} · Thi thử {data.bySource.mock} câu</span>
          </Typography.Paragraph>
          <Typography.Paragraph type="secondary">{thresholdText(data.thresholds)}</Typography.Paragraph>
          {dataNotes(data).map((note) => <Alert key={note} type="info" showIcon title={note} className="page-alert" />)}
          <h2 className="page-section-title">Theo chương</h2>
          <Table rowKey="chapterId" size="small" pagination={false} loading={loading} dataSource={data.chapters}
            columns={columns('chapter')} scroll={{ x: 760 }} locale={{ emptyText: 'Chưa có câu nào được gán chương' }} />
          <h2 className="page-section-title mt-4">Theo tag</h2>
          <Table rowKey="tagId" size="small" pagination={false} loading={loading} dataSource={data.tags}
            columns={columns('tag')} scroll={{ x: 760 }} locale={{ emptyText: 'Chưa có câu nào được gắn tag' }} />
        </div>}
    </PageCard>
  </section>
}
