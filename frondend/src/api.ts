import {
  defaultFoodUnitName,
  defaultFoodUnitWeight,
  normalizeFoodUnitName,
  normalizeFoodUnitWeight,
  normalizeCycleMacroSettings,
  type BulkingDayType,
  type CycleMacroSettings,
  type CycleType,
  type Food,
  type MealEntry,
  type MealType,
  type PlanDayType,
  type PlanType,
  type Profile,
} from './domain'
import type {
  AuthLoginValues,
  AuthRegisterValues,
  AuthResponse,
  FoodUsageCounts,
  MealFormState,
  FoodFormValues,
  MealDayState,
  ProfileStatus,
  RecommendationPrompt,
  RecommendationPromptFormValues,
} from './types'

/** 登录 token 本地存储 key。 */
export const authTokenKey = 'training-auth-token'

/** 接口错误提示函数。 */
type ApiErrorNotifier = (message: string) => void

/** 未登录回调函数。 */
type UnauthorizedNotifier = () => void

/** 默认接口错误文案。 */
const defaultApiErrorMessage = '接口请求失败，请稍后重试'

/** 当前全局接口错误提示函数。 */
let apiErrorNotifier: ApiErrorNotifier | null = null

/** 当前未登录回调函数。 */
let unauthorizedNotifier: UnauthorizedNotifier | null = null

/** 接口错误。 */
export class ApiError extends Error {
  /** HTTP 状态码。 */
  status: number

