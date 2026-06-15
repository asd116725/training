import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import { ConfigProvider, DatePicker, Form, message } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import { CalendarDays, Flame } from 'lucide-react'
import 'antd/dist/reset.css'
import './App.css'
import {
  clearAuthToken,
  clearMealEntries,
  createFood,
  createMealEntries,
  createMealEntry,
  createRecommendationPrompt,
  deleteRecommendationPrompt,
  deleteFood,
  deleteMealEntry,
  fetchCurrentUser,
  fetchCycleMacroSettings,
  fetchFoods,
  fetchMealDayState,
  fetchProfileStatus,
  fetchPublicFoods,
  fetchRecommendationPrompts,
  getAuthToken,
  importFood,
  isUnauthorizedApiError,
  loginAuth,
  logoutAuth,
  reorderRecommendationPrompts,
  registerAuth,
  requestApi,
  saveCycleMacroSettings,
  saveMealDayType,
  saveProfile,
  setApiErrorNotifier,
  setAuthToken,
  setUnauthorizedNotifier,
  updateFood,
  updateMealEntry,
  updateRecommendationPrompt,
} from './api'
import { AppNav } from './components/AppNav'
import { FoodDrawer } from './components/FoodDrawer'
import { MealEntryModal } from './components/MealEntryModal'
import { PageLoading } from './components/PageLoading'
import { ProfilePanel } from './components/ProfilePanel'
import { ProfileModal } from './components/ProfileModal'
import { StatusPill } from './components/Common'
import { antdTheme, defaultFoodForm, initialMealForm } from './config'
import {
  bulkingDayLabels,
  bulkingDayTypes,
  calculateBulkingDailyPlan,
  calculateDailyPlan,
  calculateEntryTotals,
  calculateFoodGrams,
  calculateRemaining,
  createId,
  cycleLabels,
  cycleTypes,
  defaultBulkingMacroSettings,
  defaultCycleMacroSettings,
  defaultFoods,
  mealLabels,
  defaultProfile,
  getTargetRecommendationMeals,
  normalizeStoredEntries,
  normalizeStoredFoods,
  normalizeBulkingMacroSettings,
  normalizeCycleMacroSettings,
  planLabels,
  type BulkingDayType,
  type BulkingMacroSettings,
  type CycleMacroSettings,
  type CycleType,
  type DailyPlan,
  type Food,
  type MealEntry,
  type MealType,
  type PlanDayType,
  type PlanType,
  type Profile,
  type RecommendedItem,
} from './domain'
import { readStoredState, useStoredState } from './hooks/useStoredState'
import type {
  AppRoute,
  AuthLoginValues,
  AuthResponse,
  AuthRegisterValues,
  AuthUser,
  FoodFormDraftValues,
  FoodFormValues,
  MealDayState,
  MealDraftFormState,
  FoodSource,
  MealFormState,
  MealSource,
  ProfileSource,
  RecommendationPrompt,
  RecommendationPromptFormValues,
  RecommendationState,
  SkippedMeals,
} from './types'
import { groupEntriesByMeal } from './utils/meal'
import { CycleMacroModal } from './components/CycleMacroModal'

dayjs.locale('zh-cn')

/** 登录注册页懒加载组件。 */
const AuthPage = lazy(() => import('./pages/AuthPage'))

/** 训练计划页懒加载组件。 */
const DashboardPage = lazy(() => import('./pages/DashboardPage'))

/** 食材库页懒加载组件。 */
const FoodLibraryPage = lazy(() => import('./pages/FoodLibraryPage'))

/** 首次建档页懒加载组件。 */
const ProfileSetupPage = lazy(() => import('./pages/ProfileSetupPage'))

/** 应用页面路由列表。 */
const appRoutes: AppRoute[] = ['cutting', 'bulking', 'foods']

/** 当前导航 Tab 本地缓存键。 */
const activeRouteStorageKey = 'training-active-route'

