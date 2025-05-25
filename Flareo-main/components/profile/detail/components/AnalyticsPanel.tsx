"use client"
import { TrendingUp, Users, DollarSign, Package, BarChart3, PieChart } from "lucide-react"

export default function AnalyticsPanel() {
  const stats = [
    {
      title: "总收入",
      value: "$12,345",
      change: "+12.5%",
      changeType: "positive",
      icon: DollarSign,
    },
    {
      title: "插件下载",
      value: "8,432",
      change: "+8.2%",
      changeType: "positive",
      icon: Package,
    },
    {
      title: "活跃用户",
      value: "1,234",
      change: "-2.1%",
      changeType: "negative",
      icon: Users,
    },
    {
      title: "转化率",
      value: "3.2%",
      change: "+0.5%",
      changeType: "positive",
      icon: TrendingUp,
    },
  ]

  const chartData = [
    { month: "1月", revenue: 2400, downloads: 1200 },
    { month: "2月", revenue: 1398, downloads: 800 },
    { month: "3月", revenue: 9800, downloads: 2000 },
    { month: "4月", revenue: 3908, downloads: 1500 },
    { month: "5月", revenue: 4800, downloads: 1800 },
    { month: "6月", revenue: 3800, downloads: 1600 },
  ]

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">数据分析</h3>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const IconComponent = stat.icon
          return (
            <div key={index} className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className={`text-sm ${stat.changeType === "positive" ? "text-green-600" : "text-red-600"}`}>
                    {stat.change}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                  <IconComponent className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* 图表区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 收入趋势图 */}
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-gray-900">收入趋势</h4>
            <BarChart3 className="w-5 h-5 text-gray-400" />
          </div>
          <div className="h-64 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500">收入趋势图表</p>
              <p className="text-sm text-gray-400">显示过去6个月的收入变化</p>
            </div>
          </div>
        </div>

        {/* 下载分析图 */}
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-gray-900">下载分析</h4>
            <PieChart className="w-5 h-5 text-gray-400" />
          </div>
          <div className="h-64 bg-gradient-to-br from-green-50 to-blue-50 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <PieChart className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500">下载分析图表</p>
              <p className="text-sm text-gray-400">按插件类型分布</p>
            </div>
          </div>
        </div>
      </div>

      {/* 详细数据表格 */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h4 className="text-lg font-semibold text-gray-900">月度数据</h4>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">月份</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">收入</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  下载量
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  增长率
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {chartData.map((data, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{data.month}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${data.revenue}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{data.downloads}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                    +{((data.revenue / 1000) * 2).toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
