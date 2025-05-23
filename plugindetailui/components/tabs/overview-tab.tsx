import MediaGallery from "@/components/media-gallery"

export default function OverviewTab() {
  const screenshots = [
    { id: 1, src: "/placeholder.svg?height=225&width=400", alt: "截图1" },
    { id: 2, src: "/placeholder.svg?height=225&width=400", alt: "截图2" },
    { id: 3, src: "/placeholder.svg?height=225&width=400", alt: "视频演示" },
  ]

  return (
    <div className="prose max-w-none">
      <h3 className="text-xl font-semibold mb-4">插件描述</h3>
      <p className="text-neutral-700">
        这是一个功能强大的数据可视化工具包，专为现代Web应用设计。它提供了一系列高度可定制的图表组件，帮助开发者轻松创建美观、交互式的仪表盘和数据报告。无论您是需要展示复杂的业务数据，还是监控实时系统指标，这个工具包都能满足您的需求。
      </p>

      <h3 className="text-xl font-semibold mt-6 mb-4">主要功能特点</h3>
      <ul className="list-disc pl-6 text-neutral-700">
        <li className="mb-2">支持多种图表类型：折线图、柱状图、饼图、散点图、雷达图等。</li>
        <li className="mb-2">高度可定制：提供丰富的配置选项，轻松调整样式、颜色和布局。</li>
        <li className="mb-2">交互式体验：支持缩放、平移、提示框、图例交互等。</li>
        <li className="mb-2">响应式设计：图表自动适应不同屏幕尺寸。</li>
        <li className="mb-2">性能优化：采用高效渲染技术，处理大规模数据集。</li>
        <li className="mb-2">易于集成：提供清晰的API和文档，支持React、Vue等主流框架。</li>
        <li className="mb-2">数据源灵活：支持JSON、CSV等多种数据格式。</li>
      </ul>

      <h3 className="text-xl font-semibold mt-6 mb-4">截图与演示</h3>
      <MediaGallery images={screenshots} />

      <h3 className="text-xl font-semibold mt-6 mb-4">使用场景</h3>
      <p className="text-neutral-700">该工具包适用于各种需要数据可视化的场景，例如：</p>
      <ul className="list-disc pl-6 text-neutral-700">
        <li className="mb-2">业务智能（BI）仪表盘</li>
        <li className="mb-2">实时监控系统</li>
        <li className="mb-2">数据分析报告</li>
        <li className="mb-2">金融数据展示</li>
        <li className="mb-2">物联网数据可视化</li>
      </ul>
    </div>
  )
}
