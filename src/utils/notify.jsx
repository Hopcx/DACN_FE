import { notification } from 'antd'
import { getApiError, getApiErrorDetails, getApiErrorLevel } from '../api/response'

notification.config({ placement: 'top', duration: 6, maxCount: 3 })

const TITLES = {
  warning: 'Cảnh báo',
  error: 'Có lỗi xảy ra',
  success: 'Thành công',
  info: 'Thông báo',
}

function open(level, description, title) {
  notification[level]({
    title: title || TITLES[level],
    description,
    className: `notice notice--${level}`,
    showProgress: true,
    pauseOnHover: true,
  })
}

/** Hộp thông báo: vàng = cảnh báo, đỏ = lỗi nghiêm trọng, xanh = thành công. */
export const notifyWarning = (description, title) => open('warning', description, title)
export const notifyError = (description, title) => open('error', description, title)
export const notifySuccess = (description, title) => open('success', description, title)
export const notifyInfo = (description, title) => open('info', description, title)

export function notifyApiError(error) {
  const level = getApiErrorLevel(error)
  const details = getApiErrorDetails(error)
  const message = getApiError(error)
  const description = details.length > 1
    ? <ul className="notice__list">{details.map((line) => <li key={line}>{line}</li>)}</ul>
    : message
  open(level, description)
  return message
}
