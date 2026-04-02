import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const { id, userName, phoneNumber, agreedPrivacy } = await req.json();

    if (!id || !userName || !phoneNumber || !agreedPrivacy) {
      return NextResponse.json(
        { error: '필수 입력값이 누락되었습니다.' },
        { status: 400 }
      );
    }

    // Supabase DB 업데이트
    const { data, error } = await supabase
      .from('dispute_analyses')
      .update({
        user_name: userName,
        phone_number: phoneNumber,
        agreed_privacy: agreedPrivacy,
        status: 'requested'
      })
      .eq('id', id)
      .select('id')
      .single();

    if (error) {
      console.error('Update error:', error);
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
