'use client';

import { useState, useEffect } from 'react';

// ==========================================
// 1. Data & Types (15 Categories)
// ==========================================
type CategoryInfo = {
  id: string;
  title: string;
  icon: string;
};

const categories: CategoryInfo[] = [
  { id: 'gym', title: '헬스장 / PT', icon: '🏋️' },
  { id: 'wedding', title: '예식장', icon: '💒' },
  { id: 'travel', title: '숙박 / 항공권', icon: '✈️' },
  { id: 'medical', title: '의료 / 성형외과', icon: '🩺' },
  { id: 'education', title: '학원 / 온라인 강의', icon: '📚' },
  { id: 'usedcar', title: '중고차 매매', icon: '🚗' },
  { id: 'autorepair', title: '자동차 수리', icon: '🛠️' },
  { id: 'moving', title: '이사 화물', icon: '📦' },
  { id: 'delivery', title: '택배 / 배송', icon: '🚚' },
  { id: 'beauty', title: '미용실 / 네일샵', icon: '💅' },
  { id: 'interior', title: '인테리어 시공', icon: '🏠' },
  { id: 'game', title: '모바일 게임 결제', icon: '🎮' },
  { id: 'ecommerce', title: '전자상거래 / 직구', icon: '🛒' },
  { id: 'postpartum', title: '산후조리원', icon: '👶' },
  { id: 'funeral', title: '상조 서비스', icon: '⚰️' },
];

