import Link from 'next/link'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-orange-100 flex flex-col">
      {/* Header */}
      <header className="p-6">
        <Link href="/" className="inline-flex items-center gap-2 group">
          <span className="text-2xl">🍳</span>
          <span className="text-xl font-bold text-orange-500 group-hover:text-orange-600 transition-colors">
            장사한컷
          </span>
        </Link>
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="p-6 text-center text-sm text-stone-400">
        <p>소상공인의 성공을 응원합니다 🙏</p>
      </footer>
    </div>
  )
}
