import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import SidebarLogout from '@/components/SidebarLogout'

const NAV_ITEMS = [
  { href: '/dashboard', label: '홈', emoji: '🏠' },
  { href: '/create', label: '콘텐츠 만들기', emoji: '✨' },
  { href: '/history', label: '콘텐츠 히스토리', emoji: '📂' },
  { href: '/analytics', label: '매출 분석', emoji: '📊' },
  { href: '/reviews', label: '리뷰 분석', emoji: '⭐' },
  { href: '/settings', label: '설정', emoji: '⚙️' },
]

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: store } = await supabase
    .from('stores')
    .select('name, is_onboarded')
    .eq('user_id', user.id)
    .single()

  if (!store || !store.is_onboarded) {
    redirect('/onboarding')
  }

  return (
    <div className="flex h-screen bg-[#FFFBF5] overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-orange-100 flex flex-col flex-shrink-0 shadow-sm">
        {/* Logo */}
        <div className="p-6 border-b border-orange-100">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">🍳</span>
            <span className="text-xl font-bold text-orange-500">장사한컷</span>
          </div>
          <p className="text-xs text-stone-400 truncate">{store.name}</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-stone-600 hover:bg-orange-50 hover:text-orange-600 transition-all font-medium group"
            >
              <span className="text-lg">{item.emoji}</span>
              <span className="text-sm">{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Bottom section */}
        <div className="p-4 border-t border-orange-100">
          <div className="flex items-center gap-3 px-4 py-3 mb-2">
            <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center text-sm">
              {store.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-stone-700 truncate">{store.name}</p>
              <p className="text-xs text-stone-400 truncate">{user.email}</p>
            </div>
          </div>
          <SidebarLogout />
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="h-full">
          {children}
        </div>
      </main>
    </div>
  )
}
