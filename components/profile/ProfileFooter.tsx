import { Home, HelpCircle, LogOut } from "lucide-react"
import Link from "next/link"

export default function ProfileFooter() {
  return (
    <footer className="bg-white border-t border-gray-200 mt-12">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">© 2025 Flareo. 让插件开发更简单。</div>

          <div className="flex items-center gap-6">
            <Link
              href="/"
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors duration-200"
            >
              <Home className="w-4 h-4" />
              市场首页
            </Link>
            <Link
              href="/help"
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors duration-200"
            >
              <HelpCircle className="w-4 h-4" />
              帮助文档
            </Link>
            <button className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors duration-200">
              <LogOut className="w-4 h-4" />
              退出登录
            </button>
          </div>
        </div>
      </div>
    </footer>
  )
}
