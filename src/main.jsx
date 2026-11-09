import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ConfigProvider, theme } from 'antd'
import viVN from 'antd/locale/vi_VN'
import dayjs from 'dayjs'
import 'dayjs/locale/vi'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import AppProvider from './context/AppProvider'
import { store } from './redux/store'
import 'antd/dist/reset.css'
import './index.css'
import './pages/student.css'
import './notice.css'
import App from './App.jsx'

dayjs.locale('vi')

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ConfigProvider
      locale={viVN}
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: {
          colorPrimary: '#26a69a',
          colorInfo: '#26a69a',
          colorLink: '#26a69a',
          colorTextBase: '#16263a',
          colorBgLayout: '#f3f6fa',
          borderRadius: 10,
          fontFamily: "Inter, 'Segoe UI', Roboto, sans-serif",
        },
        components: {
          Table: { headerBg: '#f1f5f9', headerColor: '#334155', borderColor: '#e8edf3', rowHoverBg: '#f8fafc' },
          Button: { fontWeight: 500 },
          Modal: { titleFontSize: 18 },
        },
      }}
    >
      <Provider store={store}>
        <AppProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </AppProvider>
      </Provider>
    </ConfigProvider>
  </StrictMode>,
)
