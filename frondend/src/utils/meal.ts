import { mealLabels, type MealEntry, type MealType } from '../domain'

/** 餐次顺序。 */
export const mealTypes = Object.keys(mealLabels) as MealType[]

/** 餐次下拉选项。 */
export const mealOptions = mealTypes.map((value) => ({ value, label: mealLabels[value] }))

/** 分组餐食记录。 */
export function groupEntriesByMeal(entries: MealEntry[]) {
  return entries.reduce<Partial<Record<MealType, MealEntry[]>>>((groups, entry) => {
    groups[entry.meal] = [...(groups[entry.meal] ?? []), entry]
    return groups
  }, {})
}
