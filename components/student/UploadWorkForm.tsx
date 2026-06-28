'use client'

import { useActionState, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { createWork } from '@/app/dashboard/student/actions'
import FormField from '@/components/ui/FormField'
import SubmitButton from '@/components/ui/SubmitButton'

const WORK_TYPES = [
  { value: 'tesis',      label: 'Tesis' },
  { value: 'monografía', label: 'Monografía' },
  { value: 'artículo',   label: 'Artículo científico' },
  { value: 'informe',    label: 'Informe' },
  { value: 'poster',     label: 'Póster' },
]

const NIVELES = [
  { value: 'grado',           label: 'Licenciatura / Grado' },
  { value: 'especialización', label: 'Especialización' },
  { value: 'maestría',        label: 'Maestría' },
  { value: 'doctorado',       label: 'Doctorado' },
]

const NORMAS = [
  { value: 'vancouver', label: 'Vancouver (salud)' },
  { value: 'apa7',      label: 'APA 7.ª ed. (ciencias sociales)' },
  { value: 'iica',      label: 'IICA 5.ª ed. (agrarias)' },
  { value: 'chicago',   label: 'Chicago 17.ª ed. (humanidades)' },
  { value: 'mla',       label: 'MLA 9.ª ed. (literatura)' },
  { value: 'iso690',    label: 'ISO 690:2021 (internacional)' },
]

interface Props {
  userId: string
  onCancel: () => void
}

export default function UploadWorkForm({ userId, onCancel }: Props) {
  const [error, action] = useActionState(createWork, undefined)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadError(null)
    setUploading(true)
    setUploadedUrl(null)

    const supabase = createClient()
    const ext = file.name.split('.').pop()
    // Ruta: documents/{userId}/{timestamp}_{nombre_limpio}.{ext}
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const path = `${userId}/${Date.now()}_${safeName}`

    const { data, error } = await supabase.storage
      .from('documents')
      .upload(path, file, { upsert: false })

    if (error) {
      setUploadError(`Error al subir el archivo: ${error.message}`)
      setUploading(false)
      return
    }

    // Obtener URL firmada válida por 1 año (el acceso real se controla por RLS)
    const { data: signed } = await supabase.storage
      .from('documents')
      .createSignedUrl(data.path, 60 * 60 * 24 * 365)

    setUploadedUrl(signed?.signedUrl ?? data.path)
    setFileName(file.name)
    setUploading(false)
  }

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <h2 className="mb-5 text-base font-semibold text-zinc-900">Subir trabajo académico</h2>

      <form action={action} className="flex flex-col gap-5">
        {/* Campo oculto con la URL del documento ya subido */}
        <input type="hidden" name="document_url" value={uploadedUrl ?? ''} />

        <FormField
          label="Título del trabajo"
          name="title"
          type="text"
          required
          placeholder="Ej: Prevalencia de diabetes tipo 2 en adultos mayores..."
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <label htmlFor="work_type" className="text-sm font-medium text-zinc-700">
              Tipo de trabajo
            </label>
            <select
              id="work_type"
              name="work_type"
              required
              defaultValue=""
              className="rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
            >
              <option value="" disabled>Seleccioná el tipo</option>
              {WORK_TYPES.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="academic_level" className="text-sm font-medium text-zinc-700">
              Nivel académico
            </label>
            <select
              id="academic_level"
              name="academic_level"
              required
              defaultValue=""
              className="rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
            >
              <option value="" disabled>Seleccioná el nivel</option>
              {NIVELES.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="citation_style" className="text-sm font-medium text-zinc-700">
            Norma de citación
          </label>
          <select
            id="citation_style"
            name="citation_style"
            required
            defaultValue="vancouver"
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
          >
            {NORMAS.map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        {/* Zona de carga de archivo */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-zinc-700">
            Documento (PDF o DOCX — máx. 50 MB)
          </label>
          <div
            className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-zinc-300 bg-zinc-50 px-4 py-8 text-center transition hover:border-zinc-400 hover:bg-zinc-100"
            onClick={() => fileRef.current?.click()}
          >
            {uploading ? (
              <p className="text-sm text-zinc-500">Subiendo archivo...</p>
            ) : uploadedUrl ? (
              <>
                <p className="text-sm font-medium text-green-700">✓ {fileName}</p>
                <p className="mt-1 text-xs text-zinc-400">Hacé clic para reemplazar</p>
              </>
            ) : (
              <>
                <p className="text-sm text-zinc-500">Hacé clic para seleccionar el archivo</p>
                <p className="mt-1 text-xs text-zinc-400">PDF o DOCX</p>
              </>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.doc,.docx"
            className="hidden"
            onChange={handleFileChange}
          />
          {uploadError && (
            <p className="text-xs text-red-600">{uploadError}</p>
          )}
        </div>

        {(error || uploadError) && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
            {error?.message ?? uploadError}
          </p>
        )}

        <div className="flex gap-3">
          <SubmitButton
            label="Registrar trabajo"
            loadingLabel="Guardando..."
          />
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-zinc-200 px-4 py-2.5 text-sm text-zinc-600 hover:border-zinc-400 hover:text-zinc-900 transition"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  )
}
