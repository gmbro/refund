import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * 관리자용 접수 내역 조회 API
 * 관리자 인증 토큰이 있는 요청만 데이터를 반환합니다.
 * → 클라이언트에서 Supabase를 직접 호출하지 않아 anon key로의 DB 직접 접근을 차단합니다.
 */
export async function GET(req: NextRequest) {
  try {
    // Authorization 헤더에서 토큰 확인
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    
    // 토큰 검증 (base64 디코딩 후 admin 접두사 확인)
    try {
      const decoded = Buffer.from(token, 'base64').toString();
      if (!decoded.startsWith('admin:')) {
        throw new Error('Invalid token');
      }
    } catch {
      return NextResponse.json(
        { error: '유효하지 않은 인증 토큰입니다.' },
        { status: 401 }
      );
    }

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
 */
export async function PATCH(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    try {
      const decoded = Buffer.from(token, 'base64').toString();
      if (!decoded.startsWith('admin:')) {
        throw new Error('Invalid token');
      }
    } catch {
      return NextResponse.json(
        { error: '유효하지 않은 인증 토큰입니다.' },
        { status: 401 }
      );
    }

    const { id, status } = await req.json();

    if (!id || !status) {
      return NextResponse.json(
        { error: '필수 파라미터가 누락되었습니다.' },
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
