'use client';

import Link from 'next/link';
import { CategoryInfo } from '@/lib/types';

const categories: CategoryInfo[] = [
  {
    id: 'gym',
    title: '헬스장 / PT',
    subtitle: '중도 해지 환불',
    description: '헬스장, 필라테스, 요가, PT 등 체육시설 이용 계약의 중도 해지 시 환불액을 계산합니다.',
    icon: 'gym',
    tags: ['방문판매법 제29조', '소비자분쟁해결기준'],
    gradient: 'from-blue-500 to-cyan-400',
  },
  {
    id: 'wedding',
    title: '예식장',
    subtitle: '계약 취소 환불',
    description: '예식장 계약 해제 시 위약금 기준을 분석하고 적정 환불액을 산출합니다.',
    icon: 'wedding',
    tags: ['예식장 표준약관', '공정거래위원회'],
    gradient: 'from-purple-500 to-pink-400',
  },
  {
    id: 'travel',
    title: '숙박 / 항공권',
    subtitle: '예약 취소 환불',
    description: '숙박 또는 항공권 예약 취소 시 위약금 기준과 환불 가능 금액을 분석합니다.',
    icon: 'travel',
    tags: ['소비자분쟁해결기준', '전자상거래법'],
    gradient: 'from-cyan-500 to-emerald-400',
  },
];

const iconMap: Record<string, React.ReactNode> = {
  gym: (
    <svg viewBox="0 0 48 48" fill="none" className="w-12 h-12">
      <rect x="4" y="20" width="4" height="8" rx="1" fill="currentColor" opacity="0.7" />
      <rect x="10" y="16" width="4" height="16" rx="1" fill="currentColor" opacity="0.85" />
      <rect x="16" y="22" width="16" height="4" rx="1" fill="currentColor" />
      <rect x="34" y="16" width="4" height="16" rx="1" fill="currentColor" opacity="0.85" />
      <rect x="40" y="20" width="4" height="8" rx="1" fill="currentColor" opacity="0.7" />
    </svg>
  ),
  wedding: (
    <svg viewBox="0 0 48 48" fill="none" className="w-12 h-12">
      <path d="M24 8C24 8 16 16 16 24C16 28.4 19.6 32 24 32C28.4 32 32 28.4 32 24C32 16 24 8 24 8Z" fill="currentColor" opacity="0.3" />
      <circle cx="24" cy="24" r="8" stroke="currentColor" strokeWidth="2.5" fill="none" />
      <circle cx="24" cy="24" r="4" fill="currentColor" opacity="0.6" />
      <path d="M24 16V8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M18 36L24 32L30 36" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 40L24 36L34 40" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  travel: (
    <svg viewBox="0 0 48 48" fill="none" className="w-12 h-12">
      <path d="M24 6L28 18H40L30 26L34 38L24 30L14 38L18 26L8 18H20L24 6Z" fill="currentColor" opacity="0.15" />
      <path d="M38 12L26 22L38 36" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 24H38" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M26 22L14 22" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M26 22L20 32" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
      <path d="M26 22L20 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
    </svg>
  ),
};

const glowClasses: Record<string, string> = {
  gym: 'card-glow-blue',
  wedding: 'card-glow-purple',
  travel: 'card-glow-cyan',
};

const colorClasses: Record<string, string> = {
  gym: 'text-blue-400',
  wedding: 'text-purple-400',
  travel: 'text-cyan-400',
};

export default function HomePage() {
  return (
    <main className="flex-1">
      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between max-w-6xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
            환
          </div>
          <span className="font-bold text-lg text-white">환불원정대</span>
        </div>
        <div className="text-sm text-slate-400">
          AI 법률 분석 서비스
        </div>
      </header>

      {/* Hero Section */}
      <section className="px-6 pt-16 pb-12 max-w-6xl mx-auto text-center">
        <div className="animate-fade-in-up">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 text-sm font-medium mb-6">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            무료 AI 법률 분석
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight">
            <span className="text-white">억울한 위약금,</span>
            <br />
            <span className="gradient-text">법으로 바로잡으세요</span>
          </h1>
          <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
            AI가 관련 법령과 판례를 실시간 검색하여
            <br className="hidden md:block" />
            <strong className="text-slate-300">합법적인 환불 금액</strong>과 <strong className="text-slate-300">항의 문자 초안</strong>을 제공합니다.
          </p>
        </div>
      </section>

      {/* Category Cards */}
      <section className="px-6 pb-20 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {categories.map((cat, i) => (
            <Link
              key={cat.id}
              href={`/dispute/${cat.id}`}
              className={`glass-card ${glowClasses[cat.icon]} p-6 cursor-pointer block animate-fade-in-up animate-delay-${(i + 1) * 100}`}
              id={`category-${cat.id}`}
            >
              <div className={`${colorClasses[cat.icon]} mb-4`}>
                {iconMap[cat.icon]}
              </div>
              <h2 className="text-xl font-bold text-white mb-1">{cat.title}</h2>
              <p className="text-sm text-slate-400 mb-3">{cat.subtitle}</p>
              <p className="text-sm text-slate-500 mb-4 leading-relaxed">{cat.description}</p>
              <div className="flex flex-wrap gap-2">
                {cat.tags.map((tag) => (
                  <span key={tag} className="tag-badge">{tag}</span>
                ))}
              </div>
              <div className="mt-4 flex items-center gap-1 text-sm text-slate-500">
                <span>분석 시작하기</span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="px-6 pb-20 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div className="animate-fade-in-up animate-delay-100">
            <div className="text-3xl mb-3">⚖️</div>
            <h3 className="text-white font-semibold mb-2">실시간 법령 검색</h3>
            <p className="text-slate-500 text-sm">법제처 DB에서 관련 법령과 판례를 실시간으로 검색합니다</p>
          </div>
          <div className="animate-fade-in-up animate-delay-200">
            <div className="text-3xl mb-3">🧮</div>
            <h3 className="text-white font-semibold mb-2">정확한 환불액 계산</h3>
            <p className="text-slate-500 text-sm">소비자분쟁해결기준에 따라 법적으로 정확한 환불액을 산출합니다</p>
          </div>
          <div className="animate-fade-in-up animate-delay-300">
            <div className="text-3xl mb-3">📱</div>
            <h3 className="text-white font-semibold mb-2">바로 쓸 수 있는 문자</h3>
            <p className="text-slate-500 text-sm">법적 근거가 담긴 항의 문자 초안을 생성합니다</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-8 border-t border-slate-800 text-center text-sm text-slate-600">
        <p>환불원정대는 법률 자문을 제공하지 않으며, 참고 정보 제공 목적의 서비스입니다.</p>
        <p className="mt-1">최종 법적 판단은 법률 전문가와 상담하시기 바랍니다.</p>
      </footer>
    </main>
  );
}
