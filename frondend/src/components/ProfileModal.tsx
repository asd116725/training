import { Form, Modal } from 'antd'
import type { FormInstance } from 'antd'
import type { Profile } from '../domain'
import { ProfileFormFields } from './ProfileFormFields'

/** 个人信息编辑弹窗组件。 */
export function ProfileModal({
  form,
  open,
  saving,
  onCancel,
  onSubmit,
}: {
  form: FormInstance<Profile>
  open: boolean
  saving: boolean
  onCancel: () => void
  onSubmit: () => void
}) {
  return (
    <Modal
      centered
      className="food-modal profile-modal"
      confirmLoading={saving}
      okText="保存个人信息"
      open={open}
      title="编辑个人信息"
      onCancel={onCancel}
      onOk={onSubmit}
    >
      <Form className="profile-modal-form" form={form} layout="vertical">
        <ProfileFormFields />
      </Form>
    </Modal>
  )
}