  /** 创建接口错误。 */
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

/** 后端食材响应。 */
interface FoodResponse {
  id: number
  name: string
  unitName?: string
  unitWeight?: number
  protein: number
  carbs: number
  fat: number
  calories: number
  remark?: string
  owned?: boolean
}

/** 食材保存请求。 */
type FoodRequest = FoodFormValues

/** 后端推荐提示词响应。 */
interface RecommendationPromptResponse {
  id: number
  title: string
  content: string
  sortOrder: number
}

/** 推荐提示词保存请求。 */
type RecommendationPromptRequest = RecommendationPromptFormValues

/** 后端个人信息响应。 */
interface ProfileResponse extends Profile {
  id: number | null
}

/** 后端个人信息初始化状态响应。 */
interface ProfileStatusResponse {
  initialized: boolean
  profile: ProfileResponse | null
}

/** 后端餐食明细响应。 */
interface MealEntryResponse {
  id: number
  date: string
  mealType: string
  foodId: number
  foodName: string
  quantity?: number
  unitName?: string
  grams: number
  calories: number
  protein: number
  carbs: number
  fat: number
}

/** 后端食材使用次数响应。 */
interface MealFoodUsageResponse {
  foodId: number
  count: number
}

/** 后端单日餐食响应。 */
interface MealDayResponse {
  entries: MealEntryResponse[]
  cuttingCycleType?: string
  bulkingDayType?: string
}

/** 个人信息保存请求。 */
type ProfileRequest = Profile

/** 餐食明细保存请求。 */
interface MealEntryRequest {
  date: string
  mealType: MealType
  foodId: number
  quantity: number
  cuttingCycleType: CycleType
  bulkingDayType: BulkingDayType
}

/** 餐食日型保存请求。 */
interface MealDayTypeRequest {
  date: string
  planType: PlanType
  dayType: PlanDayType
}

/** 碳循环宏量配置响应。 */
type CycleMacroSettingsResponse = CycleMacroSettings

/** 后端餐次到前端餐次映射。 */
const mealTypeMap: Record<string, MealType> = {
  BREAKFAST: 'breakfast',
  DINNER: 'dinner',
  LUNCH: 'lunch',
  POST_WORKOUT: 'postWorkout',
  PRE_WORKOUT: 'preWorkout',
}

/** 设置全局接口错误提示函数。 */
export function setApiErrorNotifier(notifier: ApiErrorNotifier | null) {
  apiErrorNotifier = notifier
}

/** 设置全局未登录回调函数。 */
export function setUnauthorizedNotifier(notifier: UnauthorizedNotifier | null) {
  unauthorizedNotifier = notifier
}

/** 读取登录 token。 */
export function getAuthToken() {
  return localStorage.getItem(authTokenKey)
}

/** 保存登录 token。 */
export function setAuthToken(token: string) {
  localStorage.setItem(authTokenKey, token)
}

/** 清理登录 token。 */
export function clearAuthToken() {
  localStorage.removeItem(authTokenKey)
}

/** 判断是否为未登录错误。 */
export function isUnauthorizedApiError(error: unknown) {
  return error instanceof ApiError && error.status === 401
}

/** 截取适合提示展示的错误文案。 */
function normalizeErrorMessage(message: string) {
  const normalizedMessage = message.trim()
  return normalizedMessage.length > 120 ? `${normalizedMessage.slice(0, 120)}...` : normalizedMessage
}

/** 判断是否为主动取消的接口请求。 */
function isAbortError(error: unknown) {
  return error instanceof Error && error.name === 'AbortError'
}

/** 获取适合展示的接口错误文案。 */
function getApiErrorMessage(error: unknown) {
  if (!(error instanceof Error) || !error.message || error instanceof TypeError) {
    return defaultApiErrorMessage
  }

  return normalizeErrorMessage(error.message)
}

/** 创建请求配置。 */
function createRequestInit(init: RequestInit | undefined, withAuth: boolean) {
  const headers = new Headers(init?.headers)
  const token = getAuthToken()

  if (withAuth && token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  return { ...init, headers }
}

/** 从接口响应体中读取错误文案。 */
async function readResponseErrorMessage(response: Response) {
  const fallbackMessage = `接口请求失败：${response.status}`

  try {
    const contentType = response.headers.get('content-type') ?? ''

    if (contentType.includes('application/json')) {
      const data = (await response.clone().json()) as Partial<Record<string, unknown>>
      const message = data.message ?? data.error ?? data.detail

      if (typeof message === 'string' && message.trim()) {
        return normalizeErrorMessage(message)
      }
    }

    const text = await response.clone().text()
    return text.trim() ? normalizeErrorMessage(text) : fallbackMessage
  } catch {
    return fallbackMessage
  }
}

/** 通知全局接口错误。 */
function notifyApiError(error: unknown) {
  if (isAbortError(error)) {
    return
  }

  apiErrorNotifier?.(getApiErrorMessage(error))
}

/** 将后端食材转换为前端食材。 */
function normalizeFood(food: FoodResponse): Food {
  const hasInvalidUnit = !food.unitName?.trim() || !food.unitWeight || food.unitWeight <= 0
  const shouldScaleFromPerGram = food.calories <= 10 && food.protein <= 1 && food.carbs <= 1 && food.fat <= 1
  const nutritionFactor = shouldScaleFromPerGram ? 100 : 1

  return {
    id: String(food.id),
    name: food.name,
    unitName: hasInvalidUnit ? defaultFoodUnitName : normalizeFoodUnitName(food.unitName),
    unitWeight: hasInvalidUnit ? defaultFoodUnitWeight : normalizeFoodUnitWeight(food.unitWeight),
    protein: food.protein * nutritionFactor,
    carbs: food.carbs * nutritionFactor,
    fat: food.fat * nutritionFactor,
    calories: food.calories * nutritionFactor,
    remark: food.remark ?? '',
    owned: Boolean(food.owned),
  }
}

/** 将后端推荐提示词转换为前端数据。 */
function normalizeRecommendationPrompt(prompt: RecommendationPromptResponse): RecommendationPrompt {
  return {
    id: String(prompt.id),
    title: prompt.title,
    content: prompt.content,
    sortOrder: prompt.sortOrder,
  }
}

/** 将后端个人信息转换为前端个人信息。 */
function normalizeProfile(profile: ProfileResponse): Profile {
  return {
    gender: profile.gender === 'female' ? 'female' : 'male',
    height: profile.height,
    weight: profile.weight,
    age: profile.age,
    bodyFat: profile.bodyFat,
    targetBodyFat: profile.targetBodyFat,
    activityLevel: profile.activityLevel,
  }
}

/** 将后端个人信息状态转换为前端状态。 */
function normalizeProfileStatus(response: ProfileStatusResponse): ProfileStatus {
  return {
    initialized: response.initialized && Boolean(response.profile),
    profile: response.profile ? normalizeProfile(response.profile) : null,
  }
}

/** 将后端餐食明细转换为前端餐食明细。 */
function normalizeMealEntry(entry: MealEntryResponse): MealEntry {
  return {
    id: String(entry.id),
    meal: mealTypeMap[entry.mealType] ?? 'breakfast',
    foodId: String(entry.foodId),
    quantity: entry.quantity ?? entry.grams,
    unitName: normalizeFoodUnitName(entry.unitName),
    grams: entry.grams,
  }
}

/** 转换减脂日型。 */
function normalizeCuttingCycleType(value?: string): CycleType {
  if (value === 'high' || value === 'HIGH') {
    return 'high'
  }
  if (value === 'low' || value === 'LOW') {
    return 'low'
  }
  return 'medium'
}

/** 转换增肌日型。 */
function normalizeBulkingDayType(value?: string): BulkingDayType {
  return value === 'rest' || value === 'REST' ? 'rest' : 'training'
}

/** 转换单日餐食状态。 */
function normalizeMealDayState(response: MealDayResponse): MealDayState {
  return {
    entries: response.entries.map(normalizeMealEntry),
    cuttingCycleType: normalizeCuttingCycleType(response.cuttingCycleType),
    bulkingDayType: normalizeBulkingDayType(response.bulkingDayType),
  }
}

/** 创建餐食保存请求。 */
function createMealEntryRequest(
  date: string,
  mealForm: MealFormState,
  cuttingCycleType: CycleType,
  bulkingDayType: BulkingDayType,
): MealEntryRequest {
  return {
    date,
    mealType: mealForm.meal,
    foodId: Number(mealForm.foodId),
    quantity: mealForm.quantity,
    cuttingCycleType,
    bulkingDayType,
  }
}

/** 校验接口响应是否成功。 */
async function ensureOk(response: Response, notifyUnauthorized: boolean) {
  if (!response.ok) {
    const message = await readResponseErrorMessage(response)

    if (response.status === 401 && notifyUnauthorized) {
      unauthorizedNotifier?.()
    }

    throw new ApiError(message, response.status)
  }
}

/** 发起接口请求并统一通知错误。 */
export async function requestApi(input: RequestInfo | URL, init?: RequestInit) {
  try {
    const response = await fetch(input, createRequestInit(init, true))
    await ensureOk(response, true)
    return response
  } catch (error) {
    notifyApiError(error)
    throw error
  }
}

/** 发起公开接口请求。 */
async function requestPublicApi(input: RequestInfo | URL, init?: RequestInit) {
  try {
    const response = await fetch(input, createRequestInit(init, false))
    await ensureOk(response, false)
    return response
  } catch (error) {
    notifyApiError(error)
    throw error
  }
}

/** 注册账号。 */
export async function registerAuth(values: AuthRegisterValues): Promise<AuthResponse> {
  const response = await requestPublicApi('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...values, phone: values.phone.trim(), inviteCode: values.inviteCode.trim().toUpperCase() }),
  })
  return (await response.json()) as AuthResponse
}

/** 登录账号。 */
export async function loginAuth(values: AuthLoginValues): Promise<AuthResponse> {
  const response = await requestPublicApi('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...values, phone: values.phone.trim() }),
  })
  return (await response.json()) as AuthResponse
}

