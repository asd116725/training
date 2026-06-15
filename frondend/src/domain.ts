/** 性别选项。 */
export type Gender = 'male' | 'female'

/** 碳循环日类型。 */
export type CycleType = 'high' | 'medium' | 'low'

/** 增肌日类型。 */
export type BulkingDayType = 'training' | 'rest'

/** 训练目标类型。 */
export type PlanType = 'cutting' | 'bulking'

/** 计划日类型。 */
export type PlanDayType = CycleType | BulkingDayType

/** 餐次类型。 */
export type MealType = 'breakfast' | 'lunch' | 'preWorkout' | 'postWorkout' | 'dinner'

/** 个人档案。 */
export interface Profile {
  gender: Gender
  height: number
  weight: number
  age: number
  bodyFat: number
  targetBodyFat: number
  activityLevel: number
}

/** 食材基础信息。 */
export interface Food {
  id: string
  name: string
  unitName: string
  unitWeight: number
  protein: number
  carbs: number
  fat: number
  calories: number
  remark?: string
  owned?: boolean
}

/** 餐食记录。 */
export interface MealEntry {
  id: string
  meal: MealType
  foodId: string
  quantity: number
  unitName: string
  grams: number
}

/** 营养素合计。 */
export interface NutritionTotals {
  calories: number
  protein: number
  carbs: number
  fat: number
}

/** 单日每公斤体重宏量配置。 */
export interface CycleMacroSetting {
  carbsPerKg: number
  proteinPerKg: number
  fatPerKg: number
}

/** 碳循环每公斤体重宏量配置。 */
export type CycleMacroSettings = Record<CycleType, CycleMacroSetting>

/** 增肌每公斤体重宏量配置。 */
export type BulkingMacroSettings = Record<BulkingDayType, CycleMacroSetting>

/** 计算后的每日目标。 */
export interface DailyPlan extends NutritionTotals {
  bmr: number
  tdee: number
  targetWeight: number
  fatToLose: number
}

/** 推荐食材明细。 */
export interface RecommendedItem {
  meal: MealType
  foodName: string
  grams: number
  calories: number
  protein: number
  carbs: number
  fat: number
}

/** 默认食材单位名称。 */
export const defaultFoodUnitName = '克'

/** 默认食材单位重量。 */
export const defaultFoodUnitWeight = 1

/** 食材单位选项。 */
export const foodUnitNames = ['克', '个', '件', '份', '瓶', '盒'] as const

/** 餐次中文名称。 */
export const mealLabels: Record<MealType, string> = {
  breakfast: '早餐',
  lunch: '午餐',
  preWorkout: '练前餐',
  postWorkout: '练后餐',
  dinner: '晚餐',
}

/** 碳循环中文名称。 */
export const cycleLabels: Record<CycleType, string> = {
  high: '高碳日',
  medium: '中碳日',
  low: '低碳日',
}

/** 增肌日型中文名称。 */
export const bulkingDayLabels: Record<BulkingDayType, string> = {
  training: '训练日',
  rest: '休息日',
}

/** 计划中文名称。 */
export const planLabels: Record<PlanType, string> = {
  cutting: '减脂计划',
  bulking: '增肌计划',
}

/** 减脂日型顺序。 */
export const cycleTypes: CycleType[] = ['high', 'medium', 'low']

/** 增肌日型顺序。 */
export const bulkingDayTypes: BulkingDayType[] = ['training', 'rest']

/** 默认碳循环每公斤体重宏量配置。 */
export const defaultCycleMacroSettings: CycleMacroSettings = {
  high: { carbsPerKg: 4.5, proteinPerKg: 2, fatPerKg: 0.6 },
  medium: { carbsPerKg: 3.3, proteinPerKg: 2, fatPerKg: 0.75 },
  low: { carbsPerKg: 1.5, proteinPerKg: 2, fatPerKg: 0.9 },
}

/** 默认增肌每公斤体重宏量配置。 */
export const defaultBulkingMacroSettings: BulkingMacroSettings = {
  training: { carbsPerKg: 5, proteinPerKg: 2, fatPerKg: 1 },
  rest: { carbsPerKg: 4.7, proteinPerKg: 2, fatPerKg: 1 },
}

/** 合并碳循环宏量配置默认值。 */
export function normalizeCycleMacroSettings(settings?: Partial<Record<CycleType, Partial<CycleMacroSetting>>>): CycleMacroSettings {
  return {
    high: { ...defaultCycleMacroSettings.high, ...settings?.high },
    medium: { ...defaultCycleMacroSettings.medium, ...settings?.medium },
    low: { ...defaultCycleMacroSettings.low, ...settings?.low },
  }
}

