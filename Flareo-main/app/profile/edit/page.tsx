import { ArrowLeft, Calendar, Camera } from "lucide-react"
import Link from "next/link"
import EditProfileForm from "@/components/profile/edit/EditProfileForm"

export const metadata = {
  title: "编辑资料 - Flareo",
  description: "编辑你的个人资料信息",
}

export default function EditProfilePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-6 py-4 max-w-4xl">
          <div className="flex items-center gap-4">
            <Link
              href="/profile"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors duration-200"
            >
              <ArrowLeft className="w-4 h-4" />
              返回个人中心
            </Link>
            <div className="h-4 w-px bg-gray-300"></div>
            <h1 className="text-lg font-semibold text-gray-900">编辑个人资料</h1>
          </div>
        </div>
      </div>

      {/* 主要内容 */}
      <div className="container mx-auto px-6 py-8 max-w-4xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 左侧：头像和基本信息 */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
              <div className="text-center">
                <div className="relative inline-block mb-4">
                  <img
                    src="/placeholder.svg?height=120&width=120&query=user avatar"
                    alt="用户头像"
                    className="w-30 h-30 rounded-full object-cover border-4 border-gray-100"
                  />
                  <button className="absolute bottom-0 right-0 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors duration-200 shadow-lg">
                    <Camera className="w-5 h-5" />
                  </button>
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Mohan Lu</h2>
                <p className="text-gray-600 mb-4">全栈开发者，专注于 React 和 Node.js 生态</p>
                <div className="flex items-center justify-center text-sm text-gray-500">
                  <Calendar className="w-4 h-4 mr-2" />
                  加入于 2024年1月
                </div>
              </div>
            </div>

            {/* 快速统计 */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">账户统计</h3>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">插件数量</span>
                  <span className="font-semibold text-gray-900">5</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">总部署</span>
                  <span className="font-semibold text-gray-900">127</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">总收益</span>
                  <span className="font-semibold text-gray-900">$1,234</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">用户评分</span>
                  <span className="font-semibold text-gray-900">4.8/5.0</span>
                </div>
              </div>
            </div>
          </div>

          {/* 右侧：编辑表单 */}
          <div className="lg:col-span-2">
            <EditProfileForm />
          </div>
        </div>
      </div>
    </div>
  )
}