/** 查询当前登录用户。 */
export async function fetchCurrentUser(): Promise<AuthResponse['user']> {
  const response = await requestApi('/api/auth/me')
  return (await response.json()) as AuthResponse['user']
}

/** 退出登录。 */
export async function logoutAuth(): Promise<void> {
  await requestApi('/api/auth/logout', { method: 'POST' })
}

/** 从后端读取个人信息初始化状态。 */
export async function fetchProfileStatus(signal?: AbortSignal): Promise<ProfileStatus> {
  const response = await requestApi('/api/profile', { signal })
  return normalizeProfileStatus((await response.json()) as ProfileStatusResponse)
}

/** 保存个人信息到后端。 */
export async function saveProfile(profile: ProfileRequest): Promise<Profile> {
  const response = await requestApi('/api/profile', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(profile),
  })
  return normalizeProfile((await response.json()) as ProfileResponse)
}

/** 查询碳循环宏量配置。 */
export async function fetchCycleMacroSettings(signal?: AbortSignal): Promise<CycleMacroSettings> {
  const response = await requestApi('/api/cycle-macros', { signal })
  return normalizeCycleMacroSettings((await response.json()) as CycleMacroSettingsResponse)
}

/** 保存碳循环宏量配置。 */
export async function saveCycleMacroSettings(settings: CycleMacroSettings): Promise<CycleMacroSettings> {
  const response = await requestApi('/api/cycle-macros', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(normalizeCycleMacroSettings(settings)),
  })
  return normalizeCycleMacroSettings((await response.json()) as CycleMacroSettingsResponse)
}

