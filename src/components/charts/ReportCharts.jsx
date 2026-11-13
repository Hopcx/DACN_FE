import { Column, Pie } from '@ant-design/plots'
import { Empty } from 'antd'

// Tách riêng file để trang chỉ tải thư viện biểu đồ khi cần (React.lazy).
const CHART_COLORS = {
  submitted: '#0f9d8f', inProgress: '#2f6fed', timedOut: '#f59e0b', voided: '#ef4444',
  passed: '#0f9d8f', failed: '#cbd5e1',
}

// Trục số lượt chỉ hiện số nguyên.
const countAxis = (title) => ({ title, labelFormatter: (value) => (Number.isInteger(Number(value)) ? value : '') })

// Nhãn đỉnh cột: cách đỉnh 6px, không bị cắt (chừa khoảng trống 20% phía trên trục y).
const TOP_LABEL_STYLE = { dy: -6, textBaseline: 'bottom', fontWeight: 600 }
const headroom = (values) => {
  const max = Math.max(0, ...values.map(Number).filter(Number.isFinite))
  return max > 0 ? Math.ceil(max * 1.2) : 1
}

const noData = <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có dữ liệu" />

/** Biểu đồ cột: [{ label, value, key }] — mỗi cột một màu theo key. */
export function StatusColumnChart({ data, height = 260 }) {
  if (!data?.some((item) => item.value > 0)) return noData
  return <Column data={data} xField="label" yField="value" colorField="key" height={height}
    scale={{
      color: { domain: data.map((item) => item.key), range: data.map((item) => CHART_COLORS[item.key] || '#2f6fed') },
      y: { domainMin: 0, domainMax: headroom(data.map((item) => item.value)) },
    }}
    legend={false} axis={{ y: countAxis(false), x: { title: false } }}
    label={{ text: 'value', position: 'top', style: TOP_LABEL_STYLE }}
    style={{ radiusTopLeft: 6, radiusTopRight: 6, maxWidth: 56 }}
    tooltip={{ items: [{ channel: 'y', name: 'Số lượt' }] }} />
}

/** Biểu đồ vành khuyên đạt / không đạt, số đạt ở giữa. */
export function PassDonutChart({ passed, failed, height = 260 }) {
  if (!passed && !failed) return noData
  const data = [{ type: 'Đạt', value: passed, key: 'passed' }, { type: 'Không đạt', value: failed, key: 'failed' }]
  return <Pie data={data} angleField="value" colorField="type" innerRadius={0.68} radius={0.9} height={height}
    scale={{ color: { domain: ['Đạt', 'Không đạt'], range: [CHART_COLORS.passed, CHART_COLORS.failed] } }}
    label={false} legend={{ color: { position: 'right', layout: { justifyContent: 'center' } } }}
    tooltip={{ items: [{ channel: 'y', name: 'Số lượt' }] }}
    annotations={[{ type: 'text', style: { text: `${passed}\nlượt đạt`, x: '50%', y: '50%',
      textAlign: 'center', fontSize: 18, fontWeight: 700, fill: '#0f2a44' } }]} />
}

/** Phổ điểm: [{ label, count }] cho một tập lượt. */
export function DistributionChart({ data, height = 240, xTitle = 'Điểm' }) {
  if (!data?.some((item) => item.count > 0)) return noData
  return <Column data={data} xField="label" yField="count" height={height}
    style={{ fill: '#2f6fed', radiusTopLeft: 4, radiusTopRight: 4, maxWidth: 40 }}
    axis={{ x: { title: xTitle }, y: countAxis('Số lượt') }}
    scale={{ y: { domainMin: 0, domainMax: headroom(data.map((item) => item.count)) } }}
    label={{ text: (item) => (item.count ? item.count : ''), position: 'top', style: TOP_LABEL_STYLE }}
    tooltip={{ items: [{ channel: 'y', name: 'Số lượt' }] }} />
}

/** Phổ điểm nhiều nhóm (thang 10): cột nhóm theo khoảng điểm, màu theo tên nhóm. */
export function GroupedDistributionChart({ groups, height = 300 }) {
  const data = (groups || []).flatMap((group) => group.buckets.map((bucket) =>
    ({ label: bucket.label, count: bucket.count, group: group.name })))
  if (!data.some((item) => item.count > 0)) return noData
  return <Column data={data} xField="label" yField="count" colorField="group" group height={height}
    axis={{ x: { title: 'Khoảng điểm (thang 10)' }, y: countAxis('Số lượt') }}
    style={{ radiusTopLeft: 3, radiusTopRight: 3 }}
    legend={{ color: { position: 'top' } }} />
}
