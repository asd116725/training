import { useMemo, useState } from 'react'
import { Button, InputNumber, Modal, Select, Space } from 'antd'
import { Check, Pencil, Plus, RefreshCcw, Trash2, Utensils, X } from 'lucide-react'
import {
  calculateEntryTotals,
  calculateFoodNutrition,
  mealLabels,
  roundOne,
  type Food,
  type MealEntry,
  type MealType,
} from '../domain'
import { initialMealForm } from '../config'
import type { MealDraftFormState, MealSource, SkippedMeals } from '../types'
import { mealOptions, mealTypes } from '../utils/meal'
import { SectionTitle } from './Common'
import { FoodRemarkStrip } from './FoodRemarkStrip'

/** 餐食来源文案。 */
const mealSourceLabels: Record<MealSource, string> = {
  api: '后端数据库',
  loading: '加载中',
  local: '本地缓存',
}

/** 添加餐食上次餐次缓存 key。 */
const lastMealTypeKey = 'training-last-meal-type'

/** 判断是否为餐次类型。 */
function isMealType(value: string | null): value is MealType {
  return Boolean(value && mealTypes.includes(value as MealType))
}

/** 读取上次添加餐食使用的餐次。 */
function readLastMealType() {
  const cachedMealType = sessionStorage.getItem(lastMealTypeKey)
  return isMealType(cachedMealType) ? cachedMealType : undefined
}

/** 保存上次添加餐食使用的餐次。 */
function saveLastMealType(meal: MealType) {
  sessionStorage.setItem(lastMealTypeKey, meal)
}

/** 选中可搜索下拉后移出输入焦点。 */
function blurActiveElement() {
  window.setTimeout(() => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur()
    }
  })
}

/** 五餐记录面板组件。 */
export function MealPanel({
  foods,
  mealEntries,
  mealForm,
  mealSource,
  selectedDate,
  skippedMeals,
  onAddMealEntry,
  onEditMealEntry,
  onMealFormChange,
  onRestoreMeal,
  onRemoveMealEntry,
  onResetMeals,
  onSkipMeal,
}: {
  foods: Food[]
  mealEntries: Partial<Record<MealType, MealEntry[]>>
  mealForm: MealDraftFormState
  mealSource: MealSource
  selectedDate: string
  skippedMeals: SkippedMeals
  onAddMealEntry: () => void | Promise<void>
  onEditMealEntry: (entry: MealEntry) => void
  onMealFormChange: (mealForm: MealDraftFormState) => void
  onRestoreMeal: (meal: MealType) => void
  onRemoveMealEntry: (entryId: string) => void
  onResetMeals: () => void
  onSkipMeal: (meal: MealType) => void
}) {
  const entryCount = mealTypes.reduce((count, meal) => count + (mealEntries[meal]?.length ?? 0), 0)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const selectedFood = useMemo(() => foods.find((food) => food.id === mealForm.foodId), [foods, mealForm.foodId])
  const selectedFoodRemark = selectedFood?.remark?.trim() ?? ''
  const previewNutrition = selectedFood && mealForm.grams ? calculateFoodNutrition(selectedFood, mealForm.grams) : null
  const canSubmitMealForm = Boolean(mealForm.meal && mealForm.foodId && mealForm.grams)

  /** 打开添加记录弹窗。 */
  const openAddModal = () => {
    onMealFormChange({ ...initialMealForm, meal: readLastMealType() })
    setIsAddModalOpen(true)
  }

  /** 关闭添加记录弹窗。 */
  const closeAddModal = () => setIsAddModalOpen(false)

  /** 保存新增餐食记录。 */
  const saveMealEntry = async () => {
    if (mealForm.meal) {
      saveLastMealType(mealForm.meal)
    }

    await onAddMealEntry()
    closeAddModal()
  }

  return (
    <section className="panel meal-panel">
      <div className="section-header">
        <SectionTitle icon={<Utensils size={18} />} title="五餐记录" />
        <div className="meal-header-tools">
          <Button className="primary-action meal-add-trigger" htmlType="button" icon={<Plus size={15} />} onClick={openAddModal}>
            添加记录
          </Button>
          <Button className="ghost-action" htmlType="button" icon={<RefreshCcw size={15} />} onClick={onResetMeals}>
            清空当天
          </Button>
        </div>
      </div>
      <p className="muted-text meal-source">
        {selectedDate} · {entryCount} 条记录 · {mealSourceLabels[mealSource]}
      </p>
      <MealAddModal
        foods={foods}
        mealForm={mealForm}
        open={isAddModalOpen}
        canSubmit={canSubmitMealForm}
        previewNutrition={previewNutrition}
        selectedFoodName={selectedFood?.name ?? '未选择食材'}
        selectedFoodRemark={selectedFoodRemark}
        onCancel={closeAddModal}
        onMealFormChange={onMealFormChange}
        onSubmit={saveMealEntry}
      />
      <div className="meal-timeline">
        {mealTypes.map((meal) => (
          <MealColumn
            key={meal}
            meal={meal}
            entries={mealEntries[meal] ?? []}
            foods={foods}
            isSkipped={Boolean(skippedMeals[meal])}
            onEdit={onEditMealEntry}
            onRemove={onRemoveMealEntry}
            onRestore={onRestoreMeal}
            onSkip={onSkipMeal}
          />
        ))}
      </div>
    </section>
  )
}

