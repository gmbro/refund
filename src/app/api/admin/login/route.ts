import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, getClientIP, generateAdminToken, securePasswordCompare } from '@/lib/security';

// 로그인 시도 제한: IP당 5분에 5회 (인스턴스별, 보조 방어선)
const LOGIN_RATE_LIMIT = { max: 5, windowMs: 5 * 60 * 1000 };

/**
 * 관리자 로그인 API
 * 보안 조치:
 * - securePasswordCompare: SHA256 해시 후 timingSafeEqual (Timing Attack 방지)
 * - Rate Limiting: IP당 5분에 5회 (보조 방어선)
 * - HMAC-SHA256 서명 토큰 발급 (24시간 만료)
 */
export async function POST(req: NextRequest) {
  try {
    // Rate Limiting (보조 방어선)
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

    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminPassword) {
      console.error('ADMIN_PASSWORD 환경변수가 설정되지 않았습니다.');
      return NextResponse.json(
        { error: '서버 설정 오류입니다.' },
        { status: 500 }
      );
    }

    // Timing Attack 방지: SHA256 해시 후 timingSafeEqual로 비교
    if (!securePasswordCompare(password, adminPassword)) {
      return NextResponse.json(
        { error: '비밀번호가 일치하지 않습니다.' },
        { status: 401 }
      );
    }

    // HMAC-SHA256 서명된 토큰 생성 (24시간 만료)
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
