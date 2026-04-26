import { Button, Card, Space, Tag, Typography } from 'antd'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { APP_NAME, ROUTES } from '../data/constants'
import { setStatus } from '../redux/slices/appSlice'

export default function HomePage() {
  const status = useSelector((s) => s.app.status)
  const dispatch = useDispatch()
  const navigate = useNavigate()

  return (
    <section className="page home-page mx-auto flex min-h-[calc(100vh-88px)] max-w-6xl items-center px-5 py-10">
      <div className="grid w-full gap-6 lg:grid-cols-[minmax(0,1.2fr)_380px]">
        <div className="space-y-6">
          <Space wrap>
            <Tag color="blue">Vite</Tag>
            <Tag color="cyan">Tailwind CSS 4</Tag>
            <Tag color="geekblue">Ant Design 6</Tag>
            <Tag color="purple">Redux Toolkit</Tag>
          </Space>

          <div className="space-y-3">
            <Typography.Title level={1} className="!mb-0 !text-4xl !font-semibold !text-slate-900 md:!text-5xl">
              {APP_NAME}
            </Typography.Title>
            <Typography.Paragraph className="!mb-0 max-w-2xl !text-base !leading-7 !text-slate-600">
              Project hiện đã được cấu hình để dùng song song Tailwind cho layout tiện dụng,
              Ant Design cho component UI, và Redux Toolkit cho state toàn cục.
            </Typography.Paragraph>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button type="primary" size="large" onClick={() => dispatch(setStatus('ready'))}>
              Cập nhật Redux state
            </Button>
            <Button size="large" onClick={() => navigate(ROUTES.login)}>
              Đăng nhập
            </Button>
            <Button size="large" type="default" onClick={() => navigate(ROUTES.register)}>
              Đăng ký
            </Button>
          </div>
        </div>

        <Card className="border-0 shadow-sm">
          <div className="space-y-4">
            <div>
              <Typography.Text strong>Redux status</Typography.Text>
              <p className="home-page__meta mt-2 rounded-lg bg-slate-100 px-3 py-2 font-medium text-slate-700">
                {status}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              <div className="rounded-lg border border-slate-200 bg-white p-4">
                <p className="mb-1 text-sm font-medium text-slate-900">Tailwind</p>
                <p className="mb-0 text-sm text-slate-500">
                  Utility classes cho spacing, grid, responsive.
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-4">
                <p className="mb-1 text-sm font-medium text-slate-900">Ant Design</p>
                <p className="mb-0 text-sm text-slate-500">
                  `ConfigProvider` và theme token đã được bật ở entry.
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-4">
                <p className="mb-1 text-sm font-medium text-slate-900">Redux Toolkit</p>
                <p className="mb-0 text-sm text-slate-500">
                  `Provider` dùng store hiện tại trong `src/redux/store.js`.
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </section>
  )
}
