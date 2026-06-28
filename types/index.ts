// Tipos globales — Gabinete de Estudios

export type UserRole = 'student' | 'supervisor' | 'admin'

export type AcademicLevel =
  | 'grado'
  | 'posgrado'
  | 'diplomado'
  | 'especialización'
  | 'masterado'
  | 'doctorado'

export type WorkType = 'tesis' | 'monografía' | 'artículo' | 'informe' | 'poster'

export type CitationStyle = 'vancouver' | 'apa7' | 'iica' | 'chicago' | 'mla' | 'iso690'

export type WorkStatus =
  | 'pendiente_pago'
  | 'en_auditoría'
  | 'entregado'
  | 'archivado'

export type PaymentStatus = 'pendiente' | 'completado' | 'fallido' | 'reembolsado'

export type WorkStage =
  | 'propuesta'
  | 'anteproyecto'
  | 'campo'
  | 'análisis'
  | 'redacción'
  | 'revisión'
  | 'defensa'
  | 'cerrado'

export type StageStatus = 'pendiente' | 'en_curso' | 'completado' | 'bloqueado'

export type TransactionType = 'ingreso' | 'egreso'

export type TransactionCategory =
  | 'asesoría'
  | 'posgrado'
  | 'material'
  | 'servicio'
  | 'impuesto'
  | 'otro'

export type SifenStatus = 'pendiente' | 'aprobado' | 'rechazado' | 'anulado'

export type IvaRegime = 'general' | 'pequeño_contribuyente' | 'iragro'

// Entidades principales

export interface Student {
  id: string
  email: string
  full_name: string
  country: string | null
  career: string | null
  institution: string
  academic_level: AcademicLevel | null
  id_number: string | null
  phone: string | null
  role: UserRole
  created_at: string
}

export interface AcademicWork {
  id: string
  student_id: string
  title: string
  work_type: WorkType
  academic_level: AcademicLevel
  citation_style: CitationStyle
  status: WorkStatus
  payment_id: string | null
  created_at: string
  updated_at: string
}

export interface Audit {
  id: string
  work_id: string
  input_document_url: string
  output_docx_url: string | null
  diagnosis_json: Record<string, unknown> | null
  confidence_scores: Record<string, unknown> | null
  tokens_used: number | null
  created_at: string
}

export interface Payment {
  id: string
  student_id: string
  stripe_session_id: string
  amount_usd: number
  status: PaymentStatus
  created_at: string
}

export interface WorkStageRecord {
  id: string
  work_id: string
  stage_name: WorkStage
  status: StageStatus
  notes: string | null
  notified_at: string | null
  changed_by: string
  created_at: string
  updated_at: string
}

export interface Transaction {
  id: string
  type: TransactionType
  category: TransactionCategory
  description: string
  amount_gs: number
  amount_usd: number | null
  counterpart: string
  counterpart_ruc: string | null
  invoice_id: string | null
  date: string
  created_at: string
}

export interface Invoice {
  id: string
  student_id: string | null
  transaction_id: string
  invoice_number: string
  cdc: string | null
  xml_content: string | null
  kude_url: string | null
  sifen_status: SifenStatus
  sifen_response: Record<string, unknown> | null
  client_name: string
  client_ruc: string
  client_email: string
  subtotal_gs: number
  iva_10_gs: number
  iva_5_gs: number
  total_gs: number
  regime: IvaRegime
  issued_at: string
  sent_to_sifen_at: string | null
  created_at: string
}