/** 添加餐食记录弹窗组件。 */
function MealAddModal({
  canSubmit,
  foods,
  mealForm,
  open,
  previewNutrition,
  selectedFoodName,
  selectedFoodRemark,
  onCancel,
  onMealFormChange,
  onSubmit,
}: {
  canSubmit: boolean
  foods: Food[]
  mealForm: MealDraftFormState
  open: boolean
  previewNutrition: ReturnType<typeof calculateFoodNutrition> | null
  selectedFoodName: string
  selectedFoodRemark: string
  onCancel: () => void
  onMealFormChange: (mealForm: MealDraftFormState) => void
  onSubmit: () => void | Promise<void>
}) {
  return (
    <Modal
      centered
      className="food-modal meal-add-modal"
      closeIcon={<X size={17} />}
      footer={
        <div className="meal-add-footer">
          <span>数据来自食材库，每 100g 自动换算。</span>
          <div className="meal-add-actions">
            <Button className="meal-add-cancel" onClick={onCancel}>
              取消
            </Button>
            <Button className="meal-add-save" disabled={!canSubmit} icon={<Check size={16} />} type="primary" onClick={onSubmit}>
              保存记录
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
            <strong>添加餐食记录</strong>
            <small>选择餐次、食材与重量，保存后进入当天五餐记录。</small>
          </span>
        </div>
      }
      width={960}
      onCancel={onCancel}
    >
      <div className="meal-add-form">
        <div className="meal-add-field">
          <MealAddFieldLabel hint="五餐分栏" title="餐次" />
          <Select<MealType>
            placeholder="请选择餐次"
            value={mealForm.meal}
            options={mealOptions}
            onChange={(meal) => {
              saveLastMealType(meal)
              onMealFormChange({ ...mealForm, meal })
            }}
          />
        </div>
        <div className="meal-add-field">
          <MealAddFieldLabel hint="支持名称搜索" title="食材" />
          <Select<string>
            showSearch
            placeholder="请选择食材"
            optionFilterProp="label"
            value={mealForm.foodId}
            options={foods.map((food) => ({ value: food.id, label: food.name }))}
            onChange={(foodId) => onMealFormChange({ ...mealForm, foodId })}
            onSelect={blurActiveElement}
          />
        </div>
        <div className="meal-add-field">
          <MealAddFieldLabel hint="按克重换算" title="重量" />
          <Space.Compact className="modal-number-control meal-add-amount-control">
            <InputNumber
              min={1}
              precision={0}
              placeholder="请输入克重"
              step={10}
              value={mealForm.grams ?? null}
              onChange={(grams) => onMealFormChange({ ...mealForm, grams: grams ?? undefined })}
            />
            <span className="modal-unit-addon">g</span>
          </Space.Compact>
        </div>
        <FoodRemarkStrip remark={selectedFoodRemark} />
        {previewNutrition ? (
          <div className="meal-add-preview">
            <span>预计摄入</span>
            <strong>{Math.round(previewNutrition.calories)} kcal</strong>
            <small>{selectedFoodName}</small>
            <p>
              碳 {roundOne(previewNutrition.carbs)}g · 蛋 {roundOne(previewNutrition.protein)}g · 脂{' '}
              {roundOne(previewNutrition.fat)}g
            </p>
          </div>
        ) : (
          <div className="meal-add-preview is-empty">
            <span>预计摄入</span>
            <strong>待计算</strong>
            <small>选择食材并填写重量后显示碳蛋脂</small>
          </div>
        )}
      </div>
    </Modal>
  )
}

