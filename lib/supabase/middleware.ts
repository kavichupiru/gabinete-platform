import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Refresca la sesión del usuario y protege rutas según rol
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      db: { schema: 'gabinete' },
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresca el token (no eliminar — necesario para que la sesión no expire)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Rutas públicas accesibles sin sesión
  const rutasPublicas = ['/', '/login', '/register', '/auth/callback']
  const esRutaPublica = rutasPublicas.includes(pathname)

  // Sin sesión → redirigir al login (excepto rutas públicas)
  if (!user && !esRutaPublica) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Con sesión → redirigir fuera de auth si ya está logueado
  if (user && (pathname === '/login' || pathname === '/register')) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard/student'
    return NextResponse.redirect(url)
  }

  // Protección de ruta supervisor: solo roles supervisor y admin
  if (user && pathname.startsWith('/dashboard/supervisor')) {
    const { data: studentData } = await supabase
      .from('students')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!studentData || !['supervisor', 'admin'].includes(studentData.role)) {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard/student'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}