/** 获取本地日期字符串。 */
function getLocalDateString(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/** 判断是否为应用页面路由。 */
function isAppRoute(route: unknown): route is AppRoute {
  return typeof route === 'string' && appRoutes.includes(route as AppRoute)
}

/** 根据地址识别当前页面。 */
function getRouteFromPath(pathname: string): AppRoute {
  if (pathname.startsWith('/foods')) {
    return 'foods'
  }

  return pathname.startsWith('/bulking') ? 'bulking' : 'cutting'
}

/** 将已校验的食材草稿转换为保存数据。 */
function normalizeFoodFormValues(values: FoodFormDraftValues): FoodFormValues {
  const unitName = values.unitName.trim()
  const nutritionFactor = getFoodFormNutritionFactor(unitName)

  return {
    name: values.name,
    unitName,
    unitWeight: Number(values.unitWeight),
    carbs: Number(values.carbs) / nutritionFactor,
    protein: Number(values.protein) / nutritionFactor,
    fat: Number(values.fat) / nutritionFactor,
    calories: Number(values.calories) / nutritionFactor,
    remark: values.remark,
  }
}

/** 获取食材表单营养显示倍率。 */
function getFoodFormNutritionFactor(unitName?: string) {
  return unitName?.trim() === '克' ? 100 : 1
}

/** 转换食材营养为表单展示值。 */
function toFoodFormNutritionValue(value: number, unitName: string) {
  return value * getFoodFormNutritionFactor(unitName)
}

/** 获取本地缓存的导航页面。 */
function getStoredRoute(fallback: AppRoute) {
  try {
    const cachedRoute = localStorage.getItem(activeRouteStorageKey)
    const parsedRoute = cachedRoute ? JSON.parse(cachedRoute) : fallback
    return isAppRoute(parsedRoute) ? parsedRoute : fallback
  } catch {
    return fallback
  }
}

/** 获取初始导航页面。 */
function getInitialRoute() {
  const routeFromPath = getRouteFromPath(window.location.pathname)
  return window.location.pathname === '/' ? getStoredRoute(routeFromPath) : routeFromPath
}

/** 获取页面对应地址。 */
function getPathFromRoute(route: AppRoute) {
  if (route === 'foods') {
    return '/foods'
  }

  return route === 'bulking' ? '/bulking' : '/'
}

/** 根据路由获取当前计划类型。 */
function getPlanTypeFromRoute(route: AppRoute): PlanType {
  return route === 'bulking' ? 'bulking' : 'cutting'
}

/** 创建每公斤宏量摘要。 */
function createMacroSummary(profile: Profile, dailyPlan: DailyPlan) {
  return `每公斤体重：碳水 ${roundMacroPerKg(dailyPlan.carbs, profile.weight)}g · 蛋白 ${roundMacroPerKg(dailyPlan.protein, profile.weight)}g · 脂肪 ${roundMacroPerKg(dailyPlan.fat, profile.weight)}g`
}

/** 计算每公斤宏量并保留一位小数。 */
function roundMacroPerKg(value: number, weight: number) {
  return Math.round((value / weight) * 10) / 10
}

/** 计算热量缺口或盈余。 */
function getCalorieBalance(planType: PlanType, calories: number, tdee: number) {
  return planType === 'bulking'
    ? Math.max(0, Math.round(calories - tdee))
    : Math.max(0, Math.round(tdee - calories))
}

/** 创建餐食本地缓存 key。 */
function createMealCacheKey(date: string, userId?: number) {
  return userId ? `training-user-${userId}-entries-${date}` : `training-entries-${date}`
}

/** 判断是否为减脂日型。 */
function isCycleType(value: unknown): value is CycleType {
  return typeof value === 'string' && cycleTypes.includes(value as CycleType)
}

/** 判断是否为增肌日型。 */
function isBulkingDayType(value: unknown): value is BulkingDayType {
  return typeof value === 'string' && bulkingDayTypes.includes(value as BulkingDayType)
}

/** 创建单日餐食状态。 */
function createMealDayState(
  entries: MealEntry[],
  cuttingCycleType: CycleType = 'medium',
  bulkingDayType: BulkingDayType = 'training',
): MealDayState {
  return { entries: normalizeStoredEntries(entries), cuttingCycleType, bulkingDayType }
}

/** 读取兼容旧格式的餐食缓存。 */
function readMealDayCache(key: string, fallback = createMealDayState([])): MealDayState {
  try {
    const cached = localStorage.getItem(key)

    if (!cached) {
      return fallback
    }

    const parsed = JSON.parse(cached) as unknown

    if (Array.isArray(parsed)) {
      return createMealDayState(parsed as MealEntry[], fallback.cuttingCycleType, fallback.bulkingDayType)
    }

    if (parsed && typeof parsed === 'object' && Array.isArray((parsed as Partial<MealDayState>).entries)) {
      const state = parsed as Partial<MealDayState>
      const entries = state.entries ?? []
      return createMealDayState(
        entries,
        entries.length && isCycleType(state.cuttingCycleType) ? state.cuttingCycleType : fallback.cuttingCycleType,
        entries.length && isBulkingDayType(state.bulkingDayType) ? state.bulkingDayType : fallback.bulkingDayType,
      )
    }

    return fallback
  } catch {
    return fallback
  }
}

/** 写入单日餐食缓存。 */
function writeMealDayCache(key: string, state: MealDayState) {
  const cacheState = state.entries.length ? state : { entries: state.entries }
  localStorage.setItem(key, JSON.stringify(cacheState))
}

/** 创建跳过餐次本地缓存 key。 */
function createMealSkipCacheKey(date: string, userId?: number) {
  return userId ? `training-user-${userId}-skipped-meals-${date}` : `training-skipped-meals-${date}`
}

/** 创建推荐结果本地缓存 key。 */
function createRecommendationCacheKey(date: string, planType: PlanType, userId?: number) {
  return userId
    ? `training-user-${userId}-${planType}-recommendation-v2-${date}`
    : `training-${planType}-recommendation-v2-${date}`
}

/** 按推荐提示词顺序排序。 */
function sortRecommendationPrompts(prompts: RecommendationPrompt[]) {
  return [...prompts].sort((first, second) => first.sortOrder - second.sortOrder || Number(first.id) - Number(second.id))
}

/** 组装按顺序执行的推荐要求。 */
function createOrderedRecommendationRequirement(prompts: RecommendationPrompt[]) {
  const orderedPrompts = prompts.map((prompt, index) => `${index + 1}. ${prompt.title}：${prompt.content}`).join('\n')
  return orderedPrompts ? `请按以下顺序满足推荐要求：\n${orderedPrompts}` : ''
}

/** 推荐接口等待 DeepSeek 的最长时间。 */
const recommendationTimeoutMs = 105000

/** 标准化食材名称用于推荐项匹配。 */
function normalizeFoodName(name: string) {
  return name.trim().toLowerCase()
}

/** 按推荐食材名称匹配食材库。 */
function findFoodByRecommendationName(foods: Food[], foodName: string) {
  const normalizedName = normalizeFoodName(foodName)
  return foods.find((food) => normalizeFoodName(food.name) === normalizedName)
    ?? foods.find((food) => normalizedName.includes(normalizeFoodName(food.name)))
}

/** 将推荐项转换为指定餐次录入表单。 */
function createRecommendedMealForm(item: RecommendedItem, food: Food, meal: MealType): MealFormState {
  return {
    meal,
    foodId: food.id,
    quantity: roundMealQuantity(item.grams / food.unitWeight),
  }
}

/** 判断餐食草稿是否可提交。 */
function isCompleteMealForm(mealForm: MealDraftFormState): mealForm is MealFormState {
  return Boolean(mealForm.meal && mealForm.foodId && mealForm.quantity && mealForm.quantity > 0)
}

/** 基于当前食材快照创建本地餐食记录。 */
function createLocalMealEntry(mealForm: MealFormState, food: Food, id: string = createId()): MealEntry {
  return {
    id,
    meal: mealForm.meal,
    foodId: mealForm.foodId,
    quantity: mealForm.quantity,
    unitName: food.unitName,
    grams: calculateFoodGrams(food, mealForm.quantity),
  }
}

/** 保留适合餐食数量展示的精度。 */
function roundMealQuantity(value: number) {
  return Math.round(value * 100) / 100
}

/** 主应用组件。 */
function App() {
  const [foodForm] = Form.useForm<FoodFormDraftValues>()
  const [profileForm] = Form.useForm<Profile>()
  const [mealEntryForm] = Form.useForm<MealFormState>()
  const [cycleMacroForm] = Form.useForm<CycleMacroSettings>()
  const [bulkingMacroForm] = Form.useForm<BulkingMacroSettings>()
  /** 全局消息提示实例。 */
  const [messageApi, messageContextHolder] = message.useMessage()
  const [activeRoute, setActiveRouteState] = useState<AppRoute>(getInitialRoute)
  const [authUser, setAuthUser] = useState<AuthUser | null>(null)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [isSavingAuth, setIsSavingAuth] = useState(false)
  const [isCheckingProfile, setIsCheckingProfile] = useState(false)
  const [isProfileInitialized, setIsProfileInitialized] = useState(false)
  const [profile, setProfile] = useStoredState<Profile>('training-profile', defaultProfile)
  const [foods, setFoods] = useStoredState<Food[]>('training-foods', defaultFoods, normalizeStoredFoods)
  const [cycleMacroSettings, setCycleMacroSettingsState] = useState<CycleMacroSettings>(() =>
    normalizeCycleMacroSettings(readStoredState('training-cycle-macro-settings', defaultCycleMacroSettings)),
  )
  const [bulkingMacroSettings, setBulkingMacroSettingsState] = useState<BulkingMacroSettings>(() =>
    normalizeBulkingMacroSettings(readStoredState('training-bulking-macro-settings', defaultBulkingMacroSettings)),
  )
  const [selectedDate, setSelectedDate] = useStoredState<string>('training-selected-date', getLocalDateString())
  const [entries, setEntriesState] = useState<MealEntry[]>([])
  const [skippedMeals, setSkippedMealsState] = useState<SkippedMeals>({})
  const [cycleType, setCycleType] = useStoredState<CycleType>('training-cycle', 'medium')
  const [bulkingDayType, setBulkingDayType] = useStoredState<BulkingDayType>('training-bulking-day', 'training')
  const [mealForm, setMealForm] = useState(initialMealForm)
  const [recommendation, setRecommendationState] = useState<RecommendationState | null>(null)
  const [recommendationPrompts, setRecommendationPrompts] = useState<RecommendationPrompt[]>([])
  const [importingRecommendationMeal, setImportingRecommendationMeal] = useState<MealType | null>(null)
  const [isRecommending, setIsRecommending] = useState(false)
  const [isSavingRecommendationPrompt, setIsSavingRecommendationPrompt] = useState(false)
  const [profileSource, setProfileSource] = useState<ProfileSource>('loading')
  const [isCycleMacroModalOpen, setIsCycleMacroModalOpen] = useState(false)
  const [isBulkingMacroModalOpen, setIsBulkingMacroModalOpen] = useState(false)
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [isProfileCollapsed, setIsProfileCollapsed] = useState(false)
  const [mealSource, setMealSource] = useState<MealSource>('loading')
  const [isMealEntryModalOpen, setIsMealEntryModalOpen] = useState(false)
  const [isSavingMealEntry, setIsSavingMealEntry] = useState(false)
  const [editingMealEntry, setEditingMealEntry] = useState<MealEntry | null>(null)
  const [foodSource, setFoodSource] = useState<FoodSource>('loading')
  const [isFoodDrawerOpen, setIsFoodDrawerOpen] = useState(false)
  const [isSavingFood, setIsSavingFood] = useState(false)
  const [editingFood, setEditingFood] = useState<Food | null>(null)
  const [publicFoods, setPublicFoods] = useState<Food[]>([])
  const [isLoadingPublicFoods, setIsLoadingPublicFoods] = useState(false)
  const [importingFoodId, setImportingFoodId] = useState<string | null>(null)
  /** 当前计划类型。 */
  const activePlanType = getPlanTypeFromRoute(activeRoute)
  /** 是否正在展示增肌计划。 */
  const isBulkingPlan = activePlanType === 'bulking'

  /** 更新导航 Tab 并同步本地缓存。 */
  const setActiveRoute = useCallback((route: AppRoute) => {
    setActiveRouteState(route)
    localStorage.setItem(activeRouteStorageKey, JSON.stringify(route))
  }, [])

  /** 更新碳循环宏量配置并同步本地缓存。 */
  const setCycleMacroSettings = useCallback((nextSettings: CycleMacroSettings) => {
    const normalizedSettings = normalizeCycleMacroSettings(nextSettings)
    setCycleMacroSettingsState(normalizedSettings)
    localStorage.setItem('training-cycle-macro-settings', JSON.stringify(normalizedSettings))
  }, [])

  /** 更新增肌宏量配置并同步本地缓存。 */
  const setBulkingMacroSettings = useCallback((nextSettings: BulkingMacroSettings) => {
    const normalizedSettings = normalizeBulkingMacroSettings(nextSettings)
    setBulkingMacroSettingsState(normalizedSettings)
    localStorage.setItem('training-bulking-macro-settings', JSON.stringify(normalizedSettings))
  }, [])

  /** 更新当前日期餐食并同步本地缓存。 */
  const setEntries = useCallback((nextEntries: MealEntry[]) => {
    setEntriesState(nextEntries)
    if (authUser) {
      writeMealDayCache(createMealCacheKey(selectedDate, authUser.id), createMealDayState(nextEntries, cycleType, bulkingDayType))
    }
  }, [authUser, bulkingDayType, cycleType, selectedDate])

  /** 更新当前日期跳过餐次并同步本地缓存。 */
  const setSkippedMeals = useCallback((nextSkippedMeals: SkippedMeals) => {
    setSkippedMealsState(nextSkippedMeals)
    if (authUser) {
      localStorage.setItem(createMealSkipCacheKey(selectedDate, authUser.id), JSON.stringify(nextSkippedMeals))
    }
  }, [authUser, selectedDate])

  /** 更新推荐结果并同步本地缓存。 */
  const setRecommendation = useCallback((nextRecommendation: RecommendationState | null) => {
    setRecommendationState(nextRecommendation)

    if (!authUser) {
      return
    }

    if (nextRecommendation) {
      localStorage.setItem(createRecommendationCacheKey(selectedDate, activePlanType, authUser.id), JSON.stringify(nextRecommendation))
      return
    }

    localStorage.removeItem(createRecommendationCacheKey(selectedDate, activePlanType, authUser.id))
  }, [activePlanType, authUser, selectedDate])

  const dailyPlan = useMemo(() => (
    isBulkingPlan
      ? calculateBulkingDailyPlan(profile, bulkingDayType, bulkingMacroSettings)
      : calculateDailyPlan(profile, cycleType, cycleMacroSettings)
  ), [bulkingDayType, bulkingMacroSettings, cycleMacroSettings, cycleType, isBulkingPlan, profile])
  /** 当前日型。 */
  const dayType: PlanDayType = isBulkingPlan ? bulkingDayType : cycleType
  /** 当前日型中文名称。 */
  const dayLabels: Record<string, string> = isBulkingPlan ? bulkingDayLabels : cycleLabels
  /** 当前日型顺序。 */
  const dayTypes: PlanDayType[] = isBulkingPlan ? bulkingDayTypes : cycleTypes
  /** 当前热量平衡标签。 */
  const balanceLabel = isBulkingPlan ? '热量盈余' : '热量缺口'
  /** 当前热量平衡数值。 */
  const balanceValue = getCalorieBalance(activePlanType, dailyPlan.calories, dailyPlan.tdee)
  /** 当前每公斤宏量摘要。 */
  const macroSummary = createMacroSummary(profile, dailyPlan)
  const consumed = useMemo(() => calculateEntryTotals(entries, foods), [entries, foods])
  const remaining = useMemo(() => calculateRemaining(dailyPlan, consumed), [dailyPlan, consumed])
  const mealEntries = useMemo(() => groupEntriesByMeal(entries), [entries])
  const targetRecommendationMeals = useMemo(() => getTargetRecommendationMeals(entries, skippedMeals), [entries, skippedMeals])
  const orderedRecommendationRequirement = useMemo(
    () => createOrderedRecommendationRequirement(recommendationPrompts),
    [recommendationPrompts],
  )
  /** 应用外壳类名。 */
  const appShellClassName = [
    'app-shell',
    isProfileCollapsed ? 'is-profile-collapsed' : '',
  ].filter(Boolean).join(' ')

  /** 重置登录用户相关的业务状态。 */
  const resetBusinessState = useCallback(() => {
    setProfile(defaultProfile)
    setIsCheckingProfile(false)
    setIsProfileInitialized(false)
    setCycleMacroSettings(defaultCycleMacroSettings)
    setBulkingMacroSettings(defaultBulkingMacroSettings)
    setBulkingDayType('training')
    setEntriesState([])
    setSkippedMealsState({})
    setRecommendationState(null)
    setRecommendationPrompts([])
    setProfileSource('loading')
    setMealSource('loading')
    setFoodSource('loading')
    setMealForm(initialMealForm)
  }, [setBulkingDayType, setBulkingMacroSettings, setCycleMacroSettings, setProfile])

  /** 处理登录成功响应。 */
  const applyAuthResponse = (response: AuthResponse) => {
    resetBusinessState()
    setIsCheckingProfile(true)
    setAuthToken(response.token)
    setAuthUser(response.user)
    window.history.replaceState(null, '', '/')
    setActiveRoute('cutting')
    messageApi.success('登录成功')
  }

  useEffect(() => {
    /** 同步浏览器历史页面。 */
    const syncRoute = () => setActiveRoute(getRouteFromPath(window.location.pathname))

    window.addEventListener('popstate', syncRoute)

    return () => window.removeEventListener('popstate', syncRoute)
  }, [setActiveRoute])

  useEffect(() => {
    /** 展示全局接口错误提示。 */
    const showApiError = (content: string) => {
      messageApi.error({ content, duration: 3, key: 'global-api-error' })
    }

    setApiErrorNotifier(showApiError)
    setUnauthorizedNotifier(() => {
      clearAuthToken()
      setAuthUser(null)
      resetBusinessState()
      messageApi.warning({ content: '登录已失效，请重新登录', duration: 3, key: 'auth-expired' })
    })

    return () => {
      setApiErrorNotifier(null)
      setUnauthorizedNotifier(null)
    }
  }, [messageApi, resetBusinessState])

  useEffect(() => {
    let isMounted = true
    const token = getAuthToken()

    /** 校验本地 token。 */
    const checkAuth = async () => {
      if (!token) {
        setIsCheckingAuth(false)
        return
      }

      try {
        const user = await fetchCurrentUser()
        if (isMounted) {
          setIsCheckingProfile(true)
          setAuthUser(user)
        }
      } catch {
        clearAuthToken()
        if (isMounted) {
          setAuthUser(null)
        }
      } finally {
        if (isMounted) {
          setIsCheckingAuth(false)
        }
      }
    }

    checkAuth()

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    if (!authUser || !isProfileInitialized) {
      return
    }

    const controller = new AbortController()

    /** 从后端加载碳循环宏量配置，失败时保留本地缓存。 */
    const loadCycleMacroSettings = async () => {
      try {
        const remoteSettings = await fetchCycleMacroSettings(controller.signal)
        setCycleMacroSettings(remoteSettings)
      } catch (error) {
        if (isUnauthorizedApiError(error)) {
          return
        }

        setCycleMacroSettings(normalizeCycleMacroSettings(readStoredState('training-cycle-macro-settings', defaultCycleMacroSettings)))
      }
    }

    loadCycleMacroSettings()

    return () => controller.abort()
  }, [authUser, isProfileInitialized, setCycleMacroSettings])

  useEffect(() => {
    if (!authUser || !isProfileInitialized) {
      return
    }

    const controller = new AbortController()

    /** 从后端加载推荐提示词列表。 */
    const loadRecommendationPrompts = async () => {
      try {
        const remotePrompts = await fetchRecommendationPrompts(controller.signal)
        setRecommendationPrompts(sortRecommendationPrompts(remotePrompts))
      } catch (error) {
        if (isUnauthorizedApiError(error)) {
          return
        }

        setRecommendationPrompts([])
      }
    }

    loadRecommendationPrompts()

    return () => controller.abort()
  }, [authUser, isProfileInitialized])

  useEffect(() => {
    if (!authUser) {
      return
    }

    const controller = new AbortController()

    /** 从后端加载个人信息状态。 */
    const loadProfile = async () => {
      setIsCheckingProfile(true)
      setProfileSource('loading')

      try {
        const remoteStatus = await fetchProfileStatus(controller.signal)

        if (remoteStatus.initialized && remoteStatus.profile) {
          setProfile(remoteStatus.profile)
          setProfileSource('api')
          setIsProfileInitialized(true)
          return
        }

        setIsProfileInitialized(false)
      } catch (error) {
        if (isUnauthorizedApiError(error)) {
          return
        }

        setIsProfileInitialized(false)
      } finally {
        setIsCheckingProfile(false)
      }
    }

    loadProfile()

    return () => controller.abort()
  }, [authUser, setProfile])

  useEffect(() => {
    if (!authUser || !isProfileInitialized) {
      return
    }

    const controller = new AbortController()
    const mealCacheKey = createMealCacheKey(selectedDate, authUser.id)
    const cachedMealDayState = readMealDayCache(mealCacheKey)
    const cachedSkippedMeals = readStoredState<SkippedMeals>(createMealSkipCacheKey(selectedDate, authUser.id), {})
    const cachedRecommendation = readStoredState<RecommendationState | null>(
      createRecommendationCacheKey(selectedDate, activePlanType, authUser.id),
      null,
    )

    /** 同步当前日期缓存餐食。 */
    const syncCachedEntries = () => {
      setMealSource('loading')
      setEntriesState(cachedMealDayState.entries)
      setCycleType(cachedMealDayState.cuttingCycleType)
      setBulkingDayType(cachedMealDayState.bulkingDayType)
      setSkippedMealsState(cachedSkippedMeals)
      setRecommendationState(cachedRecommendation)
    }

    /** 从后端加载指定日期餐食，失败时使用本地缓存。 */
    const loadMealEntries = async () => {
      try {
        const remoteMealDayState = await fetchMealDayState(selectedDate, controller.signal)
        setEntriesState(remoteMealDayState.entries)
        setCycleType(remoteMealDayState.cuttingCycleType)
        setBulkingDayType(remoteMealDayState.bulkingDayType)
        writeMealDayCache(mealCacheKey, remoteMealDayState)
        setMealSource('api')
      } catch (error) {
        if (isUnauthorizedApiError(error)) {
          return
        }

        setEntriesState(cachedMealDayState.entries)
        setCycleType(cachedMealDayState.cuttingCycleType)
        setBulkingDayType(cachedMealDayState.bulkingDayType)
        setMealSource('local')
      }
    }

    syncCachedEntries()
    loadMealEntries()

    return () => controller.abort()
  }, [activePlanType, authUser, isProfileInitialized, selectedDate, setBulkingDayType, setCycleType])

  useEffect(() => {
    if (!authUser || !isProfileInitialized) {
      return
    }

    const controller = new AbortController()

    /** 从后端加载食材，失败时保留本地食材。 */
    const loadFoods = async () => {
      try {
        const remoteFoods = await fetchFoods(controller.signal)
        setFoods(remoteFoods)
        setFoodSource('api')
        setMealForm((current) => (current.foodId && !remoteFoods.some((food) => food.id === current.foodId)
          ? { ...current, foodId: undefined }
          : current))
      } catch (error) {
        if (isUnauthorizedApiError(error)) {
          return
        }

        setFoodSource('local')
      }
    }

    loadFoods()

    return () => controller.abort()
  }, [authUser, isProfileInitialized, setFoods])

  /** 打开碳循环宏量配置弹窗。 */
  const openCycleMacroModal = () => {
    cycleMacroForm.setFieldsValue(normalizeCycleMacroSettings(cycleMacroSettings))
    setIsCycleMacroModalOpen(true)
  }

  /** 关闭碳循环宏量配置弹窗。 */
  const closeCycleMacroModal = () => {
    setIsCycleMacroModalOpen(false)
    cycleMacroForm.resetFields()
  }

  /** 提交碳循环宏量配置。 */
  const submitCycleMacroForm = async () => {
    const values = await cycleMacroForm.validateFields()
    const normalizedValues = normalizeCycleMacroSettings(values)

    try {
      const remoteSettings = await saveCycleMacroSettings(normalizedValues)
      setCycleMacroSettings(remoteSettings)
    } catch (error) {
      if (isUnauthorizedApiError(error)) {
        return
      }

      setCycleMacroSettings(normalizedValues)
    } finally {
      closeCycleMacroModal()
    }
  }

  /** 打开增肌宏量配置弹窗。 */
  const openBulkingMacroModal = () => {
    bulkingMacroForm.setFieldsValue(normalizeBulkingMacroSettings(bulkingMacroSettings))
    setIsBulkingMacroModalOpen(true)
  }

  /** 关闭增肌宏量配置弹窗。 */
  const closeBulkingMacroModal = () => {
    setIsBulkingMacroModalOpen(false)
    bulkingMacroForm.resetFields()
  }

  /** 提交增肌宏量配置。 */
  const submitBulkingMacroForm = async () => {
    const values = await bulkingMacroForm.validateFields()
    setBulkingMacroSettings(normalizeBulkingMacroSettings(values))
    closeBulkingMacroModal()
  }

  /** 打开个人信息弹窗。 */
  const openProfileModal = () => {
    profileForm.setFieldsValue(profile)
    setIsProfileModalOpen(true)
  }

  /** 切换个人目标栏展开状态。 */
  const toggleProfileCollapsed = () => {
    setIsProfileCollapsed((collapsed) => !collapsed)
  }

  /** 关闭个人信息弹窗。 */
  const closeProfileModal = () => {
    setIsProfileModalOpen(false)
    profileForm.resetFields()
  }

  /** 保存个人信息到后端。 */
  const saveProfileInfo = async (values: Profile, closeAfterSave = true) => {
    setIsSavingProfile(true)

    try {
      const nextProfile = await saveProfile(values)
      setProfile(nextProfile)
      setProfileSource('api')
      setIsProfileInitialized(true)

      if (closeAfterSave) {
        closeProfileModal()
      }

      return true
    } catch (error) {
      if (isUnauthorizedApiError(error)) {
        return false
      }

      return false
    } finally {
      setIsSavingProfile(false)
    }
  }

  /** 提交个人信息表单。 */
  const submitProfileForm = async () => {
    const values = await profileForm.validateFields()
    await saveProfileInfo(values)
  }

  /** 提交首次建档表单。 */
  const submitProfileSetup = async (values: Profile) => {
    const saved = await saveProfileInfo(values, false)

    if (saved) {
      window.history.replaceState(null, '', '/')
      setActiveRoute('cutting')
    }
  }

  /** 打开新增食材抽屉。 */
  const openCreateFoodDrawer = () => {
    setEditingFood(null)
    foodForm.setFieldsValue(defaultFoodForm)
    setIsFoodDrawerOpen(true)
  }

  /** 打开编辑食材抽屉。 */
  const openEditFoodDrawer = (food: Food) => {
    setEditingFood(food)
    foodForm.setFieldsValue({
      name: food.name,
      unitName: food.unitName,
      unitWeight: food.unitWeight,
      carbs: toFoodFormNutritionValue(food.carbs, food.unitName),
      protein: toFoodFormNutritionValue(food.protein, food.unitName),
      fat: toFoodFormNutritionValue(food.fat, food.unitName),
      calories: toFoodFormNutritionValue(food.calories, food.unitName),
      remark: food.remark ?? '',
    })
    setIsFoodDrawerOpen(true)
  }

  /** 关闭食材抽屉。 */
  const closeFoodDrawer = () => {
    setIsFoodDrawerOpen(false)
    setEditingFood(null)
    foodForm.resetFields()
  }

  /** 保存新增或编辑后的食材。 */
  const saveFood = async (values: FoodFormValues) => {
    setIsSavingFood(true)

    try {
      if (editingFood) {
        const nextFood = foodSource === 'api' ? await updateFood(editingFood.id, values) : { ...editingFood, ...values }
        setFoods(foods.map((food) => (food.id === editingFood.id ? nextFood : food)))
      } else {
        const nextFood = foodSource === 'api' ? await createFood(values) : { ...values, id: createId() }
        setFoods([...foods, nextFood])
      }
      closeFoodDrawer()
    } catch (error) {
      if (isUnauthorizedApiError(error)) {
        return
      }

      setFoodSource('local')
    } finally {
      setIsSavingFood(false)
    }
  }

  /** 提交食材抽屉表单。 */
  const submitFoodForm = async () => {
    const values = normalizeFoodFormValues(await foodForm.validateFields())
    await saveFood(values)
  }

  /** 加载公共食材库。 */
  const loadPublicFoods = async () => {
    setIsLoadingPublicFoods(true)

    try {
      setPublicFoods(await fetchPublicFoods())
    } catch (error) {
      if (isUnauthorizedApiError(error)) {
        return
      }
    } finally {
      setIsLoadingPublicFoods(false)
    }
  }

  /** 从公共食材库导入。 */
  const importPublicFood = async (foodId: string) => {
    setImportingFoodId(foodId)

    try {
      const nextFood = await importFood(foodId)
      setFoods((currentFoods) =>
        currentFoods.some((food) => food.id === nextFood.id) ? currentFoods : [...currentFoods, nextFood],
      )
      await loadPublicFoods()
    } catch (error) {
      if (isUnauthorizedApiError(error)) {
        return
      }
    } finally {
      setImportingFoodId(null)
    }
  }

  /** 取消单个餐次的不吃状态。 */
  const clearSkippedMeal = (meal: MealType) => {
    if (!skippedMeals[meal]) {
      return
    }

    const nextSkippedMeals = { ...skippedMeals }
    delete nextSkippedMeals[meal]
    setSkippedMeals(nextSkippedMeals)
  }

  /** 标记餐次为不吃。 */
  const skipMeal = (meal: MealType) => {
    setSkippedMeals({ ...skippedMeals, [meal]: true })
    setRecommendation(null)
  }

  /** 恢复餐次为待选择。 */
  const restoreMeal = (meal: MealType) => {
    const nextSkippedMeals = { ...skippedMeals }
    delete nextSkippedMeals[meal]
    setSkippedMeals(nextSkippedMeals)
    setRecommendation(null)
  }

  /** 删除食材并清理关联餐食。 */
  const removeFood = async (foodId: string) => {
    try {
      if (foodSource === 'api') {
        await deleteFood(foodId)
      }

      setFoods(foods.filter((food) => food.id !== foodId))
      setEntries(entries.filter((entry) => entry.foodId !== foodId))
      setRecommendation(null)
    } catch (error) {
      if (isUnauthorizedApiError(error)) {
        return
      }

      setFoodSource('local')
    }
  }

  /** 添加餐食记录。 */
  const addMealEntry = async () => {
    if (!isCompleteMealForm(mealForm)) {
      messageApi.warning('请选择餐次、食材并填写数量')
      return
    }

    const selectedFood = foods.find((food) => food.id === mealForm.foodId)

    if (!selectedFood) {
      messageApi.warning('请选择有效食材')
      return
    }

    try {
      const nextEntry = mealSource !== 'local'
        ? await createMealEntry(selectedDate, mealForm, cycleType, bulkingDayType)
        : createLocalMealEntry(mealForm, selectedFood)
      setEntries([...entries, nextEntry])
      clearSkippedMeal(mealForm.meal)
      setRecommendation(null)
      setMealSource(mealSource !== 'local' ? 'api' : 'local')
    } catch (error) {
      if (isUnauthorizedApiError(error)) {
        return
      }

      setMealSource('local')
      setEntries([...entries, createLocalMealEntry(mealForm, selectedFood)])
      clearSkippedMeal(mealForm.meal)
      setRecommendation(null)
    }
  }

  /** 打开餐食编辑弹窗。 */
  const openEditMealEntry = (entry: MealEntry) => {
    setEditingMealEntry(entry)
    mealEntryForm.setFieldsValue({
      foodId: entry.foodId,
      quantity: entry.quantity,
      meal: entry.meal,
    })
    setIsMealEntryModalOpen(true)
  }

  /** 关闭餐食编辑弹窗。 */
  const closeMealEntryModal = () => {
    setIsMealEntryModalOpen(false)
    setEditingMealEntry(null)
    mealEntryForm.resetFields()
  }

  /** 保存餐食修改。 */
  const saveMealEntryInfo = async (values: MealFormState) => {
    if (!editingMealEntry) {
      return
    }

    setIsSavingMealEntry(true)
    const selectedFood = foods.find((food) => food.id === values.foodId)

    if (!selectedFood) {
      messageApi.warning('请选择有效食材')
      setIsSavingMealEntry(false)
      return
    }

    try {
      const nextEntry = mealSource !== 'local'
        ? await updateMealEntry(editingMealEntry.id, selectedDate, values, cycleType, bulkingDayType)
        : createLocalMealEntry(values, selectedFood, editingMealEntry.id)
      setEntries(entries.map((entry) => (entry.id === editingMealEntry.id ? nextEntry : entry)))
      clearSkippedMeal(values.meal)
      setRecommendation(null)
      closeMealEntryModal()
    } catch (error) {
      if (isUnauthorizedApiError(error)) {
        return
      }

      setMealSource('local')
      setEntries(entries.map((entry) => (entry.id === editingMealEntry.id ? createLocalMealEntry(values, selectedFood, entry.id) : entry)))
      clearSkippedMeal(values.meal)
      setRecommendation(null)
      closeMealEntryModal()
    } finally {
      setIsSavingMealEntry(false)
    }
  }

  /** 提交餐食编辑表单。 */
  const submitMealEntryForm = async () => {
    const values = await mealEntryForm.validateFields()
    await saveMealEntryInfo(values)
  }

  /** 删除餐食记录。 */
  const removeMealEntry = async (entryId: string) => {
    try {
      if (mealSource !== 'local') {
        await deleteMealEntry(entryId)
      }

      setEntries(entries.filter((entry) => entry.id !== entryId))
      setRecommendation(null)
    } catch (error) {
      if (isUnauthorizedApiError(error)) {
        return
      }

      setMealSource('local')
    }
  }

  /** 清空当前日期餐食。 */
  const resetMeals = async () => {
    try {
      if (mealSource !== 'local') {
        await clearMealEntries(selectedDate)
      }

      setEntries([])
      setSkippedMeals({})
      setRecommendation(null)
    } catch (error) {
      if (isUnauthorizedApiError(error)) {
        return
      }

      setMealSource('local')
      setEntries([])
      setSkippedMeals({})
      setRecommendation(null)
    }
  }

  /** 请求后端 AI 推荐。 */
  const requestRecommendation = async (customRequirement: string) => {
    setIsRecommending(true)
    const controller = new AbortController()
    const timeoutId = window.setTimeout(() => controller.abort(), recommendationTimeoutMs)

    try {
      const response = await requestApi('/api/recommendations/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          profile,
          cycleType: dayType,
          customRequirement: customRequirement.trim(),
          dailyPlan,
          consumed,
          remaining,
          foods,
          entries,
          skippedMeals,
          targetMeals: targetRecommendationMeals,
        }),
      })
      const data = (await response.json()) as RecommendationState
      setRecommendation(data)
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        messageApi.error('DeepSeek 响应超时，请稍后重试或切换更快模型')
      }
      setRecommendation(null)
    } finally {
      window.clearTimeout(timeoutId)
      setIsRecommending(false)
    }
  }

  /** 保存推荐提示词。 */
  const saveRecommendationPromptForm = async (values: RecommendationPromptFormValues, editingPrompt?: RecommendationPrompt | null) => {
    setIsSavingRecommendationPrompt(true)

    try {
      if (editingPrompt) {
        const updatedPrompt = await updateRecommendationPrompt(editingPrompt.id, values)
        setRecommendationPrompts((currentPrompts) =>
          sortRecommendationPrompts(currentPrompts.map((prompt) => (prompt.id === updatedPrompt.id ? updatedPrompt : prompt))),
        )
        messageApi.success('推荐提示词已更新')
        return
      }

      const createdPrompt = await createRecommendationPrompt(values)
      setRecommendationPrompts((currentPrompts) => sortRecommendationPrompts([...currentPrompts, createdPrompt]))
      messageApi.success('推荐提示词已新增')
    } finally {
      setIsSavingRecommendationPrompt(false)
    }
  }

  /** 移动推荐提示词顺序。 */
  const moveRecommendationPrompt = async (promptId: string, direction: 'up' | 'down') => {
    const currentIndex = recommendationPrompts.findIndex((prompt) => prompt.id === promptId)
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1

    if (currentIndex < 0 || targetIndex < 0 || targetIndex >= recommendationPrompts.length) {
      return
    }

    const nextPrompts = [...recommendationPrompts]
    const movedPrompt = nextPrompts[currentIndex]
    nextPrompts[currentIndex] = nextPrompts[targetIndex]
    nextPrompts[targetIndex] = movedPrompt
    setIsSavingRecommendationPrompt(true)

    try {
      const remotePrompts = await reorderRecommendationPrompts(nextPrompts.map((prompt) => prompt.id))
      setRecommendationPrompts(sortRecommendationPrompts(remotePrompts))
    } finally {
      setIsSavingRecommendationPrompt(false)
    }
  }

  /** 删除推荐提示词。 */
  const removeRecommendationPrompt = async (promptId: string) => {
    setIsSavingRecommendationPrompt(true)

    try {
      await deleteRecommendationPrompt(promptId)
      const nextPrompts = recommendationPrompts.filter((prompt) => prompt.id !== promptId)
      setRecommendationPrompts(nextPrompts)
      messageApi.success('推荐提示词已删除')
    } finally {
      setIsSavingRecommendationPrompt(false)
    }
  }

  /** 将指定餐次的推荐导入当前日期餐食记录。 */
  const importRecommendationByMeal = async (meal: MealType) => {
    const items = recommendation?.items.filter((item) => item.meal === meal) ?? []
    const mealForms = items.flatMap((item) => {
      const food = findFoodByRecommendationName(foods, item.foodName)
      return food ? [createRecommendedMealForm(item, food, meal)] : []
    })
    const skippedCount = items.length - mealForms.length
    const mealLabel = mealLabels[meal]

    if (mealForms.length === 0) {
      messageApi.warning(`没有匹配到食材库中的推荐食材，无法导入${mealLabel}记录`)
      return
    }

    setImportingRecommendationMeal(meal)

    try {
      const nextEntries = mealSource !== 'local'
        ? await createMealEntries(selectedDate, mealForms, cycleType, bulkingDayType)
        : mealForms.flatMap((form) => {
          const food = foods.find((item) => item.id === form.foodId)
          return food ? [createLocalMealEntry(form, food)] : []
        })

      setEntries([...entries, ...nextEntries])
      clearSkippedMeal(meal)
      setMealSource(mealSource !== 'local' ? 'api' : 'local')
      setRecommendation(null)
      messageApi.success(`已导入 ${nextEntries.length} 条${mealLabel}记录`)

      if (skippedCount > 0) {
        messageApi.warning(`有 ${skippedCount} 条推荐食材未匹配到食材库，已跳过`)
      }
    } catch (error) {
      if (!isUnauthorizedApiError(error)) {
        throw error
      }
    } finally {
      setImportingRecommendationMeal(null)
    }
  }

  /** 登录账号。 */
  const login = async (values: AuthLoginValues) => {
    setIsSavingAuth(true)

    try {
      applyAuthResponse(await loginAuth(values))
    } finally {
      setIsSavingAuth(false)
    }
  }

  /** 注册账号。 */
  const register = async (values: AuthRegisterValues) => {
    setIsSavingAuth(true)

    try {
      applyAuthResponse(await registerAuth(values))
    } finally {
      setIsSavingAuth(false)
    }
  }

  /** 退出登录。 */
  const logout = async () => {
    try {
      await logoutAuth()
    } catch {
      /** 退出接口失败也清理本地登录态。 */
    } finally {
      clearAuthToken()
      setAuthUser(null)
      resetBusinessState()
      messageApi.success('已退出登录')
    }
  }

  /** 导航到指定页面。 */
  const navigateRoute = (route: AppRoute) => {
    const nextPath = getPathFromRoute(route)

    if (window.location.pathname !== nextPath) {
      window.history.pushState(null, '', nextPath)
    }

    setActiveRoute(route)
  }

  /** 切换当前计划日型。 */
  const changeDayType = async (nextDayType: PlanDayType) => {
    const nextCycleType = isBulkingPlan ? cycleType : nextDayType as CycleType
    const nextBulkingDayType = isBulkingPlan ? nextDayType as BulkingDayType : bulkingDayType

    if (isBulkingPlan) {
      setBulkingDayType(nextBulkingDayType)
    } else {
      setCycleType(nextCycleType)
    }

    if (authUser) {
      writeMealDayCache(createMealCacheKey(selectedDate, authUser.id), createMealDayState(entries, nextCycleType, nextBulkingDayType))
    }

    setRecommendation(null)

    if (entries.length === 0 || mealSource === 'local') {
      return
    }

    try {
      const remoteMealDayState = await saveMealDayType(selectedDate, activePlanType, nextDayType)
      setEntriesState(remoteMealDayState.entries)
      setCycleType(remoteMealDayState.cuttingCycleType)
      setBulkingDayType(remoteMealDayState.bulkingDayType)
      writeMealDayCache(createMealCacheKey(selectedDate, authUser?.id), remoteMealDayState)
      setMealSource('api')
    } catch (error) {
      if (isUnauthorizedApiError(error)) {
        return
      }

      setMealSource('local')
    }
  }

  if (isCheckingAuth || (authUser && isCheckingProfile)) {
    return (
      <ConfigProvider locale={zhCN} theme={antdTheme}>
        {messageContextHolder}
        <PageLoading />
      </ConfigProvider>
    )
  }

  if (!authUser) {
    return (
      <ConfigProvider locale={zhCN} theme={antdTheme}>
        {messageContextHolder}
        <Suspense fallback={<PageLoading />}>
          <AuthPage checking={isCheckingAuth} saving={isSavingAuth} onLogin={login} onRegister={register} />
        </Suspense>
      </ConfigProvider>
    )
  }

  if (!isProfileInitialized) {
    return (
      <ConfigProvider locale={zhCN} theme={antdTheme}>
        {messageContextHolder}
        <Suspense fallback={<PageLoading />}>
          <ProfileSetupPage
            checking={isCheckingProfile}
            saving={isSavingProfile}
            userPhone={authUser.phone}
            onLogout={logout}
            onSubmit={submitProfileSetup}
          />
        </Suspense>
      </ConfigProvider>
    )
  }

  return (
    <ConfigProvider locale={zhCN} theme={antdTheme}>
      {messageContextHolder}
      <main className={appShellClassName}>
        <header className="topbar">
          <div className="topbar-brand">
            <p className="app-label">复古铁馆 · {planLabels[activePlanType]} · 本地工具</p>
            <h1>碳训计划</h1>
            <AppNav activeRoute={activeRoute} onNavigate={navigateRoute} />
          </div>
          <div className="topbar-actions">
            <DatePicker
              allowClear={false}
              className="global-date-picker"
              value={dayjs(selectedDate)}
              onChange={(date) => {
                if (date) {
                  setSelectedDate(date.format('YYYY-MM-DD'))
                }
              }}
            />
            <StatusPill icon={<CalendarDays size={16} />} label={dayLabels[dayType]} />
            <StatusPill icon={<Flame size={16} />} label={`${dailyPlan.calories} kcal`} />
          </div>
        </header>

        <ProfilePanel
          dailyPlan={dailyPlan}
          isCollapsed={isProfileCollapsed}
          profile={profile}
          profileSource={profileSource}
          user={authUser}
          onEditProfile={openProfileModal}
          onLogout={logout}
          onToggleCollapse={toggleProfileCollapsed}
        />

        <Suspense fallback={null}>
          {activeRoute === 'foods' ? (
            <FoodLibraryPage
              foodSource={foodSource}
              foods={foods}
              importingFoodId={importingFoodId}
              loadingPublicFoods={isLoadingPublicFoods}
              publicFoods={publicFoods}
              onCreateFood={openCreateFoodDrawer}
              onEditFood={openEditFoodDrawer}
              onImportFood={importPublicFood}
              onOpenPublicFoods={loadPublicFoods}
              onRemoveFood={removeFood}
            />
          ) : (
            <DashboardPage
              balanceLabel={balanceLabel}
              balanceValue={balanceValue}
              consumed={consumed}
              dayLabels={dayLabels}
              dayType={dayType}
              dayTypes={dayTypes}
              dailyPlan={dailyPlan}
              foods={foods}
              importingRecommendationMeal={importingRecommendationMeal}
              isRecommending={isRecommending}
              isSavingPrompt={isSavingRecommendationPrompt}
              isSurplusBalance={isBulkingPlan}
              mealEntries={mealEntries}
              mealForm={mealForm}
              mealSource={mealSource}
              macroSummary={macroSummary}
              orderedRecommendationRequirement={orderedRecommendationRequirement}
              recommendation={recommendation}
              recommendationPrompts={recommendationPrompts}
              remaining={remaining}
              selectedDate={selectedDate}
              skippedMeals={skippedMeals}
              onAddMealEntry={addMealEntry}
              onDayTypeChange={changeDayType}
              onEditCycleMacros={isBulkingPlan ? openBulkingMacroModal : openCycleMacroModal}
              onEditMealEntry={openEditMealEntry}
              onImportRecommendation={importRecommendationByMeal}
              onMealFormChange={setMealForm}
              onMovePrompt={moveRecommendationPrompt}
              onRemoveMealEntry={removeMealEntry}
              onRemovePrompt={removeRecommendationPrompt}
              onRequestRecommendation={requestRecommendation}
              onResetMeals={resetMeals}
              onRestoreMeal={restoreMeal}
              onSavePrompt={saveRecommendationPromptForm}
              onSkipMeal={skipMeal}
            />
          )}
        </Suspense>

        <FoodDrawer
          form={foodForm}
          open={isFoodDrawerOpen}
          saving={isSavingFood}
          mode={editingFood ? 'edit' : 'create'}
          onCancel={closeFoodDrawer}
          onSubmit={submitFoodForm}
        />
        <ProfileModal
          form={profileForm}
          open={isProfileModalOpen}
          saving={isSavingProfile}
          onCancel={closeProfileModal}
          onSubmit={submitProfileForm}
        />
        <MealEntryModal
          foods={foods}
          form={mealEntryForm}
          open={isMealEntryModalOpen}
          saving={isSavingMealEntry}
          onCancel={closeMealEntryModal}
          onSubmit={submitMealEntryForm}
        />
        <CycleMacroModal
          dayLabels={cycleLabels}
          dayTypes={cycleTypes}
          form={cycleMacroForm}
          initialValues={defaultCycleMacroSettings}
          open={isCycleMacroModalOpen}
          title="编辑减脂目标"
          onCancel={closeCycleMacroModal}
          onSubmit={submitCycleMacroForm}
        />
        <CycleMacroModal
          dayLabels={bulkingDayLabels}
          dayTypes={bulkingDayTypes}
          form={bulkingMacroForm}
          initialValues={defaultBulkingMacroSettings}
          open={isBulkingMacroModalOpen}
          title="编辑增肌目标"
          onCancel={closeBulkingMacroModal}
          onSubmit={submitBulkingMacroForm}
        />
      </main>
    </ConfigProvider>
  )
}

export default App
