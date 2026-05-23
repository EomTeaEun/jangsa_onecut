import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '장사한컷 - AI 마케팅 비서',
  description: '사장님의 가게를 위한 AI 마케팅 비서. 상황에 맞는 포스터, SNS 글, 마케팅 전략을 자동 생성해드립니다.',
  keywords: '소상공인, 마케팅, AI, 인스타그램, SNS, 포스터, 음식점',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased bg-cream-50 min-h-screen">
        {children}
      </body>
    </html>
  )
}
