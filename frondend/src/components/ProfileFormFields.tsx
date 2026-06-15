import { Form, Select } from 'antd'
import type { Profile } from '../domain'
import { activityLevelOptions } from '../profileOptions'
import { NumberWithUnitInput } from './NumberWithUnitInput'

/** 活动水平下拉弹层宽度。 */
const activityLevelPopupWidth = 360

/** 性别选项。 */
const genderOptions = [
  { label: '男', value: 'male' },
  { label: '女', value: 'female' },
]

/** 个人信息数字字段配置。 */
const profileNumberFields: Array<{
  label: string
  message: string
  name: Exclude<keyof Profile, 'gender'>
  precision: number
  unit: string
}> = [
  { label: '身高', message: '请输入身高', name: 'height', precision: 0, unit: 'cm' },
  { label: '体重', message: '请输入体重', name: 'weight', precision: 1, unit: 'kg' },
  { label: '年龄', message: '请输入年龄', name: 'age', precision: 0, unit: '岁' },
  { label: '当前体脂', message: '请输入当前体脂', name: 'bodyFat', precision: 1, unit: '%' },
  { label: '目标体脂', message: '请输入目标体脂', name: 'targetBodyFat', precision: 1, unit: '%' },
]

/** 个人信息表单字段。 */
export function ProfileFormFields({ className = 'modal-grid' }: { className?: string }) {
  return (
    <div className={className}>
      <Form.Item className="profile-form-field" label="性别" name="gender" rules={[{ required: true, message: '请选择性别' }]}>
        <Select options={genderOptions} placeholder="请选择性别" />
      </Form.Item>
      <Form.Item className="profile-form-field" label="活动水平" name="activityLevel" rules={[{ required: true, message: '请选择活动水平' }]}>
        <Select options={activityLevelOptions} placeholder="请选择活动水平" popupMatchSelectWidth={activityLevelPopupWidth} />
      </Form.Item>
      {profileNumberFields.map((field) => (
        <Form.Item
          className="profile-form-field"
          key={field.name}
          label={field.label}
          name={field.name}
          rules={[{ required: true, message: field.message }]}
        >
          <NumberWithUnitInput min={0} precision={field.precision} placeholder={field.label} unit={field.unit} />
        </Form.Item>
      ))}
    </div>
  )
}
