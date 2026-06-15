import { Button, Form } from 'antd'
import { Check, LogOut, Target, UserRound } from 'lucide-react'
import type { Profile } from '../domain'
import { ProfileFormFields } from '../components/ProfileFormFields'

/** 个人信息初始化页属性。 */
interface ProfileSetupPageProps {
  checking?: boolean
  saving?: boolean
  userPhone: string
  onLogout: () => void
  onSubmit: (values: Profile) => Promise<void>
}

/** 新用户首次完善个人档案页。 */
export function ProfileSetupPage({
  checking = false,
  saving = false,
  userPhone,
  onLogout,
  onSubmit,
}: ProfileSetupPageProps) {
  const [form] = Form.useForm<Profile>()

  return (
    <main className="profile-setup-shell">
      <section className="profile-setup-card">
        <div className="profile-setup-hero">
          <span>
            <Target size={34} />
          </span>
          <p>首次建档</p>
          <h1>先建立你的训练档案</h1>
          <small>保存真实身高、体重、体脂与训练频率后，再进入今日热量表和五餐记录。</small>
          <div className="profile-setup-user">
            <UserRound size={17} />
            <strong>{userPhone}</strong>
            <button type="button" onClick={onLogout}>
              <LogOut size={15} />
              退出
            </button>
          </div>
        </div>

        <div className="profile-setup-form-panel">
          <div className="profile-setup-form-title">
            <p>个人目标</p>
            <span>{checking ? '正在读取档案状态' : '所有字段均需填写'}</span>
          </div>
          <Form className="profile-setup-form" disabled={checking} form={form} layout="vertical" onFinish={onSubmit}>
            <ProfileFormFields className="profile-setup-grid" />
            <Button
              block
              className="auth-submit profile-setup-submit"
              disabled={checking}
              htmlType="submit"
              icon={<Check size={17} />}
              loading={saving || checking}
              type="primary"
            >
              {checking ? '正在检查档案' : '保存并进入今日计划'}
            </Button>
          </Form>
        </div>
      </section>
    </main>
  )
}