/** 查询某天餐食状态。 */
export async function fetchMealDayState(date: string, signal?: AbortSignal): Promise<MealDayState> {
  const response = await requestApi(`/api/meals?date=${encodeURIComponent(date)}`, { signal })
  return normalizeMealDayState((await response.json()) as MealDayResponse)
}

/**
 * 查询食材历史使用次数。
 * @param signal 请求取消信号。
 * @returns 食材使用次数索引。
 */
export async function fetchMealFoodUsage(signal?: AbortSignal): Promise<FoodUsageCounts> {
  const response = await requestApi('/api/meals/food-usage', { signal })
  const usages = (await response.json()) as MealFoodUsageResponse[]

  return usages.reduce<FoodUsageCounts>((counts, usage) => {
    counts[String(usage.foodId)] = usage.count
    return counts
  }, {})
}

/** 新增餐食明细。 */
export async function createMealEntry(
  date: string,
  mealForm: MealFormState,
  cuttingCycleType: CycleType,
  bulkingDayType: BulkingDayType,
): Promise<MealEntry> {
  const response = await requestApi('/api/meals/items', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(createMealEntryRequest(date, mealForm, cuttingCycleType, bulkingDayType)),
  })
  return normalizeMealEntry((await response.json()) as MealEntryResponse)
}

/** 批量新增餐食明细。 */
export async function createMealEntries(
  date: string,
  mealForms: MealFormState[],
  cuttingCycleType: CycleType,
  bulkingDayType: BulkingDayType,
): Promise<MealEntry[]> {
  const response = await requestApi('/api/meals/items/batch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items: mealForms.map((mealForm) => createMealEntryRequest(date, mealForm, cuttingCycleType, bulkingDayType)) }),
  })
  const entries = (await response.json()) as MealEntryResponse[]
  return entries.map(normalizeMealEntry)
}

