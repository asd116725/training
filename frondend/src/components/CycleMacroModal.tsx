import { Form, Modal } from 'antd'
import type { FormInstance } from 'antd'
import { cycleLabels, defaultCycleMacroSettings, type CycleMacroSettings, type CycleType } from '../domain'
import { NumberWithUnitInput } from './NumberWithUnitInput'

/** 碳循环日顺序。 */
const cycleTypes: CycleType[] = ['high', 'medium', 'low']

/** 每公斤体重宏量字段。 */
const macroPerKgFields = [
  { label: '碳水', name: 'carbsPerKg', unit: 'g/kg' },
  { label: '蛋白', name: 'proteinPerKg', unit: 'g/kg' },
  { label: '脂肪', name: 'fatPerKg', unit: 'g/kg' },
] as const

/** 碳循环宏量配置弹窗组件。 */
export function CycleMacroModal({
  form,
  open,
  onCancel,
  onSubmit,
}: {
  form: FormInstance<CycleMacroSettings>
  open: boolean
  onCancel: () => void
  onSubmit: () => void
}) {
  return (
    <Modal
      centered
      className="food-modal cycle-macro-modal"
      forceRender
      okText="保存配置"
      open={open}
      title="编辑碳循环目标"
      onCancel={onCancel}
      onOk={onSubmit}
    >
      <Form className="cycle-macro-form" form={form} initialValues={defaultCycleMacroSettings} layout="vertical">
        {cycleTypes.map((cycleType) => (
          <section className="cycle-macro-card" key={cycleType}>
            <h3>{cycleLabels[cycleType]}</h3>
            <div className="modal-grid">
              {macroPerKgFields.map((field) => (
                <Form.Item
                  key={field.name}
                  label={`每公斤${field.label}`}
                  name={[cycleType, field.name]}
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
