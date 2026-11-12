import { useState } from 'react'
import { Alert, Button, Modal, Popconfirm, Select, Table } from 'antd'
import { importAccounts } from '../../services/accountExcelService'
import { checkXlsxFile, excelErrorMessage, excelIssues, issueRowLabel } from '../../services/excelFile'

const ROLE_OPTIONS = [{ value: 3, label: 'Giảng viên' }, { value: 4, label: 'Học viên' }]

export default function AccountExcelImportModal({ open, onClose, onImported }) {
  const [levelId, setLevelId] = useState(null)
  const [file, setFile] = useState(null)
  const [fileError, setFileError] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const [issues, setIssues] = useState([])

  const canSubmit = Boolean(levelId) && Boolean(file) && !fileError && !pending

  function chooseFile(event) {
    const chosen = event.target.files?.[0] || null
    setFile(chosen); setIssues([]); setError('')
    setFileError(chosen ? checkXlsxFile(chosen) : '')
  }

  async function submit() {
    if (!canSubmit) return
    setPending(true); setError(''); setIssues([])
    try {
      const result = await importAccounts(file, levelId)
      onImported(result)
    } catch (failure) {
      setError(excelErrorMessage(failure)); setIssues(excelIssues(failure))
    } finally { setPending(false) }
  }

  const close = () => { if (!pending) onClose() }

  return <Modal title="Nhập tài khoản từ Excel" open={open} onCancel={close} destroyOnHidden width={720}
    footer={<>
      <Button onClick={close} disabled={pending}>Đóng</Button>
      <Popconfirm title="Hệ thống sẽ tạo tài khoản và gửi email xác minh cho mọi dòng trong file. Tiếp tục?"
        okText="Tiếp tục" cancelText="Hủy" disabled={!canSubmit} onConfirm={submit}>
        <Button type="primary" disabled={!canSubmit} loading={pending}>Nhập tài khoản</Button>
      </Popconfirm>
    </>}>
    <p>Sheet <strong>Accounts</strong> gồm 8 cột đúng thứ tự: FullName, DateOfBirth (yyyy-MM-dd), Email,
      PhoneNumber (có thể trống), Address, Sex (1 nam / 0 nữ), UserName, Password. Tối đa 500 dòng, 2 MB.</p>
    <ul>
      <li>Có lỗi ở bất kỳ dòng nào thì không tài khoản nào được tạo.</li>
      <li>Mỗi tài khoản nhận email xác minh và phải xác minh trước khi đăng nhập.</li>
      <li>File chứa mật khẩu dạng rõ, hãy xóa file sau khi nhập.</li>
    </ul>
    <div className="page-toolbar">
      <Select placeholder="Vai trò cho cả file" aria-label="Vai trò cho cả file" style={{ minWidth: 200 }}
        options={ROLE_OPTIONS} value={levelId} onChange={setLevelId} disabled={pending} />
      <input type="file" accept=".xlsx" aria-label="Chọn file tài khoản Excel" onChange={chooseFile} disabled={pending} />
    </div>
    {fileError && <Alert type="error" showIcon title={fileError} className="page-alert" />}
    {error && <Alert type="error" showIcon title={error} className="page-alert" />}
    {issues.length > 0 && <Table rowKey={(_, index) => index} size="small" pagination={{ pageSize: 10 }}
      scroll={{ x: true }} dataSource={issues} columns={[
        { title: 'Dòng', dataIndex: 'row', render: issueRowLabel },
        { title: 'Cột', dataIndex: 'column' },
        { title: 'Mã lỗi', dataIndex: 'code' },
        { title: 'Chi tiết', dataIndex: 'message' },
      ]} />}
  </Modal>
}
