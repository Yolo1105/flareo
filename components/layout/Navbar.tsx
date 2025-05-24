"use client"

import type React from "react"
import Link from "next/link"
import { useState } from "react"
import { usePathname } from "next/navigation"

const navItems = [
  { name: "探索", href: "/explore" },
  { name: "工坊", href: "/navigator" },
  { name: "社区", href: "/community" },
  { name: "众包", href: "/crowdsourcing" },
  { name: "竞赛", href: "/contest" },
]

const Header: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname()

  return (
    <header className="navbar" style={{ padding: "var(--spacing-3, 1rem) 0", minHeight: "60px" }}>
      <div className="container mx-auto px-4 flex justify-between items-center" style={{ height: "100%" }}>
        <div className="flex items-center" style={{ gap: "var(--spacing-6, 2rem)" }}>
          <Link
            href="/"
            className="navbar-brand flex items-center"
            style={{ fontSize: "1.25rem", textDecoration: "none" }}
          >
            <i
              className="ri-flashlight-line"
              style={{ marginRight: "var(--spacing-2, 0.5rem)", fontSize: "1.25rem", color: "#6366f1" }}
            ></i>
            Flareo
          </Link>

          <ul
            className="navbar-nav hidden md:flex items-center"
            style={{ fontSize: "0.95rem", gap: "var(--spacing-6, 2rem)", margin: 0, padding: 0, listStyle: "none" }}
          >
            {navItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={
                      "nav-link" +
                      (isActive
                        ? " text-indigo-700 font-bold border-b-2 border-indigo-600"
                        : " text-neutral-500")
                    }
                    style={{
                      textDecoration: "none",
                      padding: "var(--spacing-2, 0.5rem) 0",
                      transition: "color 0.2s, border-bottom 0.2s",
                    }}
                  >
                    {item.name}
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>

        <button
          className="mobile-nav-toggle md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          style={{ background: "none", border: "none", fontSize: "1.5rem", cursor: "pointer" }}
        >
          <i className="ri-menu-line"></i>
        </button>

        <button
          className="btn btn-outline hidden md:flex items-center"
          style={{
            fontSize: "0.95rem",
            padding: "var(--spacing-2, 0.5rem) var(--spacing-4, 1rem)",
            border: "1px solid #d1d5db",
            borderRadius: "0.375rem",
            background: "transparent",
            cursor: "pointer",
            textDecoration: "none",
          }}
        >
          <i className="ri-login-circle-line" style={{ marginRight: "var(--spacing-2, 0.5rem)" }}></i>
          Sign In
        </button>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="absolute top-full left-0 w-full bg-white border-t border-gray-200 md:hidden z-50">
            <ul className="navbar-nav p-4" style={{ fontSize: "0.95rem", listStyle: "none", margin: 0 }}>
              {navItems.map((item) => {
                const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))
                return (
                  <li className="mb-2" key={item.href}>
                    <Link
                      href={item.href}
                      className={
                        "nav-link block py-2" +
                        (isActive
                          ? " text-indigo-700 font-bold border-b-2 border-indigo-600"
                          : " text-neutral-500")
                      }
                      onClick={() => setMobileMenuOpen(false)}
                      style={{ textDecoration: "none" }}
                    >
                      {item.name}
                    </Link>
                  </li>
                )
              })}
              <li className="pt-4 border-t border-gray-200">
                <button
                  className="btn btn-outline flex items-center w-full justify-center"
                  style={{
                    fontSize: "0.95rem",
                    padding: "var(--spacing-2, 0.5rem) var(--spacing-4, 1rem)",
                    border: "1px solid #d1d5db",
                    borderRadius: "0.375rem",
                    background: "transparent",
                    cursor: "pointer",
                  }}
                >
                  <i className="ri-login-circle-line" style={{ marginRight: "var(--spacing-2, 0.5rem)" }}></i>
                  Sign In
                </button>
              </li>
            </ul>
          </div>
        )}
      </div>
    </header>
  )
}
export default Header

