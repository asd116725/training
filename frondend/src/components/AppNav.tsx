import { Database, Dumbbell } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { AppRoute } from '../types'

/** 顶部导航配置。 */
const navItems: Array<{ icon: LucideIcon; label: string; route: AppRoute }> = [
  { icon: Dumbbell, label: '减脂计划', route: 'cutting' },
  { icon: Dumbbell, label: '增肌计划', route: 'bulking' },
  { icon: Database, label: '食材库', route: 'foods' },
]

/** 顶部页面导航。 */
export function AppNav({ activeRoute, onNavigate }: { activeRoute: AppRoute; onNavigate: (route: AppRoute) => void }) {
  return (
    <nav className="app-nav" aria-label="主导航">
      {navItems.map((item) => {
        const Icon = item.icon
        const isActive = activeRoute === item.route

        return (
          <button
            className={isActive ? 'app-nav-link is-active' : 'app-nav-link'}
            key={item.route}
            type="button"
            onClick={() => onNavigate(item.route)}
          >
            <Icon size={15} />
            {item.label}
          </button>
        )
      })}
    </nav>
  )
}
