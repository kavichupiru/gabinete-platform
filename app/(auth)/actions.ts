'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { AcademicLevel } from '@/types'

export type AuthError = { message: string }

// ── Registro ─────────────────────────────────────────────────────────────────

// useActionState requiere firma (prevState, formData)
export async function signUp(
  _prevState: AuthError | undefined,
  formData: FormData
): Promise<AuthError | undefined> {
  const email          = formData.get('email') as string
  const password       = formData.get('password') as string
  const full_name      = formData.get('full_name') as string
  const institution    = formData.get('institution') as string
  const academic_level = formData.get('academic_level') as AcademicLevel

  const supabase = await createClient()

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // El trigger handle_new_user() lee estos campos para crear gabinete.students
      data: { full_name, institution, academic_level },
    },
  })

  if (error) return { message: error.message }

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