/** 合并增肌宏量配置默认值。 */
export function normalizeBulkingMacroSettings(
  settings?: Partial<Record<BulkingDayType, Partial<CycleMacroSetting>>>,
): BulkingMacroSettings {
  return {
    training: { ...defaultBulkingMacroSettings.training, ...settings?.training },
    rest: { ...defaultBulkingMacroSettings.rest, ...settings?.rest },
  }
}

/** 默认个人档案。 */
export const defaultProfile: Profile = {
  gender: 'male',
  height: 175,
  weight: 78,
  age: 30,
  bodyFat: 22,
  targetBodyFat: 15,
  activityLevel: 1.55,
}

/** 默认食材库。 */
export const defaultFoods: Food[] = [
  { id: 'chicken-breast', name: '鸡胸肉', unitName: '克', unitWeight: 1, protein: 0.23, carbs: 0, fat: 0.02, calories: 1.1 },
  { id: 'egg', name: '鸡蛋', unitName: '克', unitWeight: 1, protein: 0.13, carbs: 0.01, fat: 0.1, calories: 1.55 },
  { id: 'rice', name: '米饭', unitName: '克', unitWeight: 1, protein: 0.026, carbs: 0.259, fat: 0.003, calories: 1.16 },
  { id: 'oat', name: '燕麦', unitName: '克', unitWeight: 1, protein: 0.169, carbs: 0.663, fat: 0.069, calories: 3.89 },
  { id: 'sweet-potato', name: '红薯', unitName: '克', unitWeight: 1, protein: 0.016, carbs: 0.201, fat: 0.001, calories: 0.86 },
  { id: 'salmon', name: '三文鱼', unitName: '克', unitWeight: 1, protein: 0.2, carbs: 0, fat: 0.13, calories: 2.08 },
  { id: 'broccoli', name: '西兰花', unitName: '克', unitWeight: 1, protein: 0.028, carbs: 0.066, fat: 0.004, calories: 0.34 },
  { id: 'olive-oil', name: '橄榄油', unitName: '克', unitWeight: 1, protein: 0, carbs: 0, fat: 1, calories: 8.84 },
]

/** 默认餐食记录。 */
export const defaultEntries: MealEntry[] = [
  { id: 'entry-1', meal: 'breakfast', foodId: 'oat', quantity: 50, unitName: '克', grams: 50 },
  { id: 'entry-2', meal: 'breakfast', foodId: 'egg', quantity: 100, unitName: '克', grams: 100 },
  { id: 'entry-3', meal: 'lunch', foodId: 'chicken-breast', quantity: 180, unitName: '克', grams: 180 },
  { id: 'entry-4', meal: 'lunch', foodId: 'rice', quantity: 220, unitName: '克', grams: 220 },
]

/** 生成简单唯一标识。 */
export const createId = () => crypto.randomUUID()

/** 保留一位小数。 */
export const roundOne = (value: number) => Math.round(value * 10) / 10

/** 按数量计算食材克重。 */
export function calculateFoodGrams(food: Food, quantity: number) {
  return roundOne(quantity * food.unitWeight)
}

/** 标准化食材单位名称。 */
export function normalizeFoodUnitName(unitName?: string) {
  return unitName?.trim() || defaultFoodUnitName
}

/** 标准化食材单位重量。 */
export function normalizeFoodUnitWeight(unitWeight?: number) {
  return unitWeight && unitWeight > 0 ? unitWeight : defaultFoodUnitWeight
}

/** 按克数计算单个食材营养。 */
export function calculateFoodNutrition(food: Food, grams: number): NutritionTotals {
  const ratio = grams / normalizeFoodUnitWeight(food.unitWeight)

  return {
    calories: roundOne(food.calories * ratio),
    protein: roundOne(food.protein * ratio),
    carbs: roundOne(food.carbs * ratio),
    fat: roundOne(food.fat * ratio),
  }
}

