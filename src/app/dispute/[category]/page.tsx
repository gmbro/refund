'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

const categoryMeta: Record<string, { title: string; subtitle: string; color: string }> = {
  gym: { title: '헬스장 / PT', subtitle: '중도 해지 환불 분석', color: 'blue' },
  wedding: { title: '예식장', subtitle: '계약 취소 환불 분석', color: 'purple' },
  travel: { title: '숙박 / 항공권', subtitle: '예약 취소 환불 분석', color: 'cyan' },
};

export default function DisputePage() {
  const params = useParams();
  const router = useRouter();
  const category = params.category as string;
  const meta = categoryMeta[category] || categoryMeta.gym;

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Record<string, string>>({});

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload: Record<string, string> = { ...formData, category };

      // 숫자 필드 변환
      const numericFields = ['totalAmount', 'totalMonths', 'usedMonths', 'usedSessions', 'totalSessions', 'demandedPenalty'];
      for (const field of numericFields) {
        if (payload[field]) {
          payload[field] = String(Number(payload[field]));
        }
      }

      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error('분석 요청 실패');
      }

      const result = await res.json();
      // 결과를 localStorage에 저장 (결과 페이지에서 즉시 사용)
      localStorage.setItem(`analysis_${result.id}`, JSON.stringify(result));
      router.push(`/result/${result.id}`);
    } catch (error) {
      console.error('Analysis error:', error);
      alert('분석 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex-1">
      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between max-w-3xl mx-auto w-full">
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
            환
          </div>
          <span className="font-bold text-lg text-white">환불원정대</span>
        </Link>
      </header>

      {/* Form */}
      <section className="px-6 py-12 max-w-3xl mx-auto">
        <div className="animate-fade-in-up mb-8">
          <Link href="/" className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-300 text-sm transition-colors mb-4">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            카테고리 선택으로
          </Link>
          <h1 className="text-3xl font-bold text-white mb-2">{meta.title}</h1>
          <p className="text-slate-400">{meta.subtitle}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in-up animate-delay-100">
          <div className="glass-card p-6 space-y-5" style={{ cursor: 'default' }}>
            {/* 카테고리별 필드 렌더링 */}
            {category === 'gym' && <GymFields formData={formData} onChange={handleChange} />}
            {category === 'wedding' && <WeddingFields formData={formData} onChange={handleChange} />}
            {category === 'travel' && <TravelFields formData={formData} onChange={handleChange} />}

            {/* 공통: 상황 설명 */}
            <div>
              <label className="form-label">억울한 상황을 설명해 주세요</label>
              <textarea
                className="form-input resize-none"
                rows={4}
                placeholder="예: 6개월 헬스장 회원권을 끊었는데 2개월밖에 못 다녔습니다. 해지하려고 하니 위약금 30%를 내라고 합니다..."
                value={formData.description || ''}
                onChange={(e) => handleChange('description', e.target.value)}
                required
              />
            </div>
          </div>

          {/* 제출 버튼 */}
          <button
            type="submit"
            disabled={loading}
            className="gradient-btn w-full text-lg py-4 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} />
                AI가 법령을 분석하고 있습니다...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                AI 법리 분석 시작
              </>
            )}
          </button>
        </form>
      </section>
    </main>
  );
}

function GymFields({ formData, onChange }: { formData: Record<string, string>; onChange: (f: string, v: string) => void }) {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="form-label">총 결제 금액 (원)</label>
          <input
            type="number"
            className="form-input"
            placeholder="600,000"
            value={formData.totalAmount || ''}
            onChange={(e) => onChange('totalAmount', e.target.value)}
            required
          />
        </div>
        <div>
          <label className="form-label">총 계약 기간 (개월)</label>
          <input
            type="number"
            className="form-input"
            placeholder="6"
            value={formData.totalMonths || ''}
            onChange={(e) => onChange('totalMonths', e.target.value)}
            required
          />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="form-label">이용한 기간 (개월)</label>
          <input
            type="number"
            className="form-input"
            placeholder="2"
            value={formData.usedMonths || ''}
            onChange={(e) => onChange('usedMonths', e.target.value)}
            required
          />
        </div>
        <div>
          <label className="form-label">업체 요구 위약금 (원)</label>
          <input
            type="number"
            className="form-input"
            placeholder="200,000"
            value={formData.demandedPenalty || ''}
            onChange={(e) => onChange('demandedPenalty', e.target.value)}
            required
          />
        </div>
      </div>
      <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/10">
        <p className="text-sm text-blue-300 font-medium mb-1">💡 PT 이용 시 (선택사항)</p>
        <div className="grid grid-cols-2 gap-4 mt-2">
          <div>
            <label className="form-label">총 PT 횟수</label>
            <input type="number" className="form-input" placeholder="30" value={formData.totalSessions || ''} onChange={(e) => onChange('totalSessions', e.target.value)} />
          </div>
          <div>
            <label className="form-label">이용한 PT 횟수</label>
            <input type="number" className="form-input" placeholder="10" value={formData.usedSessions || ''} onChange={(e) => onChange('usedSessions', e.target.value)} />
          </div>
        </div>
      </div>
    </>
  );
}

function WeddingFields({ formData, onChange }: { formData: Record<string, string>; onChange: (f: string, v: string) => void }) {
  return (
    <>
      <div>
        <label className="form-label">총 예식 비용 (원)</label>
        <input type="number" className="form-input" placeholder="5,000,000" value={formData.totalAmount || ''} onChange={(e) => onChange('totalAmount', e.target.value)} required />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="form-label">예식 예정일</label>
          <input type="date" className="form-input" value={formData.weddingDate || ''} onChange={(e) => onChange('weddingDate', e.target.value)} required />
        </div>
        <div>
          <label className="form-label">취소 통보일</label>
          <input type="date" className="form-input" value={formData.cancelDate || ''} onChange={(e) => onChange('cancelDate', e.target.value)} required />
        </div>
      </div>
      <div>
        <label className="form-label">업체 요구 위약금 (원)</label>
        <input type="number" className="form-input" placeholder="2,000,000" value={formData.demandedPenalty || ''} onChange={(e) => onChange('demandedPenalty', e.target.value)} required />
      </div>
    </>
  );
}

function TravelFields({ formData, onChange }: { formData: Record<string, string>; onChange: (f: string, v: string) => void }) {
  return (
    <>
      <div>
        <label className="form-label">총 결제 금액 (원)</label>
        <input type="number" className="form-input" placeholder="500,000" value={formData.totalAmount || ''} onChange={(e) => onChange('totalAmount', e.target.value)} required />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="form-label">이용 예정일</label>
          <input type="date" className="form-input" value={formData.serviceDate || ''} onChange={(e) => onChange('serviceDate', e.target.value)} required />
        </div>
        <div>
          <label className="form-label">취소 요청일</label>
          <input type="date" className="form-input" value={formData.cancelDate || ''} onChange={(e) => onChange('cancelDate', e.target.value)} required />
        </div>
      </div>
      <div>
        <label className="form-label">서비스 유형</label>
        <select className="form-input" value={formData.serviceType || 'accommodation'} onChange={(e) => onChange('serviceType', e.target.value)} required>
          <option value="accommodation">숙박 (호텔, 펜션 등)</option>
          <option value="flight">항공권</option>
        </select>
      </div>
      <div>
        <label className="form-label">업체 요구 위약금 (원)</label>
        <input type="number" className="form-input" placeholder="300,000" value={formData.demandedPenalty || ''} onChange={(e) => onChange('demandedPenalty', e.target.value)} required />
      </div>
    </>
  );
}
