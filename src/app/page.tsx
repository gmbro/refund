'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { CATEGORY_LEGAL_SUMMARY } from '@/data/refund-rules';

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
  { id: 'other', title: '기타 (직접 입력)', icon: '📝' },
];

// ==========================================
// 1.5 Tooltip Component (click/tap, opens below)
// ==========================================
function Tooltip({ children, text }: { children: React.ReactNode; text: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [open]);

  return (
    <div ref={ref} className="relative inline-flex items-center">
      <div onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(!open); }}>{children}</div>
      {open && (
        <div className="absolute top-full left-0 mt-1.5 w-[220px] z-50 animate-fade-in-up" style={{ animationDuration: '0.15s' }}>
          <div className="absolute top-0 left-3 -mt-1 border-4 border-transparent border-b-slate-800"></div>
          <div className="bg-slate-800 text-white text-xs rounded-lg py-2.5 px-3.5 shadow-xl whitespace-pre-line leading-relaxed mt-1">
            {text}
          </div>
        </div>
      )}
    </div>
  );
}

const LabelWithTooltip = ({ label, tooltipText }: { label: string; tooltipText: string }) => (
  <label className="form-label flex items-center gap-1.5">
    {label}
    <Tooltip text={tooltipText}>
      <span className="cursor-pointer w-4 h-4 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center text-[10px] font-bold hover:bg-orange-200 hover:text-orange-600 active:bg-orange-300 transition-colors select-none">?</span>
    </Tooltip>
  </label>
);

// ==========================================
// 1.6 Currency Input Component (auto comma formatting)
// ==========================================
function CurrencyInput({ value, onChange, placeholder, required, id }: {
  value: string;
  onChange: (rawValue: string) => void;
  placeholder?: string;
  required?: boolean;
  id?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const formatNumber = (num: string) => {
    const raw = num.replace(/[^0-9]/g, '');
    if (!raw) return '';
    return Number(raw).toLocaleString('ko-KR');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, '');
    onChange(raw);
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setTimeout(() => {
      e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 300);
  };

  return (
    <input
      ref={inputRef}
      id={id}
      type="text"
      inputMode="numeric"
      className="form-input"
      placeholder={placeholder}
      value={formatNumber(value)}
      onChange={handleInputChange}
      onFocus={handleFocus}
      required={required}
    />
  );
}

const KOREAN_DAYS = ['일', '월', '화', '수', '목', '금', '토'];
const KOREAN_MONTHS = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];

