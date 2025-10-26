'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import clsx from 'clsx'

export const Navbar = () => {
  const pathname = usePathname()

  const navLinks = [
    { href: '/', label: 'Request URLs' },
    { href: '/media', label: 'Media' },
  ]

  return (
    <header className="bg-white border-b shadow-sm sticky top-0 z-50">
      <div className="container mx-auto flex items-center gap-8 p-4">
        <Link href="/" className="text-lg font-semibold text-blue-600 hover:text-blue-700 transition-colors">
          🧭 MediaScraper
        </Link>

        <nav className="space-x-6 text-gray-700">
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={clsx(
                'transition-colors hover:text-blue-600',
                pathname === href && 'text-blue-600 font-medium'
              )}
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  )
}
