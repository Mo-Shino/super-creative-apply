// تصدير Excel (ملف .xlsx منسّق بهوية المسابقة) وPDF (تقرير مطبوع بنفس الهوية).

const BRAND = { purple: 'FF4A37E1', lime: 'FFDDF700', ink: 'FF000000', zebra: 'FFF4F3FD', line: 'FFE2E0F5' }

const fmt = new Intl.DateTimeFormat('ar-EG', {
  timeZone: 'Africa/Cairo',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
})

export const formatTime = (ms) => (ms ? fmt.format(new Date(ms)) : '—')

export function fileStamp() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Cairo' }).format(new Date()) // YYYY-MM-DD
}

function download(blob, name) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}

export function countByTalent(rows, talents) {
  const map = Object.fromEntries(talents.map((t) => [t, 0]))
  for (const r of rows) if (r.talent in map) map[r.talent] += 1
  return map
}

export async function exportExcel(rows, talents) {
  const mod = await import('exceljs')
  const ExcelJS = mod.default ?? mod
  const wb = new ExcelJS.Workbook()
  wb.creator = 'Super كريتيف'
  wb.created = new Date()

  /* ---- ورقة الطلبات ---- */
  const ws = wb.addWorksheet('الطلبات', {
    views: [{ rightToLeft: true, state: 'frozen', ySplit: 1 }],
    properties: { tabColor: { argb: BRAND.purple } },
  })
  ws.columns = [
    { header: '#', key: 'no', width: 7 },
    { header: 'الاسم بالكامل', key: 'fullName', width: 34 },
    { header: 'رقم الواتساب', key: 'phone', width: 18 },
    { header: 'اسم المدرسة', key: 'school', width: 32 },
    { header: 'الصف الدراسي', key: 'grade', width: 18 },
    { header: 'الموهبة / المجال', key: 'talent', width: 26 },
    { header: 'وقت التقديم', key: 'time', width: 26 },
  ]

  const header = ws.getRow(1)
  header.height = 30
  header.eachCell((c) => {
    c.font = { name: 'Arial', bold: true, size: 12, color: { argb: 'FFFFFFFF' } }
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND.purple } }
    c.alignment = { horizontal: 'center', vertical: 'middle', readingOrder: 'rtl' }
    c.border = { bottom: { style: 'medium', color: { argb: BRAND.lime } } }
  })

  rows.forEach((r, i) => {
    const row = ws.addRow({
      no: r.no,
      fullName: r.fullName,
      phone: String(r.phone ?? ''),
      school: r.school,
      grade: r.grade,
      talent: r.talent,
      time: formatTime(r.ts),
    })
    row.height = 24
    row.eachCell((c, col) => {
      c.font = { name: 'Arial', size: 11, bold: col === 2 }
      c.alignment = {
        horizontal: col === 1 || col === 3 || col === 7 ? 'center' : 'right',
        vertical: 'middle',
        readingOrder: 'rtl',
      }
      c.border = { bottom: { style: 'thin', color: { argb: BRAND.line } } }
      if (i % 2 === 1) c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND.zebra } }
    })
    row.getCell(3).numFmt = '@' // نخلي الرقم نص عشان الصفر في الأول ما يضيعش
  })
  ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: 7 } }

  /* ---- ورقة الملخص ---- */
  const sm = wb.addWorksheet('ملخص', {
    views: [{ rightToLeft: true }],
    properties: { tabColor: { argb: BRAND.lime } },
  })
  sm.columns = [
    { header: 'المجال', key: 'k', width: 32 },
    { header: 'عدد الطلبات', key: 'v', width: 18 },
  ]
  const counts = countByTalent(rows, talents)
  sm.getRow(1).height = 30
  sm.getRow(1).eachCell((c) => {
    c.font = { name: 'Arial', bold: true, size: 12, color: { argb: 'FFFFFFFF' } }
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND.purple } }
    c.alignment = { horizontal: 'center', vertical: 'middle', readingOrder: 'rtl' }
  })
  talents.forEach((t) => sm.addRow({ k: t, v: counts[t] }))
  const total = sm.addRow({ k: 'الإجمالي', v: rows.length })
  total.eachCell((c) => {
    c.font = { name: 'Arial', bold: true, size: 12 }
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND.lime } }
  })
  sm.eachRow((row, n) => {
    if (n === 1) return
    row.height = 24
    row.eachCell((c, col) => {
      c.alignment = { horizontal: col === 1 ? 'right' : 'center', vertical: 'middle', readingOrder: 'rtl' }
      c.border = { bottom: { style: 'thin', color: { argb: BRAND.line } } }
      if (!c.font?.bold) c.font = { name: 'Arial', size: 11 }
    })
  })

  const buf = await wb.xlsx.writeBuffer()
  download(
    new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
    `super-creative-registrations-${fileStamp()}.xlsx`,
  )
}

/** PDF: بنطبع تقرير مصمّم (مخفي في الشاشة) ومن نافذة الطباعة بتختار "Save as PDF" */
export function printReport() {
  const prev = document.title
  document.title = `super-creative-registrations-${fileStamp()}`
  const restore = () => {
    document.title = prev
    window.removeEventListener('afterprint', restore)
  }
  window.addEventListener('afterprint', restore)
  window.print()
}