// ==========================================
// 2. Custom DatePicker Component
// ==========================================
function DatePicker({ value, onChange, label, id, tooltipText }: {
  value: string;
  onChange: (value: string) => void;
  label: string;
  id: string;
  tooltipText?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [viewYear, setViewYear] = useState(() => {
    if (value) return new Date(value).getFullYear();
    return new Date().getFullYear();
  });
  const [viewMonth, setViewMonth] = useState(() => {
    if (value) return new Date(value).getMonth();
    return new Date().getMonth();
  });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const handlePrevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const handleNextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const handleSelectDate = (day: number) => {
    const mm = String(viewMonth + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    onChange(`${viewYear}-${mm}-${dd}`);
    setIsOpen(false);
  };

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);
  const days: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  const selectedDate = value ? new Date(value) : null;

  const formatDisplayDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 (${KOREAN_DAYS[d.getDay()]})`;
  };

  return (
    <div ref={containerRef} className="datepicker-container relative">
      {tooltipText ? (
        <LabelWithTooltip label={label} tooltipText={tooltipText} />
      ) : (
        <label className="form-label" htmlFor={id}>{label}</label>
      )}
      <button
        type="button"
        id={id}
        className="form-input text-left flex items-center justify-between cursor-pointer"
        onClick={() => { setIsOpen(!isOpen); if (!isOpen && value) { setViewYear(new Date(value).getFullYear()); setViewMonth(new Date(value).getMonth()); } }}
      >
        <span className={value ? 'text-slate-800' : 'text-slate-400'}>
          {value ? formatDisplayDate(value) : '날짜를 선택하세요'}
        </span>
        <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </button>

      {isOpen && (
        <div className="datepicker-dropdown absolute z-50 mt-2 w-full bg-white rounded-xl shadow-2xl border border-slate-200/80 overflow-hidden animate-fade-in-up" style={{ animationDuration: '0.2s' }}>
          {/* Month/Year navigation */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-orange-50 to-amber-50 border-b border-orange-100">
            <button type="button" onClick={handlePrevMonth} className="w-8 h-8 rounded-full hover:bg-orange-100 flex items-center justify-center transition-colors">
              <svg className="w-5 h-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            </button>
            <div className="text-base font-bold text-slate-700">
              {viewYear}년 {KOREAN_MONTHS[viewMonth]}
            </div>
            <button type="button" onClick={handleNextMonth} className="w-8 h-8 rounded-full hover:bg-orange-100 flex items-center justify-center transition-colors">
              <svg className="w-5 h-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 gap-0 px-3 pt-3 pb-1">
            {KOREAN_DAYS.map((day, i) => (
              <div key={day} className={`text-center text-xs font-bold py-1 ${i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-slate-400'}`}>
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-0 px-3 pb-3">
            {days.map((day, i) => {
              if (day === null) return <div key={`empty-${i}`} className="p-1" />;
              
              const dateObj = new Date(viewYear, viewMonth, day);
              const isToday = dateObj.getTime() === today.getTime();
              const isSelected = selectedDate && dateObj.getFullYear() === selectedDate.getFullYear() && dateObj.getMonth() === selectedDate.getMonth() && dateObj.getDate() === selectedDate.getDate();
              const dayOfWeek = dateObj.getDay();

              return (
                <button
                  key={`day-${day}`}
                  type="button"
                  onClick={() => handleSelectDate(day)}
                  className={`
                    p-1 text-sm font-medium rounded-lg transition-all duration-150 aspect-square flex items-center justify-center
                    ${isSelected 
                      ? 'bg-orange-500 text-white shadow-md shadow-orange-500/30 scale-105' 
                      : isToday 
                        ? 'bg-orange-100 text-orange-700 font-bold ring-1 ring-orange-300' 
                        : dayOfWeek === 0 
                          ? 'text-red-500 hover:bg-red-50' 
                          : dayOfWeek === 6 
                            ? 'text-blue-500 hover:bg-blue-50' 
                            : 'text-slate-600 hover:bg-slate-100'
                    }
                  `}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Quick actions */}
          <div className="px-3 pb-3 flex gap-2">
            <button
              type="button"
              onClick={() => { const t = new Date(); handleSelectDate(t.getDate()); setViewYear(t.getFullYear()); setViewMonth(t.getMonth()); }}
              className="flex-1 text-xs py-2 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 font-medium transition-colors"
            >
              오늘
            </button>
            <button
              type="button"
              onClick={() => { onChange(''); setIsOpen(false); }}
              className="flex-1 text-xs py-2 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 font-medium transition-colors"
            >
              초기화
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// 3. Voice Input Hook
// ==========================================
function useVoiceInput(onResult: (text: string) => void) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      setIsSupported(true);
      const recognition = new SpeechRecognition();
      recognition.lang = 'ko-KR';
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }
        if (finalTranscript) {
          onResult(finalTranscript);
        }
      };

      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);

      recognitionRef.current = recognition;
    }
  }, [onResult]);

  const toggle = useCallback(() => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  }, [isListening]);

  return { isListening, isSupported, toggle };
}

