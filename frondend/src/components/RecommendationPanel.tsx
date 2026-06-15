import { useState, type ChangeEventHandler } from 'react'
import { Button, Form, Input, Modal, Popconfirm } from 'antd'
import { ArrowDown, ArrowUp, Check, Download, FileText, Pencil, Plus, Sparkles, Trash2, X } from 'lucide-react'
import { mealLabels, roundOne } from '../domain'
import type { MealType, NutritionTotals, RecommendedItem } from '../domain'
import type { RecommendationPrompt, RecommendationPromptFormValues, RecommendationState } from '../types'
import { SectionTitle } from './Common'

/** 推荐餐次展示顺序。 */
const recommendationMealOrder = Object.keys(mealLabels) as MealType[]

/** 提示词弹窗字段标签属性。 */
interface PromptFieldLabelProps {
  hint: string
  title: string
}

/** 提示词弹窗带标记输入框属性。 */
interface PromptMarkedInputProps {
  autoSize?: { maxRows: number; minRows: number }
  id?: string
  mark: string
  placeholder: string
  textArea?: boolean
  value?: string
  onChange?: ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement>
}

/** 按餐次分组推荐项。 */
function groupRecommendedItems(items: RecommendedItem[]) {
  return recommendationMealOrder.flatMap((meal) => {
    const mealItems = items.filter((item) => item.meal === meal)
    return mealItems.length ? [{ meal, items: mealItems }] : []
  })
}

