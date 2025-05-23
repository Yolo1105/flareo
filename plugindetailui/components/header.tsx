import Link from "next/link"

export default function Header() {
  return (
    <header className="bg-neutral-800 text-white py-3">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <div className="font-semibold">Plugin Hub</div>
        <nav className="flex gap-6">
          <Link href="#" className="text-white no-underline hover:text-neutral-200 transition-colors">
            市场
          </Link>
          <Link href="#" className="text-white no-underline hover:text-neutral-200 transition-colors">
            文档
          </Link>
          <Link href="#" className="text-white no-underline hover:text-neutral-200 transition-colors">
            社区
          </Link>
          <Link href="#" className="text-white no-underline hover:text-neutral-200 transition-colors">
            登录
          </Link>
        </nav>
      </div>
    </header>
  )
}
