import { NextRequest, NextResponse } from 'next/server';
import { calculateRefund } from '@/lib/refund-calculator';
import { analyzeLegalCase } from '@/lib/gemini';
import { searchLawsByCategory } from '@/lib/mcp-client';
import { FALLBACK_LEGAL_REFERENCES } from '@/data/refund-rules';
import { supabase } from '@/lib/supabase';
import { DisputeInput } from '@/lib/types';
import { 
  checkRateLimit, getClientIP, isUrlSafe, 
  isValidCategory, isValidAmount, sanitizeString 
} from '@/lib/security';

export const maxDuration = 60; // Vercel 함수 타임아웃 60초

// 분석 API Rate Limit: IP당 1분에 3회 (Gemini API 비용 보호)
const ANALYZE_RATE_LIMIT = { max: 3, windowMs: 60 * 1000 };

export async function POST(req: NextRequest) {
  try {
    // 1. Rate Limiting - Gemini API 비용 폭주 방지
    const clientIP = getClientIP(req);
    const rateCheck = checkRateLimit(`analyze:${clientIP}`, ANALYZE_RATE_LIMIT.max, ANALYZE_RATE_LIMIT.windowMs);
    
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: '분석 요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { category, description, fileBase64, fileMimeType, ...rest } = body;

    // 2. 입력 검증
    if (!category || !isValidCategory(category)) {
      return NextResponse.json(
        { error: '유효하지 않은 카테고리입니다.' },
        { status: 400 }
      );
    }

    const totalAmount = Number(rest.totalAmount) || 0;
    if (!isValidAmount(totalAmount)) {
      return NextResponse.json(
        { error: '금액은 0원 ~ 10억원 사이여야 합니다.' },
        { status: 400 }
      );
    }

    const demandedPenalty = Number(rest.demandedPenalty) || 0;
    if (!isValidAmount(demandedPenalty)) {
      return NextResponse.json(
        { error: '위약금은 0원 ~ 10억원 사이여야 합니다.' },
        { status: 400 }
      );
    }

    // 설명 텍스트 sanitize
    const sanitizedDescription = sanitizeString(description || '', 5000);

    // 3. 입력 데이터 구성
    const inputData = buildInputData(category, rest, sanitizedDescription);

    // 4. 환불액 계산
    const calculation = calculateRefund(inputData);

    // 5. MCP로 법령 검색 (실패 시 폴백)
    let legalReferences: string[];
    try {
      const mcpResults = await searchLawsByCategory(category, sanitizedDescription);
      legalReferences = mcpResults.length > 0 ? mcpResults : FALLBACK_LEGAL_REFERENCES[category] || [];
    } catch {
      console.log('MCP search failed, using fallback data');
      legalReferences = FALLBACK_LEGAL_REFERENCES[category] || [];
    }

    // 6. 이용약관 링크에서 텍스트 가져오기 (SSRF 방지 적용)
    let contractTermsText = '';
    if (rest.contractLink) {
      // SSRF 방지: 내부 네트워크 URL 차단
      if (!isUrlSafe(rest.contractLink)) {
        console.warn('SSRF 차단: 안전하지 않은 URL 요청 감지:', rest.contractLink);
      } else {
        try {
          const linkRes = await fetch(rest.contractLink, {
            signal: AbortSignal.timeout(5000),
            headers: { 'User-Agent': 'Mozilla/5.0' },
          });
          if (linkRes.ok) {
            const html = await linkRes.text();
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
    }

    // 7. 첨부 파일 데이터 구성 (서버측 크기 제한: 3MB)
    let attachmentData: { base64: string; mimeType: string } | undefined;
    if (fileBase64) {
      const fileSizeBytes = Buffer.from(fileBase64, 'base64').length;
      if (fileSizeBytes > 3 * 1024 * 1024) {
        return NextResponse.json(
          { error: '첨부 파일은 3MB 이하만 허용됩니다.' },
          { status: 400 }
        );
      }
      
      // MIME type 화이트리스트 검증
      const allowedMimeTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
      const mimeType = fileMimeType || 'image/jpeg';
      if (!allowedMimeTypes.includes(mimeType)) {
        return NextResponse.json(
          { error: '허용되지 않은 파일 형식입니다. (PDF, JPG, PNG, WebP만 가능)' },
          { status: 400 }
        );
      }
      
      attachmentData = { base64: fileBase64, mimeType };
    }

    // 8. Gemini AI 기초 진단 및 변호사용 리포트 생성
    const { clientSummary, lawyerReport } = await analyzeLegalCase(
      category,
      inputData as unknown as Record<string, unknown>,
      legalReferences,
      calculation as unknown as Record<string, unknown>,
      contractTermsText,
      attachmentData
    );

    // 9. Supabase에 저장
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

    // 10. 결과 반환 (변호사 리포트는 클라이언트에 전달하지 않음)
    const result = {
      id: resultId,
      category,
      input_data: inputData,
      calculation,
      clientSummary,
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
      return {
        category,
        totalAmount: Number(data.totalAmount) || 0,
        demandedPenalty: Number(data.demandedPenalty) || 0,
        contractDate: data.contractDate || '',
        cancelDate: data.cancelDate || '',
        otherCategoryName: data.otherCategoryName ? sanitizeString(data.otherCategoryName, 100) : undefined,
        contractLink: data.contractLink,
        attachedFile: data.attachedFile,
        description,
      };
  }
}