/** 添加餐食字段标签组件。 */
function MealAddFieldLabel({ hint, title }: { hint: string; title: string }) {
  return (
    <span className="meal-add-field-label">
      <span>
        <b>*</b> {title}
      </span>
      <small>{hint}</small>
    </span>
  )
}

/** 餐次列组件。 */
function MealColumn({
  meal,
  entries,
  foods,
  isSkipped,
  onEdit,
  onRemove,
  onRestore,
  onSkip,
}: {
  meal: MealType
  entries: MealEntry[]
  foods: Food[]
  isSkipped: boolean
  onEdit: (entry: MealEntry) => void
  onRemove: (entryId: string) => void
  onRestore: (meal: MealType) => void
  onSkip: (meal: MealType) => void
}) {
  const totals = calculateEntryTotals(entries, foods)

  return (
    <div className="meal-column">
      <div className="meal-column-head">
        <strong>{mealLabels[meal]}</strong>
        <span>{Math.round(totals.calories)} kcal</span>
      </div>
      <div className="meal-items">
        {entries.length === 0 ? (
          <MealEmptyState isSkipped={isSkipped} meal={meal} onRestore={onRestore} onSkip={onSkip} />
        ) : (
          entries.map((entry) => {
            const food = foods.find((item) => item.id === entry.foodId)
            const nutrition = food ? calculateFoodNutrition(food, entry.grams) : null

            return (
              <div className="meal-item" key={entry.id}>
                <div className="meal-item-main">
                  <div className="meal-item-title">
                    <strong>{food?.name}</strong>
                    <div className="meal-item-actions">
                      <button type="button" onClick={() => onEdit(entry)} aria-label="编辑餐食">
                        <Pencil size={14} />
                      </button>
                      <button type="button" onClick={() => onRemove(entry.id)} aria-label="删除餐食">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  <span>
                    {entry.grams}g · {nutrition?.calories ?? 0}kcal
                  </span>
                  {nutrition && (
                    <small>
                      碳{roundOne(nutrition.carbs)}g · 蛋{roundOne(nutrition.protein)}g · 脂{roundOne(nutrition.fat)}g
                    </small>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

/** 空餐次状态组件。 */
function MealEmptyState({
  isSkipped,
  meal,
  onRestore,
  onSkip,
}: {
  isSkipped: boolean
  meal: MealType
  onRestore: (meal: MealType) => void
  onSkip: (meal: MealType) => void
}) {
  if (isSkipped) {
    return (
      <div className="meal-empty-state is-skipped">
        <strong>不吃</strong>
        <span>已跳过该餐</span>
        <button type="button" onClick={() => onRestore(meal)} aria-label={`恢复${mealLabels[meal]}`}>
          恢复
        </button>
      </div>
    )
  }

  return (
    <div className="meal-empty-state">
      <strong>待选择</strong>
      <span>可添加餐食或标记不吃</span>
      <button type="button" onClick={() => onSkip(meal)} aria-label={`${mealLabels[meal]}不吃`}>
        不吃
      </button>
    </div>
  )
}
