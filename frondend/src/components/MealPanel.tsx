import { useMemo, useState, type DragEvent } from 'react'
import { Button, InputNumber, Modal, Select, Space } from 'antd'
import { Check, Pencil, Plus, RefreshCcw, Trash2, Utensils, X } from 'lucide-react'
import {
  calculateEntryTotals,
  calculateFoodGrams,
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

/** 餐次列拖拽事件处理函数。 */
type MealColumnDragHandler = (event: DragEvent<HTMLDivElement>, meal: MealType) => void

/** 餐食卡片拖拽开始事件处理函数。 */
type MealItemDragStartHandler = (event: DragEvent<HTMLDivElement>, entry: MealEntry) => void

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
  mealFoods,
  mealEntries,
  mealForm,
  mealSource,
  selectedDate,
  skippedMeals,
  onAddMealEntry,
  onEditMealEntry,
  onMealFormChange,
  onMoveMealEntry,
  onRestoreMeal,
  onRemoveMealEntry,
  onResetMeals,
  onSkipMeal,
}: {
  foods: Food[]
  mealFoods: Food[]
  mealEntries: Partial<Record<MealType, MealEntry[]>>
  mealForm: MealDraftFormState
  mealSource: MealSource
  selectedDate: string
  skippedMeals: SkippedMeals
  onAddMealEntry: () => void | Promise<void>
  onEditMealEntry: (entry: MealEntry) => void
  onMealFormChange: (mealForm: MealDraftFormState) => void
  onMoveMealEntry: (entry: MealEntry, targetMeal: MealType) => void | Promise<void>
  onRestoreMeal: (meal: MealType) => void
  onRemoveMealEntry: (entryId: string) => void
  onResetMeals: () => void
  onSkipMeal: (meal: MealType) => void
}) {
  const entryCount = mealTypes.reduce((count, meal) => count + (mealEntries[meal]?.length ?? 0), 0)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  /** 当前拖拽中的餐食记录 ID。 */
  const [draggingEntryId, setDraggingEntryId] = useState<string | null>(null)
  /** 当前拖拽悬停的餐次。 */
  const [dragOverMeal, setDragOverMeal] = useState<MealType | null>(null)
  /** 当前正在保存移动的餐食记录 ID。 */
  const [movingEntryId, setMovingEntryId] = useState<string | null>(null)
  const selectedFood = useMemo(() => foods.find((food) => food.id === mealForm.foodId), [foods, mealForm.foodId])
  /** 餐食记录 ID 索引。 */
  const mealEntryMap = useMemo(
    () => new Map(mealTypes.flatMap((meal) => (mealEntries[meal] ?? []).map((entry) => [entry.id, entry] as const))),
    [mealEntries],
  )
  const selectedFoodRemark = selectedFood?.remark?.trim() ?? ''
  const previewGrams = selectedFood && mealForm.quantity ? calculateFoodGrams(selectedFood, mealForm.quantity) : 0
  const previewNutrition = selectedFood && mealForm.quantity ? calculateFoodNutrition(selectedFood, previewGrams) : null
  const canSubmitMealForm = Boolean(mealForm.meal && mealForm.foodId && mealForm.quantity)

  /** 打开添加记录弹窗。 */
  const openAddModal = () => {
    onMealFormChange({ ...initialMealForm, meal: readLastMealType() })
    setIsAddModalOpen(true)
  }

  /** 关闭添加记录弹窗。 */
  const closeAddModal = () => setIsAddModalOpen(false)

  /** 清理餐食拖拽状态。 */
  const clearMealDragState = () => {
    setDraggingEntryId(null)
    setDragOverMeal(null)
  }

  /** 开始拖拽餐食记录。 */
  const startMealEntryDrag: MealItemDragStartHandler = (event, entry) => {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', entry.id)
    setDraggingEntryId(entry.id)
  }

  /** 拖过餐次列时标记目标餐次。 */
  const dragOverMealColumn: MealColumnDragHandler = (event, meal) => {
    /** 当前拖拽中的餐食记录。 */
    const draggingEntry = draggingEntryId ? mealEntryMap.get(draggingEntryId) : null

    if (!draggingEntry || draggingEntry.meal === meal || movingEntryId) {
      return
    }

    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
    setDragOverMeal(meal)
  }

  /** 离开餐次列时取消目标高亮。 */
  const leaveMealColumn: MealColumnDragHandler = (event, meal) => {
    if (event.relatedTarget instanceof Node && event.currentTarget.contains(event.relatedTarget)) {
      return
    }

    if (dragOverMeal === meal) {
      setDragOverMeal(null)
    }
  }

  /** 拖放餐食记录到目标餐次。 */
  const dropMealEntry: MealColumnDragHandler = async (event, targetMeal) => {
    event.preventDefault()
    /** 被拖放的餐食记录 ID。 */
    const entryId = event.dataTransfer.getData('text/plain') || draggingEntryId
    /** 被拖放的餐食记录。 */
    const entry = entryId ? mealEntryMap.get(entryId) : undefined

    clearMealDragState()

    if (!entry || entry.meal === targetMeal || movingEntryId) {
      return
    }

    setMovingEntryId(entry.id)

    try {
      await onMoveMealEntry(entry, targetMeal)
    } finally {
      setMovingEntryId(null)
    }
  }

  /**
   * 保存新增餐食记录。
   * @param shouldContinue 保存后是否继续添加下一条。
   */
  const saveMealEntry = async (shouldContinue = false) => {
    if (mealForm.meal) {
      saveLastMealType(mealForm.meal)
    }

    await onAddMealEntry()

    if (shouldContinue) {
      onMealFormChange({ meal: mealForm.meal })
      return
    }

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
        mealFoods={mealFoods}
        mealForm={mealForm}
        open={isAddModalOpen}
        canSubmit={canSubmitMealForm}
        previewGrams={previewGrams}
        previewNutrition={previewNutrition}
        selectedFood={selectedFood}
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
            dragOverMeal={dragOverMeal}
            draggingEntryId={draggingEntryId}
            isSkipped={Boolean(skippedMeals[meal])}
            movingEntryId={movingEntryId}
            onDragEnd={clearMealDragState}
            onDragLeave={leaveMealColumn}
            onDragOver={dragOverMealColumn}
            onDragStart={startMealEntryDrag}
            onDrop={dropMealEntry}
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
  mealFoods,
  mealForm,
  open,
  previewGrams,
  previewNutrition,
  selectedFood,
  selectedFoodRemark,
  onCancel,
  onMealFormChange,
  onSubmit,
}: {
  canSubmit: boolean
  mealFoods: Food[]
  mealForm: MealDraftFormState
  open: boolean
  previewGrams: number
  previewNutrition: ReturnType<typeof calculateFoodNutrition> | null
  selectedFood?: Food
  selectedFoodRemark: string
  onCancel: () => void
  onMealFormChange: (mealForm: MealDraftFormState) => void
  onSubmit: (shouldContinue?: boolean) => void | Promise<void>
}) {
  /** 当前选择食材的单位名称。 */
  const foodUnitName = selectedFood?.unitName ?? '单位'
  /** 当前数量输入精度。 */
  const quantityPrecision = foodUnitName === '克' ? 0 : 2
  /** 当前数量输入步长。 */
  const quantityStep = foodUnitName === '克' ? 10 : 1

  return (
    <Modal
      centered
      className="food-modal meal-add-modal"
      closeIcon={<X size={17} />}
      footer={
        <div className="meal-add-footer">
          <span>数据来自食材库，按食材单位自动换算。</span>
          <div className="meal-add-actions">
            <Button className="meal-add-cancel" onClick={onCancel}>
              取消
            </Button>
            <Button
              className="meal-add-save-and-continue"
              disabled={!canSubmit}
              icon={<Check size={16} />}
              onClick={() => onSubmit(true)}
            >
              保存并继续
            </Button>
            <Button className="meal-add-save" disabled={!canSubmit} icon={<Check size={16} />} type="primary" onClick={() => onSubmit()}>
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
            <small>选择餐次、食材与数量，保存后进入当天五餐记录。</small>
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
            options={mealFoods.map((food) => ({ value: food.id, label: food.name }))}
            onChange={(foodId) => onMealFormChange({ ...mealForm, foodId })}
            onSelect={blurActiveElement}
          />
        </div>
        <div className="meal-add-field">
          <MealAddFieldLabel hint="按食材单位录入" title="数量" />
          <Space.Compact className="modal-number-control meal-add-amount-control">
            <InputNumber
              min={1}
              precision={quantityPrecision}
              placeholder="请输入数量"
              step={quantityStep}
              value={mealForm.quantity ?? null}
              onChange={(quantity) => onMealFormChange({ ...mealForm, quantity: quantity ?? undefined })}
            />
            <span className="modal-unit-addon">{foodUnitName}</span>
          </Space.Compact>
        </div>
        <FoodRemarkStrip remark={selectedFoodRemark} />
        {previewNutrition ? (
          <div className="meal-add-preview">
            <span>预计摄入</span>
            <strong>{Math.round(previewNutrition.calories)} kcal</strong>
            <small>{selectedFood?.name ?? '未选择食材'}</small>
            <p className="meal-add-unit-preview">
              {mealForm.quantity}
              {foodUnitName} = {previewGrams}g
            </p>
            <p>
              碳 {roundOne(previewNutrition.carbs)}g · 蛋 {roundOne(previewNutrition.protein)}g · 脂{' '}
              {roundOne(previewNutrition.fat)}g
            </p>
          </div>
        ) : (
          <div className="meal-add-preview is-empty">
            <span>预计摄入</span>
            <strong>待计算</strong>
            <small>选择食材并填写数量后显示碳蛋脂</small>
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

/** 格式化餐食记录数量展示。 */
function formatMealEntryAmount(entry: MealEntry) {
  const quantityText = `${entry.quantity}${entry.unitName}`

  return entry.unitName === '克' ? quantityText : `${quantityText} · ${entry.grams}g`
}

/** 餐次列组件。 */
function MealColumn({
  meal,
  entries,
  foods,
  dragOverMeal,
  draggingEntryId,
  isSkipped,
  movingEntryId,
  onDragEnd,
  onDragLeave,
  onDragOver,
  onDragStart,
  onDrop,
  onEdit,
  onRemove,
  onRestore,
  onSkip,
}: {
  meal: MealType
  entries: MealEntry[]
  foods: Food[]
  dragOverMeal: MealType | null
  draggingEntryId: string | null
  isSkipped: boolean
  movingEntryId: string | null
  onDragEnd: () => void
  onDragLeave: MealColumnDragHandler
  onDragOver: MealColumnDragHandler
  onDragStart: MealItemDragStartHandler
  onDrop: MealColumnDragHandler
  onEdit: (entry: MealEntry) => void
  onRemove: (entryId: string) => void
  onRestore: (meal: MealType) => void
  onSkip: (meal: MealType) => void
}) {
  const totals = calculateEntryTotals(entries, foods)
  /** 餐次列状态类名。 */
  const columnClassName = [
    'meal-column',
    draggingEntryId ? 'is-drag-active' : '',
    dragOverMeal === meal ? 'is-drag-over' : '',
  ].filter(Boolean).join(' ')

  return (
    <div
      className={columnClassName}
      onDragLeave={(event) => onDragLeave(event, meal)}
      onDragOver={(event) => onDragOver(event, meal)}
      onDrop={(event) => onDrop(event, meal)}
    >
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
            /** 餐食卡片状态类名。 */
            const itemClassName = [
              'meal-item',
              draggingEntryId === entry.id ? 'is-dragging' : '',
              movingEntryId === entry.id ? 'is-moving' : '',
            ].filter(Boolean).join(' ')
            /** 当前餐食记录是否正在保存移动。 */
            const isMovingEntry = movingEntryId === entry.id

            return (
              <div
                aria-busy={isMovingEntry}
                aria-grabbed={draggingEntryId === entry.id}
                className={itemClassName}
                draggable={!isMovingEntry}
                key={entry.id}
                title="拖动到其他餐次"
                onDragEnd={onDragEnd}
                onDragStart={(event) => onDragStart(event, entry)}
              >
                <div className="meal-item-main">
                  <div className="meal-item-title">
                    <strong>{food?.name}</strong>
                    <div className="meal-item-actions">
                      <button draggable={false} type="button" onClick={() => onEdit(entry)} aria-label="编辑餐食">
                        <Pencil size={14} />
                      </button>
                      <button draggable={false} type="button" onClick={() => onRemove(entry.id)} aria-label="删除餐食">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  <span>
                    {formatMealEntryAmount(entry)} · {nutrition?.calories ?? 0}kcal
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