/** 汇总一组营养素。 */
export function sumNutrition(items: NutritionTotals[]): NutritionTotals {
  return items.reduce<NutritionTotals>(
    (total, item) => ({
      calories: roundOne(total.calories + item.calories),
      protein: roundOne(total.protein + item.protein),
      carbs: roundOne(total.carbs + item.carbs),
      fat: roundOne(total.fat + item.fat),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  )
}

/** 标准化本地缓存食材。 */
export function normalizeStoredFoods(foods: Food[]): Food[] {
  return foods.map((food) => {
    const legacyFood = food as Food & { unitName?: string; unitWeight?: number }
    const hasUnitFields = legacyFood.unitName !== undefined || legacyFood.unitWeight !== undefined
    const hasInvalidUnit = !legacyFood.unitName?.trim() || !legacyFood.unitWeight || legacyFood.unitWeight <= 0
    const unitName = normalizeFoodUnitName(legacyFood.unitName)
    const unitWeight = normalizeFoodUnitWeight(legacyFood.unitWeight)

    if (hasUnitFields && !hasInvalidUnit) {
      return { ...food, unitName, unitWeight }
    }

    return {
      ...food,
      unitName,
      unitWeight,
      protein: food.protein / 100,
      carbs: food.carbs / 100,
      fat: food.fat / 100,
      calories: food.calories / 100,
    }
  })
}

/** 标准化本地缓存餐食。 */
export function normalizeStoredEntries(entries: MealEntry[]): MealEntry[] {
  return entries.map((entry) => {
    const legacyEntry = entry as MealEntry & { quantity?: number; unitName?: string }

    return {
      ...entry,
      quantity: legacyEntry.quantity ?? entry.grams,
      unitName: normalizeFoodUnitName(legacyEntry.unitName),
    }
  })
}

/** 根据个人信息和碳循环日计算每日目标。 */
export function calculateDailyPlan(
  profile: Profile,
  cycleType: CycleType,
  macroSettings: CycleMacroSettings = defaultCycleMacroSettings,
): DailyPlan {
  const metrics = calculateProfileMetrics(profile)
  const setting = macroSettings[cycleType]
  const protein = profile.weight * setting.proteinPerKg
  const carbs = profile.weight * setting.carbsPerKg
  const fat = profile.weight * setting.fatPerKg
  const calories = carbs * 4 + protein * 4 + fat * 9

  return {
    bmr: Math.round(metrics.bmr),
    tdee: Math.round(metrics.tdee),
    calories: Math.round(calories),
    protein: Math.round(protein),
    carbs: Math.round(carbs),
    fat: Math.round(fat),
    targetWeight: roundOne(metrics.targetWeight),
    fatToLose: roundOne(metrics.fatToLose),
  }
}

/** 根据个人信息和增肌日型计算每日目标。 */
export function calculateBulkingDailyPlan(
  profile: Profile,
  dayType: BulkingDayType,
  macroSettings: BulkingMacroSettings = defaultBulkingMacroSettings,
): DailyPlan {
  const metrics = calculateProfileMetrics(profile)
  const setting = macroSettings[dayType]
  const protein = profile.weight * setting.proteinPerKg
  const carbs = profile.weight * setting.carbsPerKg
  const fat = profile.weight * setting.fatPerKg
  const calories = carbs * 4 + protein * 4 + fat * 9

  return {
    bmr: Math.round(metrics.bmr),
    tdee: Math.round(metrics.tdee),
    calories: Math.round(calories),
    protein: Math.round(protein),
    carbs: Math.round(carbs),
    fat: Math.round(fat),
    targetWeight: roundOne(metrics.targetWeight),
    fatToLose: roundOne(metrics.fatToLose),
  }
}

/** 计算个人基础代谢和体重目标指标。 */
function calculateProfileMetrics(profile: Profile) {
  const genderOffset = profile.gender === 'male' ? 5 : -161
  const bmr = 10 * profile.weight + 6.25 * profile.height - 5 * profile.age + genderOffset
  const tdee = bmr * profile.activityLevel
  const leanMass = profile.weight * (1 - profile.bodyFat / 100)
  const targetWeight = leanMass / (1 - profile.targetBodyFat / 100)
  const fatToLose = Math.max(0, profile.weight - targetWeight)

  return { bmr, tdee, targetWeight, fatToLose }
}

/** 计算餐食记录的营养合计。 */
export function calculateEntryTotals(entries: MealEntry[], foods: Food[]): NutritionTotals {
  return sumNutrition(
    entries
      .map((entry) => {
        const food = foods.find((item) => item.id === entry.foodId)
        return food ? calculateFoodNutrition(food, entry.grams) : null
      })
      .filter((item): item is NutritionTotals => Boolean(item)),
  )
}

/** 计算剩余营养目标。 */
export function calculateRemaining(target: NutritionTotals, consumed: NutritionTotals): NutritionTotals {
  return {
    calories: Math.max(0, roundOne(target.calories - consumed.calories)),
    protein: Math.max(0, roundOne(target.protein - consumed.protein)),
    carbs: Math.max(0, roundOne(target.carbs - consumed.carbs)),
    fat: Math.max(0, roundOne(target.fat - consumed.fat)),
  }
}

/** 获取需要补全推荐的餐次。 */
export function getTargetRecommendationMeals(
  entries: MealEntry[],
  skippedMeals: Partial<Record<MealType, boolean>> = {},
): MealType[] {
  const usedMeals = new Set(entries.map((entry) => entry.meal))
  const availableMeals = (Object.keys(mealLabels) as MealType[]).filter((meal) => !skippedMeals[meal])
  const emptyMeals = availableMeals.filter((meal) => !usedMeals.has(meal))

  return emptyMeals.length > 0 ? emptyMeals : availableMeals.includes('dinner') ? ['dinner'] : availableMeals.slice(-1)
}
