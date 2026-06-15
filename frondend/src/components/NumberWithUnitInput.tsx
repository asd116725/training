import { InputNumber, Space } from 'antd'
import type { InputNumberProps } from 'antd'

/** 数字单位输入组件属性。 */
interface NumberWithUnitInputProps {
  min: number
  precision: number
  placeholder?: string
  step?: number
  unit: string
  value?: InputNumberProps['value']
  onChange?: InputNumberProps['onChange']
}

/** 数字加单位的受控输入组件。 */
export function NumberWithUnitInput({
  min,
  onChange,
  placeholder,
  precision,
  step,
  unit,
  value,
}: NumberWithUnitInputProps) {
  return (
    <Space.Compact className="modal-number-control">
      <InputNumber min={min} precision={precision} placeholder={placeholder} step={step} value={value} onChange={onChange} />
      <span className="modal-unit-addon">{unit}</span>
    </Space.Compact>
  )
}
