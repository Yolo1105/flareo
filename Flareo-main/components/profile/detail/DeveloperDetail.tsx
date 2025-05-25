"use client"
import { useState } from "react"
import { Package, DollarSign, Trophy, MessageCircle, Target, BarChart3 } from "lucide-react"
import MyPluginsTable from "./components/MyPluginsTable"
import EarningsTable from "./components/EarningsTable"
import AchievementsPanel from "./components/AchievementsPanel"
import DevInteractionsTable from "./components/DevInteractionsTable"
import OrderRequestsTable from "./components/OrderRequestsTable"
import AnalyticsPanel from "./components/AnalyticsPanel"

const tabs = [
  { id: "plugins", label: "我的插件", icon: Package },
  { id: "orders", label: "接单需求", icon: Target },
  { id: "earnings", label: "收益记录", icon: DollarSign },
  { id: "analytics", label: "数据分析", icon: BarChart3 },
  { id: "achievements", label: "成就排行", icon: Trophy },
  { id: "interactions", label: "互动记录", icon: MessageCircle },
]

export default function DeveloperDetail() {
  const [activeTab, setActiveTab] = useState("plugins")

  const renderTabContent = () => {
    switch (activeTab) {
      case "plugins":
        return <MyPluginsTable />
      case "orders":
        return <OrderRequestsTable />
      case "earnings":
        return <EarningsTable />
      case "analytics":
        return <AnalyticsPanel />
      case "achievements":
        return <AchievementsPanel />
      case "interactions":
        return <DevInteractionsTable />
      default:
        return <MyPluginsTable />
    }
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm w-full">
      {/* Tab 导航栏 - 粘性定位 */}
      <div className="border-b border-gray-200 bg-white sticky top-20 z-30 rounded-t-lg">
        <nav className="flex space-x-8 px-6 overflow-x-auto" aria-label="详细内容导航">
          {tabs.map((tab) => {
            const IconComponent = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center gap-2 py-4 px-1 font-medium text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 whitespace-nowrap ${
                  isActive ? "text-blue-600" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <IconComponent className="w-4 h-4" />
                {tab.label}
                {/* 活跃指示器 */}
                {isActive && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full transition-all duration-200"></div>
                )}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Tab 内容区 */}
      <div className="p-6">
        <div className="space-y-6">{renderTabContent()}</div>
      </div>
    </div>
  )
}