/** 更新餐食明细。 */
export async function updateMealEntry(
  id: string,
  date: string,
  mealForm: MealFormState,
  cuttingCycleType: CycleType,
  bulkingDayType: BulkingDayType,
): Promise<MealEntry> {
  const response = await requestApi(`/api/meals/items/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(createMealEntryRequest(date, mealForm, cuttingCycleType, bulkingDayType)),
  })
  return normalizeMealEntry((await response.json()) as MealEntryResponse)
}

/** 保存某天绑定日型。 */
export async function saveMealDayType(date: string, planType: PlanType, dayType: PlanDayType): Promise<MealDayState> {
  const request: MealDayTypeRequest = { date, planType, dayType }
  const response = await requestApi('/api/meals/day-type', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })
  return normalizeMealDayState((await response.json()) as MealDayResponse)
}

/** 删除餐食明细。 */
export async function deleteMealEntry(id: string): Promise<void> {
  await requestApi(`/api/meals/items/${id}`, { method: 'DELETE' })
}

/** 清空某天餐食明细。 */
export async function clearMealEntries(date: string): Promise<void> {
  await requestApi(`/api/meals?date=${encodeURIComponent(date)}`, { method: 'DELETE' })
}

/** 从后端读取推荐提示词列表。 */
export async function fetchRecommendationPrompts(signal?: AbortSignal): Promise<RecommendationPrompt[]> {
  const response = await requestApi('/api/recommendation-prompts', { signal })
  const prompts = (await response.json()) as RecommendationPromptResponse[]
  return prompts.map(normalizeRecommendationPrompt)
}

/** 新增推荐提示词。 */
export async function createRecommendationPrompt(values: RecommendationPromptRequest): Promise<RecommendationPrompt> {
  const response = await requestApi('/api/recommendation-prompts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(values),
  })
  return normalizeRecommendationPrompt((await response.json()) as RecommendationPromptResponse)
}

/** 更新推荐提示词。 */
export async function updateRecommendationPrompt(id: string, values: RecommendationPromptRequest): Promise<RecommendationPrompt> {
  const response = await requestApi(`/api/recommendation-prompts/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(values),
  })
  return normalizeRecommendationPrompt((await response.json()) as RecommendationPromptResponse)
}

/** 删除推荐提示词。 */
export async function deleteRecommendationPrompt(id: string): Promise<void> {
  await requestApi(`/api/recommendation-prompts/${id}`, { method: 'DELETE' })
}

/** 保存推荐提示词顺序。 */
export async function reorderRecommendationPrompts(ids: string[]): Promise<RecommendationPrompt[]> {
  const response = await requestApi('/api/recommendation-prompts/order', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ids: ids.map(Number) }),
  })
  const prompts = (await response.json()) as RecommendationPromptResponse[]
  return prompts.map(normalizeRecommendationPrompt)
}

/** 从后端读取食材库。 */
export async function fetchFoods(signal?: AbortSignal): Promise<Food[]> {
  const response = await requestApi('/api/foods', { signal })
  const foods = (await response.json()) as FoodResponse[]
  return foods.map(normalizeFood)
}

/** 从后端读取公共食材库。 */
export async function fetchPublicFoods(signal?: AbortSignal): Promise<Food[]> {
  const response = await requestApi('/api/foods/public', { signal })
  const foods = (await response.json()) as FoodResponse[]
  return foods.map(normalizeFood)
}

/** 保存食材到后端。 */
export async function createFood(food: FoodRequest): Promise<Food> {
  const response = await requestApi('/api/foods', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(food),
  })
  return normalizeFood((await response.json()) as FoodResponse)
}

/** 从公共食材库导入食材。 */
export async function importFood(foodId: string): Promise<Food> {
  const response = await requestApi('/api/foods/import', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ foodId: Number(foodId) }),
  })
  return normalizeFood((await response.json()) as FoodResponse)
}

/** 更新后端食材。 */
export async function updateFood(id: string, food: FoodRequest): Promise<Food> {
  const response = await requestApi(`/api/foods/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(food),
  })
  return normalizeFood((await response.json()) as FoodResponse)
}

/** 从后端删除食材。 */
export async function deleteFood(id: string): Promise<void> {
  await requestApi(`/api/foods/${id}`, { method: 'DELETE' })
}
