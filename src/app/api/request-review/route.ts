import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { 
  checkRateLimit, getClientIP, isValidUUID, 
  sanitizeString, isValidEmail, isValidPhone 
} from '@/lib/security';

// 상담 접수 Rate Limit: IP당 10분에 5회
const REVIEW_RATE_LIMIT = { max: 5, windowMs: 10 * 60 * 1000 };

export async function POST(req: NextRequest) {
  try {
    // Rate Limiting
    const clientIP = getClientIP(req);
    const rateCheck = checkRateLimit(`review:${clientIP}`, REVIEW_RATE_LIMIT.max, REVIEW_RATE_LIMIT.windowMs);
    
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' },
        { status: 429 }
      );
    }

    const { id, userName, userEmail, phoneNumber, agreedPrivacy } = await req.json();

    // 입력 검증
    if (!id || !isValidUUID(id)) {
      return NextResponse.json(
        { error: '유효하지 않은 요청입니다.' },
        { status: 400 }
      );
    }

    if (!userName || typeof userName !== 'string' || userName.trim().length < 1) {
      return NextResponse.json(
        { error: '이름을 입력해주세요.' },
        { status: 400 }
      );
    }

    if (!phoneNumber || !isValidPhone(phoneNumber)) {
      return NextResponse.json(
        { error: '유효한 전화번호를 입력해주세요. (예: 010-1234-5678)' },
        { status: 400 }
      );
    }

    if (userEmail && !isValidEmail(userEmail)) {
      return NextResponse.json(
        { error: '유효한 이메일 주소를 입력해주세요.' },
        { status: 400 }
      );
    }

    if (!agreedPrivacy) {
      return NextResponse.json(
        { error: '개인정보 수집에 동의해주세요.' },
        { status: 400 }
      );
    }

    // 입력값 sanitize
    const sanitizedName = sanitizeString(userName, 50);
    const sanitizedPhone = phoneNumber.replace(/[^0-9-]/g, '').slice(0, 15);
    const sanitizedEmail = userEmail ? sanitizeString(userEmail, 100) : undefined;

    // Supabase DB 업데이트
    const updateData: Record<string, unknown> = {
      user_name: sanitizedName,
      phone_number: sanitizedPhone,
      agreed_privacy: agreedPrivacy,
      status: 'requested'
    };

    if (sanitizedEmail) {
      updateData.user_email = sanitizedEmail;
    }

    const { data, error } = await supabase
      .from('dispute_analyses')
      .update(updateData)
      .eq('id', id)
      .select('id')
      .single();

    if (error) {
      console.error('Update error:', error);
      
      // user_email 컬럼이 없을 경우 이메일 없이 재시도
      if (error.message?.includes('user_email')) {
        const { user_email, ...fallbackData } = updateData;
        const { data: fallbackResult, error: fallbackError } = await supabase
          .from('dispute_analyses')
          .update(fallbackData)
          .eq('id', id)
          .select('id')
          .single();

        if (fallbackError) {
          return NextResponse.json(
            { error: '검토 요청 접수에 실패했습니다.' },
            { status: 500 }
          );
        }
        
        return NextResponse.json({ success: true, message: '검토 요청이 접수되었습니다.' });
      }
      
      return NextResponse.json(
        { error: '검토 요청 접수에 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: '검토 요청이 접수되었습니다.' });
  } catch (error) {
    console.error('Request review error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
