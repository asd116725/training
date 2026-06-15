import { theme } from 'antd'
import type { ThemeConfig } from 'antd'
import type { FoodFormValues, MacroField, MealDraftFormState } from './types'

/** 食材表单默认值。 */
export const defaultFoodForm: FoodFormValues = {
  name: '',
  carbs: 0,
  protein: 0,
  fat: 0,
  calories: 0,
  remark: '',
}

/** AntD 黑色主题配置。 */
export const antdTheme: ThemeConfig = {
  algorithm: theme.darkAlgorithm,
  token: {
    colorPrimary: '#39ff88',
    colorBgBase: '#050706',
    colorBgContainer: '#111713',
    colorBorder: 'rgba(196, 255, 205, 0.18)',
    colorText: '#f4f7ef',
    colorTextSecondary: '#8d9a90',
    borderRadius: 6,
    fontFamily: '"Avenir Next", "PingFang SC", "Microsoft YaHei", system-ui, sans-serif',
  },
}

/** 初始餐食表单。 */
export const initialMealForm: MealDraftFormState = {}

/** 营养素字段展示配置。 */
export const macroFields: MacroField[] = [
  { key: 'calories', label: '热量', unit: 'kcal' },
  { key: 'protein', label: '蛋白质', unit: 'g' },
  { key: 'carbs', label: '碳水', unit: 'g' },
  { key: 'fat', label: '脂肪', unit: 'g' },
]
