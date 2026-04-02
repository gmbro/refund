'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCase, setSelectedCase] = useState<any>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'refund1234') { // 임시 하드코딩 패스워드
      setIsAuthenticated(true);
      fetchRequests();
    } else {
      alert('비밀번호가 일치하지 않습니다.');
    }
  };

  const fetchRequests = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('dispute_analyses')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching requests:', error);
      alert('데이터를 불러오는데 실패했습니다.');
    } else {
      setRequests(data || []);
    }
    setLoading(false);
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    const { error } = await supabase
      .from('dispute_analyses')
      .update({ status: newStatus })
      .eq('id', id);

    if (error) {
      alert('상태 변경에 실패했습니다.');
    } else {
      fetchRequests();
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
        <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200">
          <h1 className="text-xl font-bold mb-4">관리자 로그인</h1>
          <form onSubmit={handleLogin} className="flex gap-2">
            <input 
              type="password" 
              placeholder="비밀번호 입력" 
              className="border border-slate-300 rounded px-3 py-2 outline-none focus:border-orange-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button type="submit" className="bg-orange-500 text-white px-4 py-2 rounded font-bold hover:bg-orange-600">접속</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto font-gowun">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-slate-800">석지운 변호사 접수 내역 (Admin)</h1>
        <button onClick={fetchRequests} className="px-4 py-2 bg-slate-100 rounded-lg text-sm hover:bg-slate-200">새로고침</button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-4 py-3 font-semibold text-slate-600">접수일시</th>
              <th className="px-4 py-3 font-semibold text-slate-600">상태</th>
              <th className="px-4 py-3 font-semibold text-slate-600">이름</th>
              <th className="px-4 py-3 font-semibold text-slate-600">연락처</th>
              <th className="px-4 py-3 font-semibold text-slate-600">카테고리</th>
              <th className="px-4 py-3 font-semibold text-slate-600">결제액</th>
              <th className="px-4 py-3 font-semibold text-slate-600">상세보기</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-500">불러오는 중...</td></tr>
            ) : requests.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-500">접수 내역이 없습니다.</td></tr>
            ) : (
              requests.map((req) => (
                <tr key={req.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                  <td className="px-4 py-3 text-slate-500">{new Date(req.created_at).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <select 
                      value={req.status || 'pending'} 
                      onChange={(e) => handleStatusChange(req.id, e.target.value)}
                      className={`text-xs font-bold px-2 py-1 rounded border outline-none ${req.status === 'requested' ? 'bg-orange-100 text-orange-700 border-orange-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}
                    >
                      <option value="pending">작성 중</option>
                      <option value="requested">상담 요청됨</option>
                      <option value="reviewed">상담 완료</option>
                    </select>
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-800">{req.user_name || '-'}</td>
                  <td className="px-4 py-3 text-slate-600">{req.phone_number || '-'}</td>
                  <td className="px-4 py-3 text-slate-600">{req.category === 'other' ? req.input_data?.otherCategoryName : req.category}</td>
                  <td className="px-4 py-3 text-slate-800 font-bold">{Number(req.input_data?.totalAmount || 0).toLocaleString()}원</td>
                  <td className="px-4 py-3">
                    <button onClick={() => setSelectedCase(req)} className="text-orange-600 font-bold hover:underline">리포트 보기</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selectedCase && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-xl flex flex-col overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-xl font-bold text-slate-800">
                {selectedCase.user_name}님의 사건 - 변호사용 리포트
              </h2>
              <button onClick={() => setSelectedCase(null)} className="text-slate-400 hover:text-slate-800 text-2xl leading-none">&times;</button>
            </div>
            
            <div className="p-6 overflow-y-auto" style={{ whiteSpace: 'pre-wrap' }}>
              <div className="grid grid-cols-2 gap-4 mb-6 text-sm bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div><strong className="text-slate-500">연락처:</strong> <br/>{selectedCase.phone_number || '미입력'}</div>
                <div><strong className="text-slate-500">이메일:</strong> <br/>{selectedCase.user_email || '미입력'}</div>
                <div>
                  <strong className="text-slate-500">이용약관 링크:</strong> <br/>
                  {selectedCase.input_data?.contractLink ? (
                    <a href={selectedCase.input_data.contractLink} target="_blank" rel="noreferrer" className="text-blue-500 underline break-all">{selectedCase.input_data.contractLink}</a>
                  ) : '없음'}
                </div>
                <div>
                  <strong className="text-slate-500">첨부 파일명:</strong> <br/>
                  {selectedCase.input_data?.attachedFile || '없음'}
                </div>
              </div>

              <h3 className="font-bold text-slate-800 mb-2 border-b pb-2">AI 변호사 리포트</h3>
              <div className="text-slate-700 text-sm leading-relaxed prose max-w-none">
                {selectedCase.report_markdown || '리포트가 생성되지 않았습니다.'}
              </div>

              <h3 className="font-bold text-slate-800 mt-8 mb-2 border-b pb-2">고객 입력 원문</h3>
              <div className="text-slate-700 text-sm bg-slate-50 p-4 rounded-lg">
                {selectedCase.input_data?.description || '입력된 내용이 없습니다.'}
              </div>
            </div>
            <div className="p-4 border-t border-slate-100 bg-slate-50 text-right">
              <button onClick={() => setSelectedCase(null)} className="bg-slate-800 text-white px-6 py-2 rounded-lg font-bold">닫기</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
