import { Button, Tooltip } from 'antd'
import { Activity, ArrowDown, ArrowUp, CircleHelp, SlidersHorizontal } from 'lucide-react'
import { macroFields } from '../config'
import type { DailyPlan, NutritionTotals, PlanDayType } from '../domain'
import { MacroBar, SectionTitle } from './Common'

/** 热量术语说明文案。 */
const calorieTermTips = {
  BMR: '基础代谢率：身体在静息状态下维持呼吸、心跳等生命活动所需的每日热量。',
  TDEE: '每日总能量消耗：基础代谢加上日常活动和运动后，一天大约消耗的总热量。',
}

/** 热量读数单元组件。 */
function CalorieReadout({ label, tip, value, unit }: { label: string; tip?: string; value: number; unit: string }) {
  return (
    <div className="calorie-readout">
      <div className="calorie-readout-label">
        <span>{label}</span>
        {tip && (
          <Tooltip overlayClassName="calorie-term-tooltip" placement="top" title={tip}>
            <button aria-label={`${label}说明`} className="calorie-tip-trigger" type="button">
              <CircleHelp size={12} strokeWidth={2.4} />
            </button>
          </Tooltip>
        )}
      </div>
      <strong>{value}</strong>
      <i aria-hidden="true" />
      <small>{unit}</small>
    </div>
  )
}

/** 今日目标热量面板组件。 */
export function TargetPanel({
  balanceLabel,
  balanceValue,
  consumed,
  dayLabels,
  dayType,
  dayTypes,
  dailyPlan,
  isSurplusBalance,
  macroSummary,
  onEditCycleMacros,
  onDayTypeChange,
}: {
  balanceLabel: string
  balanceValue: number
  consumed: NutritionTotals
  dayLabels: Record<string, string>
  dayType: PlanDayType
  dayTypes: PlanDayType[]
  dailyPlan: DailyPlan
  isSurplusBalance: boolean
  macroSummary: string
  onEditCycleMacros: () => void
  onDayTypeChange: (type: PlanDayType) => void
}) {
  return (
    <section className="panel target-panel">
      <div className="section-header">
        <SectionTitle icon={<Activity size={18} />} title="今日热量表" />
        <div className="cycle-tools">
          <div className="cycle-switch">
            {dayTypes.map((type) => (
              <button
                key={type}
                type="button"
                className={dayType === type ? 'is-active' : ''}
                onClick={() => onDayTypeChange(type)}
              >
                {dayLabels[type]}
              </button>
            ))}
          </div>
          <Button className="ghost-action cycle-config-action" icon={<SlidersHorizontal size={15} />} onClick={onEditCycleMacros}>
            配置
          </Button>
        </div>
      </div>
      <p className="muted-text cycle-macro-summary">
        {macroSummary}
      </p>
      <div className="calorie-strip">
        <div className="calorie-support">
          <CalorieReadout label="BMR" tip={calorieTermTips.BMR} value={dailyPlan.bmr} unit="kcal" />
          <CalorieReadout label="TDEE" tip={calorieTermTips.TDEE} value={dailyPlan.tdee} unit="kcal" />
        </div>
        <div className="calorie-target">
          <span>目标热量</span>
          <strong>{dailyPlan.calories}</strong>
          <i aria-hidden="true" />
          <small>kcal</small>
        </div>
        <div className={isSurplusBalance ? 'calorie-deficit is-surplus' : 'calorie-deficit'}>
          <span>{balanceLabel}</span>
          <strong>{balanceValue}</strong>
          {isSurplusBalance ? <ArrowUp size={34} strokeWidth={2.6} /> : <ArrowDown size={34} strokeWidth={2.6} />}
          <small>kcal</small>
        </div>
      </div>
      <div className="macro-list">
        {macroFields.map((field) => (
          <MacroBar
            key={field.key}
            label={field.label}
            target={dailyPlan[field.key]}
            consumed={consumed[field.key]}
            unit={field.unit}
          />
        ))}
      </div>
    </section>
  )
}
