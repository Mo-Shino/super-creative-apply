// Firebase (Firestore Lite): نسخة خفيفة ومناسبة لفورم بيكتب بس.
// الـ SDK بيتحمّل لحظة الإرسال بس (dynamic import) عشان الصفحة تفتح بسرعة.

export const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

export const isFirebaseConfigured = Boolean(config.apiKey && config.projectId && config.appId)

export const COLLECTION = 'registrations'

let dbPromise = null

function getDb() {
  if (!dbPromise) {
    dbPromise = (async () => {
      const [{ initializeApp }, { getFirestore }] = await Promise.all([
        import('firebase/app'),
        import('firebase/firestore/lite'),
      ])
      return getFirestore(initializeApp(config))
    })()
  }
  return dbPromise
}

/** يحفظ طلب تقديم جديد. بيرمي Error بـ code واضح لو فشل. */
export async function submitRegistration(data) {
  if (!isFirebaseConfigured) {
    const err = new Error('firebase-not-configured')
    err.code = 'app/not-configured'
    throw err
  }
  const db = await getDb()
  const { collection, addDoc, serverTimestamp } = await import('firebase/firestore/lite')
  await addDoc(collection(db, COLLECTION), { ...data, createdAt: serverTimestamp() })
}
