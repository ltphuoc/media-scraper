'use client'

import { logout } from '@/lib/auth'
import clsx from 'clsx'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

export const Navbar = () => {
  const router = useRouter()
  const pathname = usePathname()

  const navLinks = [
    { href: '/dashboard', label: 'Request URLs' },
    { href: '/dashboard/media', label: 'Media' },
    { href: '/dashboard/metrics', label: 'Monitor' },
  ]

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  return (
    <header className="bg-white border-b shadow-sm sticky top-0 z-50">
      <div className="container mx-auto flex items-center justify-between p-4">
        <div className="flex items-center gap-8">
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

        <button
          onClick={handleLogout}
          className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-md hover:bg-red-600 transition-colors"
        >
          Logout
        </button>
      </div>
    </header>
  )
}