/** 剩余餐推荐面板组件。 */
export function RecommendationPanel({
  importingRecommendationMeal,
  isRecommending,
  isSavingPrompt,
  recommendation,
  recommendationRequirement,
  recommendationPrompts,
  remaining,
  onImportRecommendation,
  onMovePrompt,
  onRemovePrompt,
  onRequestRecommendation,
  onSavePrompt,
}: {
  importingRecommendationMeal: MealType | null
  isRecommending: boolean
  isSavingPrompt: boolean
  recommendation: RecommendationState | null
  recommendationRequirement: string
  recommendationPrompts: RecommendationPrompt[]
  remaining: NutritionTotals
  onImportRecommendation: (meal: MealType) => void
  onMovePrompt: (promptId: string, direction: 'up' | 'down') => Promise<void>
  onRemovePrompt: (promptId: string) => Promise<void>
  onRequestRecommendation: (customRequirement: string) => void
  onSavePrompt: (values: RecommendationPromptFormValues, editingPrompt?: RecommendationPrompt | null) => Promise<void>
}) {
  const [promptForm] = Form.useForm<RecommendationPromptFormValues>()
  const [editingPrompt, setEditingPrompt] = useState<RecommendationPrompt | null>(null)
  const [isPromptModalOpen, setIsPromptModalOpen] = useState(false)
  /** 提示词弹窗标题。 */
  const promptModalTitle = editingPrompt ? '编辑提示语句' : '新增提示语句'

  /** 打开新增提示词弹窗。 */
  const openCreatePromptModal = () => {
    setEditingPrompt(null)
    promptForm.setFieldsValue({ title: '', content: '' })
    setIsPromptModalOpen(true)
  }

  /** 打开编辑提示词弹窗。 */
  const openEditPromptModal = (prompt: RecommendationPrompt) => {
    setEditingPrompt(prompt)
    promptForm.setFieldsValue({ title: prompt.title, content: prompt.content })
    setIsPromptModalOpen(true)
  }

  /** 关闭提示词弹窗。 */
  const closePromptModal = () => {
    setIsPromptModalOpen(false)
    setEditingPrompt(null)
    promptForm.resetFields()
  }

  /** 提交提示词表单。 */
  const submitPromptForm = async () => {
    try {
      const values = await promptForm.validateFields()
      await onSavePrompt(values, editingPrompt)
      closePromptModal()
    } catch {
      // 表单校验失败时保留弹窗。
    }
  }

  return (
    <section className="panel recommend-panel">
      <SectionTitle icon={<Sparkles size={18} />} title="剩余餐推荐" />
      <p className="muted-text">
        剩余 {remaining.calories} kcal · 蛋白{remaining.protein}g · 碳水{remaining.carbs}g · 脂肪{remaining.fat}g
      </p>
      <div className="prompt-library">
        <div className="prompt-library-head">
          <span>按顺序的提示语句</span>
          <Button className="ghost-action icon-action" icon={<Plus size={15} />} title="新增提示语句" onClick={openCreatePromptModal} />
        </div>
        <div className="prompt-sequence">
          {recommendationPrompts.length ? (
            recommendationPrompts.map((prompt, index) => (
              <div className="prompt-sequence-item" key={prompt.id}>
                <div className="prompt-sequence-index">{index + 1}</div>
                <div className="prompt-sequence-copy">
                  <strong>{prompt.title}</strong>
                  <p>{prompt.content}</p>
                </div>
                <div className="prompt-sequence-actions">
                  <Button
                    className="table-action"
                    disabled={index === 0 || isSavingPrompt}
                    icon={<ArrowUp size={15} />}
                    title="上移"
                    onClick={() => onMovePrompt(prompt.id, 'up')}
                  />
                  <Button
                    className="table-action"
                    disabled={index === recommendationPrompts.length - 1 || isSavingPrompt}
                    icon={<ArrowDown size={15} />}
                    title="下移"
                    onClick={() => onMovePrompt(prompt.id, 'down')}
                  />
                  <Button
                    className="table-action"
                    disabled={isSavingPrompt}
                    icon={<Pencil size={15} />}
                    title="编辑提示语句"
                    onClick={() => openEditPromptModal(prompt)}
                  />
                  <Popconfirm
                    title="删除提示语句"
                    description="确认删除这条入库提示语句？"
                    okText="删除"
                    cancelText="取消"
                    onConfirm={() => onRemovePrompt(prompt.id)}
                  >
                    <Button className="table-action" disabled={isSavingPrompt} icon={<Trash2 size={15} />} title="删除提示语句" />
                  </Popconfirm>
                </div>
              </div>
            ))
          ) : (
            <PromptEmptyState onCreatePrompt={openCreatePromptModal} />
          )}
        </div>
      </div>
      <Button
        className="primary-action"
        type="primary"
        icon={<Sparkles size={17} />}
        loading={isRecommending}
        onClick={() => onRequestRecommendation(recommendationRequirement)}
      >
        生成推荐
      </Button>
      <Modal
        centered
        className="food-modal prompt-modal"
        closeIcon={<X size={17} />}
        footer={
          <div className="prompt-modal-footer">
            <span>保存后将加入右侧提示词列表</span>
            <div className="prompt-modal-actions">
              <Button className="prompt-modal-cancel" onClick={closePromptModal}>
                取消
              </Button>
              <Button
                className="prompt-modal-save"
                icon={<Check size={16} />}
                loading={isSavingPrompt}
                type="primary"
                onClick={submitPromptForm}
              >
                保存提示词
              </Button>
            </div>
          </div>
        }
        forceRender
        open={isPromptModalOpen}
        rootClassName="prompt-modal-root"
        title={
          <div className="prompt-modal-title">
            <span className="prompt-modal-title-icon">
              <Sparkles size={19} />
            </span>
            <span>
              <strong>{promptModalTitle}</strong>
              <small>为剩余餐推荐补充一条偏好或约束，让生成结果更贴合今天的目标。</small>
            </span>
          </div>
        }
        width={650}
        onCancel={closePromptModal}
      >
        <Form className="prompt-modal-form" form={promptForm} layout="vertical" requiredMark={false}>
          <Form.Item
            label={<PromptFieldLabel hint="列表中展示的简短标题" title="名称" />}
            name="title"
            rules={[{ required: true, message: '请输入名称' }]}
          >
            <PromptMarkedInput mark="Aa" placeholder="例如：晚餐少油高蛋白" />
          </Form.Item>
          <Form.Item
            label={<PromptFieldLabel hint="写成明确的饮食约束" title="内容" />}
            name="content"
            rules={[{ required: true, message: '请输入内容' }]}
          >
            <PromptMarkedInput
              autoSize={{ minRows: 5, maxRows: 7 }}
              mark="T"
              placeholder="例如：晚餐不吃蛋白粉，优先用鸡腿、虾仁和米饭补足蛋白质与碳水。"
              textArea
            />
          </Form.Item>
          <div className="prompt-modal-chips">
            <span>常用方向</span>
            <i>高蛋白</i>
            <i>低油</i>
            <i>训练后</i>
          </div>
        </Form>
      </Modal>
      <RecommendationList
        importingRecommendationMeal={importingRecommendationMeal}
        recommendation={recommendation}
        onImportRecommendation={onImportRecommendation}
      />
    </section>
  )
}