// ==========================================
// 4. Legal Summary Preview Component
// ==========================================
function LegalPreviewCard({ categoryId }: { categoryId: string }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const summary = CATEGORY_LEGAL_SUMMARY[categoryId];
  if (!summary) return null;

  return (
    <div className="legal-preview-card mb-6">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full text-left"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">⚖️</span>
            <span className="font-bold text-slate-700 text-sm">소비자분쟁해결기준 — {summary.title}</span>
          </div>
          <svg
            className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
        {!isExpanded && (
          <p className="text-xs text-orange-600 mt-2 font-medium">
            👆 탭하여 내 법적 권리를 미리 확인하세요
          </p>
        )}
      </button>

      {isExpanded && (
        <div className="mt-4 space-y-4 animate-fade-in-up" style={{ animationDuration: '0.3s' }}>
          <div>
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">📋 핵심 기준</h4>
            <ul className="space-y-1.5">
              {summary.keyPoints.map((point, i) => (
                <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                  <span className="text-orange-400 mt-0.5 flex-shrink-0">•</span>
                  {point}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-orange-50/50 rounded-lg p-3 border border-orange-100">
            <h4 className="text-xs font-bold text-orange-600 mb-1.5">⚡ 위약금 상한</h4>
            <p className="text-sm font-bold text-slate-800">{summary.maxPenaltyRule}</p>
          </div>

          <div>
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">🛡️ 당신의 권리</h4>
            <ul className="space-y-1.5">
              {summary.consumerRights.map((right, i) => (
                <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                  <span className="text-green-500 mt-0.5 flex-shrink-0">✓</span>
                  {right}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// 5. Main Funnel Component
// ==========================================
export default function FunnelPage() {
  const [step, setStep] = useState(1);
  const [category, setCategory] = useState<string>('');
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);

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

  // Voice input handler
  const handleVoiceResult = useCallback((text: string) => {
    setFormData((prev) => ({
      ...prev,
      description: (prev.description || '') + text,
    }));
  }, []);

  const { isListening, isSupported, toggle: toggleVoice } = useVoiceInput(handleVoiceResult);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();

    // 날짜 필드 유효성 검증 (DatePicker는 hidden input이므로 수동 검증)
    if (category === 'wedding' || category === 'travel') {
      if (!formData.targetDate || !formData.cancelDate) {
        alert('날짜를 모두 선택해주세요.');
        return;
      }
    } else if (category !== 'gym' && category !== 'other') {
      if (!formData.contractDate || !formData.cancelDate) {
        alert('계약/결제 일자와 취소 통보 일자를 모두 선택해주세요.');
        return;
      }
    } else if (category === 'other' && !formData.otherCategoryName) {
      alert('분쟁 대상 서비스/업종을 입력해주세요.');
      return;
    }

    handleNext(3);
    
    try {
      const payload: Record<string, string> = { ...formData, category };
      const numericFields = ['totalAmount', 'totalMonths', 'usedMonths', 'demandedPenalty'];
      for (const field of numericFields) {
        if (payload[field]) payload[field] = String(Number(payload[field]));
      }

      // Map targetDate/contractDate to appropriate API fields
      if (category === 'wedding' && payload.targetDate) {
        payload.weddingDate = payload.targetDate;
      }
      if (category === 'travel' && payload.targetDate) {
        payload.serviceDate = payload.targetDate;
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
        userEmail: formData.userEmail,
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
      <header className="px-4 md:px-6 py-3 md:py-4 flex items-center justify-between w-full relative z-10 border-b border-orange-100/50 bg-white/60 backdrop-blur-sm">
        <div 
          onClick={() => { if(step <= 2) handlePrev(1) }}
          className={`flex items-center gap-2 min-w-0 ${step <= 2 ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}`}
        >
          <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-orange-500 flex items-center justify-center text-white font-bold text-xs md:text-sm shadow-md shadow-orange-500/20 flex-shrink-0">
            환
          </div>
          <span className="font-bold text-sm md:text-lg text-slate-800 tracking-tight truncate">환불원정대</span>
        </div>
        {step > 1 && step < 5 && (
          <div className="text-xs md:text-sm text-orange-600/80 font-medium bg-orange-100/50 px-2.5 md:px-3 py-1 rounded-full border border-orange-200/50 flex-shrink-0 ml-2">
            {step} / 4
          </div>
        )}
      </header>

      {/* Container */}
      <div className="flex-1 w-full max-w-5xl mx-auto px-4 md:px-6 pb-24 relative z-10 animate-fade-in-up overflow-x-hidden" key={step}>
        
        {/* STEP 1: 카테고리 15종 */}
        {step === 1 && (
          <div className="pt-8 md:pt-12 pb-10">
             <div className="text-center mb-8 md:mb-12">
               <div className="inline-flex items-center gap-2 px-3 md:px-4 py-1.5 rounded-full bg-orange-100 text-orange-700 text-xs md:text-sm font-bold mb-4 md:mb-6 shadow-sm border border-orange-200">
                 ✨ 일상 속 분쟁, AI와 변호사가 함께 풀어드립니다
               </div>
               <h1 className="text-2xl md:text-5xl font-extrabold mb-4 md:mb-5 text-slate-800 leading-tight">
                 불공정한 위약금, <br className="md:hidden" />
                 <span className="gradient-text">확실하게 방어하세요</span>
               </h1>
               <p className="text-slate-600 text-base md:text-lg">
                 어떤 카테고리에서 분쟁이 발생했나요? 선택해주세요.
               </p>
             </div>

             <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 md:gap-4">
                {categories.map((cat) => (
                  <div
                    key={cat.id}
                    onClick={() => handleCategorySelect(cat.id)}
                    className="glass-card p-3 md:p-5 cursor-pointer flex flex-col items-center justify-center text-center hover:border-orange-300 hover:shadow-orange-200/50 hover:-translate-y-1 transition-all duration-300"
                  >
                    <div className="text-2xl md:text-4xl mb-1.5 md:mb-3 drop-shadow-sm">{cat.icon}</div>
                    <h2 className="text-xs md:text-base font-bold text-slate-700 leading-tight">{cat.title}</h2>
                  </div>
                ))}
             </div>
          </div>
        )}

        {/* STEP 2: 정보 입력 */}
        {step === 2 && (
          <div className="max-w-xl mx-auto pt-8">
            <button onClick={() => handlePrev(1)} className="flex items-center gap-1 text-slate-500 hover:text-slate-700 text-sm mb-6 font-medium">
              ← 카테고리 다시 선택
            </button>
            <div className="mb-6 text-center">
              <div className="text-4xl mb-3">{categories.find(c => c.id === category)?.icon}</div>
              <h1 className="text-2xl font-bold text-slate-800 mb-2">{getCategoryTitle()} 분쟁 접수</h1>
              <p className="text-slate-600 text-sm">상황을 입력해주시면 AI가 소비자분쟁해결기준을 바탕으로 1차 진단서를 작성합니다.</p>
            </div>

            {/* 법적 기준 미리보기 */}
            <LegalPreviewCard categoryId={category} />

            <form onSubmit={handleAnalyze} className="space-y-6">
              <div className="glass-card p-6 md:p-8 space-y-6">
                
                {category === 'gym' ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div><LabelWithTooltip label="총 결제액 (원)" tooltipText="할인 전 정가가 아닌, 부가세 포함 실제로 결제하신 총 금액입니다." /><CurrencyInput value={formData.totalAmount || ''} onChange={(v) => handleChange('totalAmount', v)} required /></div>
                      <div><LabelWithTooltip label="총 개월 수" tooltipText="계약하신 전체 서비스 기간(개월 수) 또는 총 PT 횟수입니다." /><input type="number" inputMode="numeric" className="form-input" value={formData.totalMonths || ''} onChange={(e) => handleChange('totalMonths', e.target.value)} onFocus={(e) => setTimeout(() => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300)} required /></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div><LabelWithTooltip label="이용 개월 수" tooltipText="실제로 헬스장/서비스를 이용하신 개월 수 또는 횟수입니다." /><input type="number" inputMode="numeric" className="form-input" value={formData.usedMonths || ''} onChange={(e) => handleChange('usedMonths', e.target.value)} onFocus={(e) => setTimeout(() => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300)} required /></div>
                      <div><LabelWithTooltip label="업체 요구 위약금 (원)" tooltipText="환불을 요구했을 때 업체가 차감하겠다고 주장하는 위약금입니다." /><CurrencyInput value={formData.demandedPenalty || ''} onChange={(v) => handleChange('demandedPenalty', v)} required /></div>
                    </div>
                  </>
                ) : category === 'wedding' || category === 'travel' ? (
                   <>
                    <div><LabelWithTooltip label="총 결제 금액 (원)" tooltipText="식대, 대관료 등 계약서 상의 총 금액 또는 실제 총 결제액입니다." /><CurrencyInput value={formData.totalAmount || ''} onChange={(v) => handleChange('totalAmount', v)} required /></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <DatePicker
                        id={`${category}-target-date`}
                        label={category==='wedding'?'예식 예정일':'이용 예정일'}
                        tooltipText={category==='wedding'?'계약서 상의 결혼식 날짜입니다.':'숙소나 항공권의 실제 이용 시작일입니다.'}
                        value={formData.targetDate || ''}
                        onChange={(v) => handleChange('targetDate', v)}
                      />
                      <DatePicker
                        id={`${category}-cancel-date`}
                        label="취소 요청일"
                        tooltipText="업체에 처음으로 계약 해지(환불) 의사를 전달한 날짜입니다."
                        value={formData.cancelDate || ''}
                        onChange={(v) => handleChange('cancelDate', v)}
                      />
                    </div>
                    <div><LabelWithTooltip label="업체 요구 위약금 (원)" tooltipText="환불을 요구했을 때 업체가 차감하겠다고 주장하는 위약금입니다." /><CurrencyInput value={formData.demandedPenalty || ''} onChange={(v) => handleChange('demandedPenalty', v)} required /></div>
                   </>
                ) : category === 'other' ? (
                   <>
                    <div>
                      <LabelWithTooltip label="분쟁 대상 서비스 명칭" tooltipText="예: 필라테스, 렌터카, 어학원 등 분쟁이 발생한 업종을 적어주세요." />
                      <input type="text" className="form-input" placeholder="예: 요가원 회원권" value={formData.otherCategoryName || ''} onChange={(e) => handleChange('otherCategoryName', e.target.value)} required />
                    </div>
                    <div><LabelWithTooltip label="총 결제 금액 (원)" tooltipText="할인 전 정가가 아닌, 부가세 포함 실제로 결제하신 총 금액입니다." /><CurrencyInput placeholder="예: 1,000,000" value={formData.totalAmount || ''} onChange={(v) => handleChange('totalAmount', v)} required /></div>
                    <div><LabelWithTooltip label="업체 요구 보상/위약금액 (원)" tooltipText="환불을 요구했을 때 업체가 차감하겠다고 주장하는 위약금입니다." /><CurrencyInput placeholder="예: 300,000" value={formData.demandedPenalty || ''} onChange={(v) => handleChange('demandedPenalty', v)} required /></div>
                   </>
                ) : (
                  // 공통 폼 (나머지 카테고리)
                  <>
                    <div><LabelWithTooltip label="총 결제 금액 (원)" tooltipText="할인 전 정가가 아닌, 부가세 포함 실제로 결제하신 총 금액입니다." /><CurrencyInput placeholder="예: 1,000,000" value={formData.totalAmount || ''} onChange={(v) => handleChange('totalAmount', v)} required /></div>
                    <div><LabelWithTooltip label="업체의 요구 보상/위약금액 (원)" tooltipText="환불을 요구했을 때 업체가 차감하겠다고 주장하는 위약금입니다." /><CurrencyInput placeholder="예: 300,000" value={formData.demandedPenalty || ''} onChange={(v) => handleChange('demandedPenalty', v)} required /></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <DatePicker
                        id="generic-contract-date"
                        label="계약/결제 일자"
                        tooltipText="최초로 비용을 결제하시거나 계약서에 서명하신 날짜입니다."
                        value={formData.contractDate || ''}
                        onChange={(v) => handleChange('contractDate', v)}
                      />
                      <DatePicker
                        id="generic-cancel-date"
                        label="취소 통보 일자"
                        tooltipText="업체에 처음으로 계약 해지(환불) 의사를 전달한 날짜입니다."
                        value={formData.cancelDate || ''}
                        onChange={(v) => handleChange('cancelDate', v)}
                      />
                    </div>
                  </>
                )}

                <div className="pt-4 border-t border-slate-200">
                  <div className="flex items-center justify-between mb-2">
                    <label className="form-label text-orange-600 font-bold mb-0">억울한 상황을 상세히 적어주세요</label>
                    {isSupported && (
                      <button
                        type="button"
                        onClick={toggleVoice}
                        className={`voice-btn ${isListening ? 'voice-btn-active' : ''}`}
                        title={isListening ? '음성 입력 중지' : '음성으로 입력하기'}
                      >
                        {isListening ? (
                          <span className="flex items-center gap-1.5">
                            <span className="voice-pulse-dot" />
                            <span className="text-xs font-bold">녹음 중...</span>
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                            </svg>
                            <span className="text-xs font-bold">음성 입력</span>
                          </span>
                        )}
                      </button>
                    )}
                  </div>
                  <textarea 
                    className={`form-input resize-none w-full h-32 bg-slate-50/50 ${isListening ? 'ring-2 ring-red-300 border-red-200' : ''}`}
                    placeholder="예: 단순 변심으로 환불하려는데 계약금 100%를 전부 몰수한다고 합니다."
                    value={formData.description || ''}
                    onChange={(e) => handleChange('description', e.target.value)}
                    required
                  />
                  {isListening && (
                    <p className="text-xs text-red-500 mt-1 animate-pulse font-medium">
                      🎤 음성을 인식하고 있습니다. 말씀해주세요...
                    </p>
                  )}
                </div>

                {/* 이용약관 링크 및 계약서 첨부 */}
                <div className="pt-4 border-t border-slate-200 space-y-4">
                  <div>
                    <LabelWithTooltip label="이용약관 링크 (선택)" tooltipText="해당 업체의 이용약관이나 환불 정책이 게시된 웹사이트 주소가 있다면 붙여넣어주세요." />
                    <input type="url" className="form-input bg-slate-50 text-sm" placeholder="https://..." value={formData.contractLink || ''} onChange={(e) => handleChange('contractLink', e.target.value)} />
                  </div>
                  <div>
                    <LabelWithTooltip label="계약서/결제내역 첨부 (선택)" tooltipText="참고용으로 계약서 촬영본 또는 PDF를 첨부하실 수 있습니다." />
                    <input type="file" accept=".pdf,.png,.jpg,.jpeg,.webp" className="block w-full text-sm text-slate-500
                      file:mr-4 file:py-2.5 file:px-4
                      file:rounded-xl file:border-0
                      file:text-sm file:font-semibold
                      file:bg-orange-100 file:text-orange-700
                      hover:file:bg-orange-200 file:transition-colors file:cursor-pointer cursor-pointer border border-slate-200 rounded-xl"
                      onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                          handleChange('attachedFile', e.target.files[0].name);
                        }
                      }}
                    />
                  </div>
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
                소비자분쟁해결기준 분석 중...
             </h2>
             <p className="text-slate-600 text-center max-w-md text-sm leading-relaxed">
               입력하신 정보를 바탕으로 소비자분쟁해결기준과 <br/>
               관련 법령·판례를 우선적으로 검토하고 있습니다.
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

              {/* 내 법적 권리 하이라이트 섹션 */}
              {analysisResult.calculation && (
                <div className="legal-rights-card mb-8">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-xl">🛡️</span>
                    <h3 className="text-lg font-extrabold text-slate-800">소비자분쟁해결기준에 따른 내 권리</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 mb-4">
                    <div className="bg-green-50 rounded-xl p-3 md:p-4 border border-green-200">
                      <p className="text-xs font-bold text-green-600 mb-1">법적으로 보장되는 최소 환불액</p>
                      <p className="text-xl md:text-2xl font-extrabold text-green-700">
                        {Number(analysisResult.calculation.legalMinRefund).toLocaleString()}원
                      </p>
                    </div>
                    <div className="bg-red-50 rounded-xl p-3 md:p-4 border border-red-200">
                      <p className="text-xs font-bold text-red-500 mb-1">업체 요구 위약금</p>
                      <p className="text-xl md:text-2xl font-extrabold text-red-600">
                        {Number(analysisResult.calculation.demandedPenalty).toLocaleString()}원
                      </p>
                    </div>
                  </div>

                  {analysisResult.calculation.excessPenalty > 0 && (
                    <div className="bg-amber-50 rounded-xl p-4 border border-amber-300 mb-4">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">⚠️</span>
                        <p className="text-sm font-extrabold text-amber-700">법적 기준 초과 위약금 감지!</p>
                      </div>
                      <p className="text-sm text-amber-800">
                        업체가 요구하는 위약금은 소비자분쟁해결기준보다 <strong className="text-red-600">{Number(analysisResult.calculation.excessPenalty).toLocaleString()}원</strong> 더 많습니다.
                        이 초과분은 법적으로 부당한 요구일 수 있습니다.
                      </p>
                    </div>
                  )}

                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                    <p className="text-xs font-bold text-slate-500 mb-2">📐 산정 근거</p>
                    <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">{analysisResult.calculation.formula}</p>
                    <p className="text-xs text-slate-500 mt-3 pt-2 border-t border-slate-200">
                      <strong>적용 법령:</strong> {analysisResult.calculation.legalBasis}
                    </p>
                  </div>
                </div>
              )}

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
                    <div>
                      <label className="form-label">이메일</label>
                      <input type="email" className="form-input bg-slate-50 focus:bg-white" placeholder="example@email.com" value={formData.userEmail || ''} onChange={(e) => handleChange('userEmail', e.target.value)} required />
                    </div>
                    
                    {/* 개인정보 수집 안내 */}
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-xs text-slate-500 space-y-2">
                      <p className="font-bold text-slate-600">📋 개인정보 수집·이용 안내</p>
                      <table className="w-full text-left">
                        <tbody>
                          <tr className="border-b border-slate-100">
                            <td className="py-1.5 pr-3 font-semibold text-slate-600 whitespace-nowrap align-top">수집 항목</td>
                            <td className="py-1.5">이름, 이메일, 휴대폰 번호</td>
                          </tr>
                          <tr className="border-b border-slate-100">
                            <td className="py-1.5 pr-3 font-semibold text-slate-600 whitespace-nowrap align-top">수집 목적</td>
                            <td className="py-1.5">담당 변호사의 법률 상담 연결 및 사건 진행 안내</td>
                          </tr>
                          <tr className="border-b border-slate-100">
                            <td className="py-1.5 pr-3 font-semibold text-slate-600 whitespace-nowrap align-top">보유 기간</td>
                            <td className="py-1.5">수집일로부터 1년 (이후 자동 파기)</td>
                          </tr>
                          <tr>
                            <td className="py-1.5 pr-3 font-semibold text-slate-600 whitespace-nowrap align-top">제3자 제공</td>
                            <td className="py-1.5">담당 법률사무소 외 제3자에게 제공하지 않습니다.</td>
                          </tr>
                        </tbody>
                      </table>
                      <p className="text-slate-400">※ 동의를 거부할 수 있으며, 거부 시 상담 신청이 제한됩니다.</p>
                    </div>

                    <div className="pt-1 pb-2">
                       <label className="flex items-start gap-3 cursor-pointer group">
                         <div className="pt-0.5">
                           <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-orange-500 focus:ring-orange-500 cursor-pointer" required />
                         </div>
                         <div className="text-xs text-slate-600 group-hover:text-slate-800 transition-colors font-medium">
                           (필수) 위 개인정보 수집·이용에 동의합니다.
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
               입력해주신 연락처(<strong>{formData.phoneNumber}</strong>) 또는<br/>
               이메일(<strong>{formData.userEmail}</strong>)로<br/>
               영업일 기준 1~2일 내에 답변을 드리겠습니다.
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
              <br/>모든 법적 권리 보호 조치와 분쟁 해결은 담당 변호사와의 실제 상담 검토 후 결정하시기 바랍니다.
            </p>
            <div className="flex justify-center gap-4 mb-3">
              <button onClick={() => setShowTerms(true)} className="text-xs text-slate-500 hover:text-slate-800 underline decoration-slate-300 underline-offset-4">이용약관</button>
              <span className="text-xs text-slate-300">|</span>
              <button onClick={() => setShowPrivacy(true)} className="text-xs font-bold text-slate-600 hover:text-slate-900 underline decoration-slate-400 underline-offset-4">개인정보처리방침</button>
            </div>
            <p className="text-[10px] text-slate-400">
              © {new Date().getFullYear()} 환불원정대 AI Intake System. All rights reserved.
            </p>
         </div>
      </footer>

      {/* 이용약관 모달 */}
      {showTerms && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setShowTerms(false)}>
          <div className="bg-white w-full max-w-2xl max-h-[80vh] rounded-2xl shadow-xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-800">이용약관</h2>
              <button onClick={() => setShowTerms(false)} className="text-slate-400 hover:text-slate-800 text-2xl">&times;</button>
            </div>
            <div className="px-6 py-5 overflow-y-auto max-h-[65vh] text-sm text-slate-600 leading-relaxed space-y-4">
              <h3 className="font-bold text-slate-800">제1조 (목적)</h3>
              <p>본 약관은 환불원정대(이하 &quot;서비스&quot;)가 제공하는 AI 기반 소비자분쟁 진단 서비스의 이용 조건 및 절차에 관한 사항을 규정함을 목적으로 합니다.</p>

              <h3 className="font-bold text-slate-800">제2조 (서비스의 내용)</h3>
              <p>① 본 서비스는 이용자가 입력한 정보를 바탕으로 소비자분쟁해결기준 및 관련 법령에 따른 AI 기초 진단 정보를 제공합니다.<br/>② 본 서비스는 법률 자문이 아니며, 진단 결과는 참고용으로만 활용되어야 합니다.<br/>③ 이용자가 변호사 상담을 신청할 경우, 해당 정보는 담당 변호사에게 전달되며 별도의 상담 절차가 진행됩니다.</p>

              <h3 className="font-bold text-slate-800">제3조 (면책사항)</h3>
              <p>① 본 서비스에서 제공하는 AI 진단 결과는 법적 효력이 없으며, 실제 분쟁 해결을 위해서는 반드시 변호사와의 상담이 필요합니다.<br/>② 서비스 제공자는 AI 진단 결과의 정확성 또는 완전성을 보장하지 않습니다.<br/>③ 이용자의 부정확한 정보 입력으로 인한 결과에 대해 서비스 제공자는 책임을 지지 않습니다.</p>

              <h3 className="font-bold text-slate-800">제4조 (이용자의 의무)</h3>
              <p>① 이용자는 정확한 정보를 입력하여야 합니다.<br/>② 타인의 개인정보를 도용하여 서비스를 이용해서는 안 됩니다.<br/>③ 서비스를 통해 제공받은 진단 결과를 상업적 목적으로 무단 복제·배포해서는 안 됩니다.</p>

              <h3 className="font-bold text-slate-800">제5조 (서비스 변경 및 중단)</h3>
              <p>서비스 제공자는 운영상·기술상의 필요에 따라 서비스의 내용을 변경하거나 중단할 수 있으며, 이 경우 사전 공지합니다.</p>

              <h3 className="font-bold text-slate-800">제6조 (준거법 및 관할)</h3>
              <p>본 약관에 관한 분쟁은 대한민국 법률에 따르며, 서울중앙지방법원을 관할 법원으로 합니다.</p>
            </div>
          </div>
        </div>
      )}

      {/* 개인정보처리방침 모달 */}
      {showPrivacy && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setShowPrivacy(false)}>
          <div className="bg-white w-full max-w-2xl max-h-[80vh] rounded-2xl shadow-xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-800">개인정보처리방침</h2>
              <button onClick={() => setShowPrivacy(false)} className="text-slate-400 hover:text-slate-800 text-2xl">&times;</button>
            </div>
            <div className="px-6 py-5 overflow-y-auto max-h-[65vh] text-sm text-slate-600 leading-relaxed space-y-4">
              <h3 className="font-bold text-slate-800">1. 개인정보의 수집 항목</h3>
              <p>본 서비스는 상담 신청 시 다음의 개인정보를 수집합니다.</p>
              <ul className="list-disc ml-5 space-y-1">
                <li><strong>필수 항목:</strong> 이름, 휴대폰 번호, 이메일 주소</li>
                <li><strong>선택 항목:</strong> 이용약관 링크, 계약서/결제내역 파일명</li>
                <li><strong>자동 수집 항목:</strong> 서비스 이용 기록, 접속 일시</li>
              </ul>

              <h3 className="font-bold text-slate-800">2. 수집 및 이용 목적</h3>
              <ul className="list-disc ml-5 space-y-1">
                <li>AI 기초 진단 서비스 제공</li>
                <li>담당 변호사의 법률 상담 연결 및 사건 진행 안내</li>
                <li>서비스 이용 기록 보관 및 분쟁 처리</li>
              </ul>

              <h3 className="font-bold text-slate-800">3. 개인정보의 보유 및 이용 기간</h3>
              <p>수집된 개인정보는 <strong>수집일로부터 1년</strong>간 보유·이용하며, 보유 기간 경과 후 지체 없이 파기합니다. 단, 관련 법령에 따라 보존이 필요한 경우에는 해당 법령에서 정한 기간 동안 보관합니다.</p>

              <h3 className="font-bold text-slate-800">4. 개인정보의 제3자 제공</h3>
              <p>이용자의 개인정보는 원칙적으로 외부에 제공하지 않습니다. 다만, 이용자가 상담을 신청한 경우 해당 담당 변호사에게 사건 진행을 위해 제공될 수 있습니다.</p>

              <h3 className="font-bold text-slate-800">5. 개인정보의 파기 절차 및 방법</h3>
              <p>보유 기간이 경과하거나 처리 목적이 달성된 경우, 전자적 파일은 복구 불가능한 방법으로 삭제하며, 종이 문서는 분쇄기로 파기합니다.</p>

              <h3 className="font-bold text-slate-800">6. 이용자의 권리</h3>
              <p>이용자는 언제든지 자신의 개인정보에 대해 열람, 정정, 삭제, 처리 정지를 요청할 수 있습니다. 요청은 서비스 내 문의 채널을 통해 접수하실 수 있습니다.</p>

              <h3 className="font-bold text-slate-800">7. 개인정보보호 책임자</h3>
              <p>개인정보 관련 문의사항이 있으시면 아래 연락처로 문의해주시기 바랍니다.</p>
              <ul className="list-disc ml-5 space-y-1">
                <li>담당자: 환불원정대 개인정보보호 담당</li>
                <li>이메일: privacy@refund-expedition.com</li>
              </ul>

              <p className="text-xs text-slate-400 pt-4 border-t border-slate-100">본 방침은 {new Date().getFullYear()}년 4월 1일부터 시행됩니다.</p>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
