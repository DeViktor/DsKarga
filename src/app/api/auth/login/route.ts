import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabaseServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
  if (!url || !anonKey) {
    throw new Error('Supabase env vars missing');
  }
  return createClient(url, anonKey);
}

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !user) {
      return NextResponse.json({ error: 'Usuário ou senha incorretos' }, { status: 401 });
    }

    const storedHash: string | undefined = user.password_hash || user.password;
    if (!storedHash || typeof storedHash !== 'string') {
      return NextResponse.json({ error: 'Senha não configurada' }, { status: 400 });
    }

    const isBcrypt = storedHash.startsWith('$2a$') || storedHash.startsWith('$2b$') || storedHash.startsWith('$2y$');

    let valid = false;
    if (isBcrypt) {
      const bcrypt = await import('bcryptjs');
      valid = await bcrypt.compare(password, storedHash);
    } else {
      valid = storedHash === password;
    }

    if (!valid) {
      return NextResponse.json({ error: 'Usuário ou senha incorretos' }, { status: 401 });
    }

    const token = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${user.id}-${Date.now()}`;
    const iat = Math.floor(Date.now() / 1000);

    const res = NextResponse.json({ ok: true, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
    res.cookies.set('sb-auth-token', token, { httpOnly: true, sameSite: 'strict', path: '/', maxAge: 3600 });
    res.cookies.set('sb-auth-iat', String(iat), { httpOnly: true, sameSite: 'strict', path: '/', maxAge: 3600 });
    return res;
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Falha no login' }, { status: 500 });
  }
}