/** 提示词弹窗字段标签组件。 */
function PromptFieldLabel({ hint, title }: PromptFieldLabelProps) {
  return (
    <span className="prompt-field-label">
      <span>
        <b>*</b> {title}
      </span>
      <small>{hint}</small>
    </span>
  )
}

/** 提示词弹窗带左侧标记的输入组件。 */
function PromptMarkedInput({ autoSize, id, mark, onChange, placeholder, textArea, value }: PromptMarkedInputProps) {
  return (
    <div className="prompt-modal-control">
      <span className="prompt-modal-control-mark">{mark}</span>
      {textArea ? (
        <Input.TextArea
          autoSize={autoSize}
          id={id}
          placeholder={placeholder}
          value={value}
          onChange={onChange as ChangeEventHandler<HTMLTextAreaElement>}
        />
      ) : (
        <Input
          id={id}
          placeholder={placeholder}
          value={value}
          onChange={onChange as ChangeEventHandler<HTMLInputElement>}
        />
      )}
    </div>
  )
}

/** 提示语句空状态组件。 */
function PromptEmptyState({ onCreatePrompt }: { onCreatePrompt: () => void }) {
  return (
    <div className="prompt-empty-card">
      <div className="empty-state-icon">
        <FileText size={18} />
      </div>
      <div className="empty-state-copy">
        <strong>暂无提示语句</strong>
        <span>添加饮食偏好，生成时会按顺序执行</span>
      </div>
      <Button className="ghost-action empty-state-action" icon={<Plus size={14} />} onClick={onCreatePrompt}>
        添加第一条
      </Button>
    </div>
  )
}

/** 推荐列表组件。 */
function RecommendationList({
  recommendation,
  importingRecommendationMeal,
  onImportRecommendation,
}: {
  recommendation: RecommendationState | null
  importingRecommendationMeal: MealType | null
  onImportRecommendation: (meal: MealType) => void
}) {
  const items = recommendation?.items ?? []
  const groupedItems = groupRecommendedItems(items)
  /** 是否已有可展示的推荐餐食。 */
  const hasRecommendationItems = groupedItems.length > 0

  return (
    <div className="recommend-list">
      <div className="recommend-list-head">
        <p className="recommend-source">
          {recommendation ? (recommendation.source === 'deepseek' ? 'DeepSeek 推荐' : '规则推荐') : '等待生成'}
        </p>
      </div>
      {recommendation?.summary && <p className="muted-text">{recommendation.summary}</p>}
      {hasRecommendationItems ? (
        groupedItems.map(({ meal, items: mealItems }) => (
          <div className="recommend-meal-group" key={meal}>
            <div className="recommend-meal-head">
              <span>{mealLabels[meal]}</span>
              {recommendation?.items.length ? (
                <Button
                  className="ghost-action recommend-import-action"
                  disabled={Boolean(importingRecommendationMeal) && importingRecommendationMeal !== meal}
                  icon={<Download size={14} />}
                  loading={importingRecommendationMeal === meal}
                  onClick={() => onImportRecommendation(meal)}
                >
                  导入{mealLabels[meal]}记录
                </Button>
              ) : null}
            </div>
            {mealItems.map((item, index) => (
              <div className="recommend-item" key={`${item.meal}-${item.foodName}-${index}`}>
                <div>
                  <strong>
                    {item.foodName} {item.grams}g
                  </strong>
                </div>
                <small>
                  {Math.round(item.calories)}kcal · 蛋白{roundOne(item.protein)}g · 碳水{roundOne(item.carbs)}g · 脂肪
                  {roundOne(item.fat)}g
                </small>
              </div>
            ))}
          </div>
        ))
      ) : (
        <RecommendationEmptyState hasRecommendation={Boolean(recommendation)} />
      )}
    </div>
  )
}

/** 推荐结果空状态组件。 */
function RecommendationEmptyState({ hasRecommendation }: { hasRecommendation: boolean }) {
  return (
    <div className="recommend-empty-card">
      <div className="empty-state-icon">
        <Sparkles size={18} />
      </div>
      <div className="empty-state-copy">
        <strong>{hasRecommendation ? '没有可导入餐食' : '生成后展示餐食'}</strong>
        <span>{hasRecommendation ? 'DeepSeek 本次没有返回有效食材' : '可导入的推荐餐会在这里出现'}</span>
      </div>
    </div>
  )
}
