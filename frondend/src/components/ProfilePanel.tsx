import { Button } from 'antd'
import { ChevronLeft, ChevronRight, LogOut, Pencil, Target, UserRound } from 'lucide-react'
import type { DailyPlan, Profile } from '../domain'
import { getActivityLevelLabel } from '../profileOptions'
import type { AuthUser, ProfileSource } from '../types'
import { SectionTitle } from './Common'

/** 个人信息来源文案。 */
const profileSourceLabels: Record<ProfileSource, string> = {
  api: '后端数据库',
  loading: '加载中',
  local: '本地缓存',
}

/** 性别展示文案。 */
const genderLabels: Record<Profile['gender'], string> = {
  female: '女',
  male: '男',
}

/** 个人目标面板组件。 */
export function ProfilePanel({
  dailyPlan,
  isCollapsed,
  profile,
  profileSource,
  user,
  onEditProfile,
  onLogout,
  onToggleCollapse,
}: {
  dailyPlan: DailyPlan
  isCollapsed: boolean
  profile: Profile
  profileSource: ProfileSource
  user: AuthUser
  onEditProfile: () => void
  onLogout: () => void
  onToggleCollapse: () => void
}) {
  /** 个人目标面板类名。 */
  const profilePanelClassName = isCollapsed ? 'panel profile-panel is-collapsed' : 'panel profile-panel'

  /** 个人信息展示项。 */
  const profileItems = [
    { label: '性别', value: genderLabels[profile.gender] },
    { label: '身高', value: `${profile.height} cm` },
    { label: '体重', value: `${profile.weight} kg` },
    { label: '年龄', value: `${profile.age} 岁` },
    { label: '当前体脂', value: `${profile.bodyFat} %` },
    { label: '目标体脂', value: `${profile.targetBodyFat} %` },
    { label: '活动水平', value: getActivityLevelLabel(profile.activityLevel) },
  ]

  if (isCollapsed) {
    return (
      <aside className={profilePanelClassName}>
        <button type="button" className="profile-rail-button" onClick={onToggleCollapse} aria-label="展开个人目标">
          <Target size={20} />
          <span>个人目标</span>
          <ChevronRight size={18} />
        </button>
      </aside>
    )
  }

  return (
    <aside className={profilePanelClassName}>
      <div className="section-header">
        <SectionTitle icon={<Target size={18} />} title="个人目标" />
        <div className="profile-actions">
          <Button className="ghost-action" icon={<Pencil size={15} />} onClick={onEditProfile}>
            编辑信息
          </Button>
          <Button
            aria-label="收起个人目标"
            className="ghost-action profile-collapse-action"
            icon={<ChevronLeft size={16} />}
            onClick={onToggleCollapse}
          />
        </div>
      </div>
      <div className="profile-account">
        <span>
          <UserRound size={15} />
          {user.phone}
        </span>
        <Button className="ghost-action profile-logout-action" icon={<LogOut size={14} />} onClick={onLogout}>
          退出
        </Button>
      </div>
      <p className="muted-text profile-source">资料来源：{profileSourceLabels[profileSource]}</p>
      <div className="profile-grid">
        {profileItems.map((item) => (
          <div className="profile-card" key={item.label}>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </div>
        ))}
      </div>
      <div className="profile-result">
        <span>目标体重</span>
        <strong>{dailyPlan.targetWeight} kg</strong>
        <span>预计需减脂</span>
        <strong>{dailyPlan.fatToLose} kg</strong>
      </div>
    </aside>
  )
}
