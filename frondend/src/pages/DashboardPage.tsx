import { RecommendationPanel } from '../components/RecommendationPanel'
import { TargetPanel } from '../components/TargetPanel'
import { MealPanel } from '../components/MealPanel'
import type {
  DailyPlan,
  Food,
  MealEntry,
  MealType,
  NutritionTotals,
  PlanDayType,
} from '../domain'
import type {
  MealDraftFormState,
  MealSource,
  RecommendationPrompt,
  RecommendationPromptFormValues,
  RecommendationState,
  SkippedMeals,
} from '../types'

/** 训练计划页属性。 */
interface DashboardPageProps {
  balanceLabel: string
  balanceValue: number
  consumed: NutritionTotals
  dayLabels: Record<string, string>
  dayType: PlanDayType
  dayTypes: PlanDayType[]
  dailyPlan: DailyPlan
  foods: Food[]
  importingRecommendationMeal: MealType | null
  isRecommending: boolean
  isSavingPrompt: boolean
  isSurplusBalance: boolean
  mealEntries: Partial<Record<MealType, MealEntry[]>>
  mealForm: MealDraftFormState
  mealSource: MealSource
  macroSummary: string
  orderedRecommendationRequirement: string
  recommendation: RecommendationState | null
  recommendationPrompts: RecommendationPrompt[]
  remaining: NutritionTotals
  selectedDate: string
  skippedMeals: SkippedMeals
  onAddMealEntry: () => void | Promise<void>
  onDayTypeChange: (dayType: PlanDayType) => void
  onEditCycleMacros: () => void
  onEditMealEntry: (entry: MealEntry) => void
  onImportRecommendation: (meal: MealType) => void
  onMealFormChange: (mealForm: MealDraftFormState) => void
  onMovePrompt: (promptId: string, direction: 'up' | 'down') => Promise<void>
  onRemoveMealEntry: (entryId: string) => void
  onRemovePrompt: (promptId: string) => Promise<void>
  onRequestRecommendation: (customRequirement: string) => void
  onResetMeals: () => void
  onRestoreMeal: (meal: MealType) => void
  onSavePrompt: (values: RecommendationPromptFormValues, editingPrompt?: RecommendationPrompt | null) => Promise<void>
  onSkipMeal: (meal: MealType) => void
}

/** 训练计划页面。 */
export function DashboardPage({
  balanceLabel,
  balanceValue,
  consumed,
  dayLabels,
  dayType,
  dayTypes,
  dailyPlan,
  foods,
  importingRecommendationMeal,
  isRecommending,
  isSavingPrompt,
  isSurplusBalance,
  mealEntries,
  mealForm,
  mealSource,
  macroSummary,
  orderedRecommendationRequirement,
  recommendation,
  recommendationPrompts,
  remaining,
  selectedDate,
  skippedMeals,
  onAddMealEntry,
  onDayTypeChange,
  onEditCycleMacros,
  onEditMealEntry,
  onImportRecommendation,
  onMealFormChange,
  onMovePrompt,
  onRemoveMealEntry,
  onRemovePrompt,
  onRequestRecommendation,
  onResetMeals,
  onRestoreMeal,
  onSavePrompt,
  onSkipMeal,
}: DashboardPageProps) {
  return (
    <section className="dashboard-grid">
      <TargetPanel
        balanceLabel={balanceLabel}
        balanceValue={balanceValue}
        consumed={consumed}
        dayLabels={dayLabels}
        dayType={dayType}
        dayTypes={dayTypes}
        dailyPlan={dailyPlan}
        isSurplusBalance={isSurplusBalance}
        macroSummary={macroSummary}
        onEditCycleMacros={onEditCycleMacros}
        onDayTypeChange={onDayTypeChange}
      />
      <RecommendationPanel
        importingRecommendationMeal={importingRecommendationMeal}
        isRecommending={isRecommending}
        isSavingPrompt={isSavingPrompt}
        recommendation={recommendation}
        recommendationRequirement={orderedRecommendationRequirement}
        recommendationPrompts={recommendationPrompts}
        remaining={remaining}
        onImportRecommendation={onImportRecommendation}
        onMovePrompt={onMovePrompt}
        onRemovePrompt={onRemovePrompt}
        onRequestRecommendation={onRequestRecommendation}
        onSavePrompt={onSavePrompt}
      />
      <MealPanel
        foods={foods}
        mealEntries={mealEntries}
        mealForm={mealForm}
        mealSource={mealSource}
        selectedDate={selectedDate}
        skippedMeals={skippedMeals}
        onAddMealEntry={onAddMealEntry}
        onEditMealEntry={onEditMealEntry}
        onMealFormChange={onMealFormChange}
        onRestoreMeal={onRestoreMeal}
        onSkipMeal={onSkipMeal}
        onRemoveMealEntry={onRemoveMealEntry}
        onResetMeals={onResetMeals}
      />
    </section>
  )
}

export default DashboardPage
