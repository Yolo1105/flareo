import { User, Calendar } from "lucide-react"

export default async function UserInfoCard() {
  // TODO: Replace with real session fetch logic (e.g., getServerSession)
  const user = {
    name: "Mohan Lu",
    avatarUrl: "/placeholder.svg?height=80&width=80&query=user avatar",
    bio: "开发者 & 使用者",
    joined: "2024-01-01",
  }

  return (
    <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-200">
      <div className="flex flex-col items-center text-center">
        <div className="relative mb-4">
          <img
            src={user.avatarUrl || "/placeholder.svg"}
            alt={`${user.name}的头像`}
            className="w-20 h-20 rounded-full object-cover border-4 border-gray-100"
          />
          <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white"></div>
        </div>

        <h2 className="text-xl font-semibold text-gray-900 mb-2">{user.name}</h2>
        <p className="text-gray-600 mb-4 flex items-center gap-1">
          <User className="w-4 h-4" />
          {user.bio}
        </p>

        <div className="flex items-center text-sm text-gray-500 bg-gray-50 px-3 py-2 rounded-full">
          <Calendar className="w-4 h-4 mr-2" />
          加入于 {new Date(user.joined).toLocaleDateString("zh-CN")}
        </div>
      </div>
    </div>
  )
}
