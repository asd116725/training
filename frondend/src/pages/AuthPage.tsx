import { useState } from 'react'
import { Button, Form, Input } from 'antd'
import { Dumbbell, KeyRound, LogIn, Phone, Ticket } from 'lucide-react'
import type { AuthLoginValues, AuthRegisterValues } from '../types'

/** 认证模式。 */
type AuthMode = 'login' | 'register'

/** 登录注册页属性。 */
interface AuthPageProps {
  checking?: boolean
  saving?: boolean
  onLogin: (values: AuthLoginValues) => Promise<void>
  onRegister: (values: AuthRegisterValues) => Promise<void>
}

/** 手机号校验规则。 */
const phoneRules = [
  { required: true, message: '请输入手机号' },
  { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' },
]

/** 密码校验规则。 */
const passwordRules = [
  { required: true, message: '请输入密码' },
  { min: 6, message: '密码至少 6 位' },
]

/** 首次进入登录注册页。 */
export function AuthPage({ checking = false, saving = false, onLogin, onRegister }: AuthPageProps) {
  const [form] = Form.useForm<AuthRegisterValues>()
  const [mode, setMode] = useState<AuthMode>('login')
  const isRegister = mode === 'register'

  /** 切换登录注册模式。 */
  const switchMode = (nextMode: AuthMode) => {
    setMode(nextMode)
    form.resetFields()
  }

  /** 提交登录或注册。 */
  const submitAuthForm = async (values: AuthRegisterValues) => {
    if (isRegister) {
      await onRegister(values)
      return
    }

    await onLogin({ phone: values.phone, password: values.password })
  }

  return (
    <main className="auth-shell">
      <section className="auth-card">
        <div className="auth-plate">
          <span>
            <Dumbbell size={34} />
          </span>
          <p>复古铁馆会员入口</p>
          <h1>碳训计划</h1>
          <small>登录后同步个人目标、五餐记录、碳循环配置与推荐提示词。</small>
        </div>

        <div className="auth-form-panel">
          <div className="auth-mode-switch">
            <button className={mode === 'login' ? 'is-active' : ''} type="button" onClick={() => switchMode('login')}>
              登录
            </button>
            <button className={isRegister ? 'is-active' : ''} type="button" onClick={() => switchMode('register')}>
              注册
            </button>
          </div>

          <Form form={form} layout="vertical" onFinish={submitAuthForm}>
            <Form.Item label="手机号" name="phone" rules={phoneRules}>
              <Input prefix={<Phone size={16} />} placeholder="请输入手机号" />
            </Form.Item>
            <Form.Item label="密码" name="password" rules={passwordRules}>
              <Input.Password prefix={<KeyRound size={16} />} placeholder="至少 6 位密码" />
            </Form.Item>
            {isRegister && (
              <Form.Item label="邀请码" name="inviteCode" rules={[{ required: true, message: '请输入邀请码' }]}>
                <Input prefix={<Ticket size={16} />} placeholder="请输入管理员提供的邀请码" />
              </Form.Item>
            )}
            <Button
              block
              className="auth-submit"
              disabled={checking}
              htmlType="submit"
              icon={<LogIn size={17} />}
              loading={saving || checking}
              type="primary"
            >
              {checking ? '正在校验登录态' : isRegister ? '注册并登录' : '登录使用'}
            </Button>
          </Form>
        </div>
      </section>
    </main>
  )
}
