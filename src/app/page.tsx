'use client';

import { useState, useRef, useEffect } from 'react';
import { CategoryInfo } from '@/lib/types';

// ==========================================
// 1. Data & Types
// ==========================================
const categories: CategoryInfo[] = [
  {
    id: 'gym',
    title: '헬스장 / PT',
    subtitle: '중도 해지 환불',
    description: '헬스장, 필라테스, 요가, PT 등 체육시설 이용 계약의 중도 해지 시 환불액을 진단합니다.',
    icon: 'gym',
    tags: ['소비자분쟁해결기준', '계속거래'],
    gradient: 'from-blue-500 to-cyan-400',
  },
  {
    id: 'wedding',
    title: '예식장',
    subtitle: '계약 취소 환불',
    description: '예식장 계약 해제 시 발생되는 위약금 기준을 안내합니다.',
    icon: 'wedding',
    tags: ['표준약관', '공정거래위원회'],
    gradient: 'from-purple-500 to-pink-400',
  },
  {
    id: 'travel',
    title: '숙박 / 항공권',
    subtitle: '예약 취소 환불',
    description: '숙박 또는 항공권 예약 취소 시 적절한 위약금 기준을 알아봅니다.',
    icon: 'travel',
    tags: ['전자상거래법', '위약금'],
    gradient: 'from-cyan-500 to-emerald-400',
  },
];

const categoryMeta: Record<string, { title: string; subtitle: string; color: string }> = {
  gym: { title: '헬스장 / PT', subtitle: '중도 해지 환불 기초 진단', color: 'blue' },
  wedding: { title: '예식장', subtitle: '계약 취소 환불 기초 진단', color: 'purple' },
  travel: { title: '숙박 / 항공권', subtitle: '예약 취소 환불 기초 진단', color: 'cyan' },
};

