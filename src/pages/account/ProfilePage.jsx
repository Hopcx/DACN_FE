import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Alert, Button, Form, Input } from 'antd'
import { LockOutlined, SaveOutlined } from '@ant-design/icons'
import { changePassword, getProfile, updateProfile } from '../../services/accountService'
import { logout } from '../../services/authService'
import { getApiError, toLoadError } from '../../api/response'
import { ROUTES } from '../../data/constants'
import PageHeader from '../../components/ui/PageHeader'
import PageCard from '../../components/ui/PageCard'
import { LoadError, PageLoading } from '../../components/ui/PageState'

export default function ProfilePage() {
  const navigate = useNavigate()
  const [passwordForm] = Form.useForm()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [profileError, setProfileError] = useState('')
  const [profileMessage, setProfileMessage] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)

  const loadProfile = useCallback(async () => {
    setLoading(true); setLoadError(null)
    try { setProfile(await getProfile()) }
    catch (failure) { setLoadError(toLoadError(failure)) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { loadProfile() }, [loadProfile])

  async function saveProfile(values) {
    setSavingProfile(true); setProfileError(''); setProfileMessage('')
    try {
      setProfile(await updateProfile({ fullName: values.fullName.trim(), address: values.address.trim() }))
      setProfileMessage('Đã cập nhật hồ sơ.')
    } catch (failure) { setProfileError(getApiError(failure)) }
    finally { setSavingProfile(false) }
  }

  async function savePassword(values) {
    setSavingPassword(true); setPasswordError('')
    try {
      await changePassword(values.oldPassword, values.newPassword)
      await logout()
      navigate(ROUTES.login, { replace: true })
    } catch (failure) { setPasswordError(getApiError(failure)) }
    finally { setSavingPassword(false) }
  }

  return <section className="page-body">
    <PageHeader title="Hồ sơ của tôi" description="Cập nhật thông tin cá nhân và mật khẩu." />
    <LoadError error={loadError} onRetry={loadProfile} retrying={loading} />
    {loading && !profile && <PageLoading label="Đang tải hồ sơ..." />}
    {profile && <div className="profile-grid">
      <PageCard>
        <h2 className="page-section-title">Thông tin cá nhân</h2>
        <div className="detail-meta">
          <span>Tên đăng nhập: <strong>{profile.userName}</strong></span>
          <span>Email: <strong>{profile.email}</strong></span>
        </div>
        {profileError && <Alert type="error" showIcon title={profileError} className="page-alert" />}
        {profileMessage && <Alert type="success" showIcon title={profileMessage} className="page-alert" />}
        <Form key={profile.id || profile.userName} layout="vertical" onFinish={saveProfile}
          initialValues={{ fullName: profile.fullName || '', address: profile.address || '' }}>
          <Form.Item name="fullName" label="Họ tên" rules={[
            { required: true, whitespace: true, message: 'Nhập họ tên' }, { max: 100, message: 'Họ tên tối đa 100 ký tự' }]}>
            <Input maxLength={100} />
          </Form.Item>
          <Form.Item name="address" label="Địa chỉ" rules={[
            { required: true, whitespace: true, message: 'Nhập địa chỉ' }, { max: 200, message: 'Địa chỉ tối đa 200 ký tự' }]}>
            <Input maxLength={200} />
          </Form.Item>
          <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={savingProfile}>Lưu hồ sơ</Button>
        </Form>
      </PageCard>
      <PageCard>
        <h2 className="page-section-title">Đổi mật khẩu</h2>
        {passwordError && <Alert type="error" showIcon title={passwordError} className="page-alert" />}
        <Form form={passwordForm} layout="vertical" onFinish={savePassword}>
          <Form.Item name="oldPassword" label="Mật khẩu cũ" rules={[{ required: true, message: 'Nhập mật khẩu cũ' }]}>
            <Input.Password autoComplete="current-password" />
          </Form.Item>
          {/* Khớp luật BE và trang đăng ký: ≥ 8 ký tự, có chữ hoa, chữ thường, chữ số, khác mật khẩu cũ */}
          <Form.Item name="newPassword" label="Mật khẩu mới" dependencies={['oldPassword']} rules={[
            { required: true, message: 'Nhập mật khẩu mới' }, { min: 8, message: 'Mật khẩu mới tối thiểu 8 ký tự' },
            { pattern: /(?=.*[A-Z])(?=.*[a-z])(?=.*\d)/, message: 'Mật khẩu phải có ít nhất một chữ hoa, một chữ thường và một chữ số.' },
            ({ getFieldValue }) => ({ validator: (_, value) => !value || value !== getFieldValue('oldPassword')
              ? Promise.resolve() : Promise.reject(new Error('Mật khẩu mới phải khác mật khẩu cũ.')) }),
          ]}>
            <Input.Password autoComplete="new-password" />
          </Form.Item>
          <Form.Item name="confirmPassword" label="Nhập lại mật khẩu mới" dependencies={['newPassword']} rules={[
            { required: true, message: 'Nhập lại mật khẩu mới' },
            ({ getFieldValue }) => ({ validator: (_, value) => !value || value === getFieldValue('newPassword')
              ? Promise.resolve() : Promise.reject(new Error('Mật khẩu xác nhận không khớp.')) }),
          ]}>
            <Input.Password autoComplete="new-password" />
          </Form.Item>
          <Button htmlType="submit" icon={<LockOutlined />} loading={savingPassword}>Đổi mật khẩu</Button>
        </Form>
      </PageCard>
    </div>}
  </section>
}
