'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface AnalysisData {
  id: string;
  category: string;
  input_data: Record<string, unknown>;
  calculation: {
    legalMinRefund: number;
    legalMaxPenalty: number;
    demandedPenalty: number;
    excessPenalty: number;
    usageFee: number;
    formula: string;
    legalBasis: string;
  };
  legal_references: string[];
  ai_analysis: string;
  protest_text: string;
  report_markdown: string;
  created_at: string;
}

const categoryNames: Record<string, string> = {
  gym: '헬스장 / PT',
  wedding: '예식장',
  travel: '숙박 / 항공권',
};

export default function ResultPage() {
  const params = useParams();
  const id = params.id as string;
  const [data, setData] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedProtest, setCopiedProtest] = useState(false);
  const [activeTab, setActiveTab] = useState<'analysis' | 'protest' | 'report'>('analysis');

  useEffect(() => {
    // 먼저 localStorage에서 데이터 확인
    const stored = localStorage.getItem(`analysis_${id}`);
    if (stored) {
      setData(JSON.parse(stored));
      setLoading(false);
    } else {
      // Supabase에서 가져오기 시도
      fetchFromSupabase();
    }
  }, [id]);

  const fetchFromSupabase = async () => {
    try {
      const res = await fetch(`/api/analyze?id=${id}`);
      if (res.ok) {
        const result = await res.json();
        setData(result);
      }
    } catch (error) {
      console.error('Failed to fetch result:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedProtest(true);
      setTimeout(() => setCopiedProtest(false), 2000);
    } catch {
      // Fallback
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopiedProtest(true);
      setTimeout(() => setCopiedProtest(false), 2000);
    }
  };

  const downloadReport = () => {
    if (!data) return;
    const blob = new Blob([data.report_markdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `사건개요서_${categoryNames[data.category]}_${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <main className="flex-1 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="spinner mx-auto mb-4" />
          <p className="text-slate-400">분석 결과를 불러오고 있습니다...</p>
        </div>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="flex-1 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-slate-400 mb-4">분석 결과를 찾을 수 없습니다.</p>
          <Link href="/" className="gradient-btn inline-block">처음으로 돌아가기</Link>
        </div>
      </main>
    );
  }

  const calc = data.calculation;
  const maxBar = Math.max(calc.demandedPenalty, calc.legalMaxPenalty, 1);

  return (
    <main className="flex-1">
      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between max-w-5xl mx-auto w-full">
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">환</div>
          <span className="font-bold text-lg text-white">환불원정대</span>
        </Link>
        <Link href="/" className="text-sm text-slate-400 hover:text-slate-300 transition-colors">
          새로운 분석 →
        </Link>
      </header>

      <section className="px-6 py-8 max-w-5xl mx-auto">
        {/* Title */}
        <div className="mb-8 animate-fade-in-up">
          <div className="tag-badge inline-block mb-3">{categoryNames[data.category]}</div>
          <h1 className="text-3xl font-bold text-white">법리 분석 결과</h1>
        </div>

        {/* 환불 계산 카드 */}
        <div className="result-card mb-6 animate-fade-in-up animate-delay-100">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <span className="text-2xl">💰</span> 환불액 계산 결과
          </h2>

          {/* 핵심 숫자 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
              <p className="text-sm text-emerald-300 mb-1">합법적 최소 환불액</p>
              <p className="text-3xl font-bold text-emerald-400">
                {calc.legalMinRefund.toLocaleString()}<span className="text-lg">원</span>
              </p>
            </div>
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
              <p className="text-sm text-amber-300 mb-1">법적 최대 위약금</p>
              <p className="text-3xl font-bold text-amber-400">
                {calc.legalMaxPenalty.toLocaleString()}<span className="text-lg">원</span>
              </p>
            </div>
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-center">
              <p className="text-sm text-rose-300 mb-1">업체 요구 위약금</p>
              <p className="text-3xl font-bold text-rose-400">
                {calc.demandedPenalty.toLocaleString()}<span className="text-lg">원</span>
              </p>
            </div>
          </div>

          {/* 비교 바 */}
          {calc.excessPenalty > 0 && (
            <div className="p-4 rounded-xl bg-rose-500/5 border border-rose-500/10 mb-4">
              <p className="text-rose-300 font-semibold mb-3">
                ⚠️ 업체가 <span className="text-rose-400">{calc.excessPenalty.toLocaleString()}원</span>을 초과 청구하고 있습니다!
              </p>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-amber-300">법적 최대 위약금</span>
                    <span className="text-amber-400">{calc.legalMaxPenalty.toLocaleString()}원</span>
                  </div>
                  <div className="comparison-bar">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all duration-1000"
                      style={{ width: `${(calc.legalMaxPenalty / maxBar) * 100}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-rose-300">업체 요구 위약금</span>
                    <span className="text-rose-400">{calc.demandedPenalty.toLocaleString()}원</span>
                  </div>
                  <div className="comparison-bar">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-rose-500 to-rose-400 transition-all duration-1000"
                      style={{ width: `${(calc.demandedPenalty / maxBar) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 계산 공식 */}
          <div className="p-4 rounded-xl bg-slate-800/50 text-sm">
            <p className="text-slate-400 font-medium mb-2">📐 계산 근거</p>
            <pre className="text-slate-300 whitespace-pre-wrap font-[var(--font-pretendard)]">{calc.formula}</pre>
            <p className="text-slate-500 mt-2 text-xs">📖 {calc.legalBasis}</p>
          </div>
        </div>

        {/* 탭 네비게이션 */}
        <div className="flex gap-2 mb-4 animate-fade-in-up animate-delay-200">
          <button
            onClick={() => setActiveTab('analysis')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'analysis'
                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            ⚖️ AI 법리 분석
          </button>
          <button
            onClick={() => setActiveTab('protest')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'protest'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            📱 항의 문자 초안
          </button>
          <button
            onClick={() => setActiveTab('report')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'report'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            📄 사건 개요서
          </button>
        </div>

        {/* 탭 콘텐츠 */}
        <div className="animate-fade-in-up animate-delay-300">
          {activeTab === 'analysis' && (
            <div className="result-card">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <span className="text-2xl">⚖️</span> AI 법리 분석
              </h2>
              <div className="prose-result">
                {data.ai_analysis.split('\n').map((line, i) => {
                  if (line.startsWith('## ')) return <h2 key={i}>{line.replace('## ', '')}</h2>;
                  if (line.startsWith('### ')) return <h3 key={i}>{line.replace('### ', '')}</h3>;
                  if (line.startsWith('- ')) return <li key={i} style={{ listStyle: 'disc', marginLeft: 20 }}>{line.replace('- ', '')}</li>;
                  if (line.startsWith('**') && line.endsWith('**')) return <p key={i}><strong>{line.replace(/\*\*/g, '')}</strong></p>;
                  if (line.trim() === '') return <br key={i} />;
                  return <p key={i}>{line}</p>;
                })}
              </div>
            </div>
          )}

          {activeTab === 'protest' && (
            <div className="result-card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <span className="text-2xl">📱</span> 항의 카톡/문자 초안
                </h2>
                <button
                  onClick={() => copyToClipboard(data.protest_text)}
                  className="copy-btn flex items-center gap-2"
                >
                  {copiedProtest ? (
                    <>
                      <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      복사됨!
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                      </svg>
                      복사하기
                    </>
                  )}
                </button>
              </div>
              <div className="p-5 rounded-xl bg-navy-950/60 border border-slate-700/50">
                <p className="text-slate-300 whitespace-pre-wrap leading-relaxed">{data.protest_text}</p>
              </div>
              <p className="text-xs text-slate-600 mt-3">* 복사 후 카톡이나 문자로 업체에 보내실 수 있습니다.</p>
            </div>
          )}

          {activeTab === 'report' && (
            <div className="result-card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <span className="text-2xl">📄</span> 한국소비자원 피해구제 사건 개요서
                </h2>
                <button onClick={downloadReport} className="gradient-btn text-sm py-2 px-4 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  다운로드 (.md)
                </button>
              </div>
              <div className="p-5 rounded-xl bg-navy-950/60 border border-slate-700/50 prose-result max-h-96 overflow-y-auto">
                {data.report_markdown.split('\n').map((line, i) => {
                  if (line.startsWith('# ')) return <h2 key={i} style={{ fontSize: '1.25rem' }}>{line.replace('# ', '')}</h2>;
                  if (line.startsWith('## ')) return <h3 key={i}>{line.replace('## ', '')}</h3>;
                  if (line.startsWith('- ')) return <li key={i} style={{ listStyle: 'disc', marginLeft: 20 }}>{line.replace('- ', '')}</li>;
                  if (line.trim() === '') return <br key={i} />;
                  return <p key={i}>{line}</p>;
                })}
              </div>
              <p className="text-xs text-slate-600 mt-3">* 이 개요서를 한국소비자원(1372) 피해구제 접수 시 첨부할 수 있습니다.</p>
            </div>
          )}
        </div>

        {/* 하단 안내 */}
        <div className="mt-8 p-4 rounded-xl bg-slate-800/30 border border-slate-700/30 text-center animate-fade-in-up animate-delay-400">
          <p className="text-slate-500 text-sm">
            💡 도움이 되셨다면 <strong className="text-slate-400">한국소비자원 (국번없이 1372)</strong>에 피해구제를 접수해보세요.
          </p>
        </div>
      </section>
    </main>
  );
}
