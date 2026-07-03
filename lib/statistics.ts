import Papa from 'papaparse'
import ExcelJS from 'exceljs'
import * as ss from 'simple-statistics'

export interface ColumnSummary {
  name: string
  type: 'numeric' | 'categorical'
  count: number
  missing: number
  // numérico
  mean?: number
  median?: number
  stdDev?: number
  min?: number
  max?: number
  // categórico
  frequencies?: Record<string, number>
}

export interface DatasetSummary {
  rowCount: number
  columns: ColumnSummary[]
}

async function parseCsv(buffer: Buffer): Promise<Record<string, string>[]> {
  const text = buffer.toString('utf8')
  const result = Papa.parse<Record<string, string>>(text, { header: true, skipEmptyLines: true })
  return result.data
}

async function parseXlsx(buffer: Buffer): Promise<Record<string, string>[]> {
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.load(buffer as any)
  const sheet = workbook.worksheets[0]
  if (!sheet) return []

  const headerRow = sheet.getRow(1).values as unknown[]
  const headers = headerRow.slice(1).map(h => String(h ?? ''))

  const rows: Record<string, string>[] = []
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return
    const values = row.values as unknown[]
    const record: Record<string, string> = {}
    headers.forEach((header, i) => {
      record[header] = String(values[i + 1] ?? '')
    })
    rows.push(record)
  })
  return rows
}

export async function parseDataset(buffer: Buffer, fileName: string): Promise<Record<string, string>[]> {
  const isExcel = /\.(xlsx|xls)$/i.test(fileName)
  return isExcel ? parseXlsx(buffer) : parseCsv(buffer)
}

function isNumeric(value: string): boolean {
  if (value.trim() === '') return false
  return !isNaN(Number(value))
}

export function summarizeDataset(rows: Record<string, string>[]): DatasetSummary {
  if (rows.length === 0) return { rowCount: 0, columns: [] }

  const columnNames = Object.keys(rows[0])

  const columns: ColumnSummary[] = columnNames.map(name => {
    const rawValues = rows.map(r => r[name] ?? '')
    const missing = rawValues.filter(v => v.trim() === '').length
    const nonEmpty = rawValues.filter(v => v.trim() !== '')
    const allNumeric = nonEmpty.length > 0 && nonEmpty.every(isNumeric)

    if (allNumeric) {
      const numbers = nonEmpty.map(Number)
      return {
        name,
        type: 'numeric',
        count: nonEmpty.length,
        missing,
        mean: round(ss.mean(numbers)),
        median: round(ss.median(numbers)),
        stdDev: numbers.length > 1 ? round(ss.standardDeviation(numbers)) : 0,
        min: round(Math.min(...numbers)),
        max: round(Math.max(...numbers)),
      }
    }

    const frequencies: Record<string, number> = {}
    for (const v of nonEmpty) {
      frequencies[v] = (frequencies[v] ?? 0) + 1
    }
    return {
      name,
      type: 'categorical',
      count: nonEmpty.length,
      missing,
      frequencies,
    }
  })

  return { rowCount: rows.length, columns }
}

function round(n: number): number {
  return Math.round(n * 100) / 100
}
