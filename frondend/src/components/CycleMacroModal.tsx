import { Form, Modal } from 'antd'
import type { FormInstance } from 'antd'
import { NumberWithUnitInput } from './NumberWithUnitInput'

/** 每公斤体重宏量字段。 */
const macroPerKgFields = [
  { label: '碳水', name: 'carbsPerKg', unit: 'g/kg' },
  { label: '蛋白', name: 'proteinPerKg', unit: 'g/kg' },
  { label: '脂肪', name: 'fatPerKg', unit: 'g/kg' },
] as const

/** 宏量配置弹窗属性。 */
interface CycleMacroModalProps<T extends string> {
  dayLabels: Record<T, string>
  dayTypes: T[]
  form: FormInstance
  initialValues: Record<T, { carbsPerKg: number; proteinPerKg: number; fatPerKg: number }>
  open: boolean
  title: string
  onCancel: () => void
  onSubmit: () => void
}

/** 碳循环宏量配置弹窗组件。 */
export function CycleMacroModal({
  dayLabels,
  dayTypes,
  form,
  initialValues,
  open,
  title,
  onCancel,
  onSubmit,
}: CycleMacroModalProps<string>) {
  return (
    <Modal
      centered
      className="food-modal cycle-macro-modal"
      forceRender
      okText="保存配置"
      open={open}
      title={title}
      onCancel={onCancel}
      onOk={onSubmit}
    >
      <Form className="cycle-macro-form" form={form} initialValues={initialValues} layout="vertical">
        {dayTypes.map((dayType) => (
          <section className="cycle-macro-card" key={dayType}>
            <h3>{dayLabels[dayType]}</h3>
            <div className="modal-grid">
              {macroPerKgFields.map((field) => (
                <Form.Item
                  key={field.name}
                  label={`每公斤${field.label}`}
                  name={[dayType, field.name]}
                  rules={[{ required: true, message: `请输入每公斤${field.label}` }]}
                >
                  <NumberWithUnitInput min={0} precision={2} step={0.1} unit={field.unit} />
                </Form.Item>
              ))}
            </div>
          </section>
        ))}
      </Form>
    </Modal>
  )
}
