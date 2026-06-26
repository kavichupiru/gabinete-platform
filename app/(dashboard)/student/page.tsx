import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ProfileCard from '@/components/student/ProfileCard'
import WorksSection from '@/components/student/WorksSection'
import type { AcademicWork, Student } from '@/types'

export default async function StudentDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: student } = await supabase
    .from('students')
    .select('full_name, email, institution, academic_level')
    .eq('id', user.id)
    .single()

  const { data: works } = await supabase
    .from('academic_works')
    .select('id, title, work_type, academic_level, status, created_at')
    .order('created_at', { ascending: false })

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900">Mi dashboard</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Seguí el estado de tus trabajos académicos.
        </p>
      </div>

      {student && (
        <ProfileCard
          student={student as Pick<Student, 'full_name' | 'email' | 'institution' | 'academic_level'>}
        />
      )}

      <WorksSection
        works={(works ?? []) as AcademicWork[]}
        userId={user.id}
      />
    </div>
  )
}
