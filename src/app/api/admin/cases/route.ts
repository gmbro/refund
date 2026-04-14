import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { verifyAdminToken, isValidStatus, isValidUUID } from '@/lib/security';

/**
 * 관리자 인증 토큰 검증 헬퍼
 */
function authenticateAdmin(req: NextRequest): NextResponse | null {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json(
      { error: '인증이 필요합니다.' },
      { status: 401 }
    );
  }

  const token = authHeader.replace('Bearer ', '');
  
  if (!verifyAdminToken(token)) {
    return NextResponse.json(
      { error: '인증 토큰이 유효하지 않거나 만료되었습니다. 다시 로그인해주세요.' },
      { status: 401 }
    );
  }

  return null; // 인증 성공
}

/**
 * 관리자용 접수 내역 조회 API
 * - HMAC 서명 토큰 검증 (만료 24시간)
 * - Supabase 서버사이드 접근
 */
export async function GET(req: NextRequest) {
  try {
    const authError = authenticateAdmin(req);
    if (authError) return authError;

    const { data, error } = await supabase
      .from('dispute_analyses')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Admin fetch error:', error);
      return NextResponse.json(
        { error: '데이터 조회에 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: data || [] });
  } catch (error) {
    console.error('Admin cases error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * 접수 상태 변경 API
 * - 상태 값 화이트리스트 검증 (SQL Injection 방지)
 * - UUID 형식 검증
 */
export async function PATCH(req: NextRequest) {
  try {
    const authError = authenticateAdmin(req);
    if (authError) return authError;

    const { id, status } = await req.json();

    // UUID 형식 검증
    if (!id || !isValidUUID(id)) {
      return NextResponse.json(
        { error: '유효하지 않은 ID 형식입니다.' },
        { status: 400 }
      );
    }

    // 상태 값 화이트리스트 검증
    if (!status || !isValidStatus(status)) {
      return NextResponse.json(
        { error: '유효하지 않은 상태 값입니다. (pending, requested, reviewed)' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('dispute_analyses')
      .update({ status })
      .eq('id', id);

    if (error) {
      console.error('Status update error:', error);
      return NextResponse.json(
        { error: '상태 변경에 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin patch error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
