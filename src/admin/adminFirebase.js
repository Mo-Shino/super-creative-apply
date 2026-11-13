// Firebase للأدمن: Auth + Firestore (النسخة الكاملة عشان التحديث المباشر).
// الملف ده بيتحمّل بس لما حد يفتح /admin، فمش بيثقّل صفحة التقديم العادية.
import { getApp, getApps, initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { config, isFirebaseConfigured, COLLECTION } from '../lib/firebase.js'

export { isFirebaseConfigured, COLLECTION }

// إيميل الأدمن: مجرد "اسم مستخدم" ثابت. الباسورد بس هو اللي بتكتبه في الصفحة.
// لازم يكون هو نفس الإيميل اللي هتعمل بيه المستخدم في Firebase Authentication
// وهو نفسه المكتوب في firestore.rules.
export const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || 'admin@super-creative.app'

const app = isFirebaseConfigured ? (getApps().length ? getApp() : initializeApp(config)) : null

export const auth = app ? getAuth(app) : null
export const db = app ? getFirestore(app) : null
