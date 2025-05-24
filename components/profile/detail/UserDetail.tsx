"use client"
import { useState } from "react"
import { Server, Heart, Users, MessageCircle } from "lucide-react"
import DeploymentsTable from "./components/DeploymentsTable"
import FavoritesGrid from "./components/FavoritesGrid"
import FollowingGrid from "./components/FollowingGrid"
import UserInteractionsTable from "./components/UserInteractionsTable"

const tabs = [
  { id: "deployments", label: "部署管理", icon: Server },
  { id: "favorites", label: "收藏列表", icon: Heart },
  { id: "following", label: "关注列表", icon: Users },
  { id: "interactions", label: "互动记录", icon: MessageCircle },
]

export default function UserDetail() {
  const [activeTab, setActiveTab] = useState("deployments")

  const renderTabContent = () => {
    switch (activeTab) {
      case "deployments":
        return <DeploymentsTable />
      case "favorites":
        return <FavoritesGrid />
      case "following":
        return <FollowingGrid />
      case "interactions":
        return <UserInteractionsTable />
      default:
        return <DeploymentsTable />
    }
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm w-full">
      {/* Tab 导航栏 - 粘性定位 */}
      <div className="border-b border-gray-200 bg-white sticky top-20 z-30 rounded-t-lg">
        <nav className="flex space-x-8 px-6" aria-label="详细内容导航">
          {tabs.map((tab) => {
            const IconComponent = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center gap-2 py-4 px-1 font-medium text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
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
