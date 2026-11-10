import { lazy, Suspense } from 'react'
import { Spin } from 'antd'

const load = (name) => lazy(() => import('./ReportCharts').then((module) => ({ default: module[name] })))
const LazyStatus = load('StatusColumnChart')
const LazyDonut = load('PassDonutChart')
const LazyDistribution = load('DistributionChart')
const LazyGrouped = load('GroupedDistributionChart')

const fallback = <div className="chart-loading"><Spin /></div>
const wrap = (Component) => function ChartWithSuspense(props) {
  return <Suspense fallback={fallback}><Component {...props} /></Suspense>
}

// Thư viện biểu đồ chỉ được tải khi trang có biểu đồ hiển thị.
export const StatusColumnChart = wrap(LazyStatus)
export const PassDonutChart = wrap(LazyDonut)
export const DistributionChart = wrap(LazyDistribution)
export const GroupedDistributionChart = wrap(LazyGrouped)
