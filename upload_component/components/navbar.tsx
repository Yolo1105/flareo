import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function Navbar() {
  return (
    <header className="border-b bg-white">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="text-2xl font-bold text-primary">
          Plugin Hub
        </Link>

        <nav className="hidden md:flex items-center space-x-6">
          <Link href="/marketplace" className="text-gray-600 hover:text-primary transition-colors">
            插件市场
          </Link>
          <Link href="/docs" className="text-gray-600 hover:text-primary transition-colors">
            开发文档
          </Link>
          <Link href="/community" className="text-gray-600 hover:text-primary transition-colors">
            开发者社区
          </Link>
          <Link href="/dashboard" className="text-primary font-medium">
            我的控制台
          </Link>
        </nav>

        <div className="flex items-center space-x-4">
          <Button variant="outline">切换角色</Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Avatar className="cursor-pointer">
                <AvatarImage src="https://randomuser.me/api/portraits/men/32.jpg" alt="用户头像" />
                <AvatarFallback>用户</AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>我的账户</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>个人资料</DropdownMenuItem>
              <DropdownMenuItem>我的插件</DropdownMenuItem>
              <DropdownMenuItem>收益统计</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>退出登录</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
