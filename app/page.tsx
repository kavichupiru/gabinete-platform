import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Con sesión activa → dashboard; sin sesión → login
  if (user) redirect('/dashboard/student')
  redirect('/login')
}
