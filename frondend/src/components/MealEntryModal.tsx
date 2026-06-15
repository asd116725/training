import { useMemo } from 'react'
import { Button, Form, Modal, Select } from 'antd'
import type { FormInstance } from 'antd'
import { Check, Utensils, X } from 'lucide-react'
import { calculateFoodNutrition, roundOne, type Food } from '../domain'
import type { MealFormState } from '../types'
import { mealOptions } from '../utils/meal'
import { FoodRemarkStrip } from './FoodRemarkStrip'
import { NumberWithUnitInput } from './NumberWithUnitInput'

/** 餐食明细编辑弹窗组件。 */
export function MealEntryModal({
  foods,
  form,
  open,
  saving,
  onCancel,
  onSubmit,
}: {
  foods: Food[]
  form: FormInstance<MealFormState>
  open: boolean
  saving: boolean
  onCancel: () => void
  onSubmit: () => void
}) {
  const watchedFoodId = Form.useWatch('foodId', form) ?? form.getFieldValue('foodId')
  const watchedGrams = Number(Form.useWatch('grams', form) ?? form.getFieldValue('grams') ?? 0)
  const selectedFood = useMemo(() => foods.find((food) => food.id === watchedFoodId), [foods, watchedFoodId])
  const selectedFoodRemark = selectedFood?.remark?.trim() ?? ''
  const previewNutrition = selectedFood ? calculateFoodNutrition(selectedFood, watchedGrams) : null

  return (
    <Modal
      centered
      className="food-modal meal-add-modal meal-entry-modal"
      closeIcon={<X size={17} />}
      footer={
        <div className="meal-add-footer">
          <span>修改后会同步更新当天五餐记录。</span>
          <div className="meal-add-actions">
            <Button className="meal-add-cancel" onClick={onCancel}>
              取消
            </Button>
            <Button className="meal-add-save" icon={<Check size={16} />} loading={saving} type="primary" onClick={onSubmit}>
              保存修改
            </Button>
          </div>
        </div>
      }
      open={open}
      title={
        <div className="meal-add-title">
          <span className="meal-add-title-icon">
            <Utensils size={20} />
          </span>
          <span>
            <strong>编辑餐食记录</strong>
            <small>调整餐次、食材与重量，保存后重新计算当天摄入。</small>
          </span>
        </div>
      }
      width={960}
      onCancel={onCancel}
    >
      <Form className="meal-entry-modal-form meal-add-form" form={form} layout="vertical" requiredMark={false}>
        <Form.Item
          className="meal-add-field"
          label={<MealEntryFieldLabel hint="五餐分栏" title="餐次" />}
          name="meal"
          rules={[{ required: true, message: '请选择餐次' }]}
        >
          <Select options={mealOptions} />
        </Form.Item>
        <Form.Item
          className="meal-add-field"
          label={<MealEntryFieldLabel hint="支持名称搜索" title="食材" />}
          name="foodId"
          rules={[{ required: true, message: '请选择食材' }]}
        >
          <Select
            showSearch
            optionFilterProp="label"
            options={foods.map((food) => ({ value: food.id, label: food.name }))}
          />
        </Form.Item>
        <Form.Item
          className="meal-add-field"
          label={<MealEntryFieldLabel hint="按克重换算" title="重量" />}
          name="grams"
          rules={[{ required: true, message: '请输入克数' }]}
        >
          <NumberWithUnitInput min={1} precision={0} step={10} unit="g" />
        </Form.Item>
        <FoodRemarkStrip remark={selectedFoodRemark} />
        <div className="meal-add-preview">
          <span>预计摄入</span>
          <strong>{Math.round(previewNutrition?.calories ?? 0)} kcal</strong>
          <small>{selectedFood?.name ?? '未选择食材'}</small>
          <p>
            碳 {roundOne(previewNutrition?.carbs ?? 0)}g · 蛋 {roundOne(previewNutrition?.protein ?? 0)}g · 脂{' '}
            {roundOne(previewNutrition?.fat ?? 0)}g
          </p>
        </div>
      </Form>
    </Modal>
  )
}

/** 编辑餐食字段标签组件。 */
function MealEntryFieldLabel({ hint, title }: { hint: string; title: string }) {
  return (
    <span className="meal-add-field-label">
      <span>
        <b>*</b> {title}
      </span>
      <small>{hint}</small>
    </span>
  )
}
