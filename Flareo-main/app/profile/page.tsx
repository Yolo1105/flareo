import React from "react"
import { Suspense } from "react"
import ProfileHeader from "@/components/profile/ProfileHeader"
import ProfileContent from "@/components/profile/ProfileContent"

export const metadata = {
  title: "个人中心 - Flareo",
  description: "在这里查看并管理你的插件、部署、收益和收藏",
}

export default function ProfilePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 第二层：个人资料头部 */}
      <div className="sticky top-0 z-50 bg-white shadow-sm">
        <ProfileHeader />
      </div>

      {/* 主内容区：统一间距 */}
      <main className="py-6">
        <Suspense fallback={<div className="animate-pulse">Loading...</div>}>
          <ProfileContent />
        </Suspense>
      </main>
    </div>
  )
}
