import type { BulkingDayType, CycleType, MealEntry, MealType, NutritionTotals, Profile, RecommendedItem } from './domain'

/** 应用页面路由。 */
export type AppRoute = 'cutting' | 'bulking' | 'foods'

/** 登录用户。 */
export interface AuthUser {
  id: number
  phone: string
}

/** 登录响应。 */
export interface AuthResponse {
  token: string
  user: AuthUser
}

/** 个人档案初始化状态。 */
export interface ProfileStatus {
  initialized: boolean
  profile: Profile | null
}

/** 登录表单。 */
export interface AuthLoginValues {
  phone: string
  password: string
}

/** 注册表单。 */
export interface AuthRegisterValues extends AuthLoginValues {
  inviteCode: string
}

/** 本地推荐响应结构。 */
export interface RecommendationState {
  source: 'rules' | 'deepseek'
  summary: string
  items: RecommendedItem[]
}

/** 推荐提示词。 */
export interface RecommendationPrompt {
  id: string
  title: string
  content: string
  sortOrder: number
}

/** 推荐提示词表单。 */
export interface RecommendationPromptFormValues {
  title: string
  content: string
}

/** 食材编辑表单。 */
export interface FoodFormValues {
  name: string
  unitName: string
  unitWeight: number
  carbs: number
  protein: number
  fat: number
  calories: number
  remark: string
}

/** 食材编辑草稿表单，允许新增时数字为空。 */
export interface FoodFormDraftValues extends Omit<FoodFormValues, 'carbs' | 'protein' | 'fat' | 'calories' | 'unitWeight'> {
  unitWeight?: number | null
  carbs?: number | null
  protein?: number | null
  fat?: number | null
  calories?: number | null
}

/** 食材编辑器模式。 */
export type FoodEditorMode = 'create' | 'edit'

/** 食材来源状态。 */
export type FoodSource = 'loading' | 'api' | 'local'

/** 个人信息来源状态。 */
export type ProfileSource = 'loading' | 'api' | 'local'

/** 餐食记录来源状态。 */
export type MealSource = 'loading' | 'api' | 'local'

/** 食材使用次数索引。 */
export type FoodUsageCounts = Record<string, number>

/** 单日餐食状态。 */
export interface MealDayState {
  entries: MealEntry[]
  cuttingCycleType: CycleType
  bulkingDayType: BulkingDayType
}

/** 已跳过餐次状态。 */
export type SkippedMeals = Partial<Record<MealType, boolean>>

/** 餐食录入表单。 */
export interface MealFormState {
  meal: MealType
  foodId: string
  quantity: number
}

/** 餐食录入草稿，允许弹窗初始为空。 */
export interface MealDraftFormState {
  meal?: MealType
  foodId?: string
  quantity?: number | null
}

/** 营养素字段展示配置。 */
export interface MacroField {
  key: keyof NutritionTotals
  label: string
  unit: string
}
