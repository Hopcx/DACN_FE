import axiosClient from './axiosClient'
import { normalizeBlobError, saveBlob } from './blob'

export async function downloadFile(url, { params, fileName }) {
  try {
    const response = await axiosClient.get(url, { params, responseType: 'blob' })
    saveBlob(response.data, fileName)
  } catch (failure) {
    await normalizeBlobError(failure)
    throw failure
  }
}
