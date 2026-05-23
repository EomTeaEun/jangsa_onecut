'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function SidebarLogout() {
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <button
      onClick={handleLogout}
      className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-stone-500 hover:bg-red-50 hover:text-red-500 transition-all text-sm font-medium"
    >
      <span>🚪</span>
      <span>로그아웃</span>
    </button>
  )
}
