'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

interface ActiveNavLinkProps {
  href: string
  children: React.ReactNode
  className?: string
  activeClassName?: string
}

export default function ActiveNavLink({
  href,
  children,
  className,
  activeClassName,
}: ActiveNavLinkProps) {
  const pathname = usePathname()
  const isActive = pathname === href

  return (
    <Link
      href={href}
      className={cn(
        className,
        isActive && (activeClassName || 'bg-orange-50 text-orange-600')
      )}
    >
      {children}
    </Link>
  )
}
