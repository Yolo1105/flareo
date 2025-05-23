export default function ChangelogTab() {
  const versions = [
    {
      version: "2.1.0",
      date: "2025-05-18",
      changes: [
        "新增了3D柱状图组件",
        "优化了大数据集的渲染性能，提升约30%",
        "添加了新的主题选项",
        "修复了在某些浏览器中的兼容性问题",
      ],
    },
    {
      version: "2.0.0",
      date: "2025-04-02",
      changes: [
        "完全重写了渲染引擎，大幅提升性能",
        "新增了实时数据支持",
        "添加了10种新图表类型",
        "改进了响应式布局",
        "更新了API设计，提供更直观的接口（不向后兼容）",
      ],
    },
    {
      version: "1.5.2",
      date: "2025-02-15",
      changes: ["修复了数据更新时的闪烁问题", "优化了移动端触摸交互", "改进了工具提示的显示逻辑"],
    },
  ]

  return (
    <div className="prose max-w-none">
      <h3 className="text-xl font-semibold mb-6">更新日志</h3>

      <div className="space-y-8">
        {versions.map((version, index) => (
          <div key={version.version} className="relative pl-6 pb-8">
            {/* 时间线 */}
            {index < versions.length - 1 && (
              <div className="absolute left-2.5 top-3 bottom-0 w-0.5 bg-neutral-200"></div>
            )}

            {/* 版本点 */}
            <div className="absolute left-0 top-2 w-5 h-5 rounded-full bg-indigo-600 border-4 border-white"></div>

            <div>
              <div className="flex items-baseline gap-3 mb-2">
                <h4 className="text-lg font-semibold m-0">版本 {version.version}</h4>
                <span className="text-sm text-neutral-500">{version.date}</span>
              </div>

              <ul className="list-disc pl-5 space-y-1 text-neutral-700">
                {version.changes.map((change, i) => (
                  <li key={i}>{change}</li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
