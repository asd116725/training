import { useMemo, useState } from 'react'
import { Button, Input, Modal, Segmented, Table } from 'antd'
import type { TableProps } from 'antd'
import { Database, Download, FileDown, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import type { Food } from '../domain'
import type { FoodSource } from '../types'

/** 食材来源文案。 */
const foodSourceLabels: Record<FoodSource, string> = {
  api: '本地数据库',
  loading: '加载中',
  local: '本地缓存',
}

/** 食材筛选类型。 */
type FoodFilter = 'all' | 'protein' | 'carbs' | 'fat'

/** 食材表格每页条数。 */
const foodPageSize = 10

/** 食材筛选选项。 */
const foodFilterOptions: Array<{ label: string; value: FoodFilter }> = [
  { label: '全部', value: 'all' },
  { label: '高蛋白', value: 'protein' },
  { label: '高碳水', value: 'carbs' },
  { label: '高脂肪', value: 'fat' },
]

/** 食材名称是否匹配搜索关键词。 */
function matchFoodName(food: Food, keyword: string) {
  return food.name.toLowerCase().includes(keyword.trim().toLowerCase())
}

/** 食材是否匹配宏量筛选。 */
function matchFoodFilter(food: Food, filter: FoodFilter) {
  if (filter === 'protein') {
    return food.protein >= 15
  }

  if (filter === 'carbs') {
    return food.carbs >= 30
  }

  if (filter === 'fat') {
    return food.fat >= 10
  }

  return true
}

/** 获取食材标签。 */
function getFoodTags(food: Food) {
  return [
    food.protein >= 15 ? '高蛋白' : '',
    food.carbs >= 30 ? '高碳水' : '',
    food.fat >= 10 ? '高脂肪' : '',
  ].filter(Boolean)
}

/** 获取食材备注展示文案。 */
function getFoodRemarkText(food: Food) {
  return food.remark?.trim() || '—'
}

/** 计算食材平均热量。 */
function getAverageCalories(foods: Food[]) {
  if (foods.length === 0) {
    return 0
  }

  return Math.round(foods.reduce((total, food) => total + food.calories, 0) / foods.length)
}

/** 食材库二级页面属性。 */
interface FoodLibraryPageProps {
  foodSource: FoodSource
  foods: Food[]
  importingFoodId: string | null
  loadingPublicFoods: boolean
  publicFoods: Food[]
  onCreateFood: () => void
  onEditFood: (food: Food) => void
  onImportFood: (foodId: string) => Promise<void>
  onOpenPublicFoods: () => Promise<void>
  onRemoveFood: (foodId: string) => void
}

/** 食材库二级页面。 */
export function FoodLibraryPage({
  foodSource,
  foods,
  importingFoodId,
  loadingPublicFoods,
  publicFoods,
  onCreateFood,
  onEditFood,
  onImportFood,
  onOpenPublicFoods,
  onRemoveFood,
}: FoodLibraryPageProps) {
  const [foodKeyword, setFoodKeyword] = useState('')
  const [foodFilter, setFoodFilter] = useState<FoodFilter>('all')
  const [foodPage, setFoodPage] = useState(1)
  const [publicFoodKeyword, setPublicFoodKeyword] = useState('')
  const [isPublicModalOpen, setIsPublicModalOpen] = useState(false)

  /** 搜索和筛选后的食材列表。 */
  const filteredFoods = useMemo(
    () => foods.filter((food) => matchFoodName(food, foodKeyword) && matchFoodFilter(food, foodFilter)),
    [foodFilter, foodKeyword, foods],
  )

  /** 搜索后的公共食材列表。 */
  const filteredPublicFoods = useMemo(
    () => publicFoods.filter((food) => matchFoodName(food, publicFoodKeyword)),
    [publicFoodKeyword, publicFoods],
  )

  /** 打开公共食材弹窗。 */
  const openPublicFoodModal = async () => {
    setIsPublicModalOpen(true)
    await onOpenPublicFoods()
  }

  /** AntD 食材表格列配置。 */
  const foodColumns = useMemo<TableProps<Food>['columns']>(
    () => [
      {
        dataIndex: 'name',
        title: '名称',
        width: 150,
        render: (name: Food['name']) => <strong className="food-name-cell">{name}</strong>,
      },
      {
        dataIndex: 'protein',
        title: '蛋白质(g)',
        width: 130,
        render: (value: Food['protein']) => `${value} g`,
      },
      {
        dataIndex: 'carbs',
        title: '碳水(g)',
        width: 120,
        render: (value: Food['carbs']) => `${value} g`,
      },
      {
        dataIndex: 'fat',
        title: '脂肪(g)',
        width: 120,
        render: (value: Food['fat']) => `${value} g`,
      },
      {
        dataIndex: 'calories',
        title: '热量(kcal)',
        width: 130,
        render: (value: Food['calories']) => `${value} kcal`,
      },
      {
        key: 'tags',
        title: '标签',
        width: 150,
        render: (_: unknown, food) => {
          const tags = getFoodTags(food)

          return (
            <div className="food-tag-list">
              {(tags.length > 0 ? tags : ['常规']).map((tag) => (
                <span className={tag === '常规' ? 'food-tag is-muted' : 'food-tag'} key={tag}>{tag}</span>
              ))}
            </div>
          )
        },
      },
      {
        dataIndex: 'remark',
        title: '备注',
        width: 220,
        render: (_: Food['remark'], food) => <span className="food-remark-cell">{getFoodRemarkText(food)}</span>,
      },
      {
        align: 'right',
        className: 'food-actions-column',
        key: 'actions',
        title: '操作',
        fixed: 'right',
        width: 92,
        render: (_: unknown, food) => (
          <div className="food-row-actions">
            <Button
              aria-label={`编辑${food.name}`}
              className="table-action"
              icon={<Pencil size={15} />}
              type="text"
              onClick={() => onEditFood(food)}
            />
            <Button
              aria-label={`删除${food.name}`}
              className="table-action"
              icon={<Trash2 size={15} />}
              type="text"
              onClick={() => onRemoveFood(food.id)}
            />
          </div>
        ),
      },
    ],
    [onEditFood, onRemoveFood],
  )

  /** 公共食材表格列配置。 */
  const publicFoodColumns = useMemo<TableProps<Food>['columns']>(
    () => [
      {
        dataIndex: 'name',
        title: '名称',
        render: (name: Food['name']) => <strong className="food-name-cell">{name}</strong>,
      },
      {
        dataIndex: 'protein',
        title: '蛋白质(g)',
        render: (value: Food['protein']) => `${value} g`,
      },
      {
        dataIndex: 'carbs',
        title: '碳水(g)',
        render: (value: Food['carbs']) => `${value} g`,
      },
      {
        dataIndex: 'fat',
        title: '脂肪(g)',
        render: (value: Food['fat']) => `${value} g`,
      },
      {
        dataIndex: 'calories',
        title: '热量(kcal)',
        render: (value: Food['calories']) => `${value} kcal`,
      },
      {
        align: 'right',
        key: 'actions',
        title: '操作',
        width: 110,
        render: (_: unknown, food) => (
          <Button
            className={food.owned ? 'table-action is-owned-food' : 'table-action'}
            disabled={food.owned}
            icon={food.owned ? undefined : <Download size={15} />}
            loading={importingFoodId === food.id}
            type="text"
            onClick={() => onImportFood(food.id)}
          >
            {food.owned ? '我的食材' : '导入'}
          </Button>
        ),
      },
    ],
    [importingFoodId, onImportFood],
  )

  return (
    <section className="food-library-page">
      <div className="food-library-hero">
        <div>
          <p className="app-label">食材数据 · 每 100g</p>
          <h2>
            <Database size={28} />
            食材库
          </h2>
          <p className="muted-text">维护每 100g 食材的碳蛋脂与热量，所有推荐和五餐记录都会使用这里的数据。</p>
        </div>
        <div className="food-library-actions">
          <Button className="ghost-action" icon={<FileDown size={16} />} onClick={openPublicFoodModal}>
            公共库导入
          </Button>
          <Button className="primary-action add-food-action" icon={<Plus size={18} />} type="primary" onClick={onCreateFood}>
            新增食材
          </Button>
        </div>
      </div>

      <div className="food-library-stats">
        <FoodStat label="食材总数" value={`${foods.length}`} />
        <FoodStat label="当前结果" value={`${filteredFoods.length}`} />
        <FoodStat label="平均热量" value={`${getAverageCalories(foods)} kcal`} />
        <FoodStat label="数据来源" value={foodSourceLabels[foodSource]} />
      </div>

      <div className="food-library-surface">
        <div className="food-library-toolbar">
          <Input
            allowClear
            className="food-search"
            placeholder="搜索食材名称"
            prefix={<Search size={16} />}
            value={foodKeyword}
            onChange={(event) => {
              setFoodKeyword(event.target.value)
              setFoodPage(1)
            }}
          />
          <Segmented
            className="food-macro-filter"
            options={foodFilterOptions}
            value={foodFilter}
            onChange={(value) => {
              setFoodFilter(value as FoodFilter)
              setFoodPage(1)
            }}
          />
        </div>
        <Table<Food>
          className="food-table"
          columns={foodColumns}
          dataSource={filteredFoods}
          pagination={{
            current: foodPage,
            pageSize: foodPageSize,
            showSizeChanger: false,
            showTotal: (total) => `共 ${total} 条`,
            onChange: setFoodPage,
          }}
          rowKey="id"
          scroll={{ x: 1112 }}
        />
      </div>
      <Modal
        className="food-modal public-food-modal"
        footer={null}
        open={isPublicModalOpen}
        title="公共食材库"
        width={860}
        onCancel={() => setIsPublicModalOpen(false)}
      >
        <div className="public-food-toolbar">
          <Input
            allowClear
            className="food-search"
            placeholder="搜索公共食材"
            prefix={<Search size={16} />}
            value={publicFoodKeyword}
            onChange={(event) => setPublicFoodKeyword(event.target.value)}
          />
          <span>共 {filteredPublicFoods.length} 条</span>
        </div>
        <Table<Food>
          className="food-table public-food-table"
          columns={publicFoodColumns}
          dataSource={filteredPublicFoods}
          loading={loadingPublicFoods}
          pagination={{ pageSize: 8, showSizeChanger: false, showTotal: (total) => `共 ${total} 条` }}
          rowKey={(food) => `${food.id}-${food.owned ? 'mine' : 'public'}`}
          scroll={{ x: 760 }}
        />
      </Modal>
    </section>
  )
}

/** 食材统计项。 */
function FoodStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="food-stat">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

export default FoodLibraryPage
