'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function VerifyContent() {
  const searchParams = useSearchParams()
  const email = searchParams.get('email')

  return (
    <div className="bg-white rounded-3xl p-8 shadow-xl border border-orange-100">
      <div className="text-center mb-6">
        <div className="text-5xl mb-4">📬</div>
        <h1 className="text-2xl font-bold text-stone-900 mb-2">메일함을 확인해주세요</h1>
        <p className="text-stone-500 text-sm">
          {email ? (
            <>
              <span className="font-semibold text-stone-700 break-all">{email}</span>로<br />
              인증 메일을 발송했어요.
            </>
          ) : (
            <>입력하신 이메일로 인증 메일을 발송했어요.</>
          )}
        </p>
      </div>

      <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 mb-6">
        <p className="font-semibold text-stone-700 text-sm mb-3">📝 인증 절차</p>
        <ol className="space-y-2.5 text-sm text-stone-600">
          <li className="flex gap-2.5">
            <span className="flex-shrink-0 w-5 h-5 bg-orange-500 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
            <span>받은 메일에서 <strong>인증 링크</strong>를 클릭해주세요</span>
          </li>
          <li className="flex gap-2.5">
            <span className="flex-shrink-0 w-5 h-5 bg-orange-500 text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
            <span>인증이 완료되면 <strong>자동으로 로그인</strong>되어 온보딩 화면으로 이동합니다</span>
          </li>
          <li className="flex gap-2.5">
            <span className="flex-shrink-0 w-5 h-5 bg-orange-500 text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
            <span>메일이 안 보이면 <strong>스팸함</strong>도 확인해보세요</span>
          </li>
        </ol>
      </div>

      <div className="bg-stone-50 border border-stone-100 rounded-xl p-3 mb-6 text-xs text-stone-500 text-center">
        💡 이 페이지를 닫아도 괜찮아요. 메일의 링크만 클릭하시면 됩니다.
      </div>

      <Link
        href="/login"
        className="block w-full bg-orange-500 text-white py-3.5 rounded-xl font-bold text-base hover:bg-orange-600 transition-all text-center"
      >
        로그인 페이지로 →
      </Link>

      <p className="mt-4 text-xs text-stone-400 text-center">
        다른 이메일로 가입하시려면{' '}
        <Link href="/signup" className="text-orange-500 hover:text-orange-600 font-medium">
          회원가입
        </Link>
        을 다시 시도해주세요
      </p>
    </div>
  )
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<div className="bg-white rounded-3xl p-8 shadow-xl border border-orange-100 text-center text-stone-400">로딩 중...</div>}>
      <VerifyContent />
    </Suspense>
  )
}
