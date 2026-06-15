import './PageLoading.css'

/** 加载态步骤文案。 */
const pageLoadingSteps = ['同步食材库', '计算碳循环', '载入餐次记录']

/** 页面懒加载占位组件。 */
export function PageLoading() {
  return (
    <div className="page-loading" aria-live="polite" role="status">
      <div className="page-loading-panel">
        <div className="page-loading-orbit" aria-hidden="true">
          <div className="page-loading-ring" />
          <div className="page-loading-core">
            <strong>72</strong>
            <span>%</span>
            <small>营养计划载入</small>
          </div>
        </div>
        <div className="page-loading-copy">
          <h2>正在校准今日训练餐盘</h2>
          <div className="page-loading-steps">
            {pageLoadingSteps.map((step) => (
              <span key={step}>{step}</span>
            ))}
          </div>
          <p>刷新时恢复页面状态，训练数据马上归位</p>
        </div>
      </div>
    </div>
  )
}
