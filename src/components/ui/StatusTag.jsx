import { Tag } from 'antd'

const COLORS = { success: 'green', warning: 'orange', info: 'blue', danger: 'red' }

export default function StatusTag({ tone = 'default', children }) {
  return <Tag color={COLORS[tone] || 'default'} variant="filled">{children}</Tag>
}
