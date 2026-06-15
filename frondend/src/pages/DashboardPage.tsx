import { RecommendationPanel } from '../components/RecommendationPanel'
import { TargetPanel } from '../components/TargetPanel'
import { MealPanel } from '../components/MealPanel'
import type {
  CycleMacroSettings,
  CycleType,
  DailyPlan,
  Food,
  MealEntry,
  MealType,
  NutritionTotals,
} from '../domain'
import type {
  MealDraftFormState,
  MealSource,
  RecommendationPrompt,
  RecommendationPromptFormValues,
  RecommendationState,
  SkippedMeals,
} from '../types'

/** 今日计划页属性。 */
interface DashboardPageProps {
  consumed: NutritionTotals
  cycleMacroSettings: CycleMacroSettings
  cycleType: CycleType
  dailyPlan: DailyPlan
  foods: Food[]
  importingRecommendationMeal: MealType | null
  isRecommending: boolean
  isSavingPrompt: boolean
  mealEntries: Partial<Record<MealType, MealEntry[]>>
  mealForm: MealDraftFormState
  mealSource: MealSource
  orderedRecommendationRequirement: string
  recommendation: RecommendationState | null
  recommendationPrompts: RecommendationPrompt[]
  remaining: NutritionTotals
  selectedDate: string
  skippedMeals: SkippedMeals
  onAddMealEntry: () => void | Promise<void>
  onCycleTypeChange: (cycleType: CycleType) => void
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

/** 今日计划页面。 */
export function DashboardPage({
  consumed,
  cycleMacroSettings,
  cycleType,
  dailyPlan,
  foods,
  importingRecommendationMeal,
  isRecommending,
  isSavingPrompt,
  mealEntries,
  mealForm,
  mealSource,
  orderedRecommendationRequirement,
  recommendation,
  recommendationPrompts,
  remaining,
  selectedDate,
  skippedMeals,
  onAddMealEntry,
  onCycleTypeChange,
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
        consumed={consumed}
        cycleMacroSettings={cycleMacroSettings}
        cycleType={cycleType}
        dailyPlan={dailyPlan}
        onEditCycleMacros={onEditCycleMacros}
        onCycleTypeChange={onCycleTypeChange}
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
