"use client"
import { Code, User, Calendar } from "lucide-react"
import type React from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"

export default function ProfileHeader() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const roleParam = searchParams.get("role")
  const role = roleParam === "user" ? "user" : "developer"

  const user = {
    name: "Mohan Lu",
    avatarUrl: "/placeholder.svg?height=64&width=64&query=user avatar",
    tagline: "全栈开发者，专注于 React 和 Node.js 生态",
    joinedAt: "2023-12-29",
  }

  const switchRole = (newRole: "developer" | "user") => {
    if (newRole === role) return

    const params = new URLSearchParams(Array.from(searchParams.entries()))
    params.set("role", newRole)
    router.push(`/profile?${params.toString()}`)
  }

  const handleKeyDown = (e: React.KeyboardEvent, newRole: "developer" | "user") => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      switchRole(newRole)
    }
    // 左右键切换
    if (e.key === "ArrowLeft" && newRole === "user") {
      switchRole("developer")
    }
    if (e.key === "ArrowRight" && newRole === "developer") {
      switchRole("user")
    }
  }

  return (
    <div className="bg-white border-b border-gray-200 shadow-sm">
      <div className="container mx-auto px-6 py-6 max-w-7xl">
        {/* 单行布局：用户信息 + 角色切换器 */}
        <div className="flex items-center justify-between">
          {/* 左侧：头像 + 用户信息 */}
          <div className="flex items-start gap-4">
            {/* 可点击的头像 */}
            <Link href="/profile/edit" className="relative flex-shrink-0 group">
              <img
                src={user.avatarUrl || "/placeholder.svg"}
                alt={`${user.name}的头像`}
                className="w-16 h-16 rounded-full object-cover border-3 border-gray-200 group-hover:border-blue-300 transition-all duration-200 group-hover:shadow-md"
              />
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-3 border-white shadow-sm"></div>
            </Link>

            {/* 用户信息区域 */}
            <div className="flex-1 min-w-0">
              {/* 可点击的名字 */}
              <Link href="/profile/edit" className="group">
                <h1 className="text-2xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-200">
                  {user.name}
                </h1>
              </Link>

              {/* Tagline */}
              <p className="text-gray-600 mt-1 text-sm leading-relaxed">{user.tagline}</p>

              {/* 加入时间 */}
              <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                <Calendar className="w-3 h-3" />
                <span>加入于 {new Date(user.joinedAt).toLocaleDateString("zh-CN")}</span>
              </div>
            </div>
          </div>

          {/* 右侧：完全无框架的角色切换器 */}
          <div className="flex-shrink-0 self-center">
            <div role="tablist" aria-label="角色切换" className="flex items-center gap-1">
              <button
                role="tab"
                aria-selected={role === "developer"}
                onClick={() => switchRole("developer")}
                onKeyDown={(e) => handleKeyDown(e, "developer")}
                title="切换到开发者模式"
                className={`flex items-center gap-1.5 px-3 py-2 font-medium text-sm transition-colors duration-200 bg-transparent border-0 outline-none focus:outline-none active:outline-none cursor-pointer ${
                  role === "developer" ? "text-blue-600 font-semibold" : "text-gray-500 hover:text-gray-700"
                }`}
                style={{
                  background: "none",
                  border: "none",
                  outline: "none",
                  boxShadow: "none",
                }}
              >
                <Code className="w-3.5 h-3.5" />
                开发者
              </button>

              <div className="w-px h-4 bg-gray-300"></div>

              <button
                role="tab"
                aria-selected={role === "user"}
                onClick={() => switchRole("user")}
                onKeyDown={(e) => handleKeyDown(e, "user")}
                title="切换到使用者模式"
                className={`flex items-center gap-1.5 px-3 py-2 font-medium text-sm transition-colors duration-200 bg-transparent border-0 outline-none focus:outline-none active:outline-none cursor-pointer ${
                  role === "user" ? "text-blue-600 font-semibold" : "text-gray-500 hover:text-gray-700"
                }`}
                style={{
                  background: "none",
                  border: "none",
                  outline: "none",
                  boxShadow: "none",
                }}
              >
                <User className="w-3.5 h-3.5" />
                使用者
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
