import { useEffect, useMemo, useState } from 'react'
import { signOut } from 'firebase/auth'
import { collection, deleteDoc, doc, onSnapshot, orderBy, query } from 'firebase/firestore'
import { TALENT_OPTIONS } from '../lib/validation.js'
import { auth, COLLECTION, db } from './adminFirebase.js'
import { countByTalent, exportExcel, fileStamp, formatTime, printReport } from './exporters.js'

const PAGE_SIZE = 50

const norm = (s = '') =>
  String(s)
    .toLowerCase()
    .replace(/[أإآ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/[ً-ْ]/g, '')
    .trim()

function Icon({ name }) {
  const p = {
    excel: 'M4 4h10l6 6v10a0 0 0 0 1 0 0H4V4zm10 0v6h6M8 13l6 6M14 13l-6 6',
    pdf: 'M6 3h9l5 5v13H6V3zm9 0v5h5M9 13h6M9 17h6',
    trash: 'M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3',
    out: 'M15 4h5v16h-5M10 8l-4 4 4 4M6 12h11',
    search: 'M11 4a7 7 0 100 14 7 7 0 000-14zm9 16l-4-4',
    wa: 'M4 20l1.4-4.2A8 8 0 118 18.6L4 20z',
  }[name]
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={p} />
    </svg>
  )
}

function ConfirmDialog({ row, busy, onCancel, onConfirm }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && !busy && onCancel()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [busy, onCancel])

  return (
    <div className="adm-overlay" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && !busy && onCancel()}>
      <div className="adm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="dlg-title" aria-describedby="dlg-desc">
        <h2 id="dlg-title">حذف الطلب؟</h2>
        <p id="dlg-desc">
          هيتم حذف طلب <strong>{row.fullName}</strong> نهائيًا، ومش هينفع تسترجعه.
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

