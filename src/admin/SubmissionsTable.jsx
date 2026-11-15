import { useEffect, useMemo, useState } from 'react'
import {
  CATEGORY_LABELS,
  PARTICIPATION_LABELS,
  deleteSubmission,
  getSubmissions,
  isSupabaseConfigured,
} from '../lib/supabase.js'

const PAGE_SIZE = 50

const norm = (s = '') =>
  String(s)
    .toLowerCase()
    .replace(/[أإآ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/[ً-ْ]/g, '')
    .trim()

function formatCairoTime(ts) {
  if (!ts) return '—'
  try {
    const d = new Date(ts)
    return new Intl.DateTimeFormat('ar-EG', {
      timeZone: 'Africa/Cairo',
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(d)
  } catch {
    return String(ts)
  }
}

function exportSubmissionsCSV(rows) {
  const headers = ['#', 'اسم الطالب', 'الفئة', 'نوع المشاركة', 'عنوان العمل', 'الفكرة', 'رابط العمل', 'وقت التسليم']
  const escapeCell = (v) => {
    const str = String(v ?? '').replace(/"/g, '""')
    return `"${str}"`
  }

  const csvRows = [headers.map(escapeCell).join(',')]
  rows.forEach((r) => {
    csvRows.push(
      [
        r.no,
        r.student_name,
        CATEGORY_LABELS[r.category] || r.category,
        PARTICIPATION_LABELS[r.participation_type] || r.participation_type,
        r.work_title,
        r.idea,
        r.work_link,
        formatCairoTime(r.created_at),
      ]
        .map(escapeCell)
        .join(','),
    )
  })

  const bom = '\uFEFF'
  const blob = new Blob([bom + csvRows.join('\r\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const dateStr = new Date().toISOString().slice(0, 10)
  a.href = url
  a.download = `super-creative-submissions-${dateStr}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function ConfirmDeleteDialog({ row, busy, onCancel, onConfirm }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && !busy && onCancel()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [busy, onCancel])

  return (
    <div
      className="adm-overlay"
      role="presentation"
      onMouseDown={(e) => e.target === e.currentTarget && !busy && onCancel()}
    >
      <div
        className="adm-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="dlg-sub-title"
        aria-describedby="dlg-sub-desc"
      >
        <h2 id="dlg-sub-title">حذف تسليم العمل؟</h2>
        <p id="dlg-sub-desc">
          هيتم حذف تسليم <strong>{row.student_name}</strong> بعنوان «<strong>{row.work_title}</strong>» نهائيًا، ومش هينفع تسترجعه.
        </p>
        <div className="adm-dialog__actions">
          <button className="adm-btn adm-btn--danger" onClick={onConfirm} disabled={busy} autoFocus>
            {busy ? 'جارٍ الحذف...' : 'أيوه، احذف'}
          </button>
          <button className="adm-btn adm-btn--ghost" onClick={onCancel} disabled={busy}>
            إلغاء
          </button>
        </div>
      </div>
    </div>
  )
}

function ExpandableIdea({ text }) {
  const [expanded, setExpanded] = useState(false)
  if (!text) return <span>—</span>

  const isLong = text.length > 75
  if (!isLong) return <span>{text}</span>

  return (
    <div className="adm-idea">
      <span className="adm-idea__text">
        {expanded ? text : `${text.slice(0, 75)}...`}
      </span>
      <button
        type="button"
        className="adm-idea__toggle"
        onClick={() => setExpanded((v) => !v)}
      >
        {expanded ? 'عرض أقل' : 'عرض المزيد'}
      </button>
    </div>
  )
}

export default function SubmissionsTable() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [page, setPage] = useState(1)
  const [toDelete, setToDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [toast, setToast] = useState('')

  const fetchRows = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await getSubmissions()
      const total = data.length
      setRows(data.map((r, i) => ({ ...r, no: total - i })))
    } catch (err) {
      if (err?.code === 'PGRST301' || err?.message?.includes('permission')) {
        setError('الصلاحيات في Supabase مش متفعّلة لقراءة التسليمات. اتأكد من تشغيل سياسات RLS.')
      } else {
        setError('حصلت مشكلة في تحميل التسليمات من Supabase. اتأكد من ضبط VITE_SUPABASE_URL و VITE_SUPABASE_ANON_KEY.')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRows()
  }, [])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(''), 3500)
    return () => clearTimeout(t)
  }, [toast])

  const countsByCategory = useMemo(() => {
    const acc = { drawing: 0, design: 0, acting: 0, singing: 0, handmade: 0 }
    rows.forEach((r) => {
      if (acc[r.category] !== undefined) acc[r.category]++
    })
    return acc
  }, [rows])

  const filtered = useMemo(() => {
    const q = norm(search)
    return rows.filter((r) => {
      if (categoryFilter && r.category !== categoryFilter) return false
      if (!q) return true
      return (
        norm(r.student_name).includes(q) ||
        norm(r.work_title).includes(q) ||
        norm(r.idea).includes(q)
      )
    })
  }, [rows, search, categoryFilter])

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, pages)
  const visible = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  async function confirmDelete() {
    if (!toDelete) return
    setDeleting(true)
    try {
      await deleteSubmission(toDelete.id)
      setToast('تم حذف التسليم بنجاح')
      setRows((prev) => prev.filter((r) => r.id !== toDelete.id))
      setToDelete(null)
    } catch {
      setToast('فشل حذف التسليم. حاول تاني.')
    } finally {
      setDeleting(false)
    }
  }

  const hasFilter = Boolean(search || categoryFilter)

  return (
    <div className="adm-submissions">
      <div className="adm-card__head">
        <div>
          <h2 className="adm-card__subtitle">تسليمات الأعمال الفنية</h2>
          <p className="adm-muted">
            {loading
              ? 'جارٍ التحميل من Supabase...'
              : hasFilter
              ? `${filtered.length} نتيجة من ${rows.length} تسليم`
              : `${rows.length} تسليم`}
          </p>
        </div>
        <div className="adm-export">
          <button
            className="adm-btn adm-btn--lime"
            onClick={() => exportSubmissionsCSV(filtered)}
            disabled={!filtered.length}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M4 4h10l6 6v10a0 0 0 0 1 0 0H4V4zm10 0v6h6M8 13l6 6M14 13l-6 6" />
            </svg>
            تصدير CSV
          </button>
          <button className="adm-btn adm-btn--ghost" onClick={fetchRows} title="تحديث البيانات">
            تحديث
          </button>
        </div>
      </div>

      {!isSupabaseConfigured && (
        <div className="adm-alert" role="alert">
          <strong>قاعدة بيانات Supabase لسه مش مضبوطة.</strong> يرجى ضبط{' '}
          <code>VITE_SUPABASE_URL</code> و <code>VITE_SUPABASE_ANON_KEY</code> في ملف <code>.env</code>.
        </div>
      )}

      {error ? (
        <div className="adm-alert" role="alert">
          {error}
        </div>
      ) : (
        <>
          <div className="adm-stats" role="group" aria-label="فلترة حسب فئة المسابقة">
            <button
              className={`adm-stat adm-stat--total ${!categoryFilter ? 'is-on' : ''}`}
              onClick={() => {
                setCategoryFilter('')
                setPage(1)
              }}
            >
              <span className="adm-stat__n">{rows.length}</span>
              <span className="adm-stat__l">الإجمالي</span>
            </button>
            {Object.entries(CATEGORY_LABELS).map(([catKey, catLabel]) => (
              <button
                key={catKey}
                className={`adm-stat ${categoryFilter === catKey ? 'is-on' : ''}`}
                onClick={() => {
                  setCategoryFilter(categoryFilter === catKey ? '' : catKey)
                  setPage(1)
                }}
                aria-pressed={categoryFilter === catKey}
              >
                <span className="adm-stat__n">{countsByCategory[catKey] || 0}</span>
                <span className="adm-stat__l">{catLabel}</span>
              </button>
            ))}
          </div>

          <div className="adm-toolbar">
            <label className="adm-search">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M11 4a7 7 0 100 14 7 7 0 000-14zm9 16l-4-4" />
              </svg>
              <span className="sr-only">بحث</span>
              <input
                type="search"
                placeholder="ابحث باسم الطالب أو عنوان العمل أو الفكرة"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
              />
            </label>
            {hasFilter && (
              <button
                className="adm-btn adm-btn--ghost"
                onClick={() => {
                  setSearch('')
                  setCategoryFilter('')
                  setPage(1)
                }}
              >
                مسح الفلتر
              </button>
            )}
          </div>

          {loading ? (
            <div className="adm-skeleton" aria-hidden="true">
              {Array.from({ length: 6 }, (_, i) => (
                <i key={i} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="adm-empty">
              <p>{rows.length === 0 ? 'لسه مفيش تسليمات أعمال.' : 'مفيش نتائج مطابقة للبحث.'}</p>
            </div>
          ) : (
            <>
              <div className="adm-tablewrap">
                <table className="adm-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>اسم الطالب</th>
                      <th>الفئة</th>
                      <th>نوع المشاركة</th>
                      <th>عنوان العمل</th>
                      <th>الفكرة</th>
                      <th>رابط العمل</th>
                      <th>وقت التسليم</th>
                      <th>
                        <span className="sr-only">حذف</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {visible.map((r) => (
                      <tr key={r.id}>
                        <td data-label="#" className="adm-num">
                          {r.no}
                        </td>
                        <td data-label="اسم الطالب" className="adm-name">
                          {r.student_name}
                        </td>
                        <td data-label="الفئة">
                          <span className="adm-tag">
                            {CATEGORY_LABELS[r.category] || r.category}
                          </span>
                        </td>
                        <td data-label="نوع المشاركة">
                          <span className="adm-subtag">
                            {PARTICIPATION_LABELS[r.participation_type] || r.participation_type}
                          </span>
                        </td>
                        <td data-label="عنوان العمل" className="adm-work-title">
                          <strong>{r.work_title}</strong>
                        </td>
                        <td data-label="الفكرة" className="adm-idea-cell">
                          <ExpandableIdea text={r.idea} />
                        </td>
                        <td data-label="رابط العمل" className="adm-link-cell">
                          <a
                            href={r.work_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="adm-work-link"
                          >
                            مشاهدة العمل ↗
                          </a>
                        </td>
                        <td data-label="وقت التسليم" className="adm-time">
                          {formatCairoTime(r.created_at)}
                        </td>
                        <td className="adm-actions">
                          <button
                            className="adm-icon"
                            onClick={() => setToDelete(r)}
                            aria-label={`حذف تسليم ${r.student_name}`}
                            title="حذف"
                          >
                            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                              <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {pages > 1 && (
                <nav className="adm-pager" aria-label="الصفحات">
                  <button
                    className="adm-btn adm-btn--ghost"
                    disabled={safePage <= 1}
                    onClick={() => setPage(safePage - 1)}
                  >
                    السابق
                  </button>
                  <span>
                    صفحة {safePage} من {pages}
                  </span>
                  <button
                    className="adm-btn adm-btn--ghost"
                    disabled={safePage >= pages}
                    onClick={() => setPage(safePage + 1)}
                  >
                    التالي
                  </button>
                </nav>
              )}
            </>
          )}
        </>
      )}

      {toDelete && (
        <ConfirmDeleteDialog
          row={toDelete}
          busy={deleting}
          onCancel={() => setToDelete(null)}
          onConfirm={confirmDelete}
        />
      )}

      {toast && (
        <div className="adm-toast" role="status">
          {toast}
        </div>
      )}
    </div>
  )
}
