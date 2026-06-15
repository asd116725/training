import { useMemo } from 'react'
import { Button, Form, Modal, Select } from 'antd'
import type { FormInstance } from 'antd'
import { Check, Utensils, X } from 'lucide-react'
import { calculateFoodGrams, calculateFoodNutrition, roundOne, type Food } from '../domain'
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
  const watchedQuantity = Number(Form.useWatch('quantity', form) ?? form.getFieldValue('quantity') ?? 0)
  const selectedFood = useMemo(() => foods.find((food) => food.id === watchedFoodId), [foods, watchedFoodId])
  const selectedFoodRemark = selectedFood?.remark?.trim() ?? ''
  const watchedGrams = selectedFood && watchedQuantity ? calculateFoodGrams(selectedFood, watchedQuantity) : 0
  const previewNutrition = selectedFood && watchedQuantity ? calculateFoodNutrition(selectedFood, watchedGrams) : null
  /** 当前食材单位名称。 */
  const foodUnitName = selectedFood?.unitName ?? '单位'
  /** 数量输入精度。 */
  const quantityPrecision = foodUnitName === '克' ? 0 : 2
  /** 数量输入步长。 */
  const quantityStep = foodUnitName === '克' ? 10 : 1

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
            <small>调整餐次、食材与数量，保存后重新计算当天摄入。</small>
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
          label={<MealEntryFieldLabel hint="按食材单位录入" title="数量" />}
          name="quantity"
          rules={[{ required: true, message: '请输入数量' }]}
        >
          <NumberWithUnitInput min={1} precision={quantityPrecision} placeholder="请输入数量" step={quantityStep} unit={foodUnitName} />
        </Form.Item>
        <FoodRemarkStrip remark={selectedFoodRemark} />
        <div className="meal-add-preview">
          <span>预计摄入</span>
          <strong>{Math.round(previewNutrition?.calories ?? 0)} kcal</strong>
          <small>{selectedFood?.name ?? '未选择食材'}</small>
          {watchedQuantity > 0 && selectedFood ? (
            <p className="meal-add-unit-preview">
              {watchedQuantity}
              {foodUnitName} = {watchedGrams}g
            </p>
          ) : null}
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
