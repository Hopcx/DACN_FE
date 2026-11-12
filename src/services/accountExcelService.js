import axiosClient from '../api/axiosClient'
import { downloadFile } from '../api/download'
import { readPayload } from '../api/response'

export const downloadAccountTemplate = () => downloadFile('/users/excel/template', { fileName: 'dacn-accounts-v1.xlsx' })
export const importAccounts = async (file, levelId) => {
  const data = new FormData()
  data.append('file', file)
  data.append('levelId', String(levelId))
  return readPayload(await axiosClient.post('/users/excel/import', data, { headers: { 'Content-Type': undefined } }))
}
export const exportAccounts = (levelId) => downloadFile('/users/excel/export', {
  params: levelId ? { levelId } : undefined, fileName: 'dacn-accounts.xlsx',
})
