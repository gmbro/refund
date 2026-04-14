import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, getClientIP, generateAdminToken } from '@/lib/security';

// 로그인 시도 제한: IP당 5분에 5회
const LOGIN_RATE_LIMIT = { max: 5, windowMs: 5 * 60 * 1000 };

/**
 * 관리자 로그인 API
 * - 비밀번호를 서버에서 검증
 * - Rate Limiting으로 Brute Force 방지
 * - HMAC 서명된 토큰 발급 (24시간 만료)
 */
export async function POST(req: NextRequest) {
  try {
    // Rate Limiting: Brute Force 방지
    const clientIP = getClientIP(req);
    const rateCheck = checkRateLimit(`admin-login:${clientIP}`, LOGIN_RATE_LIMIT.max, LOGIN_RATE_LIMIT.windowMs);
    
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: '로그인 시도 횟수를 초과했습니다. 5분 후 다시 시도해주세요.' },
        { status: 429 }
      );
    }

    const { password } = await req.json();

    if (!password || typeof password !== 'string') {
      return NextResponse.json(
        { error: '비밀번호를 입력해주세요.' },
        { status: 400 }
      );
    }

    // 환경변수에서 관리자 비밀번호 읽기
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminPassword) {
      console.error('ADMIN_PASSWORD 환경변수가 설정되지 않았습니다.');
      return NextResponse.json(
        { error: '서버 설정 오류입니다.' },
        { status: 500 }
      );
    }

    if (password !== adminPassword) {
      return NextResponse.json(
        { error: `비밀번호가 일치하지 않습니다. (${rateCheck.remaining}회 남음)` },
        { status: 401 }
      );
    }

    // HMAC 서명된 토큰 생성 (24시간 만료)
    const sessionToken = generateAdminToken();

    return NextResponse.json({ 
      success: true, 
      token: sessionToken 
    });
  } catch (error) {
    console.error('Admin login error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
