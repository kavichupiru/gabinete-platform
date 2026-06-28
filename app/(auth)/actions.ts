'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { AcademicLevel } from '@/types'

export type AuthError = { message: string }
export type AuthState = { message: string; type: 'error' | 'confirm' }

// ── Registro ─────────────────────────────────────────────────────────────────

// useActionState requiere firma (prevState, formData)
export async function signUp(
  _prevState: AuthState | undefined,
  formData: FormData
): Promise<AuthState | undefined> {
  const email          = formData.get('email') as string
  const password       = formData.get('password') as string
  const full_name      = formData.get('full_name') as string
  const country        = formData.get('country') as string
  const id_number      = formData.get('id_number') as string
  const phone          = formData.get('phone') as string
  const institution    = formData.get('institution') as string
  const career         = formData.get('career') as string
  const academic_level = formData.get('academic_level') as AcademicLevel

  const supabase = await createClient()

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://gabinete-platform.vercel.app'

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${siteUrl}/auth/callback`,
      // El trigger handle_new_user() lee estos campos para crear gabinete.students
      data: { full_name, country, id_number, phone, institution, career, academic_level },
    },
  })

  if (error) return { message: error.message, type: 'error' }

  // Supabase con confirmación de email: session es null hasta que el usuario confirme
  if (!data.session) {
    return {
      message: `Revisá tu correo (${email}) y hacé clic en el enlace de confirmación para activar tu cuenta.`,
      type: 'confirm',
    }
  }

  redirect('/dashboard/student')
}

// ── Login ─────────────────────────────────────────────────────────────────────

export async function signIn(
  _prevState: AuthError | undefined,
  formData: FormData
): Promise<AuthError | undefined> {
  const email    = formData.get('email') as string
  const password = formData.get('password') as string

  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) return { message: error.message }

  redirect('/dashboard/student')
}

// ── Logout ────────────────────────────────────────────────────────────────────

export async function signOut(): Promise<never> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
