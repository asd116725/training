import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/** 第三方依赖分包规则。 */
const vendorChunkGroups = [
  {
    name: 'react-vendor',
    priority: 30,
    test: /node_modules[\\/](react|react-dom|scheduler)[\\/]/,
  },
  {
    name: 'antd-vendor',
    priority: 20,
    test: /node_modules[\\/](antd|@ant-design|@rc-component|rc-[^\\/]+|classnames|copy-to-clipboard|throttle-debounce|compute-scroll-into-view|scroll-into-view-if-needed)[\\/]/,
  },
  {
    name: 'utility-vendor',
    priority: 10,
    test: /node_modules[\\/](dayjs|lucide-react)[\\/]/,
  },
]

/** Vite 开发配置。 */
export default defineConfig({
  plugins: [react()],
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: vendorChunkGroups,
        },
      },
    },
  },
  server: {
    proxy: {
      '/api': 'http://127.0.0.1:8080',
    },
  },
})
