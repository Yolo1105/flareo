"use client"
import { useSearchParams, useRouter } from "next/navigation"
import { Code, User } from "lucide-react"

export default function RoleSwitcher() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const roleParam = searchParams.get("role")
  const role = roleParam === "user" ? "user" : "developer"

  const switchRole = (newRole: "developer" | "user") => {
    const params = new URLSearchParams(Array.from(searchParams.entries()))
    params.set("role", newRole)
    router.push(`/profile?${params.toString()}`)
  }

  return (
    <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">视图切换</h3>
      <div role="tablist" aria-label="视图切换" className="inline-flex w-full rounded-lg bg-gray-100 p-1">
        <button
          role="tab"
          aria-selected={role === "developer"}
          onClick={() => switchRole("developer")}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
            role === "developer" ? "bg-white text-blue-600 shadow-sm" : "text-gray-600 hover:text-gray-900"
          }`}
        >
          <Code className="w-4 h-4" />
          开发者视图
        </button>
        <button
          role="tab"
          aria-selected={role === "user"}
          onClick={() => switchRole("user")}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
            role === "user" ? "bg-white text-blue-600 shadow-sm" : "text-gray-600 hover:text-gray-900"
          }`}
        >
          <User className="w-4 h-4" />
          使用者视图
        </button>
      </div>
    </div>
  )
}
