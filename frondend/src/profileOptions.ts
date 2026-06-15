import type { Profile } from './domain'

/** 活动水平下拉选项。 */
export const activityLevelOptions = [
  { label: '久坐少动（系数 1.2）', value: 1.2 },
  { label: '轻度活动 / 每周 1-3 练（系数 1.375）', value: 1.375 },
  { label: '中度活动 / 每周 3-5 练（系数 1.55）', value: 1.55 },
  { label: '高度活动 / 每周 6-7 练（系数 1.725）', value: 1.725 },
  { label: '超高活动 / 体力劳动 + 高强度训练（系数 1.9）', value: 1.9 },
]

/** 活动水平展示文案映射。 */
const activityLevelLabelMap = new Map(activityLevelOptions.map((item) => [String(item.value), item.label] as const))

/** 获取活动水平展示文案。 */
export function getActivityLevelLabel(value: Profile['activityLevel']) {
  return activityLevelLabelMap.get(String(value)) ?? `${value}`
}
