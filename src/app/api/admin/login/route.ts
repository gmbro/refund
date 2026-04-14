import { NextRequest, NextResponse } from 'next/server';

/**
 * 관리자 로그인 API
 * 비밀번호를 서버에서 검증하여 클라이언트에 비밀번호가 노출되지 않도록 합니다.
 */
export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json();

    // 환경변수에서 관리자 비밀번호 읽기 (Vercel에 설정)
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
        { error: '비밀번호가 일치하지 않습니다.' },
        { status: 401 }
      );
    }

    // 간단한 세션 토큰 생성 (실무에서는 JWT 사용 권장)
    const sessionToken = Buffer.from(
      `admin:${Date.now()}:${crypto.randomUUID()}`
    ).toString('base64');

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
