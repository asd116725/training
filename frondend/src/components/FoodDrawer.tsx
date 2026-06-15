import { Button, Drawer, Form, Input, InputNumber } from 'antd'
import type { FormInstance, InputNumberProps } from 'antd'
import { Check, Table2, X } from 'lucide-react'
import type { ChangeEventHandler } from 'react'
import { defaultFoodForm } from '../config'
import type { FoodEditorMode, FoodFormValues } from '../types'

/** 食材营养字段配置。 */
const foodNutritionFields: Array<{
  label: string
  mark: string
  message: string
  name: Exclude<keyof FoodFormValues, 'name' | 'remark'>
  note: string
  precision: number
  unit: string
}> = [
  { label: '碳水', mark: 'C', message: '请输入碳水', name: 'carbs', note: '主能量来源', precision: 1, unit: 'g' },
  { label: '蛋白', mark: 'P', message: '请输入蛋白', name: 'protein', note: '肌肉修复', precision: 1, unit: 'g' },
  { label: '脂肪', mark: 'F', message: '请输入脂肪', name: 'fat', note: '控制总摄入', precision: 1, unit: 'g' },
  { label: '热量', mark: 'K', message: '请输入热量', name: 'calories', note: '用于剩余热量计算', precision: 0, unit: 'kcal' },
]

/** 食材字段标签属性。 */
interface FoodFieldLabelProps {
  hint: string
  required?: boolean
  title: string
}

/** 食材名称输入属性。 */
interface FoodNameInputProps {
  id?: string
  value?: string
  onChange?: ChangeEventHandler<HTMLInputElement>
}

/** 食材数字输入属性。 */
interface FoodNumberInputProps {
  id?: string
  mark: string
  precision: number
  unit: string
  value?: InputNumberProps['value']
  onChange?: InputNumberProps['onChange']
}

/** 食材编辑抽屉组件。 */
export function FoodDrawer({
  form,
  mode,
  open,
  saving,
  onCancel,
  onSubmit,
}: {
  form: FormInstance<FoodFormValues>
  mode: FoodEditorMode
  open: boolean
  saving: boolean
  onCancel: () => void
  onSubmit: () => void
}) {
  /** 当前抽屉标题。 */
  const drawerTitle = mode === 'edit' ? '编辑食材' : '添加食材'
  /** 当前保存按钮文案。 */
  const submitText = mode === 'edit' ? '保存修改' : '保存食材'

  return (
    <Drawer
      className="food-drawer"
      closeIcon={<X size={17} />}
      footer={
        <div className="food-editor-footer">
          <span>建议参考包装或数据库的每 100g 数值</span>
          <div className="food-editor-actions">
            <Button className="food-editor-cancel" onClick={onCancel}>
              取消
            </Button>
            <Button className="food-editor-save" icon={<Check size={16} />} loading={saving} type="primary" onClick={onSubmit}>
              {submitText}
            </Button>
          </div>
        </div>
      }
      open={open}
      rootClassName="food-drawer-root"
      title={
        <div className="food-editor-title">
          <span className="food-editor-title-icon">
            <Table2 size={20} />
          </span>
          <span>
            <strong>{drawerTitle}</strong>
            <small>录入每 100g 的营养数据，保存后会进入食材库用于五餐记录。</small>
          </span>
        </div>
      }
      width={520}
      onClose={onCancel}
    >
      <Form className="food-editor-form" form={form} initialValues={defaultFoodForm} layout="vertical" requiredMark={false}>
        <Form.Item
          label={<FoodFieldLabel hint="在食材库中展示的名称" title="食材名称" />}
          name="name"
          rules={[{ required: true, message: '请输入食材名称' }]}
        >
          <FoodNameInput />
        </Form.Item>
        <div className="food-editor-nutrition-grid">
          {foodNutritionFields.map((field) => (
            <div className="food-editor-macro-card" key={field.name}>
              <Form.Item
                label={<FoodFieldLabel hint="/ 100g" title={field.label} />}
                name={field.name}
                rules={[{ required: true, message: field.message }]}
              >
                <FoodNumberInput mark={field.mark} precision={field.precision} unit={field.unit} />
              </Form.Item>
              <span className="food-editor-note">
                <i />
                {field.note}
              </span>
            </div>
          ))}
        </div>
        <Form.Item
          label={<FoodFieldLabel hint="例如：一个牛奶馒头重30g" required={false} title="备注" />}
          name="remark"
        >
          <Input.TextArea
            autoSize={{ minRows: 3, maxRows: 5 }}
            className="food-editor-remark-input"
            maxLength={255}
            placeholder="记录份量、熟重、生重或使用提醒"
            showCount
          />
        </Form.Item>
      </Form>
    </Drawer>
  )
}

/** 食材字段标签组件。 */
function FoodFieldLabel({ hint, required = true, title }: FoodFieldLabelProps) {
  return (
    <span className="food-editor-field-label">
      <span>
        {required ? <><b>*</b> {title}</> : title}
      </span>
      <small>{hint}</small>
    </span>
  )
}

/** 食材名称输入组件。 */
function FoodNameInput({ id, onChange, value }: FoodNameInputProps) {
  return (
    <div className="food-editor-input-shell food-editor-name-input">
      <span className="food-editor-input-mark">Aa</span>
      <Input id={id} placeholder="例如：牛肉、全麦面包" value={value} onChange={onChange} />
    </div>
  )
}

/** 食材数字输入组件。 */
function FoodNumberInput({ id, mark, onChange, precision, unit, value }: FoodNumberInputProps) {
  return (
    <div className="food-editor-input-shell food-editor-number-input">
      <span className="food-editor-input-mark">{mark}</span>
      <InputNumber controls={false} id={id} min={0} precision={precision} value={value} onChange={onChange} />
      <span className="food-editor-unit-addon">{unit}</span>
    </div>
  )
}
