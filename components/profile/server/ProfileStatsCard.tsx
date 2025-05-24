import { Package, Rocket, MessageCircle } from "lucide-react"

export default async function ProfileStatsCard() {
  // TODO: Fetch real stats from database
  const stats = [
    { label: "插件", value: 5, icon: Package, color: "text-blue-600" },
    { label: "部署", value: 12, icon: Rocket, color: "text-green-600" },
    { label: "互动", value: 34, icon: MessageCircle, color: "text-purple-600" },
  ]

  return (
    <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">统计概览</h3>
      <div className="grid grid-cols-3 gap-4">
        {stats.map((stat, index) => {
          const IconComponent = stat.icon
          return (
            <div key={index} className="text-center p-4 bg-gray-50 rounded-lg">
              <div
                className={`inline-flex items-center justify-center w-10 h-10 rounded-full bg-white mb-2 ${stat.color}`}
              >
                <IconComponent className="w-5 h-5" />
              </div>
              <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
