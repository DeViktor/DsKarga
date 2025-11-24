import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'

export default function Home() {
  const c = cookies()
  const token = c.get('sb-auth-token')?.value
  const user = c.get('sb-auth-user')?.value
  const iatStr = c.get('sb-auth-iat')?.value
  const iat = iatStr ? Number(iatStr) : 0
  const now = Math.floor(Date.now() / 1000)
  const isExpired = !iat || (now - iat > 3600)

  if (token && user && !isExpired) {
    redirect('/dashboard')
  }
  redirect('/login')
}
