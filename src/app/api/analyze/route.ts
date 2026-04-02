import { NextRequest, NextResponse } from 'next/server';
import { calculateRefund } from '@/lib/refund-calculator';
import { analyzeLegalCase } from '@/lib/gemini';
import { searchLawsByCategory } from '@/lib/mcp-client';
import { FALLBACK_LEGAL_REFERENCES } from '@/data/refund-rules';
import { supabase } from '@/lib/supabase';
import { DisputeInput } from '@/lib/types';

export const maxDuration = 60; // Vercel 함수 타임아웃 60초

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { category, description, ...rest } = body;

    // 입력 데이터 구성
    const inputData = buildInputData(category, rest, description);

    // 1. 환불액 계산
    const calculation = calculateRefund(inputData);

    // 2. MCP로 법령 검색 (실패 시 폴백)
    let legalReferences: string[];
    try {
      const mcpResults = await searchLawsByCategory(category, description || '');
      legalReferences = mcpResults.length > 0 ? mcpResults : FALLBACK_LEGAL_REFERENCES[category] || [];
    } catch {
      console.log('MCP search failed, using fallback data');
      legalReferences = FALLBACK_LEGAL_REFERENCES[category] || [];
    }

    // 3. Gemini AI 기초 진단 및 변호사용 리포트 생성
    const { clientSummary, lawyerReport } = await analyzeLegalCase(
      category,
      inputData as unknown as Record<string, unknown>,
      legalReferences,
      calculation as unknown as Record<string, unknown>
    );

    // 4. Supabase에 저장 (추후 변호사가 볼 데이터)
    let resultId = crypto.randomUUID();
    try {
      const { data: dbResult, error } = await supabase
        .from('dispute_analyses')
        .insert({
          category,
          input_data: inputData,
          calculation,
          legal_references: legalReferences,
          ai_analysis: clientSummary, // v4: ai_analysis 컬럼에 고객용 요약 저장
          report_markdown: lawyerReport, // v4: report_markdown에 변호사용 리포트 저장
          status: 'pending' // 초기 상태: 검토 전
        })
        .select('id')
        .single();

      if (!error && dbResult) {
        resultId = dbResult.id;
      } else if (error) {
         console.error('Supabase save error details:', error);
      }
    } catch (dbError) {
      console.error('Supabase save failed:', dbError);
    }

    // 5. 결과 반환
    const result = {
      id: resultId,
      category,
      input_data: inputData,
      calculation,
      clientSummary, // 새로운 필드 반환
      lawyerReport,
      created_at: new Date().toISOString(),
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      { error: '기초 진단 중 오류가 발생했습니다. 다시 시도해주세요.' },
      { status: 500 }
    );
  }
}

function buildInputData(category: string, data: Record<string, string>, description: string): DisputeInput {
  switch (category) {
    case 'gym':
      return {
        category: 'gym',
        totalAmount: Number(data.totalAmount) || 0,
        totalMonths: Number(data.totalMonths) || 1,
        usedMonths: Number(data.usedMonths) || 0,
        totalSessions: data.totalSessions ? Number(data.totalSessions) : undefined,
        usedSessions: data.usedSessions ? Number(data.usedSessions) : undefined,
        demandedPenalty: Number(data.demandedPenalty) || 0,
        description,
      };
    case 'wedding':
      return {
        category: 'wedding',
        totalAmount: Number(data.totalAmount) || 0,
        weddingDate: data.weddingDate || '',
        cancelDate: data.cancelDate || '',
        demandedPenalty: Number(data.demandedPenalty) || 0,
        description,
      };
    case 'travel':
      return {
        category: 'travel',
        totalAmount: Number(data.totalAmount) || 0,
        serviceDate: data.serviceDate || '',
        cancelDate: data.cancelDate || '',
        serviceType: (data.serviceType as 'accommodation' | 'flight') || 'accommodation',
        demandedPenalty: Number(data.demandedPenalty) || 0,
        description,
      };
    default:
      // 범용 카테고리
      return {
        category,
        totalAmount: Number(data.totalAmount) || 0,
        demandedPenalty: Number(data.demandedPenalty) || 0,
        contractDate: data.contractDate || '',
        cancelDate: data.cancelDate || '',
        otherCategoryName: data.otherCategoryName,
        contractLink: data.contractLink,
        attachedFile: data.attachedFile,
        description,
      };
  }
}
