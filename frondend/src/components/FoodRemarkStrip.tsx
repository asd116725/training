import { FileText } from 'lucide-react'

/** 食材备注条属性。 */
interface FoodRemarkStripProps {
  remark?: string
}

/** 食材备注横向提示条。 */
export function FoodRemarkStrip({ remark }: FoodRemarkStripProps) {
  const normalizedRemark = remark?.trim()

  if (!normalizedRemark) {
    return null
  }

  return (
    <div className="food-remark-strip">
      <span>
        <FileText size={17} />
        食材备注
      </span>
      <strong>{normalizedRemark}</strong>
    </div>
  )
}