export default function Dashboard() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [search, setSearch] = useState('')
  const [talent, setTalent] = useState('')
  const [page, setPage] = useState(1)
  const [toDelete, setToDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [toast, setToast] = useState('')

  // تحديث مباشر: أي طلب جديد بيظهر لوحده
  useEffect(() => {
    const q = query(collection(db, COLLECTION), orderBy('createdAt', 'desc'))
    return onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => {
          const data = d.data({ serverTimestamps: 'estimate' })
          return { id: d.id, ...data, ts: data.createdAt?.toMillis?.() ?? 0 }
        })
        const total = list.length
        setRows(list.map((r, i) => ({ ...r, no: total - i })))
        setLoading(false)
        setLoadError('')
      },
      (err) => {
        setLoading(false)
        setLoadError(
          err?.code === 'permission-denied'
            ? 'permission'
            : 'حصلت مشكلة في تحميل الطلبات. اتأكد من الإنترنت وحدّث الصفحة.',
        )
      },
    )
  }, [])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(''), 3500)
    return () => clearTimeout(t)
  }, [toast])

  const counts = useMemo(() => countByTalent(rows, TALENT_OPTIONS), [rows])

  const filtered = useMemo(() => {
    const q = norm(search)
    return rows.filter((r) => {
      if (talent && r.talent !== talent) return false
      if (!q) return true
      return norm(r.fullName).includes(q) || norm(r.school).includes(q) || String(r.phone).includes(q.replace(/\s/g, ''))
    })
  }, [rows, search, talent])

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, pages)
  const visible = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  async function confirmDelete() {
    if (!toDelete) return
    setDeleting(true)
    try {
      await deleteDoc(doc(db, COLLECTION, toDelete.id))
      setToast('تم حذف الطلب')
      setToDelete(null)
    } catch {
      setToast('فشل الحذف. حاول تاني.')
    } finally {
      setDeleting(false)
    }
  }

  async function onExcel() {
    if (!filtered.length || exporting) return
    setExporting(true)
    try {
      await exportExcel(filtered, TALENT_OPTIONS)
    } catch {
      setToast('فشل تصدير Excel. حاول تاني.')
    } finally {
      setExporting(false)
    }
  }

  const hasFilter = Boolean(search || talent)
  const reportDate = new Intl.DateTimeFormat('ar-EG', { timeZone: 'Africa/Cairo', dateStyle: 'full', timeStyle: 'short' }).format(new Date())

  return (
    <div className="adm">
      <div className="adm-screen">
        <header className="adm-top">
          <img className="adm-top__logo" src="/images/logo.webp" alt="Super كريتيف" width="1400" height="852" />
          <div className="adm-top__actions">
            <span className="adm-live" title="الطلبات الجديدة بتظهر لوحدها">
              <i aria-hidden="true" /> تحديث مباشر
            </span>
            <button className="adm-btn adm-btn--ghost adm-btn--light" onClick={() => signOut(auth)}>
              <Icon name="out" /> خروج
            </button>
          </div>
        </header>

        <section className="adm-card" aria-labelledby="adm-title">
          <div className="adm-card__head">
            <div>
              <h1 id="adm-title">طلبات التقديم</h1>
              <p className="adm-muted">
                {loading ? 'جارٍ التحميل...' : hasFilter ? `${filtered.length} نتيجة من ${rows.length} طلب` : `${rows.length} طلب`}
              </p>
            </div>
            <div className="adm-export">
              <button className="adm-btn adm-btn--lime" onClick={onExcel} disabled={!filtered.length || exporting}>
                <Icon name="excel" /> {exporting ? 'جارٍ التجهيز...' : 'تصدير Excel'}
              </button>
              <button className="adm-btn adm-btn--lime" onClick={printReport} disabled={!filtered.length}>
                <Icon name="pdf" /> تصدير PDF
              </button>
            </div>
          </div>

          {loadError === 'permission' ? (
            <div className="adm-alert" role="alert">
              <strong>الصلاحيات لسه مش متفعّلة.</strong> انسخ ملف <code>firestore.rules</code> الجديد والصقه في Firebase ← Firestore ← Rules ثم
              اضغط Publish، وحدّث الصفحة.
            </div>
          ) : loadError ? (
            <div className="adm-alert" role="alert">
              {loadError}
            </div>
          ) : (
            <>
              <div className="adm-stats" role="group" aria-label="فلترة حسب المجال">
                <button className={`adm-stat adm-stat--total ${!talent ? 'is-on' : ''}`} onClick={() => { setTalent(''); setPage(1) }}>
                  <span className="adm-stat__n">{rows.length}</span>
                  <span className="adm-stat__l">الإجمالي</span>
                </button>
                {TALENT_OPTIONS.map((t) => (
                  <button
                    key={t}
                    className={`adm-stat ${talent === t ? 'is-on' : ''}`}
                    onClick={() => { setTalent(talent === t ? '' : t); setPage(1) }}
                    aria-pressed={talent === t}
                  >
                    <span className="adm-stat__n">{counts[t]}</span>
                    <span className="adm-stat__l">{t}</span>
                  </button>
                ))}
              </div>

              <div className="adm-toolbar">
                <label className="adm-search">
                  <Icon name="search" />
                  <span className="sr-only">بحث</span>
                  <input
                    type="search"
                    placeholder="ابحث بالاسم أو المدرسة أو الرقم"
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                  />
                </label>
                {hasFilter && (
                  <button className="adm-btn adm-btn--ghost" onClick={() => { setSearch(''); setTalent(''); setPage(1) }}>
                    مسح الفلتر
                  </button>
                )}
              </div>

              {loading ? (
                <div className="adm-skeleton" aria-hidden="true">
                  {Array.from({ length: 6 }, (_, i) => <i key={i} />)}
                </div>
              ) : filtered.length === 0 ? (
                <div className="adm-empty">
                  <p>{rows.length === 0 ? 'لسه مفيش طلبات تقديم.' : 'مفيش نتائج مطابقة للبحث.'}</p>
                </div>
              ) : (
                <>
                  <div className="adm-tablewrap">
                    <table className="adm-table">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>الاسم بالكامل</th>
                          <th>الواتساب</th>
                          <th>المدرسة</th>
                          <th>الصف</th>
                          <th>المجال</th>
                          <th>وقت التقديم</th>
                          <th><span className="sr-only">حذف</span></th>
                        </tr>
                      </thead>
                      <tbody>
                        {visible.map((r) => (
                          <tr key={r.id}>
                            <td data-label="#" className="adm-num">{r.no}</td>
                            <td data-label="الاسم" className="adm-name">{r.fullName}</td>
                            <td data-label="الواتساب" className="adm-phone">
                              <a href={`https://wa.me/2${r.phone}`} target="_blank" rel="noopener noreferrer" dir="ltr">
                                {r.phone}
                              </a>
                            </td>
                            <td data-label="المدرسة">{r.school}</td>
                            <td data-label="الصف">{r.grade}</td>
                            <td data-label="المجال"><span className="adm-tag">{r.talent}</span></td>
                            <td data-label="الوقت" className="adm-time">{formatTime(r.ts)}</td>
                            <td className="adm-actions">
                              <button className="adm-icon" onClick={() => setToDelete(r)} aria-label={`حذف طلب ${r.fullName}`} title="حذف">
                                <Icon name="trash" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {pages > 1 && (
                    <nav className="adm-pager" aria-label="الصفحات">
                      <button className="adm-btn adm-btn--ghost" disabled={safePage <= 1} onClick={() => setPage(safePage - 1)}>
                        السابق
                      </button>
                      <span>
                        صفحة {safePage} من {pages}
                      </span>
                      <button className="adm-btn adm-btn--ghost" disabled={safePage >= pages} onClick={() => setPage(safePage + 1)}>
                        التالي
                      </button>
                    </nav>
                  )}
                </>
              )}
            </>
          )}
        </section>
      </div>

      {/* تقرير الـ PDF: مخفي في الشاشة وبيظهر في الطباعة بس */}
      <section className="adm-print" aria-hidden="true">
        <div className="adm-print__head">
          <img src="/images/logo.webp" alt="" width="1400" height="852" />
          <div>
            <h1>تقرير طلبات التقديم</h1>
            <p>{reportDate}</p>
            <p>
              {hasFilter ? `${filtered.length} طلب (بعد الفلترة) من ${rows.length}` : `إجمالي ${rows.length} طلب`}
              {talent ? ` — ${talent}` : ''}
            </p>
          </div>
        </div>
        <div className="adm-print__stats">
          {TALENT_OPTIONS.map((t) => (
            <span key={t}>
              {t} <b>{countByTalent(filtered, TALENT_OPTIONS)[t]}</b>
            </span>
          ))}
        </div>
        <table className="adm-print__table">
          <thead>
            <tr>
              <th>#</th>
              <th>الاسم بالكامل</th>
              <th>الواتساب</th>
              <th>المدرسة</th>
              <th>الصف</th>
              <th>المجال</th>
              <th>وقت التقديم</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id}>
                <td>{r.no}</td>
                <td>{r.fullName}</td>
                <td dir="ltr">{r.phone}</td>
                <td>{r.school}</td>
                <td>{r.grade}</td>
                <td>{r.talent}</td>
                <td>{formatTime(r.ts)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="adm-print__foot">Super كريتيف • الموسم الأول • {fileStamp()}</p>
      </section>

      {toDelete && <ConfirmDialog row={toDelete} busy={deleting} onCancel={() => setToDelete(null)} onConfirm={confirmDelete} />}
      {toast && (
        <div className="adm-toast" role="status">
          {toast}
        </div>
      )}
    </div>
  )
}
