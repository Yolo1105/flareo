"use client"
import { useState } from "react"
import { Save, X, User, Mail, Globe, MapPin, FileText, Shield, Bell, Eye } from "lucide-react"
import { useRouter } from "next/navigation"

export default function EditProfileForm() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("basic")
  const [formData, setFormData] = useState({
    // 基本信息
    name: "Mohan Lu",
    bio: "全栈开发者，专注于 React 和 Node.js 生态",
    email: "mohan@example.com",
    website: "https://mohan.dev",
    location: "北京, 中国",
    // 隐私设置
    profileVisibility: "public",
    emailVisibility: "private",
    // 通知设置
    emailNotifications: true,
    pushNotifications: true,
    marketingEmails: false,
  })

  const tabs = [
    { id: "basic", label: "基本信息", icon: User },
    { id: "privacy", label: "隐私设置", icon: Shield },
    { id: "notifications", label: "通知设置", icon: Bell },
  ]

  const handleSave = () => {
    console.log("Saving profile:", formData)
    router.push("/profile")
  }

  const handleCancel = () => {
    router.push("/profile")
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case "basic":
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="w-4 h-4 inline mr-2" />
                  姓名
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="请输入您的姓名"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Mail className="w-4 h-4 inline mr-2" />
                  邮箱
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="your@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Globe className="w-4 h-4 inline mr-2" />
                  个人网站
                </label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="https://your-website.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="w-4 h-4 inline mr-2" />
                  所在地
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="城市, 国家"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FileText className="w-4 h-4 inline mr-2" />
                个人简介
              </label>
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
                placeholder="介绍一下您自己..."
              />
              <p className="text-sm text-gray-500 mt-2">简介将显示在您的个人资料页面上</p>
            </div>
          </div>
        )

      case "privacy":
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                <Eye className="w-4 h-4 inline mr-2" />
                个人资料可见性
              </label>
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="profileVisibility"
                    value="public"
                    checked={formData.profileVisibility === "public"}
                    onChange={(e) => setFormData({ ...formData, profileVisibility: e.target.value })}
                    className="mr-3"
                  />
                  <div>
                    <div className="font-medium text-gray-900">公开</div>
                    <div className="text-sm text-gray-500">任何人都可以查看您的个人资料</div>
                  </div>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="profileVisibility"
                    value="private"
                    checked={formData.profileVisibility === "private"}
                    onChange={(e) => setFormData({ ...formData, profileVisibility: e.target.value })}
                    className="mr-3"
                  />
                  <div>
                    <div className="font-medium text-gray-900">私密</div>
                    <div className="text-sm text-gray-500">只有您自己可以查看完整的个人资料</div>
                  </div>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                <Mail className="w-4 h-4 inline mr-2" />
                邮箱地址可见性
              </label>
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="emailVisibility"
                    value="public"
                    checked={formData.emailVisibility === "public"}
                    onChange={(e) => setFormData({ ...formData, emailVisibility: e.target.value })}
                    className="mr-3"
                  />
                  <div>
                    <div className="font-medium text-gray-900">公开</div>
                    <div className="text-sm text-gray-500">在个人资料中显示邮箱地址</div>
                  </div>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="emailVisibility"
                    value="private"
                    checked={formData.emailVisibility === "private"}
                    onChange={(e) => setFormData({ ...formData, emailVisibility: e.target.value })}
                    className="mr-3"
                  />
                  <div>
                    <div className="font-medium text-gray-900">私密</div>
                    <div className="text-sm text-gray-500">不在个人资料中显示邮箱地址</div>
                  </div>
                </label>
              </div>
            </div>
          </div>
        )

      case "notifications":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">通知偏好</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">邮件通知</div>
                    <div className="text-sm text-gray-500">接收重要更新和活动通知</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.emailNotifications}
                      onChange={(e) => setFormData({ ...formData, emailNotifications: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">推送通知</div>
                    <div className="text-sm text-gray-500">接收浏览器推送通知</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.pushNotifications}
                      onChange={(e) => setFormData({ ...formData, pushNotifications: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">营销邮件</div>
                    <div className="text-sm text-gray-500">接收产品更新和促销信息</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.marketingEmails}
                      onChange={(e) => setFormData({ ...formData, marketingEmails: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      {/* Tab 导航 */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6" aria-label="编辑选项">
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
                {isActive && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full transition-all duration-200"></div>
                )}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Tab 内容 */}
      <div className="p-6">
        {renderTabContent()}

        {/* 操作按钮 */}
        <div className="flex gap-3 mt-8 pt-6 border-t border-gray-200">
          <button
            onClick={handleCancel}
            className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 hover:shadow-md transition-all duration-200 font-medium"
          >
            <X className="w-4 h-4 inline mr-2" />
            取消
          </button>
          <button
            onClick={handleSave}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 hover:shadow-md transition-all duration-200 font-medium"
          >
            <Save className="w-4 h-4" />
            保存更改
          </button>
        </div>
      </div>
    </div>
  )
}
