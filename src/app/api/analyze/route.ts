import { NextRequest, NextResponse } from 'next/server';
import { calculateRefund } from '@/lib/refund-calculator';
import { analyzeLegalCase } from '@/lib/gemini';
import { searchLawsByCategory } from '@/lib/mcp-client';
import { FALLBACK_LEGAL_REFERENCES } from '@/data/refund-rules';
import { supabase } from '@/lib/supabase';
import { DisputeInput } from '@/lib/types';

export const maxDuration = 60; // Vercel 함수 타임아웃 60초

// Vercel body size limit (free plan: 4.5MB)
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '4.5mb',
    },
  },
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { category, description, fileBase64, fileMimeType, ...rest } = body;

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

    // 3. 이용약관 링크에서 텍스트 가져오기
    let contractTermsText = '';
    if (rest.contractLink) {
      try {
        const linkRes = await fetch(rest.contractLink, {
          signal: AbortSignal.timeout(5000),
          headers: { 'User-Agent': 'Mozilla/5.0' },
        });
        if (linkRes.ok) {
          const html = await linkRes.text();
          // 간단한 HTML→텍스트 변환 (태그 제거, 3000자 제한)
          contractTermsText = html
            .replace(/<script[\s\S]*?<\/script>/gi, '')
            .replace(/<style[\s\S]*?<\/style>/gi, '')
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
            .slice(0, 3000);
        }
      } catch {
        console.log('이용약관 링크 접근 실패:', rest.contractLink);
      }
    }

    // 4. 첨부 파일 데이터 구성
    const attachmentData = fileBase64 ? {
      base64: fileBase64,
      mimeType: fileMimeType || 'image/jpeg',
    } : undefined;

    // 5. Gemini AI 기초 진단 및 변호사용 리포트 생성
    const { clientSummary, lawyerReport } = await analyzeLegalCase(
      category,
      inputData as unknown as Record<string, unknown>,
      legalReferences,
      calculation as unknown as Record<string, unknown>,
      contractTermsText,
      attachmentData
    );

    // 6. Supabase에 저장 (파일 데이터는 저장하지 않음 — 용량 이슈)
    let resultId = crypto.randomUUID();
    try {
      const { data: dbResult, error } = await supabase
        .from('dispute_analyses')
        .insert({
          category,
          input_data: inputData,
          calculation,
          legal_references: legalReferences,
          ai_analysis: clientSummary,
          report_markdown: lawyerReport,
          status: 'pending'
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

    // 7. 결과 반환
    const result = {
      id: resultId,
      category,
      input_data: inputData,
      calculation,
      clientSummary,
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
    case 'medical':
      return {
        category: 'medical',
        totalAmount: Number(data.totalAmount) || 0,
        totalSessions: data.totalSessions ? Number(data.totalSessions) : undefined,
        usedSessions: data.usedSessions ? Number(data.usedSessions) : undefined,
        demandedPenalty: Number(data.demandedPenalty) || 0,
        cancelReason: data.cancelReason || undefined,
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