// ==========================================
// 2. Main Funnel Component
// ==========================================
export default function FunnelPage() {
  const [step, setStep] = useState(1);
  const [category, setCategory] = useState<string>('');
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step]);

  const handleNext = (nextStep: number) => setStep(nextStep);
  const handlePrev = (prevStep: number) => setStep(prevStep);

  const handleCategorySelect = (id: string) => {
    setCategory(id);
    setFormData({}); // 폼 초기화
    handleNext(2);
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    handleNext(3);
    
    try {
      const payload: Record<string, string> = { ...formData, category };
      const numericFields = ['totalAmount', 'totalMonths', 'usedMonths', 'demandedPenalty'];
      for (const field of numericFields) {
        if (payload[field]) payload[field] = String(Number(payload[field]));
      }

      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('분석 요청 실패');

      const result = await res.json();
      setAnalysisResult(result);
      handleNext(4);
    } catch (error) {
      console.error('Analysis error:', error);
      alert('진단 중 오류가 발생했습니다. 다시 시도해주세요.');
      handlePrev(2);
    }
  };

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
      handleNext(5);
    } catch (error) {
       alert('접수 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
       setIsSubmitting(false);
    }
  };

  const getCategoryTitle = () => categories.find(c => c.id === category)?.title || '';

  return (
    <main className="flex-1 w-full flex flex-col min-h-screen relative overflow-hidden bg-orange-50/30">
      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between w-full relative z-10 border-b border-orange-100/50 bg-white/60 backdrop-blur-sm">
        <div 
          onClick={() => { if(step <= 2) handlePrev(1) }}
          className={`flex items-center gap-2 ${step <= 2 ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}`}
        >
          <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-orange-500/20">
            환
          </div>
          <span className="font-bold text-lg text-slate-800 tracking-tight">석지운 변호사의 환불원정대</span>
        </div>
        {step > 1 && step < 5 && (
          <div className="text-sm text-orange-600/80 font-medium bg-orange-100/50 px-3 py-1 rounded-full border border-orange-200/50">
            진행중 {step} / 4
          </div>
        )}
      </header>

      {/* Container */}
      <div className="flex-1 w-full max-w-5xl mx-auto px-4 pb-24 relative z-10 animate-fade-in-up" key={step}>
        
        {/* STEP 1: 카테고리 15종 */}
        {step === 1 && (
          <div className="pt-12 pb-10">
             <div className="text-center mb-12">
               <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-100 text-orange-700 text-sm font-bold mb-6 shadow-sm border border-orange-200">
                 ✨ 15가지 일상 속 분쟁, 석지운 변호사가 검토합니다
               </div>
               <h1 className="text-3xl md:text-5xl font-extrabold mb-5 text-slate-800 leading-tight">
                 불공정한 위약금, <br className="md:hidden" />
                 <span className="gradient-text">확실하게 방어하세요</span>
               </h1>
               <p className="text-slate-600 text-base md:text-lg">
                 어떤 카테고리에서 분쟁이 발생했나요? 선택해주세요.
               </p>
             </div>

             <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {categories.map((cat) => (
                  <div
                    key={cat.id}
                    onClick={() => handleCategorySelect(cat.id)}
                    className="glass-card p-5 cursor-pointer flex flex-col items-center justify-center text-center hover:border-orange-300 hover:shadow-orange-200/50 hover:-translate-y-1 transition-all duration-300"
                  >
                    <div className="text-4xl mb-3 drop-shadow-sm">{cat.icon}</div>
                    <h2 className="text-sm md:text-base font-bold text-slate-700">{cat.title}</h2>
                  </div>
                ))}
             </div>
          </div>
        )}

        {/* STEP 2: 정보 입력 (공통 폼 위주로 간소화) */}
        {step === 2 && (
          <div className="max-w-xl mx-auto pt-8">
            <button onClick={() => handlePrev(1)} className="flex items-center gap-1 text-slate-500 hover:text-slate-700 text-sm mb-6 font-medium">
              ← 카테고리 다시 선택
            </button>
            <div className="mb-6 text-center">
              <div className="text-4xl mb-3">{categories.find(c => c.id === category)?.icon}</div>
              <h1 className="text-2xl font-bold text-slate-800 mb-2">{getCategoryTitle()} 분쟁 접수</h1>
              <p className="text-slate-600 text-sm">상황을 입력해주시면 AI가 소비자분쟁기준을 바탕으로 1차 진단서를 작성합니다.</p>
            </div>

            <form onSubmit={handleAnalyze} className="space-y-6">
              <div className="glass-card p-6 md:p-8 space-y-6">
                
                {category === 'gym' ? (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div><label className="form-label">총 결제액 (원)</label><input type="number" className="form-input" value={formData.totalAmount || ''} onChange={(e) => handleChange('totalAmount', e.target.value)} required /></div>
                      <div><label className="form-label">총 개월 수</label><input type="number" className="form-input" value={formData.totalMonths || ''} onChange={(e) => handleChange('totalMonths', e.target.value)} required /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div><label className="form-label">이용 개월 수</label><input type="number" className="form-input" value={formData.usedMonths || ''} onChange={(e) => handleChange('usedMonths', e.target.value)} required /></div>
                      <div><label className="form-label">업체 위약금 (원)</label><input type="number" className="form-input" value={formData.demandedPenalty || ''} onChange={(e) => handleChange('demandedPenalty', e.target.value)} required /></div>
                    </div>
                  </>
                ) : category === 'wedding' || category === 'travel' ? (
                   <>
                    <div><label className="form-label">총 결제 금액 (원)</label><input type="number" className="form-input" value={formData.totalAmount || ''} onChange={(e) => handleChange('totalAmount', e.target.value)} required /></div>
                    <div className="grid grid-cols-2 gap-4">
                      <div><label className="form-label">{category==='wedding'?'예식예정일':'이용예정일'}</label><input type="date" className="form-input" value={formData.targetDate || ''} onChange={(e) => handleChange('targetDate', e.target.value)} required /></div>
                      <div><label className="form-label">취소요청일</label><input type="date" className="form-input" value={formData.cancelDate || ''} onChange={(e) => handleChange('cancelDate', e.target.value)} required /></div>
                    </div>
                    <div><label className="form-label">업체구 위약금 (원)</label><input type="number" className="form-input" value={formData.demandedPenalty || ''} onChange={(e) => handleChange('demandedPenalty', e.target.value)} required /></div>
                   </>
                ) : (
                  // 공통 폼 (나머지 12개 카테고리)
                  <>
                    <div><label className="form-label">총 결제 금액 (원)</label><input type="number" className="form-input" placeholder="예: 1000000" value={formData.totalAmount || ''} onChange={(e) => handleChange('totalAmount', e.target.value)} required /></div>
                    <div><label className="form-label">업체의 요구 보상/위약금액 (원)</label><input type="number" className="form-input" placeholder="예: 300000" value={formData.demandedPenalty || ''} onChange={(e) => handleChange('demandedPenalty', e.target.value)} required /></div>
                    <div className="grid grid-cols-2 gap-4">
                      <div><label className="form-label">계약/결제 일자</label><input type="date" className="form-input" value={formData.contractDate || ''} onChange={(e) => handleChange('contractDate', e.target.value)} required /></div>
                      <div><label className="form-label">취소 통보 일자</label><input type="date" className="form-input" value={formData.cancelDate || ''} onChange={(e) => handleChange('cancelDate', e.target.value)} required /></div>
                    </div>
                  </>
                )}

                <div className="pt-4 border-t border-slate-200">
                  <label className="form-label text-orange-600 font-bold">억울한 상황을 상세히 적어주세요</label>
                  <textarea 
                    className="form-input resize-none w-full h-32 mt-2 bg-slate-50/50" 
                    placeholder="예: 단순 변심으로 환불하려는데 계약금 100%를 전부 몰수한다고 합니다."
                    value={formData.description || ''}
                    onChange={(e) => handleChange('description', e.target.value)}
                    required
                  />
                </div>
              </div>

              <button type="submit" className="gradient-btn w-full py-4 text-lg font-bold shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2">
                <span>AI 기초 진단서 무료 확인</span>
                <span>→</span>
              </button>
            </form>
          </div>
        )}

        {/* STEP 3: Loading */}
        {step === 3 && (
          <div className="flex flex-col items-center justify-center min-h-[50vh]">
             <div className="relative w-24 h-24 mb-8">
               <div className="absolute inset-0 border-t-4 border-orange-400 rounded-full animate-spin"></div>
               <div className="absolute inset-2 border-r-4 border-amber-400 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
               <div className="absolute inset-0 flex items-center justify-center text-3xl">⚖️</div>
             </div>
             <h2 className="text-2xl font-bold text-slate-800 mb-3">
                법령 및 판례 검색 중...
             </h2>
             <p className="text-slate-600 text-center max-w-md text-sm leading-relaxed">
               입력하신 정보를 바탕으로 소비자분쟁해결기준과 <br/>
               최신 판례를 1차적으로 검토하고 있습니다.
             </p>
          </div>
        )}

        {/* STEP 4: 결과 + 변호사 검토 폼 */}
        {step === 4 && analysisResult && (
           <div className="max-w-2xl mx-auto pt-8 pb-10">
              
              <div className="p-4 rounded-xl bg-orange-50 border border-orange-200 text-sm text-slate-700 mb-8 leading-relaxed shadow-sm">
                  <p className="font-bold text-orange-700 mb-2 flex items-center gap-2">
                     안내사항
                  </p>
                  본 진단서는 AI가 소비자분쟁해결기준을 바탕으로 작성한 단순 참고용 정보입니다. <strong className="text-orange-600 border-b border-orange-300">아래 폼을 통해 석지운 변호사에게 실제 대응 방안을 문의해보세요.</strong>
              </div>

              <div className="glass-card mb-10 overflow-hidden">
                 <div className="bg-gradient-to-r from-orange-100 to-amber-50 px-6 py-5 border-b border-orange-200/60">
                    <h2 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
                      <span className="text-2xl">📑</span> AI 기초 진단 요약본
                    </h2>
                 </div>
                 <div className="p-6 md:p-8 prose-result text-sm md:text-base">
                   {analysisResult.clientSummary.split('\n').map((line: string, i: number) => {
                     if (line.startsWith('## ')) return <h2 key={i} className="text-lg font-bold text-orange-700 mt-6 mb-3 pb-2 border-b border-slate-100">{line.replace('## ', '')}</h2>;
                     if (line.startsWith('**') && line.endsWith('**')) return <p key={i} className="my-2 text-slate-800"><strong>{line.replace(/\*\*/g, '')}</strong></p>;
                     if (line.startsWith('* ')) return <li key={i} className="ml-5 list-disc text-slate-600 my-1">{line.replace('* ', '')}</li>;
                     if (line.trim() === '') return <div key={i} className="h-2"></div>;
                     return <p key={i} className="text-slate-600 my-1">{line}</p>;
                   })}
                 </div>
              </div>

              {/* Action Form */}
              <div id="review-form" className="bg-white rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.05)] border border-slate-200 p-6 md:p-8 relative overflow-hidden">
                 <div className="mb-6 relative z-10">
                   <h2 className="text-2xl font-extrabold text-slate-800 mb-2 text-center">석지운 변호사 전문 상담 신청</h2>
                   <p className="text-slate-500 text-sm text-center">
                     AI가 정리한 쟁점 요약본을 변호사님께 바로 전달합니다.<br/>
                     가장 빠르고 확실한 승소 전략을 무료 1차 상담으로 안내해 드립니다.
                   </p>
                 </div>

                 <form onSubmit={handleSubmitReview} className="space-y-5 relative z-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="form-label">이름</label>
                        <input type="text" className="form-input bg-slate-50 focus:bg-white" placeholder="홍길동" value={formData.userName || ''} onChange={(e) => handleChange('userName', e.target.value)} required />
                      </div>
                      <div>
                        <label className="form-label">연락처 (휴대폰)</label>
                        <input type="tel" className="form-input bg-slate-50 focus:bg-white" placeholder="010-1234-5678" value={formData.phoneNumber || ''} onChange={(e) => handleChange('phoneNumber', e.target.value)} required />
                      </div>
                    </div>
                    
                    <div className="pt-2 pb-2">
                       <label className="flex items-start gap-3 cursor-pointer group">
                         <div className="pt-0.5">
                           <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-orange-500 focus:ring-orange-500 cursor-pointer" required />
                         </div>
                         <div className="text-xs text-slate-500 group-hover:text-slate-700 transition-colors">
                           (필수) 접수를 위한 개인정보 수집 및 이용에 동의합니다. <br/>
                           상담 목적으로만 이용되며 1년 후 안전하게 파기됩니다.
                         </div>
                       </label>
                    </div>

                    <button 
                      type="submit" 
                      disabled={isSubmitting}
                      className="gradient-btn w-full py-4 text-white font-bold text-lg flex items-center justify-center gap-2 shadow-xl shadow-orange-500/20"
                    >
                      {isSubmitting ? '접수 처리 중...' : '변호사에게 사건 검토 요청하기'}
                    </button>
                 </form>
              </div>
           </div>
        )}

        {/* STEP 5: 완료 */}
        {step === 5 && (
           <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
             <div className="w-20 h-20 rounded-full bg-orange-100 flex items-center justify-center mb-6 shadow-sm border border-orange-200">
               <svg className="w-10 h-10 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                 <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
               </svg>
             </div>
             <h2 className="text-3xl font-extrabold text-slate-800 mb-4">접수가 완료되었습니다!</h2>
             <p className="text-slate-600 mb-8 max-w-sm mx-auto leading-relaxed">
               전달해주신 내용은 <strong>석지운 변호사</strong>가 꼼꼼히 확인 후,<br/>
               입력해주신 연락처(<strong>{formData.phoneNumber}</strong>)로<br/>
               영업일 기준 1~2일 내에 답장을 드리겠습니다.
             </p>
             <button onClick={() => window.location.reload()} className="font-bold px-6 py-3 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-50 transition-colors">
               홈으로 돌아가기
             </button>
           </div>
        )}

      </div>

      {/* Footer */}
      <footer className="w-full border-t border-slate-200 bg-white/50 backdrop-blur-md py-8 relative z-10">
         <div className="max-w-4xl mx-auto px-6 text-center">
            <p className="text-xs text-slate-400 leading-relaxed mb-3">
              본 서비스는 AI 리걸 어시스턴트에 의한 1차 진단 정보를 제공하며, 변호사법에 따른 유상 법률상담을 즉시 제공하지 않습니다.
              <br/>모든 법적 권리 보호 조치와 분쟁 해결은 석지운 변호사와의 실제 상담 검토 후 결정하시기 바랍니다.
            </p>
            <p className="text-xs text-slate-500 font-bold mb-2">
               석지운 법률사무소 | 대표변호사 석지운
            </p>
            <p className="text-[10px] text-slate-400">
              © {new Date().getFullYear()} Refund Expedition AI Intake System. All rights reserved.
            </p>
         </div>
      </footer>
    </main>
  );
}
