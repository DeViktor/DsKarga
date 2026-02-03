import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Obter cookies de autenticação definidos no login/route.ts
  const authToken = request.cookies.get('sb-auth-token')?.value;
  const authUser = request.cookies.get('sb-auth-user')?.value;
  const authIat = request.cookies.get('sb-auth-iat')?.value;

  // Verificar validade do token (1 hora = 3600 segundos)
  // Nota: Os cookies já têm maxAge=3600, mas verificamos o iat por segurança extra
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const isValid = 
    authToken && 
    authUser && 
    authIat && 
    (!isNaN(parseInt(authIat)) && parseInt(authIat) + 3600 > currentTimestamp);

  const isLoginPage = request.nextUrl.pathname === '/login';

  // Se não estiver autenticado e tentar acessar rotas protegidas (qualquer rota que não seja login)
  if (!isValid && !isLoginPage) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Se estiver autenticado e tentar acessar a página de login, redirecionar para dashboard
  if (isValid && isLoginPage) {
    const dashboardUrl = new URL('/dashboard', request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  return NextResponse.next();
}

export const config = {
  // Matcher para todas as rotas exceto api, static, image, favicon
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
