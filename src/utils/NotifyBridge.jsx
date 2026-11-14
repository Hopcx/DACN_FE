import { useEffect } from 'react'
import { App } from 'antd'
import { setNotifyApi } from './notify'

/** Gắn instance notification của <App> antd cho các hàm notify* (dùng ngoài component). */
export default function NotifyBridge() {
  const { notification } = App.useApp()
  useEffect(() => {
    setNotifyApi(notification)
    return () => setNotifyApi(null)
  }, [notification])
  return null
}
