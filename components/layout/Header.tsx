"use client"

import React, { useState, useCallback, memo } from 'react';
import Link from 'next/link';
import { HeaderProps } from '@/types/layout';

// 将导航链接数据抽离为常量
const NAV_LINKS = [
  { href: '/explore', label: '探索市场' },
  { href: '/navigator', label: '工坊' },
  { href: '/community', label: '社区' },
  { href: '/crowdsourcing', label: '众包' },
  { href: '/contest', label: '竞赛' },
];

// 将样式抽离为常量
const styles = {
  header: 'navbar',
  container: 'container mx-auto px-4 flex justify-between items-center',
  brand: 'navbar-brand flex items-center text-xl no-underline',
  brandIcon: 'ri-flashlight-line mr-2 text-xl text-indigo-500',
  nav: 'navbar-nav hidden md:flex items-center text-sm gap-8 m-0 p-0 list-none',
  navLink: 'nav-link no-underline py-2',
  mobileToggle: 'mobile-nav-toggle md:hidden bg-transparent border-none text-2xl cursor-pointer',
  signInButton: 'btn btn-outline hidden md:flex items-center text-sm px-4 py-2 border border-gray-300 rounded-md bg-transparent cursor-pointer no-underline',
  signInIcon: 'ri-login-circle-line mr-2',
  mobileMenu: 'absolute top-full left-0 w-full bg-white border-t border-gray-200 md:hidden z-50',
  mobileNav: 'navbar-nav p-4 text-sm list-none m-0',
  mobileNavItem: 'mb-2',
  mobileNavLink: 'nav-link block py-2 no-underline',
  mobileSignIn: 'btn btn-outline flex items-center w-full justify-center text-sm px-4 py-2 border border-gray-300 rounded-md bg-transparent cursor-pointer',
};

const Header: React.FC<HeaderProps> = memo(({ className = '' }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMobileMenu = useCallback(() => {
    setMobileMenuOpen(prev => !prev);
  }, []);

  const closeMobileMenu = useCallback(() => {
    setMobileMenuOpen(false);
  }, []);

  return (
    <header className={`${styles.header} ${className}`}>
      <div className={styles.container}>
        <div className="flex items-center gap-8">
          <Link href="/" className={styles.brand}>
            <i className={styles.brandIcon}></i>
            Flareo
          </Link>

          <ul className={styles.nav}>
            {NAV_LINKS.map(({ href, label }) => (
              <li key={href}>
                <Link href={href} className={styles.navLink}>
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <button
          className={styles.mobileToggle}
          onClick={toggleMobileMenu}
          aria-label="Toggle mobile menu"
        >
          <i className="ri-menu-line"></i>
        </button>

        <button className={styles.signInButton}>
          <i className={styles.signInIcon}></i>
          Sign In
        </button>

        {mobileMenuOpen && (
          <div className={styles.mobileMenu}>
            <ul className={styles.mobileNav}>
              {NAV_LINKS.map(({ href, label }) => (
                <li key={href} className={styles.mobileNavItem}>
                  <Link
                    href={href}
                    className={styles.mobileNavLink}
                    onClick={closeMobileMenu}
                  >
                    {label}
                  </Link>
                </li>
              ))}
              <li className="pt-4 border-t border-gray-200">
                <button className={styles.mobileSignIn}>
                  <i className={styles.signInIcon}></i>
                  Sign In
                </button>
              </li>
            </ul>
          </div>
        )}
      </div>
    </header>
  );
});

Header.displayName = 'Header';

export default Header; 