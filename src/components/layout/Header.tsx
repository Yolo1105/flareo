"use client"

import type React from "react"
import Link from "next/link"
import { useState } from "react"

const Header: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

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
            <li>
              <Link
                href="/explore"
                className="nav-link"
                style={{ textDecoration: "none", padding: "var(--spacing-2, 0.5rem) 0" }}
              >
                探索市场
              </Link>
            </li>
            <li>
              <Link
                href="/navigator"
                className="nav-link"
                style={{ textDecoration: "none", padding: "var(--spacing-2, 0.5rem) 0" }}
              >
                工坊
              </Link>
            </li>
            <li>
              <Link
                href="/community"
                className="nav-link active"
                style={{ textDecoration: "none", padding: "var(--spacing-2, 0.5rem) 0" }}
              >
                社区
              </Link>
            </li>
            <li>
              <Link
                href="/crowdsourcing"
                className="nav-link"
                style={{ textDecoration: "none", padding: "var(--spacing-2, 0.5rem) 0" }}
              >
                众包
              </Link>
            </li>
            <li>
              <Link
                href="/contest"
                className="nav-link"
                style={{ textDecoration: "none", padding: "var(--spacing-2, 0.5rem) 0" }}
              >
                竞赛
              </Link>
            </li>
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
              <li className="mb-2">
                <Link
                  href="/explore"
                  className="nav-link block py-2"
                  onClick={() => setMobileMenuOpen(false)}
                  style={{ textDecoration: "none" }}
                >
                  探索市场
                </Link>
              </li>
              <li className="mb-2">
                <Link
                  href="/navigator"
                  className="nav-link block py-2"
                  onClick={() => setMobileMenuOpen(false)}
                  style={{ textDecoration: "none" }}
                >
                  工坊
                </Link>
              </li>
              <li className="mb-2">
                <Link
                  href="/community"
                  className="nav-link active block py-2"
                  onClick={() => setMobileMenuOpen(false)}
                  style={{ textDecoration: "none" }}
                >
                  社区
                </Link>
              </li>
              <li className="mb-2">
                <Link
                  href="/crowdsourcing"
                  className="nav-link block py-2"
                  onClick={() => setMobileMenuOpen(false)}
                  style={{ textDecoration: "none" }}
                >
                  众包
                </Link>
              </li>
              <li className="mb-2">
                <Link
                  href="/contest"
                  className="nav-link block py-2"
                  onClick={() => setMobileMenuOpen(false)}
                  style={{ textDecoration: "none" }}
                >
                  竞赛
                </Link>
              </li>
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
