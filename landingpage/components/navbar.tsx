"use client"

import Link from "next/link"
import Image from "next/image"
import { useState } from "react"

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="navbar">
      <div className="container d-flex justify-content-between align-items-center">
        <Link href="/" className="navbar-brand">
          Plugin Hub
        </Link>

        <button className="mobile-nav-toggle d-md-none" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          <i className="ri-menu-line"></i>
        </button>

        <div className="search-bar d-none d-md-block">
          <i className="ri-search-line search-icon"></i>
          <input type="text" className="search-input" placeholder="搜索插件、功能或服务..." />
        </div>

        <ul className={`navbar-nav ${mobileMenuOpen ? "show" : ""}`}>
          <li>
            <Link href="/" className="nav-link active">
              市场
            </Link>
          </li>
          <li>
            <Link href="#" className="nav-link">
              社区
            </Link>
          </li>
          <li>
            <Link href="#" className="nav-link">
              文档
            </Link>
          </li>
          <li>
            <Link href="/upload" className="nav-link">
              定制服务
            </Link>
          </li>
          <li>
            <div className="dropdown">
              <button className="btn btn-outline">
                <Image
                  src="https://randomuser.me/api/portraits/men/32.jpg"
                  alt="用户头像"
                  className="avatar avatar-sm"
                  width={24}
                  height={24}
                  style={{ marginRight: "var(--spacing-2)" }}
                />
                张小明 <i className="ri-arrow-down-s-line"></i>
              </button>
            </div>
          </li>
        </ul>
      </div>
    </header>
  )
}
