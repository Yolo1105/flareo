export default function SpecsTab() {
  return (
    <div className="prose max-w-none">
      <h3 className="text-xl font-semibold mb-6">技术规格</h3>

      <div className="space-y-8">
        <div>
          <h4 className="text-lg font-medium mb-3">系统要求</h4>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <table className="min-w-full">
              <tbody>
                <tr className="border-b border-neutral-200">
                  <td className="py-2 pr-4 font-medium text-neutral-700 w-1/3">支持的浏览器</td>
                  <td className="py-2 text-neutral-600">Chrome 80+, Firefox 75+, Safari 13+, Edge 80+</td>
                </tr>
                <tr className="border-b border-neutral-200">
                  <td className="py-2 pr-4 font-medium text-neutral-700">JavaScript 环境</td>
                  <td className="py-2 text-neutral-600">ES6+, React 16.8+ / Vue 3+ / Angular 12+</td>
                </tr>
                <tr className="border-b border-neutral-200">
                  <td className="py-2 pr-4 font-medium text-neutral-700">Node.js 版本</td>
                  <td className="py-2 text-neutral-600">Node.js 14.0.0 或更高版本</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 font-medium text-neutral-700">移动设备支持</td>
                  <td className="py-2 text-neutral-600">iOS 13+, Android 8+</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h4 className="text-lg font-medium mb-3">性能指标</h4>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <table className="min-w-full">
              <tbody>
                <tr className="border-b border-neutral-200">
                  <td className="py-2 pr-4 font-medium text-neutral-700 w-1/3">推荐数据点数量</td>
                  <td className="py-2 text-neutral-600">单图表最多10,000个数据点（无采样）</td>
                </tr>
                <tr className="border-b border-neutral-200">
                  <td className="py-2 pr-4 font-medium text-neutral-700">渲染时间</td>
                  <td className="py-2 text-neutral-600">1,000个数据点 &lt; 100ms</td>
                </tr>
                <tr className="border-b border-neutral-200">
                  <td className="py-2 pr-4 font-medium text-neutral-700">内存占用</td>
                  <td className="py-2 text-neutral-600">单图表约 5-20MB（取决于数据量和图表类型）</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 font-medium text-neutral-700">包大小</td>
                  <td className="py-2 text-neutral-600">核心库: 45KB gzipped, 完整包: 120KB gzipped</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h4 className="text-lg font-medium mb-3">支持的图表类型</h4>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-3 bg-neutral-50 rounded-md">
                <div className="font-medium mb-1">基础图表</div>
                <ul className="list-disc pl-5 text-sm text-neutral-600">
                  <li>折线图</li>
                  <li>柱状图</li>
                  <li>饼图</li>
                  <li>散点图</li>
                  <li>面积图</li>
                </ul>
              </div>
              <div className="p-3 bg-neutral-50 rounded-md">
                <div className="font-medium mb-1">高级图表</div>
                <ul className="list-disc pl-5 text-sm text-neutral-600">
                  <li>热力图</li>
                  <li>雷达图</li>
                  <li>树形图</li>
                  <li>箱线图</li>
                  <li>漏斗图</li>
                </ul>
              </div>
              <div className="p-3 bg-neutral-50 rounded-md">
                <div className="font-medium mb-1">特殊图表</div>
                <ul className="list-disc pl-5 text-sm text-neutral-600">
                  <li>地图可视化</li>
                  <li>关系图</li>
                  <li>词云</li>
                  <li>3D图表</li>
                  <li>仪表盘</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h4 className="text-lg font-medium mb-3">数据格式支持</h4>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <ul className="list-disc pl-5 text-neutral-600">
              <li className="mb-2">JSON (推荐)</li>
              <li className="mb-2">CSV</li>
              <li className="mb-2">Excel (.xlsx, .xls) - 需要额外插件</li>
              <li className="mb-2">实时数据流 (WebSocket)</li>
              <li className="mb-2">REST API</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
