import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

function getSupabaseServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
  if (!url || !anonKey) {
    throw new Error('Supabase env vars missing');
  }
  return createClient(url, anonKey);
}

export async function GET() {
  const cookieStore = cookies();
  const token = cookieStore.get('sb-auth-token');
  const userId = cookieStore.get('sb-auth-user');
  const iat = cookieStore.get('sb-auth-iat');

  if (!token || !userId || !iat) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const currentTimestamp = Math.floor(Date.now() / 1000);
  if (parseInt(iat.value) + 3600 < currentTimestamp) {
      return NextResponse.json({ error: 'Session expired' }, { status: 401 });
  }

  const supabase = getSupabaseServerClient();
  
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .or(`id.eq.${userId.value},email.eq.${userId.value}`)
    .single();

  if (error || !user) {
    return NextResponse.json({ error: 'User not found' }, { status: 401 });
  }

  return NextResponse.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      department: user.department
    }
  });
}
