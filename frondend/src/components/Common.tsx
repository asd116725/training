import type { ReactNode } from 'react'
import { roundOne } from '../domain'

/** 区块标题组件。 */
export function SectionTitle({ icon, title }: { icon: ReactNode; title: string }) {
  return (
    <div className="section-title">
      {icon}
      <h2>{title}</h2>
    </div>
  )
}

/** 状态标签组件。 */
export function StatusPill({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <span className="status-pill">
      {icon}
      {label}
    </span>
  )
}

/** 通用字段组件。 */
export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  )
}

/** 数字字段组件。 */
export function NumberField({
  label,
  value,
  suffix,
  onChange,
}: {
  label: string
  value: number
  suffix: string
  onChange: (value: string) => void
}) {
  return (
    <Field label={label}>
      <div className="number-shell">
        <input type="number" value={value} onChange={(event) => onChange(event.target.value)} />
        <span>{suffix}</span>
      </div>
    </Field>
  )
}

/** 指标展示组件。 */
export function Metric({
  label,
  value,
  unit,
  strong = false,
  variant,
}: {
  label: string
  value: number
  unit: string
  strong?: boolean
  variant?: 'deficit'
}) {
  const className = [
    'metric',
    strong ? 'is-strong' : '',
    variant === 'deficit' ? 'is-deficit' : '',
  ].filter(Boolean).join(' ')

  return (
    <div className={className}>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{unit}</small>
    </div>
  )
}

/** 宏量进度组件。 */
export function MacroBar({
  label,
  target,
  consumed,
  unit,
}: {
  label: string
  target: number
  consumed: number
  unit: string
}) {
  const percent = Math.min(100, Math.round((consumed / target) * 100))

  return (
    <div className="macro-row">
      <div className="macro-copy">
        <strong>{label}</strong>
        <span>
          已吃 {roundOne(consumed)} / 目标 {target} {unit}
        </span>
      </div>
      <div className="macro-track">
        <span style={{ width: `${percent}%` }} />
      </div>
    </div>
  )
}