// ==========================================
// 2. Main Funnel Component
// ==========================================
export default function FunnelPage() {
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward');
  
  // Data State
  const [category, setCategory] = useState<string>('');
  const [formData, setFormData] = useState<Record<string, string>>({});
  
  // Async Result State
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Scroll to top on step change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step]);

  const handleNext = (nextStep: number) => {
    setDirection('forward');
    setStep(nextStep);
  };

  const handlePrev = (prevStep: number) => {
    setDirection('backward');
    setStep(prevStep);
  };

  const handleCategorySelect = (id: string) => {
    setCategory(id);
    handleNext(2);
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // AI 분석 (Step 2 -> Step 3 -> Step 4)
  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    handleNext(3); // Loading screen
    
    try {
      const payload: Record<string, string> = { ...formData, category };
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

      if (!res.ok) throw new Error('분석 요청 실패');

      const result = await res.json();
      setAnalysisResult(result);
      handleNext(4); // Result screen
    } catch (error) {
      console.error('Analysis error:', error);
      alert('진단 중 오류가 발생했습니다. 다시 시도해주세요.');
      handlePrev(2); // Go back to form
    }
  };

  // 변호사 검토 접수 (Step 4 -> Step 5)
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      if (!analysisResult?.id) throw new Error('잘못된 요청입니다.');
      
      const payload = {
        id: analysisResult.id,
        userName: formData.userName,
        phoneNumber: formData.phoneNumber,
        agreedPrivacy: true
      };

      const res = await fetch('/api/request-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('접수 실패');
      
      handleNext(5); // Completion Screen
    } catch (error) {
       alert('접수 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
       setIsSubmitting(false);
    }
  };

  // ==========================================
  // Render Steps
  // ==========================================
  return (
    <main className="flex-1 w-full flex flex-col min-h-screen relative overflow-hidden">
      {/* Header (Shared) */}
      <header className="px-6 py-4 flex items-center justify-between w-full relative z-10">
        <div 
          onClick={() => { if(step <= 2) handlePrev(1) }}
          className={`flex items-center gap-2 transition-opacity ${step <= 2 ? 'cursor-pointer hover:opacity-80' : 'opacity-100 cursor-default'}`}
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
            환
          </div>
          <span className="font-bold text-lg text-white">석지운 변호사의 환불원정대</span>
        </div>
        {step > 1 && step < 5 && (
          <div className="text-sm text-slate-400 font-medium">
            Step {step} / 4
          </div>
        )}
      </header>

      {/* Funnel Container (Simple fade transition) */}
      <div className="flex-1 w-full max-w-4xl mx-auto px-4 pb-20 relative z-10 animate-fade-in-up" key={step}>
        
        {/* STEP 1: 카테고리 선택 */}
        {step === 1 && (
          <div className="pt-10">
             <div className="text-center mb-10">
               <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 text-sm font-medium mb-4">
                 ⚖️ 석지운 변호사가 직접 검토합니다
               </div>
               <h1 className="text-3xl md:text-5xl font-extrabold mb-4 text-white leading-tight">
                 불공정한 위약금, <br className="md:hidden" />
                 <span className="gradient-text">제대로 돌려받으세요</span>
               </h1>
               <p className="text-slate-400 text-base md:text-lg">
                 AI가 상황을 1차 진단하고, 변호사가 명확한 솔루션을 드립니다.
               </p>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                {categories.map((cat) => (
                  <div
                    key={cat.id}
                    onClick={() => handleCategorySelect(cat.id)}
                    className={`glass-card p-6 cursor-pointer block text-left group
                      ${cat.id === 'gym' ? 'hover:border-blue-500/50 hover:shadow-[0_0_30px_rgba(59,130,246,0.15)]' : ''}
                      ${cat.id === 'wedding' ? 'hover:border-purple-500/50 hover:shadow-[0_0_30px_rgba(168,85,247,0.15)]' : ''}
                      ${cat.id === 'travel' ? 'hover:border-emerald-500/50 hover:shadow-[0_0_30px_rgba(16,185,129,0.15)]' : ''}
                    `}
                  >
                    <div className={`text-2xl mb-4 ${cat.id === 'gym' ? 'text-blue-400' : cat.id === 'wedding' ? 'text-purple-400' : 'text-emerald-400'}`}>
                      {cat.id === 'gym' && '🏋️'}
                      {cat.id === 'wedding' && '💍'}
                      {cat.id === 'travel' && '✈️'}
                    </div>
                    <h2 className="text-xl font-bold text-white mb-1 group-hover:text-blue-200 transition-colors">{cat.title}</h2>
                    <p className="text-sm text-slate-400 mb-4 h-10">{cat.description}</p>
                    <div className="mt-4 flex items-center justify-between text-sm font-medium text-slate-500 group-hover:text-blue-400 transition-colors">
                      <span>진단 시작하기</span>
                      <span>→</span>
                    </div>
                  </div>
                ))}
             </div>
          </div>
        )}

        {/* STEP 2: 정보 입력 */}
        {step === 2 && (
          <div className="max-w-2xl mx-auto pt-6">
            <button onClick={() => handlePrev(1)} className="flex items-center gap-1 text-slate-500 hover:text-slate-300 text-sm mb-6">
              ← 뒤로 가기
            </button>
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-white mb-2">{categoryMeta[category]?.title} 진단</h1>
              <p className="text-slate-400 text-sm">소비자분쟁해결기준과 관련 법령을 기준으로 1차 진단서를 자동 작성합니다.</p>
            </div>

            <form onSubmit={handleAnalyze} className="space-y-6">
              <div className="glass-card p-6 md:p-8 space-y-6">
                
                {/* 헬스장 폼 */}
                {category === 'gym' && (
                  <div className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="form-label">총 결제 금액 (원)</label>
                        <input type="number" className="form-input" placeholder="예: 600000" value={formData.totalAmount || ''} onChange={(e) => handleChange('totalAmount', e.target.value)} required />
                      </div>
                      <div>
                        <label className="form-label">총 계약 기간 (개월)</label>
                        <input type="number" className="form-input" placeholder="예: 6" value={formData.totalMonths || ''} onChange={(e) => handleChange('totalMonths', e.target.value)} required />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="form-label">이용한 기간 (개월)</label>
                        <input type="number" className="form-input" placeholder="예: 2" value={formData.usedMonths || ''} onChange={(e) => handleChange('usedMonths', e.target.value)} required />
                      </div>
                      <div>
                        <label className="form-label">업체 요구 위약금 (원)</label>
                        <input type="number" className="form-input" placeholder="예: 200000" value={formData.demandedPenalty || ''} onChange={(e) => handleChange('demandedPenalty', e.target.value)} required />
                      </div>
                    </div>
                  </div>
                )}

                {/* 예식장 폼 */}
                {category === 'wedding' && (
                  <div className="space-y-5">
                    <div>
                      <label className="form-label">총 예식 비용 (원)</label>
                      <input type="number" className="form-input" placeholder="예: 5000000" value={formData.totalAmount || ''} onChange={(e) => handleChange('totalAmount', e.target.value)} required />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div><label className="form-label">예식 예정일</label><input type="date" className="form-input" value={formData.weddingDate || ''} onChange={(e) => handleChange('weddingDate', e.target.value)} required /></div>
                      <div><label className="form-label">취소 통보일</label><input type="date" className="form-input" value={formData.cancelDate || ''} onChange={(e) => handleChange('cancelDate', e.target.value)} required /></div>
                    </div>
                    <div><label className="form-label">업체 요구 위약금 (원)</label><input type="number" className="form-input" placeholder="예: 2000000" value={formData.demandedPenalty || ''} onChange={(e) => handleChange('demandedPenalty', e.target.value)} required /></div>
                  </div>
                )}

                {/* 숙박/항공 폼 */}
                {category === 'travel' && (
                  <div className="space-y-5">
                    <div><label className="form-label">총 결제 금액 (원)</label><input type="number" className="form-input" placeholder="예: 500000" value={formData.totalAmount || ''} onChange={(e) => handleChange('totalAmount', e.target.value)} required /></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div><label className="form-label">이용 예정일</label><input type="date" className="form-input" value={formData.serviceDate || ''} onChange={(e) => handleChange('serviceDate', e.target.value)} required /></div>
                      <div><label className="form-label">취소 요청일</label><input type="date" className="form-input" value={formData.cancelDate || ''} onChange={(e) => handleChange('cancelDate', e.target.value)} required /></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="form-label">서비스 유형</label>
                        <select className="form-input" value={formData.serviceType || 'accommodation'} onChange={(e) => handleChange('serviceType', e.target.value)} required>
                          <option value="accommodation">숙박 (호텔, 펜션 등)</option>
                          <option value="flight">항공권</option>
                        </select>
                      </div>
                      <div><label className="form-label">업체 요구 위약금 (원)</label><input type="number" className="form-input" placeholder="예: 300000" value={formData.demandedPenalty || ''} onChange={(e) => handleChange('demandedPenalty', e.target.value)} required /></div>
                    </div>
                  </div>
                )}

                {/* 공통 컴포넌트: 상세 상황 설명 */}
                <div className="pt-2 border-t border-slate-700/50">
                  <label className="form-label text-white">상황을 상세히 적어주시면 변호사 검토 시 정확도가 높아집니다.</label>
                  <textarea 
                    className="form-input resize-none w-full h-32 mt-2 bg-slate-900/50" 
                    placeholder="예: 갑작스런 이사로 환불을 요청했으나, 카드로 결제했다며 수수료 명목으로 10%를 추가 공제하겠다고 합니다."
                    value={formData.description || ''}
                    onChange={(e) => handleChange('description', e.target.value)}
                    required
                  />
                </div>
              </div>

              <button type="submit" className="gradient-btn w-full py-4 text-lg font-bold shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2">
                <span>AI 기초 진단 시작하기</span>
                <span>→</span>
              </button>
            </form>
          </div>
        )}

        {/* STEP 3: Loading */}
        {step === 3 && (
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
             <div className="relative w-24 h-24 mb-8">
               <div className="absolute inset-0 border-t-4 border-blue-500 rounded-full animate-spin"></div>
               <div className="absolute inset-2 border-r-4 border-purple-500 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
               <div className="absolute inset-0 flex items-center justify-center text-2xl">⚖️</div>
             </div>
             <h2 className="text-2xl font-bold text-white mb-2 pulse-glow-text">
                인공지능 리포트 작성 중...
             </h2>
             <p className="text-slate-400 text-center max-w-md mt-2">
               법제처의 최신 판례와 공정위 소비자분쟁기준을 검색하여<br/>
               가장 현명한 대응 전략을 찾고 있습니다.
             </p>
          </div>
        )}

        {/* STEP 4: 결과 + 변호사 검토 폼 */}
        {step === 4 && analysisResult && (
           <div className="max-w-3xl mx-auto pt-6 pb-20">
              
              <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700 text-sm md:text-base text-slate-300 mb-8 leading-relaxed">
                  <p className="font-semibold text-white mb-2 flex items-center gap-2">
                    <span className="text-blue-400">⚠️</span> 안내사항
                  </p>
                  본 진단서는 <strong className="text-blue-300">소비자분쟁해결기준</strong>에 입각한 AI의 1차 진단 결과이며, 법적 효력이 없습니다.
                  아래 결과를 확인한 후, <strong className="text-white">하단의 접수폼</strong>을 통해 석지운 변호사에게 최종 법률 검토를 요청해보세요.
              </div>

              <div className="result-card mb-10 border-blue-500/20 shadow-[0_0_30px_rgba(59,130,246,0.1)]">
                 <h2 className="text-xl font-bold text-white mb-6 border-b border-slate-700/50 pb-4">
                   📑 AI 기초 진단 요약
                 </h2>
                 <div className="prose-result">
                   {analysisResult.clientSummary.split('\n').map((line: string, i: number) => {
                     if (line.startsWith('## ')) return <h2 key={i} className="text-lg font-bold text-blue-300 mt-6 mb-2">{line.replace('## ', '')}</h2>;
                     if (line.startsWith('**') && line.endsWith('**')) return <p key={i}><strong>{line.replace(/\*\*/g, '')}</strong></p>;
                     if (line.startsWith('* ')) return <li key={i} className="ml-4 list-disc text-slate-300 my-1">{line.replace('* ', '')}</li>;
                     if (line.trim() === '') return <br key={i} />;
                     return <p key={i} className="text-slate-300">{line}</p>;
                   })}
                 </div>
              </div>

              {/* Action Form */}
              <div id="review-form" className="glass-card p-6 md:p-8 relative overflow-hidden">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
                 
                 <div className="mb-6 relative z-10">
                   <h2 className="text-2xl font-bold text-white mb-2">석지운 변호사에게 최종 검토 받기</h2>
                   <p className="text-slate-400">
                     위 AI 진단 내용과 사건 쟁점 요약본을 변호사님께 직접 전송합니다.<br/>
                     연락처를 남겨주시면 무료로 1차 대응 방안(내용증명, 합의조정 등)을 안내해 드립니다.
                   </p>
                 </div>

                 <form onSubmit={handleSubmitReview} className="space-y-4 relative z-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="form-label text-white">이름</label>
                        <input type="text" className="form-input bg-slate-900/60 focus:border-blue-500" placeholder="홍길동" value={formData.userName || ''} onChange={(e) => handleChange('userName', e.target.value)} required />
                      </div>
                      <div>
                        <label className="form-label text-white">연락처 (휴대폰)</label>
                        <input type="tel" className="form-input bg-slate-900/60 focus:border-blue-500" placeholder="010-1234-5678" value={formData.phoneNumber || ''} onChange={(e) => handleChange('phoneNumber', e.target.value)} required />
                      </div>
                    </div>
                    
                    <div className="pt-4 pb-2">
                       <label className="flex items-start gap-3 cursor-pointer group">
                         <div className="relative flex items-start pt-1">
                           <input type="checkbox" className="w-5 h-5 rounded border-slate-600 bg-slate-900/60 text-blue-500 checked:bg-blue-500 cursor-pointer" required />
                         </div>
                         <div className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors">
                           (필수) 무료 검토 및 상담 접수를 위한 개인정보 수집·이용에 동의합니다.<br/>
                           <span className="text-xs text-slate-500">수집된 정보는 상담 목적으로만 사용되며, 1년간 보관 후 파기됩니다.</span>
                         </div>
                       </label>
                    </div>

                    <button 
                      type="submit" 
                      disabled={isSubmitting}
                      className="w-full py-4 rounded-xl bg-white text-navy-950 font-bold text-lg hover:bg-slate-100 transition-colors flex items-center justify-center gap-2 shadow-xl shadow-white/10"
                    >
                      {isSubmitting ? '접수 처리 중...' : '검토 요청서 접수하기'}
                    </button>
                 </form>
              </div>
           </div>
        )}

        {/* STEP 5: 완료 */}
        {step === 5 && (
           <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
             <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mb-6">
               <svg className="w-10 h-10 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                 <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
               </svg>
             </div>
             <h2 className="text-3xl font-bold text-white mb-4">접수가 완료되었습니다!</h2>
             <p className="text-slate-400 mb-8 max-w-md mx-auto leading-relaxed">
               AI가 분석한 사건 요약본이 <strong>석지운 변호사</strong>에게 성공적으로 전달되었습니다.<br/>
               남겨주신 번호 <strong>{formData.phoneNumber}</strong>로<br/>조만간 연락을 드리겠습니다.
             </p>
             <button onClick={() => window.location.reload()} className="px-6 py-3 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors">
               처음으로 돌아가기
             </button>
           </div>
        )}

      </div>

      {/* Footer */}
      <footer className="w-full border-t border-slate-800/60 py-6 relative z-10 bg-navy-950/80 backdrop-blur-sm">
         <div className="max-w-4xl mx-auto px-6 text-center">
            <p className="text-xs text-slate-500 leading-relaxed mb-2">
              본 서비스는 AI 리걸 어시스턴트에 의한 참고용 1차 진단 정보를 제공하며, 변호사법에 따른 유상 법률상담이나 확정적 법률판단을 즉시 제공하지 않습니다.
              <br/>구체적인 법적 권리 보호 조치(내용증명, 소액결제 취소, 민사소송 등)는 석지운 변호사와의 직접 상담 후 결정하시기 바랍니다.
            </p>
            <p className="text-xs text-slate-600 font-semibold mb-2">
               석지운 법률사무소 | 대표변호사 석지운
            </p>
            <p className="text-[10px] text-slate-700">
              © {new Date().getFullYear()} Refund Expedition AI Intake System. All rights reserved.
            </p>
         </div>
      </footer>
    </main>
  );
}
